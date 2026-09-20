import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const uuid = z.string().uuid()
const updateSchema = z.object({
  request_id: uuid,
  action: z.enum(['accept', 'decline', 'cancel']),
}).strict()

type RequestRow = {
  id: string
  conversation_id: string
  requester_id: string
  recipient_id: string
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  created_at: string
  responded_at: string | null
}

interface RequestQuery {
  select(columns: string): RequestQuery
  eq(column: string, value: string): RequestQuery
  order(column: string, options: { ascending: boolean }): RequestQuery
  maybeSingle(): Promise<{ data: unknown; error: unknown }>
  update(value: Record<string, string>): RequestQuery
  then<TResult1 = { data: RequestRow[] | null; error: unknown }, TResult2 = never>(
    onfulfilled?: ((value: { data: RequestRow[] | null; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

interface RequestClient {
  from(table: 'direct_message_requests'): RequestQuery
}

function getClient(context: AuthenticatedRoute): RequestClient {
  return context.supabase as unknown as RequestClient
}

export async function GET() {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { data, error } = await getClient(authentication.context)
      .from('direct_message_requests')
      .select('id, conversation_id, requester_id, recipient_id, status, created_at, responded_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data ?? [], { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load message requests', 500, false)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }
    const input = updateSchema.safeParse(await request.json().catch(() => null))
    if (!input.success) return NextResponse.json({ error: 'Invalid request update' }, { status: 400 })

    const client = getClient(authentication.context)
    const existing = await client
      .from('direct_message_requests')
      .select('id, conversation_id, requester_id, recipient_id, status, created_at, responded_at')
      .eq('id', input.data.request_id)
      .maybeSingle()
    if (existing.error) throw existing.error
    const messageRequest = existing.data as RequestRow | null
    if (!messageRequest) return NextResponse.json({ error: 'Message request not found' }, { status: 404 })
    const userId = authentication.context.user.id
    const permitted = input.data.action === 'cancel'
      ? messageRequest.requester_id === userId
      : messageRequest.recipient_id === userId
    if (!permitted) return NextResponse.json({ error: 'Message request access denied' }, { status: 403 })
    if (messageRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Message request is no longer pending' }, { status: 409 })
    }

    const nextStatus = input.data.action === 'accept' ? 'accepted' : input.data.action === 'decline' ? 'declined' : 'cancelled'
    const updated = await client
      .from('direct_message_requests')
      .update({ status: nextStatus, responded_at: new Date().toISOString() })
      .eq('id', messageRequest.id)
      .select('id, conversation_id, requester_id, recipient_id, status, created_at, responded_at')
      .maybeSingle()
    if (updated.error) throw updated.error
    return NextResponse.json(updated.data, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to update message request', 500, false)
  }
}
