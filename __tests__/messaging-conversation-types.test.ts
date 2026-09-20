import {
  normalizeDirectConversation,
  normalizeGroupConversation,
} from '@/lib/messaging/conversation-types'

describe('messaging conversation adapters', () => {
  test('normalizes a direct conversation into the Messenger contract', () => {
    expect(
      normalizeDirectConversation({
        id: 'direct-1',
        participant_id: 'user-2',
        last_message_at: '2026-09-17T12:00:00.000Z',
        last_message_preview: 'Hello there',
      })
    ).toEqual({
      id: 'direct-1',
      kind: 'direct',
      participantId: 'user-2',
      title: null,
      latestMessagePreview: 'Hello there',
      latestMessageAt: '2026-09-17T12:00:00.000Z',
    })
  })

  test('normalizes a group channel into the Messenger contract', () => {
    expect(
      normalizeGroupConversation({
        id: 'channel-1',
        group_id: 'group-1',
        name: 'Book Club',
        latest_message: {
          message: 'Welcome',
          created_at: '2026-09-17T12:00:00.000Z',
        },
      })
    ).toEqual({
      id: 'channel-1',
      kind: 'messenger_group',
      participantId: null,
      title: 'Book Club',
      description: null,
      avatarUrl: null,
      privacyMode: 'moderated',
      historyPolicy: 'retained_moderated',
      latestMessagePreview: 'Welcome',
      latestMessageAt: '2026-09-17T12:00:00.000Z',
      groupId: 'group-1',
    })
  })
})
