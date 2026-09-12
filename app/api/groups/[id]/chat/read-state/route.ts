import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const uuid = z.string().uuid()
const stateSchema = z
  .object({
    channel_id: uuid,
    last_read_at: z.string().datetime({ offset: true }).optional(),
    mark_unread: z.boolean().optional(),
  })
  .strict()
type Context = { params: Promise<{ id: string }> }

interface QueryResult {
  data: unknown[] | null
  error: unknown
}

interface Query {
  select(columns: string): Query
  eq(column: string, value: string): Query
  is(column: string, value: null): Query
  or(expression: string): Query
  maybeSingle(): Promise<QueryResult>
  upsert(value: Record<string, string | null>, options: { onConflict: string }): Query
  single(): Promise<QueryResult>
  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

interface Client {
  from(table: 'group_members' | 'group_chat_channels' | 'group_chat_channel_read_state'): Query
}

function client(context: AuthenticatedRoute): Client {
  return context.supabase as unknown as Client
}

async function authorize(context: AuthenticatedRoute, groupId: string, channelId: string) {
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

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { id: groupId } = await params
    const channelId = request.nextUrl.searchParams.get('channel_id')
    if (
      !uuid.safeParse(groupId).success ||
      typeof channelId !== 'string' ||
      !uuid.safeParse(channelId).success
    ) {
      return NextResponse.json({ error: 'Invalid read-state request' }, { status: 400 })
    }
    const denied = await authorize(authentication.context, groupId, channelId)
    if (denied) return denied
    const { data, error } = await client(authentication.context)
      .from('group_chat_channel_read_state')
      .select('channel_id, user_id, last_read_at, updated_at')
      .eq('channel_id', channelId)
      .eq('user_id', authentication.context.user.id)
      .maybeSingle()
    if (error) throw error
    return NextResponse.json(
      data ?? { channel_id: channelId, user_id: authentication.context.user.id, last_read_at: null }
    )
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load read state', 500, false)
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { id: groupId } = await params
    const input = stateSchema.safeParse(await request.json().catch(() => null))
    if (!uuid.safeParse(groupId).success || !input.success) {
      return NextResponse.json({ error: 'Invalid read-state payload' }, { status: 400 })
    }
    if (!input.data.last_read_at && input.data.mark_unread !== true) {
      return NextResponse.json(
        { error: 'A read cursor or mark_unread is required' },
        { status: 400 }
      )
    }
    const lastReadAt: string | null = input.data.mark_unread
      ? null
      : (input.data.last_read_at ?? null)
    const denied = await authorize(authentication.context, groupId, input.data.channel_id)
    if (denied) return denied
    const { data, error } = await client(authentication.context)
      .from('group_chat_channel_read_state')
      .upsert(
        {
          channel_id: input.data.channel_id,
          user_id: authentication.context.user.id,
          last_read_at: lastReadAt,
        },
        { onConflict: 'channel_id,user_id' }
      )
      .select('channel_id, user_id, last_read_at, updated_at')
      .single()
    if (error) throw error
    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to update read state', 500, false)
  }
}
