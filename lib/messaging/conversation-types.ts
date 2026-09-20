export type MessengerConversationKind = 'direct' | 'messenger_group'

export interface MessengerConversation {
  id: string
  kind: MessengerConversationKind
  participantId: string | null
  title: string | null
  description?: string | null
  avatarUrl?: string | null
  privacyMode?: 'private_e2ee' | 'moderated'
  historyPolicy?: 'retained_moderated'
  latestMessagePreview: string | null
  latestMessageAt: string | null
  unreadCount?: number
  groupId?: string
}

export interface DirectConversationRecord {
  id: string
  participant_id: string
  last_message_preview?: string | null
  last_message_at?: string | null
}

export interface GroupConversationRecord {
  id: string
  group_id: string
  name: string | null
  description?: string | null
  avatar_url?: string | null
  privacy_mode?: 'private_e2ee' | 'moderated'
  history_policy?: 'retained_moderated'
  latest_message?: {
    message: string | null
    created_at: string | null
  } | null
  unread_count?: number
}

export function normalizeDirectConversation(
  conversation: DirectConversationRecord
): MessengerConversation {
  return {
    id: conversation.id,
    kind: 'direct',
    participantId: conversation.participant_id,
    title: null,
    latestMessagePreview: conversation.last_message_preview ?? null,
    latestMessageAt: conversation.last_message_at ?? null,
  }
}

export function normalizeGroupConversation(
  conversation: GroupConversationRecord
): MessengerConversation {
  return {
    id: conversation.id,
    kind: 'messenger_group',
    participantId: null,
    title: conversation.name,
    description: conversation.description ?? null,
    avatarUrl: conversation.avatar_url ?? null,
    privacyMode: conversation.privacy_mode ?? 'moderated',
    historyPolicy: conversation.history_policy ?? 'retained_moderated',
    latestMessagePreview: conversation.latest_message?.message ?? null,
    latestMessageAt: conversation.latest_message?.created_at ?? null,
    unreadCount: conversation.unread_count,
    groupId: conversation.group_id,
  }
}
