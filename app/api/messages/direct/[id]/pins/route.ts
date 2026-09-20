import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const uuid = z.string().uuid()
type Context = { params: Promise<{ id: string }> }

interface PinQuery {
  select(columns: string): PinQuery
  eq(column: string, value: string): PinQuery
  maybeSingle(): Promise<{ data: unknown; error: unknown }>
  insert(value: Record<string, string>): PinQuery
  delete(): PinQuery
  then<TResult1 = { data: unknown[] | null; error: unknown }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown[] | null; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

interface PinClient {
  from(table: 'direct_conversations' | 'direct_conversation_messages' | 'direct_message_pins'): PinQuery
}

function getClient(context: AuthenticatedRoute): PinClient {
  return context.supabase as unknown as PinClient
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

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { id } = await params
    const messageId = request.nextUrl.searchParams.get('message_id')
    if (!uuid.safeParse(id).success || !messageId || !uuid.safeParse(messageId).success) {
      return NextResponse.json({ error: 'Invalid pin request' }, { status: 400 })
    }
    const denied = await authorize(authentication.context, id, messageId)
    if (denied) return denied
    const { data, error } = await getClient(authentication.context)
      .from('direct_message_pins')
      .select('message_id, pinned_by, created_at')
      .eq('message_id', messageId)
      .maybeSingle()
    if (error) throw error
    return NextResponse.json(data ?? null)
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load message pin', 500, false)
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    const { id } = await params
    const body = await request.json().catch(() => null) as { message_id?: string } | null
    if (!uuid.safeParse(id).success || !body?.message_id || !uuid.safeParse(body.message_id).success) {
      return NextResponse.json({ error: 'Invalid pin request' }, { status: 400 })
    }
    const denied = await authorize(authentication.context, id, body.message_id)
    if (denied) return denied
    const { data, error } = await getClient(authentication.context)
      .from('direct_message_pins')
      .insert({ message_id: body.message_id, pinned_by: authentication.context.user.id })
      .select('message_id, pinned_by, created_at')
      .maybeSingle()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to pin message', 500, false)
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
    if (!uuid.safeParse(id).success || !messageId || !uuid.safeParse(messageId).success) {
      return NextResponse.json({ error: 'Invalid pin request' }, { status: 400 })
    }
    const denied = await authorize(authentication.context, id, messageId)
    if (denied) return denied
    const { error } = await getClient(authentication.context)
      .from('direct_message_pins')
      .delete()
      .eq('message_id', messageId)
      .eq('pinned_by', authentication.context.user.id)
    if (error) throw error
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to unpin message', 500, false)
  }
}