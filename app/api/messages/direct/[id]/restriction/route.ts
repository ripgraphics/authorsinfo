import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const uuid = z.string().uuid()
const updateSchema = z.object({ restricted: z.boolean() }).strict()
type Context = { params: Promise<{ id: string }> }

type ConversationRow = { id: string; user_low_id: string; user_high_id: string }

interface RestrictionQuery {
  select(columns: string): RestrictionQuery
  eq(column: string, value: string): RestrictionQuery
  maybeSingle(): Promise<{ data: unknown; error: unknown }>
  insert(value: Record<string, string>): RestrictionQuery
  delete(): RestrictionQuery
  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

interface RestrictionClient {
  from(table: 'direct_conversations' | 'direct_message_restrictions'): RestrictionQuery
}

function getClient(context: AuthenticatedRoute): RestrictionClient {
  return context.supabase as unknown as RestrictionClient
}

async function getConversation(context: AuthenticatedRoute, conversationId: string) {
  const { data, error } = await getClient(context)
    .from('direct_conversations')
    .select('id, user_low_id, user_high_id')
    .eq('id', conversationId)
    .maybeSingle()
  if (error) throw error
  const conversation = data as ConversationRow | null
  if (!conversation || ![conversation.user_low_id, conversation.user_high_id].includes(context.user.id)) {
    return NextResponse.json({ error: 'Conversation access denied' }, { status: 403 })
  }
  return conversation
}

export async function GET(_: NextRequest, { params }: Context) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { id } = await params
    if (!uuid.safeParse(id).success) return NextResponse.json({ error: 'Invalid restriction request' }, { status: 400 })
    const conversation = await getConversation(authentication.context, id)
    if (conversation instanceof NextResponse) return conversation
    const restrictedUserId = conversation.user_low_id === authentication.context.user.id
      ? conversation.user_high_id
      : conversation.user_low_id
    const { data, error } = await getClient(authentication.context)
      .from('direct_message_restrictions')
      .select('id, user_id, restricted_user_id, created_at')
      .eq('user_id', authentication.context.user.id)
      .eq('restricted_user_id', restrictedUserId)
      .maybeSingle()
    if (error) throw error
    return NextResponse.json({ restricted: Boolean(data), restricted_user_id: restrictedUserId })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load conversation restriction', 500, false)
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    const { id } = await params
    const input = updateSchema.safeParse(await request.json().catch(() => null))
    if (!uuid.safeParse(id).success || !input.success) return NextResponse.json({ error: 'Invalid restriction update' }, { status: 400 })
    const conversation = await getConversation(authentication.context, id)
    if (conversation instanceof NextResponse) return conversation
    const restrictedUserId = conversation.user_low_id === authentication.context.user.id
      ? conversation.user_high_id
      : conversation.user_low_id
    const client = getClient(authentication.context)
    if (input.data.restricted) {
      const { data, error } = await client
        .from('direct_message_restrictions')
        .insert({ user_id: authentication.context.user.id, restricted_user_id: restrictedUserId })
        .select('id, user_id, restricted_user_id, created_at')
        .maybeSingle()
      if (error) throw error
      return NextResponse.json({ restricted: true, restricted_user_id: restrictedUserId, record: data })
    }
    const { error } = await client
      .from('direct_message_restrictions')
      .delete()
      .eq('user_id', authentication.context.user.id)
      .eq('restricted_user_id', restrictedUserId)
    if (error) throw error
    return NextResponse.json({ restricted: false, restricted_user_id: restrictedUserId })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to update conversation restriction', 500, false)
  }
}
