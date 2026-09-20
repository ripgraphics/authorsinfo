import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const uuid = z.string().uuid()
const listSchema = z.object({ message_id: uuid, attachment_id: uuid.optional() }).strict()
type AttachmentContext = { params: Promise<{ id: string }> }

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/', 'application/pdf']

type AttachmentRow = {
  id: string
  message_id: string
  file_name: string
  mime_type: string
  file_size: number
  storage_path: string
  created_at?: string
}

type ConversationRow = { id: string; user_low_id: string; user_high_id: string }

interface AttachmentQuery {
  select(columns: string): AttachmentQuery
  eq(column: string, value: string): AttachmentQuery
  maybeSingle(): Promise<{ data: unknown; error: unknown }>
  single(): Promise<{ data: AttachmentRow | null; error: unknown }>
  insert(value: Record<string, string | number>): AttachmentQuery
  then<TResult1 = { data: AttachmentRow[] | null; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((value: {
          data: AttachmentRow[] | null
          error: unknown
        }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

interface AttachmentClient {
  from(
    table: 'direct_conversations' | 'direct_conversation_messages' | 'direct_message_attachments'
  ): AttachmentQuery
  storage: {
    from(bucket: string): {
      upload(
        path: string,
        body: ArrayBuffer,
        options?: { contentType: string }
      ): Promise<{ data: { path: string } | null; error: unknown }>
      download(path: string): Promise<{ data: ArrayBuffer | null; error: unknown }>
    }
  }
}

function getClient(context: AuthenticatedRoute): AttachmentClient {
  return context.supabase as unknown as AttachmentClient
}

async function authorizeConversation(context: AuthenticatedRoute, conversationId: string) {
  const { data, error } = await getClient(context)
    .from('direct_conversations')
    .select('id, user_low_id, user_high_id')
    .eq('id', conversationId)
    .maybeSingle()
  if (error) throw error
  const conversation = data as ConversationRow | null
  if (
    !conversation ||
    ![conversation.user_low_id, conversation.user_high_id].includes(context.user.id)
  ) {
    return NextResponse.json({ error: 'Conversation access denied' }, { status: 403 })
  }
  return null
}

async function authorizeMessage(
  context: AuthenticatedRoute,
  conversationId: string,
  messageId: string
) {
  const { data, error } = await getClient(context)
    .from('direct_conversation_messages')
    .select('id')
    .eq('id', messageId)
    .eq('conversation_id', conversationId)
    .maybeSingle()
  if (error) throw error
  return data ? null : NextResponse.json({ error: 'Message not found' }, { status: 404 })
}

export async function GET(request: NextRequest, { params }: AttachmentContext) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { id } = await params
    const input = listSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
    if (!uuid.safeParse(id).success || !input.success) {
      return NextResponse.json({ error: 'Invalid attachment request' }, { status: 400 })
    }
    const denied = await authorizeConversation(authentication.context, id)
    if (denied) return denied
    if (input.data.attachment_id) {
      const messageDenied = await authorizeMessage(
        authentication.context,
        id,
        input.data.message_id
      )
      if (messageDenied) return messageDenied

      const { data: attachment, error: attachmentError } = await getClient(
        authentication.context
      )
        .from('direct_message_attachments')
        .select('id, message_id, file_name, mime_type, file_size, storage_path, created_at')
        .eq('id', input.data.attachment_id)
        .eq('message_id', input.data.message_id)
        .maybeSingle()
      if (attachmentError) throw attachmentError
      if (!attachment) {
        return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
      }

      const stored = attachment as AttachmentRow
      const download = await getClient(authentication.context)
        .storage.from('direct-message-attachments')
        .download(stored.storage_path)
      if (download.error || !download.data) {
        throw download.error ?? new Error('Attachment unavailable')
      }

      return new NextResponse(new Uint8Array(download.data), {
        headers: {
          'Content-Type': stored.mime_type,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(stored.file_name)}"`,
          'Cache-Control': 'private, no-store',
        },
      })
    }

    const messageDenied = await authorizeMessage(authentication.context, id, input.data.message_id)
    if (messageDenied) return messageDenied

    const { data, error } = await getClient(authentication.context)
      .from('direct_message_attachments')
      .select('id, message_id, file_name, mime_type, file_size, storage_path, created_at')
      .eq('message_id', input.data.message_id)
    if (error) throw error
    return NextResponse.json(data ?? [], { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load attachments', 500, false)
  }
}

export async function POST(request: NextRequest, { params }: AttachmentContext) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }
    const { id } = await params
    if (!uuid.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid attachment request' }, { status: 400 })
    }
    const denied = await authorizeConversation(authentication.context, id)
    if (denied) return denied

    const formData = await request.formData()
    const file = formData.get('file')
    const messageId = formData.get('message_id')
    if (
      !(file instanceof File) ||
      typeof messageId !== 'string' ||
      !uuid.safeParse(messageId).success
    ) {
      return NextResponse.json({ error: 'Invalid attachment upload' }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds 10MB limit' }, { status: 400 })
    }
    if (!ALLOWED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix))) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }
    const messageDenied = await authorizeMessage(authentication.context, id, messageId)
    if (messageDenied) return messageDenied

    const storagePath = `${id}/${messageId}/${crypto.randomUUID()}-${file.name}`
    const upload = await getClient(authentication.context)
      .storage.from('direct-message-attachments')
      .upload(storagePath, await file.arrayBuffer(), { contentType: file.type })
    if (upload.error) throw upload.error

    const { data, error } = await getClient(authentication.context)
      .from('direct_message_attachments')
      .insert({
        message_id: messageId,
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
      })
      .select('id, message_id, file_name, mime_type, file_size, storage_path, created_at')
      .single()
    if (error) throw error
    return NextResponse.json(data, {
      status: 201,
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to upload attachment', 500, false)
  }
}
