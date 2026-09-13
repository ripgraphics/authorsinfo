import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'
import { NotificationDispatcher } from '@/lib/services/notification-dispatcher'

const identifier = z.string().uuid()
const historySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    before: z.string().datetime().optional(),
  })
  .strict()
const messageSchema = z.object({ body: z.string().trim().min(1).max(10000) }).strict()

type DirectContext = { params: Promise<{ id: string }> }

type ConversationRow = { id: string; user_low_id: string; user_high_id: string }

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at?: string
}

interface DirectQueryResult<T> {
  data: T | T[] | null
  error: unknown
}

interface DirectQuery {
  select(columns: string): DirectQuery
  eq(column: string, value: string): DirectQuery
  order(column: string, options: { ascending: boolean }): DirectQuery
  lt(column: string, value: string): DirectQuery
  limit(value: number): DirectQuery
  maybeSingle(): Promise<{ data: ConversationRow | null; error: unknown }>
  single(): Promise<DirectQueryResult<MessageRow>>
  insert(value: Record<string, string>): DirectQuery
  then<TResult1 = DirectQueryResult<MessageRow[]>, TResult2 = never>(
    onfulfilled?:
      ((value: DirectQueryResult<MessageRow[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

interface DirectSupabaseClient {
  from(table: 'direct_conversations' | 'direct_conversation_messages'): DirectQuery
}

function getDirectClient(context: AuthenticatedRoute): DirectSupabaseClient {
  return context.supabase as unknown as DirectSupabaseClient
}

async function authorizeConversation(
  context: AuthenticatedRoute,
  conversationId: string
): Promise<ConversationRow | NextResponse> {
  const { data, error } = await getDirectClient(context)
    .from('direct_conversations')
    .select('id, user_low_id, user_high_id')
    .eq('id', conversationId)
    .maybeSingle()
  if (error) throw error
  if (!data || ![data.user_low_id, data.user_high_id].includes(context.user.id)) {
    return NextResponse.json({ error: 'Conversation access denied' }, { status: 403 })
  }
  return data
}

export async function GET(request: NextRequest, { params }: DirectContext) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { id } = await params
    const input = historySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
    if (!identifier.safeParse(id).success || !input.success) {
      return NextResponse.json({ error: 'Invalid direct message request' }, { status: 400 })
    }
    const access = await authorizeConversation(authentication.context, id)
    if (access instanceof NextResponse) return access

    const messageQuery = getDirectClient(authentication.context)
      .from('direct_conversation_messages')
      .select('id, conversation_id, sender_id, body, created_at, edited_at, deleted_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: false })
      .limit(input.data.limit)
    if (input.data.before) messageQuery.lt('created_at', input.data.before)
    const { data, error } = await messageQuery
    if (error) throw error
    const messages: MessageRow[] = Array.isArray(data)
      ? (data as unknown as MessageRow[]).reverse()
      : []
    const hasMore = messages.length === input.data.limit
    const nextCursor = hasMore ? (messages[0]?.created_at ?? null) : null
    return NextResponse.json(
      { messages, has_more: hasMore, next_cursor: nextCursor },
      {
        headers: { 'Cache-Control': 'private, no-store' },
      }
    )
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load direct messages', 500, false)
  }
}

export async function POST(request: NextRequest, { params }: DirectContext) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }
    const { id } = await params
    const input = messageSchema.safeParse(await request.json().catch(() => null))
    if (!identifier.safeParse(id).success || !input.success) {
      return NextResponse.json({ error: 'Invalid direct message' }, { status: 400 })
    }
    const access = await authorizeConversation(authentication.context, id)
    if (access instanceof NextResponse) return access

    const { data, error } = await getDirectClient(authentication.context)
      .from('direct_conversation_messages')
      .insert({
        conversation_id: id,
        sender_id: authentication.context.user.id,
        body: input.data.body,
      })
      .select('id, conversation_id, sender_id, body, created_at')
      .single()
    if (error) throw error

    const recipientId =
      access.user_low_id === authentication.context.user.id
        ? access.user_high_id
        : access.user_low_id
    const sentMessage = data as MessageRow | null
    if (sentMessage) {
      // Dispatch notification after the response is sent so the client
      // does not wait on preference lookups, email/push queueing, etc.
      after(async () => {
        await NotificationDispatcher.dispatch({
          recipient_id: recipientId,
          type: 'message',
          title: 'New message',
          message: input.data.body.slice(0, 100),
          source_user_id: authentication.context.user.id,
          source_type: 'direct_conversation',
          source_id: id,
          data: { conversation_id: id, message_id: sentMessage.id },
        })
      })
    }

    return NextResponse.json(data, {
      status: 201,
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to send direct message', 500, false)
  }
}
