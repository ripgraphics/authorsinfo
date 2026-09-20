import { NextResponse } from 'next/server'
import { requireUser, type AuthenticatedRoute } from '@/lib/auth/require-auth'
import { nextErrorResponse } from '@/lib/error-handler'

interface InboxQuery {
  select(columns: string): InboxQuery
  eq(column: string, value: string): InboxQuery
  in(column: string, values: string[]): InboxQuery
  is(column: string, value: null): InboxQuery
  or(expression: string): InboxQuery
  order(column: string, options: { ascending: boolean }): InboxQuery
  limit(value: number): InboxQuery
  maybeSingle(): Promise<{ data: unknown; error: unknown }>
  then<TResult1 = { data: unknown[] | null; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown[] | null; error: unknown }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>
}

interface InboxClient {
  from(
    table:
      | 'group_members'
      | 'group_chat_channels'
      | 'group_chat_messages'
      | 'group_chat_channel_read_state'
  ): InboxQuery
}

interface GroupMembership {
  group_id: string
}

interface ChatChannel {
  id: string
  group_id: string
  name: string | null
  description: string | null
}

interface ChatMessage {
  id: string
  channel_id: string
  user_id: string | null
  message: string | null
  created_at: string | null
}

interface InboxConversation extends ChatChannel {
  latest_message: ChatMessage | null
  unread_count: number
  kind: 'messenger_group'
  title: string | null
  latest_message_preview: string | null
  latest_message_at: string | null
}

function getInboxClient(context: AuthenticatedRoute): InboxClient {
  return context.supabase as unknown as InboxClient
}

export async function GET() {
  try {
    const authentication = await requireUser()
    if (!authentication.ok) return authentication.response

    const supabase = getInboxClient(authentication.context)
    const { data: memberships, error: membershipError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', authentication.context.user.id)
      .eq('status', 'active')
    if (membershipError) throw membershipError

    const groupIds = (memberships ?? []).map(
      (membership) => (membership as GroupMembership).group_id
    )
    if (groupIds.length === 0) return NextResponse.json([])

    const { data: channels, error: channelError } = await supabase
      .from('group_chat_channels')
      .select('id, group_id, name, description')
      .in('group_id', groupIds)
      .is('event_id', null)
      .or('is_event_channel.is.null,is_event_channel.eq.false')
      .order('created_at', { ascending: true })
    if (channelError) throw channelError

    const conversations: InboxConversation[] = []
    for (const channel of (channels ?? []) as ChatChannel[]) {
      const { data: readState, error: readStateError } = await supabase
        .from('group_chat_channel_read_state')
        .select('last_read_at')
        .eq('channel_id', channel.id)
        .eq('user_id', authentication.context.user.id)
        .maybeSingle()
      if (readStateError) throw readStateError
      const { data: messages, error: messageError } = await supabase
        .from('group_chat_messages')
        .select('id, channel_id, user_id, message, created_at')
        .eq('channel_id', channel.id)
        .or('is_hidden.is.null,is_hidden.eq.false')
        .order('created_at', { ascending: false })
        .limit(1)
      if (messageError) throw messageError
      const lastReadAt = (readState as { last_read_at?: string | null } | null)?.last_read_at
      const { data: unreadMessages, error: unreadError } = await supabase
        .from('group_chat_messages')
        .select('id')
        .eq('channel_id', channel.id)
        .or('is_hidden.is.null,is_hidden.eq.false')
        .order('created_at', { ascending: true })
        .limit(100)
      if (unreadError) throw unreadError
      conversations.push({
        ...channel,
        latest_message: ((messages ?? [])[0] as ChatMessage) ?? null,
        unread_count: (unreadMessages ?? []).filter((message) => {
          const createdAt = (message as ChatMessage).created_at
          return !lastReadAt || Boolean(createdAt && createdAt > lastReadAt)
        }).length,
        kind: 'messenger_group',
        title: channel.name,
        latest_message_preview: ((messages ?? [])[0] as ChatMessage)?.message ?? null,
        latest_message_at: ((messages ?? [])[0] as ChatMessage)?.created_at ?? null,
      })
    }

    conversations.sort((left, right) => {
      const leftDate = left.latest_message?.created_at ?? ''
      const rightDate = right.latest_message?.created_at ?? ''
      return rightDate.localeCompare(leftDate)
    })
    return NextResponse.json(conversations, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return nextErrorResponse(error, 'Unable to load messages', 500, false)
  }
}
