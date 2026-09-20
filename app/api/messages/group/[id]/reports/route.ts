import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const uuid = z.string().uuid()
const reportSchema = z.object({
  message_id: uuid,
  reason: z.enum(['spam', 'harassment', 'threats', 'hate', 'sexual', 'self_harm', 'other']),
  details: z.string().trim().max(1000).optional(),
}).strict()

type ReportContext = { params: Promise<{ id: string }> }

interface QueryResult<T = unknown> { data: T | null; error: unknown }
interface Query {
  select(columns: string): Query
  eq(column: string, value: string): Query
  is(column: string, value: null): Query
  maybeSingle(): Promise<QueryResult>
  single(): Promise<QueryResult>
  insert(value: Record<string, string>): Query
}
interface Client { from(table: 'group_members' | 'group_chat_channels' | 'group_chat_messages' | 'group_chat_reports'): Query }

function client(context: AuthenticatedRoute): Client {
  return context.supabase as unknown as Client
}

export async function POST(request: NextRequest, { params }: ReportContext) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response

    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }

    const { id: groupId } = await params
    if (!uuid.safeParse(groupId).success) {
      return NextResponse.json({ error: 'Invalid group' }, { status: 400 })
    }
    const input = reportSchema.safeParse(await request.json().catch(() => null))
    if (!input.success) {
      return NextResponse.json({ error: 'Invalid report' }, { status: 400 })
    }

    const supabase = client(authentication.context)
    const membership = await supabase
      .from('group_members')
      .select('group_id')
      .eq('group_id', groupId)
      .eq('user_id', authentication.context.user.id)
      .eq('status', 'active')
      .maybeSingle()
    if (membership.error) throw membership.error
    if (!membership.data) {
      return NextResponse.json({ error: 'Active group membership required' }, { status: 403 })
    }

    const message = await supabase
      .from('group_chat_messages')
      .select('id, channel_id, user_id')
      .eq('id', input.data.message_id)
      .maybeSingle()
    if (message.error) throw message.error
    const messageRow = message.data as { id?: string; channel_id?: string; user_id?: string } | null
    if (!messageRow?.channel_id || !messageRow.user_id) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    const channel = await supabase
      .from('group_chat_channels')
      .select('id')
      .eq('id', messageRow.channel_id)
      .eq('group_id', groupId)
      .is('event_id', null)
      .maybeSingle()
    if (channel.error) throw channel.error
    if (!channel.data) return NextResponse.json({ error: 'Message not found' }, { status: 404 })

    const report = await supabase
      .from('group_chat_reports')
      .insert({
        message_id: input.data.message_id,
        reporter_id: authentication.context.user.id,
        reported_user_id: messageRow.user_id,
        reason: input.data.reason,
        ...(input.data.details ? { details: input.data.details } : {}),
      })
      .select('id, message_id, reason, created_at')
      .single()
    if (report.error) throw report.error

    return NextResponse.json(report.data, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to report group message', 500, false)
  }
}
