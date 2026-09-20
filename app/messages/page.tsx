import { FloatingChat } from '@/components/floating-chat'
import { MessengerInvitationList } from '@/components/messenger-invitation-list'
import { requireUser } from '@/lib/auth/require-auth'
import { supabaseAdmin } from '@/lib/supabase/server'

async function resolveGroupChannel(groupId: string | undefined): Promise<string | null> {
  if (!groupId) return null
  const authentication = await requireUser()
  if (!authentication.ok) return null
  const { data: membership } = await authentication.context.supabase
    .from('group_members')
    .select('group_id')
    .eq('group_id', groupId)
    .eq('user_id', authentication.context.user.id)
    .eq('status', 'active')
    .maybeSingle()
  if (!membership) return null
  const { data: channel } = await supabaseAdmin
    .from('group_chat_channels')
    .select('id')
    .eq('group_id', groupId)
    .is('event_id', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  return channel?.id ?? null
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>
}) {
  const { group } = await searchParams
  const initialConversationId = await resolveGroupChannel(group)
  return (
    <div className="messages-page flex h-[calc(100vh-4rem)] min-h-0 flex-col overflow-hidden">
      <MessengerInvitationList />
      <div className="min-h-0 flex-1">
        <FloatingChat fullPage initialConversationId={initialConversationId} />
      </div>
    </div>
  )
}
