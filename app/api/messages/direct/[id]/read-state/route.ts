import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const identifier = z.string().uuid()
const readStateSchema = z.object({ last_read_message_id: identifier.nullable() }).strict()
type DirectContext = { params: Promise<{ id: string }> }

interface ReadStateQuery {
  select(columns: string): ReadStateQuery
  eq(column: string, value: string): ReadStateQuery
  lte(column: string, value: string): ReadStateQuery
  neq(column: string, value: string): ReadStateQuery
  maybeSingle(): Promise<{ data: unknown; error: unknown }>
  then<TResult1 = { data: unknown[] | null; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown[] | null; error: unknown }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
  upsert(value: Record<string, string | null>): ReadStateQuery
  update(value: Record<string, string | null>): ReadStateQuery
  single(): Promise<{ data: unknown; error: unknown }>
}

interface ReadStateClient {
  from(
    table: 'direct_conversations' | 'direct_conversation_read_state' | 'direct_conversation_messages'
  ): ReadStateQuery
  rpc(name: 'mark_direct_messages_read', args: Record<string, string>): Promise<{
    data: unknown
    error: unknown
  }>
}

function getClient(context: AuthenticatedRoute): ReadStateClient {
  return context.supabase as unknown as ReadStateClient
}

async function authorize(context: AuthenticatedRoute, conversationId: string) {
  const { data, error } = await getClient(context)
    .from('direct_conversations')
    .select('id')
    .eq('id', conversationId)
    .maybeSingle()
  if (error) throw error
  return data ? null : NextResponse.json({ error: 'Conversation access denied' }, { status: 403 })
}

export async function GET(_: NextRequest, { params }: DirectContext) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { id } = await params
    if (!identifier.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid read-state request' }, { status: 400 })
    }
    const denied = await authorize(authentication.context, id)
    if (denied) return denied
    const { data, error } = await getClient(authentication.context)
      .from('direct_conversation_read_state')
      .select('conversation_id, user_id, last_read_message_id, last_read_at')
      .eq('conversation_id', id)
      .then((result) => result)
    if (error) throw error
    return NextResponse.json(data ?? [], { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load direct read state', 500, false)
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
    const input = readStateSchema.safeParse(await request.json().catch(() => null))
    if (!identifier.safeParse(id).success || !input.success) {
      return NextResponse.json({ error: 'Invalid read-state request' }, { status: 400 })
    }
    const denied = await authorize(authentication.context, id)
    if (denied) return denied
    if (input.data.last_read_message_id) {
      const { error: messageReadError } = await getClient(authentication.context).rpc(
        'mark_direct_messages_read',
        {
          target_conversation_id: id,
          target_message_id: input.data.last_read_message_id,
        }
      )
      if (messageReadError) throw messageReadError
    }
    const { data, error } = await getClient(authentication.context)
      .from('direct_conversation_read_state')
      .upsert({
        conversation_id: id,
        user_id: authentication.context.user.id,
        last_read_message_id: input.data.last_read_message_id,
      })
      .select('conversation_id, user_id, last_read_message_id, last_read_at')
      .single()
    if (error) throw error
    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to update direct read state', 500, false)
  }
}
