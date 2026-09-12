import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const identifier = z.string().uuid()
const editSchema = z.object({ body: z.string().trim().min(1).max(10000) }).strict()
type LifecycleContext = { params: Promise<{ id: string; messageId: string }> }

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  edited_at: string | null
  deleted_at: string | null
}

interface LifecycleQuery {
  eq(column: string, value: string): LifecycleQuery
  update(value: Record<string, string>): LifecycleQuery
  select(columns: string): LifecycleQuery
  single(): Promise<{ data: MessageRow | null; error: unknown }>
}

interface LifecycleClient {
  from(table: 'direct_conversation_messages'): LifecycleQuery
}

function getClient(context: AuthenticatedRoute): LifecycleClient {
  return context.supabase as unknown as LifecycleClient
}

function validIds(conversationId: string, messageId: string) {
  return identifier.safeParse(conversationId).success && identifier.safeParse(messageId).success
}

function rejectCrossOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  return origin && origin !== request.nextUrl.origin
}

async function updateMessage(
  request: NextRequest,
  context: LifecycleContext,
  update: Record<string, string>
) {
  const authentication = await requireUser()
  if (!authentication.ok) return authentication.response
  if (rejectCrossOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
  }
  const { id, messageId } = await context.params
  if (!validIds(id, messageId)) {
    return NextResponse.json({ error: 'Invalid direct message request' }, { status: 400 })
  }

  const { data, error } = await getClient(authentication.context)
    .from('direct_conversation_messages')
    .update(update)
    .eq('id', messageId)
    .eq('conversation_id', id)
    .eq('sender_id', authentication.context.user.id)
    .select('id, conversation_id, sender_id, body, edited_at, deleted_at')
    .single()
  if (error) throw error
  if (!data) return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } })
}

export async function PATCH(request: NextRequest, context: LifecycleContext) {
  try {
    const input = editSchema.safeParse(await request.json().catch(() => null))
    if (!input.success) {
      return NextResponse.json({ error: 'Invalid message edit' }, { status: 400 })
    }
    return await updateMessage(request, context, {
      body: input.data.body,
      edited_at: new Date().toISOString(),
    })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to edit direct message', 500, false)
  }
}

export async function DELETE(request: NextRequest, context: LifecycleContext) {
  try {
    return await updateMessage(request, context, { deleted_at: new Date().toISOString() })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to delete direct message', 500, false)
  }
}
