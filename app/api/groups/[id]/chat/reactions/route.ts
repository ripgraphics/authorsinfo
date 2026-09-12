import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const uuid = z.string().uuid()
const reactionSchema = z
  .object({
    message_id: uuid,
    reaction: z.string().trim().min(1).max(32),
  })
  .strict()
type Context = { params: Promise<{ id: string }> }

interface ReactionQueryResult {
  data: unknown[] | null
  error: unknown
}

interface ReactionQuery {
  select(columns: string): ReactionQuery
  eq(column: string, value: string): ReactionQuery
  maybeSingle(): Promise<ReactionQueryResult>
  single(): Promise<ReactionQueryResult>
  insert(value: Record<string, string>): ReactionQuery
  delete(): ReactionQuery
  then<TResult1 = ReactionQueryResult, TResult2 = never>(
    onfulfilled?: ((value: ReactionQueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

interface ReactionClient {
  from(
    table:
      | 'group_members'
      | 'group_chat_channels'
      | 'group_chat_messages'
      | 'group_chat_message_reactions'
  ): ReactionQuery
}

function client(context: AuthenticatedRoute): ReactionClient {
  return context.supabase as unknown as ReactionClient
}

async function authorizeMessage(context: AuthenticatedRoute, groupId: string, messageId: string) {
  const supabase = client(context)
  const { data: membership, error: membershipError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('group_id', groupId)
    .eq('user_id', context.user.id)
    .eq('status', 'active')
    .maybeSingle()
  if (membershipError) throw membershipError
  if (!membership)
    return NextResponse.json({ error: 'Active group membership required' }, { status: 403 })

  const { data: message, error: messageError } = await supabase
    .from('group_chat_messages')
    .select('id')
    .eq('id', messageId)
    .maybeSingle()
  if (messageError) throw messageError
  if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  return null
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { id: groupId } = await params
    const input = reactionSchema.safeParse(await request.json().catch(() => null))
    if (!uuid.safeParse(groupId).success || !input.success) {
      return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 })
    }
    const denied = await authorizeMessage(authentication.context, groupId, input.data.message_id)
    if (denied) return denied

    const { data, error } = await client(authentication.context)
      .from('group_chat_message_reactions')
      .insert({
        message_id: input.data.message_id,
        reaction: input.data.reaction,
        user_id: authentication.context.user.id,
      })
      .select('id, message_id, reaction, user_id, created_at')
      .single()
    if (error) throw error
    return NextResponse.json(data, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to add reaction', 500, false)
  }
}

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { id: groupId } = await params
    const messageId = request.nextUrl.searchParams.get('message_id')
    if (
      !uuid.safeParse(groupId).success ||
      typeof messageId !== 'string' ||
      !uuid.safeParse(messageId).success
    ) {
      return NextResponse.json({ error: 'Invalid reaction request' }, { status: 400 })
    }
    const denied = await authorizeMessage(authentication.context, groupId, messageId)
    if (denied) return denied
    const { data, error } = await client(authentication.context)
      .from('group_chat_message_reactions')
      .select('id, message_id, reaction, user_id, created_at')
      .eq('message_id', messageId)
    if (error) throw error
    return NextResponse.json(data ?? [], { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load reactions', 500, false)
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { id: groupId } = await params
    const input = reactionSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
    if (!uuid.safeParse(groupId).success || !input.success) {
      return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 })
    }
    const denied = await authorizeMessage(authentication.context, groupId, input.data.message_id)
    if (denied) return denied

    const { error } = await client(authentication.context)
      .from('group_chat_message_reactions')
      .delete()
      .eq('message_id', input.data.message_id)
      .eq('reaction', input.data.reaction)
      .eq('user_id', authentication.context.user.id)
    if (error) throw error
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to remove reaction', 500, false)
  }
}
