import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const uuid = z.string().uuid()
const reportSchema = z
  .object({
    message_id: uuid,
    reason: z.string().trim().min(1).max(500),
  })
  .strict()
type ReportContext = { params: Promise<{ id: string }> }

type ConversationRow = { id: string; user_low_id: string; user_high_id: string }
type MessageRow = { id: string; sender_id: string }

interface ReportQuery {
  select(columns: string): ReportQuery
  eq(column: string, value: string): ReportQuery
  maybeSingle(): Promise<{ data: unknown; error: unknown }>
  single(): Promise<{ data: unknown; error: unknown }>
  insert(value: Record<string, string>): ReportQuery
}

interface ReportClient {
  from(
    table: 'direct_conversations' | 'direct_conversation_messages' | 'direct_message_reports'
  ): ReportQuery
}

function getClient(context: AuthenticatedRoute): ReportClient {
  return context.supabase as unknown as ReportClient
}

export async function POST(request: NextRequest, { params }: ReportContext) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }
    const { id } = await params
    const input = reportSchema.safeParse(await request.json().catch(() => null))
    if (!uuid.safeParse(id).success || !input.success) {
      return NextResponse.json({ error: 'Invalid report request' }, { status: 400 })
    }

    const { data: conversationData, error: conversationError } = await getClient(
      authentication.context
    )
      .from('direct_conversations')
      .select('id, user_low_id, user_high_id')
      .eq('id', id)
      .maybeSingle()
    if (conversationError) throw conversationError
    const conversation = conversationData as ConversationRow | null
    if (
      !conversation ||
      ![conversation.user_low_id, conversation.user_high_id].includes(
        authentication.context.user.id
      )
    ) {
      return NextResponse.json({ error: 'Conversation access denied' }, { status: 403 })
    }

    const { data: messageData, error: messageError } = await getClient(authentication.context)
      .from('direct_conversation_messages')
      .select('id, sender_id')
      .eq('id', input.data.message_id)
      .eq('conversation_id', id)
      .maybeSingle()
    if (messageError) throw messageError
    const message = messageData as MessageRow | null
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 })

    const { data, error } = await getClient(authentication.context)
      .from('direct_message_reports')
      .insert({
        message_id: input.data.message_id,
        reporter_id: authentication.context.user.id,
        reported_user_id: message.sender_id,
        reason: input.data.reason,
      })
      .select('id, message_id, reporter_id, reported_user_id, reason, created_at')
      .single()
    if (error) throw error
    return NextResponse.json(data, {
      status: 201,
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to submit report', 500, false)
  }
}
