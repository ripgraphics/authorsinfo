import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const identifier = z.string().uuid()
const historySchema = z
  .object({
    channel_id: identifier,
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict()
const channelListSchema = z.object({}).strict()
const messageSchema = z
  .object({
    channel_id: identifier,
    message: z.string().trim().min(1).max(10000),
  })
  .strict()
type ChatContext = { params: Promise<{ id: string }> }

interface ChatQueryResult {
  data: unknown[] | null
  error: unknown
}

interface ChatQuery {
  select(columns: string): ChatQuery
  eq(column: string, value: string): ChatQuery
  is(column: string, value: null): ChatQuery
  or(expression: string): ChatQuery
  order(column: string, options: { ascending: boolean; nullsFirst?: boolean }): ChatQuery
  limit(value: number): ChatQuery
  maybeSingle(): Promise<ChatQueryResult>
  single(): Promise<ChatQueryResult>
  insert(value: Record<string, string | boolean>): ChatQuery
  then<TResult1 = ChatQueryResult, TResult2 = never>(
    onfulfilled?: ((value: ChatQueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

interface ChatSupabaseClient {
  from(table: 'group_members' | 'group_chat_channels' | 'group_chat_messages'): ChatQuery
}

function getChatClient(context: AuthenticatedRoute): ChatSupabaseClient {
  return context.supabase as unknown as ChatSupabaseClient
}

async function authorizeChannel(context: AuthenticatedRoute, groupId: string, channelId: string) {
  const supabase = getChatClient(context)
  const { user } = context
  const { data: membership, error: membershipError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  if (membershipError) throw membershipError
  if (!membership)
    return NextResponse.json({ error: 'Active group membership required' }, { status: 403 })

  const { data: channel, error: channelError } = await supabase
    .from('group_chat_channels')
    .select('id')
    .eq('id', channelId)
    .eq('group_id', groupId)
    .is('event_id', null)
    .or('is_event_channel.is.null,is_event_channel.eq.false')
    .maybeSingle()
  if (channelError) throw channelError
  if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
  return null
}

async function authorizeGroup(context: AuthenticatedRoute, groupId: string) {
  const { data: membership, error } = await getChatClient(context)
    .from('group_members')
    .select('group_id')
    .eq('group_id', groupId)
    .eq('user_id', context.user.id)
    .eq('status', 'active')
    .maybeSingle()
  if (error) throw error
  if (!membership) {
    return NextResponse.json({ error: 'Active group membership required' }, { status: 403 })
  }
  return null
}

export async function GET(req: NextRequest, { params }: ChatContext) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { id } = await params
    if (!identifier.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid chat request' }, { status: 400 })
    }
    const channelId = req.nextUrl.searchParams.get('channel_id')
    if (!channelId) {
      const input = channelListSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams))
      if (!input.success)
        return NextResponse.json({ error: 'Invalid chat request' }, { status: 400 })
      const denied = await authorizeGroup(authentication.context, id)
      if (denied) return denied
      const { data, error } = await getChatClient(authentication.context)
        .from('group_chat_channels')
        .select('id, group_id, name, description')
        .eq('group_id', id)
        .is('event_id', null)
        .or('is_event_channel.is.null,is_event_channel.eq.false')
        .order('created_at', { ascending: true })
      if (error) throw error
      return NextResponse.json(data ?? [], {
        headers: { 'Cache-Control': 'private, no-store' },
      })
    }
    const input = historySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams))
    if (!input.success) {
      return NextResponse.json({ error: 'Invalid chat request' }, { status: 400 })
    }
    const denied = await authorizeChannel(authentication.context, id, input.data.channel_id)
    if (denied) return denied

    const { data, error } = await getChatClient(authentication.context)
      .from('group_chat_messages')
      .select('id, channel_id, user_id, message, created_at')
      .eq('channel_id', input.data.channel_id)
      .or('is_hidden.is.null,is_hidden.eq.false')
      .order('created_at', { ascending: false, nullsFirst: false })
      .order('id', { ascending: false })
      .limit(input.data.limit)
    if (error) throw error
    return NextResponse.json((data ?? []).reverse(), {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load group chat', 500, false)
  }
}

export async function POST(req: NextRequest, { params }: ChatContext) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const origin = req.headers.get('origin')
    if (origin && origin !== req.nextUrl.origin) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }
    const { id } = await params
    const input = messageSchema.safeParse(await req.json().catch(() => null))
    if (!identifier.safeParse(id).success || !input.success) {
      return NextResponse.json({ error: 'Invalid chat message' }, { status: 400 })
    }
    const denied = await authorizeChannel(authentication.context, id, input.data.channel_id)
    if (denied) return denied

    const { user } = authentication.context
    const supabase = getChatClient(authentication.context)
    const { data, error } = await supabase
      .from('group_chat_messages')
      .insert({
        channel_id: input.data.channel_id,
        message: input.data.message,
        user_id: user.id,
        is_hidden: false,
      })
      .select('id, channel_id, user_id, message, created_at')
      .single()
    if (error) throw error
    return NextResponse.json(data, {
      status: 201,
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to send group message', 500, false)
  }
}
