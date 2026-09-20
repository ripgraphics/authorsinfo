import { shouldSkipActiveUnreadRefresh } from '@/lib/messaging/unread'

describe('unread refresh policy', () => {
  test('does not skip an active conversation explicitly marked unread', () => {
    expect(
      shouldSkipActiveUnreadRefresh({
        chatOpen: true,
        conversationId: 'conversation-1',
        activeConversationId: 'conversation-1',
        manuallyUnreadConversationIds: new Set(['conversation-1']),
      })
    ).toBe(false)
  })

  test('skips a normally open active conversation', () => {
    expect(
      shouldSkipActiveUnreadRefresh({
        chatOpen: true,
        conversationId: 'conversation-1',
        activeConversationId: 'conversation-1',
        manuallyUnreadConversationIds: new Set(),
      })
    ).toBe(true)
  })
})