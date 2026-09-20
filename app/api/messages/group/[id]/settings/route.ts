import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

const uuid = z.string().uuid()
const settingsSchema = z.object({
  is_archived: z.boolean().optional(),
  is_muted: z.boolean().optional(),
}).strict()
type Context = { params: Promise<{ id: string }> }

interface Query {
  select(columns: string): Query
  eq(column: string, value: string): Query
  is(column: string, value: null): Query
  or(expression: string): Query
  maybeSingle(): Promise<{ data: unknown; error: unknown }>
  upsert(value: Record<string, string | boolean>, options?: { onConflict: string }): Query
  single(): Promise<{ data: unknown; error: unknown }>
}

interface Client {
  from(table: 'group_chat_channels' | 'group_members' | 'group_conversation_settings'): Query
}

function getClient(context: AuthenticatedRoute): Client {
  return context.supabase as unknown as Client
}

async function authorize(context: AuthenticatedRoute, channelId: string) {
  const supabase = getClient(context)
  const { data: channel, error: channelError } = await supabase
    .from('group_chat_channels')
    .select('id, group_id')
    .eq('id', channelId)
    .is('event_id', null)
    .or('is_event_channel.is.null,is_event_channel.eq.false')
    .maybeSingle()
  if (channelError) throw channelError
  if (!channel || typeof channel !== 'object' || channel === null || !('group_id' in channel)) {
    return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
  }
  const groupId = (channel as { group_id: unknown }).group_id
  if (typeof groupId !== 'string') return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
  const { data: membership, error: membershipError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('group_id', groupId)
    .eq('user_id', context.user.id)
    .eq('status', 'active')
    .maybeSingle()
  if (membershipError) throw membershipError
  return membership ? null : NextResponse.json({ error: 'Active group membership required' }, { status: 403 })
}

export async function GET(_: NextRequest, { params }: Context) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const { id } = await params
    if (!uuid.safeParse(id).success) return NextResponse.json({ error: 'Invalid settings request' }, { status: 400 })
    const denied = await authorize(authentication.context, id)
    if (denied) return denied
    const { data, error } = await getClient(authentication.context)
      .from('group_conversation_settings')
      .select('channel_id, user_id, is_archived, is_muted, updated_at')
      .eq('channel_id', id)
      .eq('user_id', authentication.context.user.id)
      .maybeSingle()
    if (error) throw error
    return NextResponse.json(data ?? {
      channel_id: id,
      user_id: authentication.context.user.id,
      is_archived: false,
      is_muted: false,
    })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load group conversation settings', 500, false)
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    const { id } = await params
    const input = settingsSchema.safeParse(await request.json().catch(() => null))
    if (!uuid.safeParse(id).success || !input.success || Object.keys(input.data).length === 0) {
      return NextResponse.json({ error: 'Invalid conversation settings' }, { status: 400 })
    }
    const denied = await authorize(authentication.context, id)
    if (denied) return denied
    const { data, error } = await getClient(authentication.context)
      .from('group_conversation_settings')
      .upsert({ channel_id: id, user_id: authentication.context.user.id, ...input.data, updated_at: new Date().toISOString() }, { onConflict: 'channel_id,user_id' })
      .select('channel_id, user_id, is_archived, is_muted, updated_at')
      .single()
    if (error) throw error
    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to update group conversation settings', 500, false)
  }
}
