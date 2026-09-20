export interface UnreadRefreshPolicyInput {
  chatOpen: boolean
  conversationId: string
  activeConversationId: string | null
  manuallyUnreadConversationIds: Set<string>
}

export function shouldSkipActiveUnreadRefresh({
  chatOpen,
  conversationId,
  activeConversationId,
  manuallyUnreadConversationIds,
}: UnreadRefreshPolicyInput): boolean {
  return (
    chatOpen &&
    conversationId === activeConversationId &&
    !manuallyUnreadConversationIds.has(conversationId)
  )
}