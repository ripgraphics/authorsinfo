import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const uuid = z.string().uuid()
type Context = { params: Promise<{ id: string }> }

interface DeletionQuery {
  select(columns: string): DeletionQuery
  eq(column: string, value: string): DeletionQuery
  maybeSingle(): Promise<{ data: unknown; error: unknown }>
  insert(value: Record<string, string>): DeletionQuery
  delete(): DeletionQuery
  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

interface DeletionClient {
  from(table: 'direct_conversation_messages' | 'direct_message_deletions'): DeletionQuery
}

function getClient(context: AuthenticatedRoute): DeletionClient {
  return context.supabase as unknown as DeletionClient
}

async function authorize(context: AuthenticatedRoute, conversationId: string, messageId: string) {
  const { data, error } = await getClient(context)
    .from('direct_conversation_messages')
    .select('id')
    .eq('id', messageId)
    .eq('conversation_id', conversationId)
    .maybeSingle()
  if (error) throw error
  return data ? null : NextResponse.json({ error: 'Message not found' }, { status: 404 })
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    const { id } = await params
    const body = await request.json().catch(() => null) as { message_id?: string } | null
    if (!uuid.safeParse(id).success || !body?.message_id || !uuid.safeParse(body.message_id).success) return NextResponse.json({ error: 'Invalid deletion request' }, { status: 400 })
    const denied = await authorize(authentication.context, id, body.message_id)
    if (denied) return denied
    const { error } = await getClient(authentication.context)
      .from('direct_message_deletions')
      .insert({ message_id: body.message_id, user_id: authentication.context.user.id, deleted_at: new Date().toISOString() })
    if (error) throw error
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to delete message for you', 500, false)
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    const { id } = await params
    const messageId = request.nextUrl.searchParams.get('message_id')
    if (!uuid.safeParse(id).success || !messageId || !uuid.safeParse(messageId).success) return NextResponse.json({ error: 'Invalid deletion request' }, { status: 400 })
    const denied = await authorize(authentication.context, id, messageId)
    if (denied) return denied
    const { error } = await getClient(authentication.context)
      .from('direct_message_deletions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', authentication.context.user.id)
    if (error) throw error
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to restore message for you', 500, false)
  }
}