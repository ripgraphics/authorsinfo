import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'
import { computeCallProviderStatus, type CallProviderSettings } from '@/lib/call-config'

const uuid = z.string().uuid()
const startSchema = z
  .object({
    conversation_id: uuid,
    media_type: z.enum(['audio', 'video']),
  })
  .strict()
const updateSchema = z
  .object({
    status: z.enum(['accepted', 'declined', 'ended', 'failed']),
    end_reason: z.string().trim().max(100).optional(),
  })
  .strict()
type CallContext = { params: Promise<{ id: string }> }

type ConfigRow = { setting_key: string; setting_value: string | null }

type CallSessionRow = {
  id: string
  conversation_id: string
  initiator_id: string
  recipient_id: string
  media_type: 'audio' | 'video'
  status: 'ringing' | 'accepted' | 'declined' | 'ended' | 'missed' | 'failed'
  started_at: string | null
  ended_at: string | null
  end_reason: string | null
  created_at: string
}

interface CallQuery {
  select(columns: string): CallQuery
  eq(column: string, value: string): CallQuery
  maybeSingle(): Promise<{ data: unknown; error: unknown }>
  single(): Promise<{ data: CallSessionRow | null; error: unknown }>
  insert(value: Record<string, string>): CallQuery
  update(value: Record<string, string | null>): CallQuery
  then<TResult1 = { data: CallSessionRow[] | null; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((value: {
          data: CallSessionRow[] | null
          error: unknown
        }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

interface CallClient {
  from(table: 'call_provider_config' | 'direct_conversations' | 'call_sessions'): CallQuery
}

function getClient(context: AuthenticatedRoute): CallClient {
  return context.supabase as unknown as CallClient
}

async function getProviderStatus(context: AuthenticatedRoute) {
  const { data, error } = await getClient(context)
    .from('call_provider_config')
    .select('setting_key, setting_value')
  if (error) throw error
  const settings: CallProviderSettings = {
    turn_provider: null,
    turn_url: null,
    turn_username: null,
    stun_url: null,
    signaling_server_url: null,
    calls_enabled: null,
  }
  for (const row of (data ?? []) as unknown as ConfigRow[]) {
    if (row.setting_key in settings) {
      settings[row.setting_key as keyof CallProviderSettings] = row.setting_value
    }
  }
  return computeCallProviderStatus(settings)
}

async function authorizeConversation(context: AuthenticatedRoute, conversationId: string) {
  const { data, error } = await getClient(context)
    .from('direct_conversations')
    .select('id, user_low_id, user_high_id')
    .eq('id', conversationId)
    .maybeSingle()
  if (error) throw error
  const conversation = data as { id: string; user_low_id: string; user_high_id: string } | null
  if (
    !conversation ||
    ![conversation.user_low_id, conversation.user_high_id].includes(context.user.id)
  ) {
    return NextResponse.json({ error: 'Conversation access denied' }, { status: 403 })
  }
  return conversation
}

async function loadAuthorizedCall(context: AuthenticatedRoute, callId: string) {
  const { data, error } = await getClient(context)
    .from('call_sessions')
    .select(
      'id, conversation_id, initiator_id, recipient_id, media_type, status, started_at, ended_at, end_reason, created_at'
    )
    .eq('id', callId)
    .maybeSingle()
  if (error) throw error
  const call = data as CallSessionRow | null
  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 })
  if (![call.initiator_id, call.recipient_id].includes(context.user.id)) {
    return NextResponse.json({ error: 'Call access denied' }, { status: 403 })
  }
  return call
}

export async function POST(request: NextRequest) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }
    const input = startSchema.safeParse(await request.json().catch(() => null))
    if (!input.success) {
      return NextResponse.json({ error: 'Invalid call request' }, { status: 400 })
    }

    const status = await getProviderStatus(authentication.context)
    if (!status.ready) {
      return NextResponse.json(
        { error: status.reason ?? 'Calls are not available.' },
        { status: 503 }
      )
    }

    const conversation = await authorizeConversation(
      authentication.context,
      input.data.conversation_id
    )
    if (conversation instanceof NextResponse) return conversation

    const recipientId =
      conversation.user_low_id === authentication.context.user.id
        ? conversation.user_high_id
        : conversation.user_low_id

    const { data, error } = await getClient(authentication.context)
      .from('call_sessions')
      .insert({
        conversation_id: input.data.conversation_id,
        initiator_id: authentication.context.user.id,
        recipient_id: recipientId,
        media_type: input.data.media_type,
        status: 'ringing',
      })
      .select(
        'id, conversation_id, initiator_id, recipient_id, media_type, status, started_at, ended_at, end_reason, created_at'
      )
      .single()
    if (error) throw error

    return NextResponse.json(data, {
      status: 201,
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to start call', 500, false)
  }
}

export async function PATCH(request: NextRequest, { params }: CallContext) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }
    const { id } = await params
    const input = updateSchema.safeParse(await request.json().catch(() => null))
    if (!uuid.safeParse(id).success || !input.success) {
      return NextResponse.json({ error: 'Invalid call update' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const updates: Record<string, string | null> = { status: input.data.status }
    if (input.data.status === 'accepted') updates.started_at = now
    if (['declined', 'ended', 'failed'].includes(input.data.status)) {
      updates.ended_at = now
      updates.end_reason = input.data.end_reason ?? null
    }

    const authorizedCall = await loadAuthorizedCall(authentication.context, id)
    if (authorizedCall instanceof NextResponse) return authorizedCall

    const { data, error } = await getClient(authentication.context)
      .from('call_sessions')
      .update(updates)
      .eq('id', authorizedCall.id)
      .select(
        'id, conversation_id, initiator_id, recipient_id, media_type, status, started_at, ended_at, end_reason, created_at'
      )
      .single()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Call not found' }, { status: 404 })

    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to update call', 500, false)
  }
}

export async function GET(_: NextRequest, { params }: CallContext) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { id } = await params
    if (!uuid.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid call request' }, { status: 400 })
    }

    const authorizedCall = await loadAuthorizedCall(authentication.context, id)
    if (authorizedCall instanceof NextResponse) return authorizedCall

    return NextResponse.json(authorizedCall, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load call', 500, false)
  }
}
