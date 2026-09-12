import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const uuid = z.string().uuid()
const reactionSchema = z
  .object({ message_id: uuid, reaction: z.string().trim().min(1).max(32) })
  .strict()
type ReactionContext = { params: Promise<{ id: string }> }

interface ReactionQuery {
  select(columns: string): ReactionQuery
  eq(column: string, value: string): ReactionQuery
  maybeSingle(): Promise<{ data: unknown; error: unknown }>
  single(): Promise<{ data: unknown; error: unknown }>
  insert(value: Record<string, string>): ReactionQuery
  delete(): ReactionQuery
  then<TResult1 = { data: unknown[] | null; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown[] | null; error: unknown }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

interface ReactionClient {
  from(table: 'direct_conversation_messages' | 'direct_message_reactions'): ReactionQuery
}

function getClient(context: AuthenticatedRoute): ReactionClient {
  return context.supabase as unknown as ReactionClient
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

export async function POST(request: NextRequest, { params }: ReactionContext) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { id } = await params
    const input = reactionSchema.safeParse(await request.json().catch(() => null))
    if (!uuid.safeParse(id).success || !input.success) {
      return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 })
    }
    const denied = await authorizeMessage(authentication.context, id, input.data.message_id)
    if (denied) return denied
    const { data, error } = await getClient(authentication.context)
      .from('direct_message_reactions')
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

export async function GET(request: NextRequest, { params }: ReactionContext) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { id } = await params
    const messageId = request.nextUrl.searchParams.get('message_id')
    if (!uuid.safeParse(id).success || !messageId || !uuid.safeParse(messageId).success) {
      return NextResponse.json({ error: 'Invalid reaction request' }, { status: 400 })
    }
    const denied = await authorizeMessage(authentication.context, id, messageId)
    if (denied) return denied
    const { data, error } = await getClient(authentication.context)
      .from('direct_message_reactions')
      .select('id, message_id, reaction, user_id, created_at')
      .eq('message_id', messageId)
    if (error) throw error
    return NextResponse.json(data ?? [], { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load reactions', 500, false)
  }
}

export async function DELETE(request: NextRequest, { params }: ReactionContext) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { id } = await params
    const input = reactionSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
    if (!uuid.safeParse(id).success || !input.success) {
      return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 })
    }
    const denied = await authorizeMessage(authentication.context, id, input.data.message_id)
    if (denied) return denied
    const { error } = await getClient(authentication.context)
      .from('direct_message_reactions')
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
