import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const conversationSchema = z
  .object({
    user_id: z.string().uuid().optional(),
    user_permalink: z.string().trim().min(1).max(200).optional(),
  })
  .strict()
  .refine((value) => Boolean(value.user_id || value.user_permalink), {
    message: 'Target user is required',
  })

type ConversationRow = {
  id: string
  user_low_id: string
  user_high_id: string
  created_at?: string | null
  last_message_at?: string | null
}

interface ConversationQueryResult {
  data: ConversationRow | null
  error: unknown
}

interface ConversationQuery {
  select(columns: string): ConversationQuery
  eq(column: string, value: string): ConversationQuery
  order(column: string, options: { ascending: boolean }): ConversationQuery
  maybeSingle(): Promise<ConversationQueryResult>
  single(): Promise<ConversationQueryResult>
  insert(value: Record<string, string>): ConversationQuery
  then<TResult1 = { data: ConversationRow[] | null; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((value: {
          data: ConversationRow[] | null
          error: unknown
        }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

interface ConversationSupabaseClient {
  from(table: 'direct_conversations' | 'users'): ConversationQuery
}

function getConversationClient(context: AuthenticatedRoute): ConversationSupabaseClient {
  return context.supabase as unknown as ConversationSupabaseClient
}

export async function GET() {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response

    const { data, error } = await getConversationClient(authentication.context)
      .from('direct_conversations')
      .select('id, user_low_id, user_high_id, created_at, last_message_at')
      .order('last_message_at', { ascending: false })
    if (error) throw error

    const conversations = (data ?? []).map((conversation) => ({
      ...conversation,
      participant_id:
        conversation.user_low_id === authentication.context.user.id
          ? conversation.user_high_id
          : conversation.user_low_id,
    }))
    return NextResponse.json(conversations, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load direct conversations', 500, false)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response

    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }

    const input = conversationSchema.safeParse(await request.json().catch(() => null))
    if (!input.success) {
      return NextResponse.json({ error: 'Invalid conversation request' }, { status: 400 })
    }

    let targetUserId = input.data.user_id
    if (!targetUserId && input.data.user_permalink) {
      const { data: target, error: targetError } = await getConversationClient(
        authentication.context
      )
        .from('users')
        .select('id')
        .eq('user_permalink', input.data.user_permalink)
        .maybeSingle()
      if (targetError) throw targetError
      targetUserId = (target as { id?: string } | null)?.id
    }
    if (!targetUserId || targetUserId === authentication.context.user.id) {
      return NextResponse.json({ error: 'Invalid conversation target' }, { status: 400 })
    }

    const userIds = [authentication.context.user.id, targetUserId].sort()
    const [userLowId, userHighId] = userIds
    const supabase = getConversationClient(authentication.context)
    const existing = await supabase
      .from('direct_conversations')
      .select('id, user_low_id, user_high_id')
      .eq('user_low_id', userLowId)
      .eq('user_high_id', userHighId)
      .maybeSingle()
    if (existing.error) throw existing.error
    if (existing.data) return NextResponse.json(existing.data)

    const created = await supabase
      .from('direct_conversations')
      .insert({ user_low_id: userLowId, user_high_id: userHighId })
      .select('id, user_low_id, user_high_id')
      .single()
    if (created.error) throw created.error

    return NextResponse.json(created.data, { status: 201 })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to create direct conversation', 500, false)
  }
}
