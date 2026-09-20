import {
  appendUniqueMessage,
  normalizeDirectMessage,
  normalizeGroupMessage,
} from '@/lib/messaging/message-types'

describe('messaging message adapters', () => {
  test('normalizes a direct message', () => {
    expect(
      normalizeDirectMessage({
        id: 'message-1',
        sender_id: 'user-1',
        body: 'Hello',
        created_at: '2026-09-17T12:00:00.000Z',
        deleted_at: null,
        read_at: null,
        read_by: null,
      })
    ).toEqual({
      id: 'message-1',
      senderId: 'user-1',
      body: 'Hello',
      createdAt: '2026-09-17T12:00:00.000Z',
      deletedAt: null,
      readAt: null,
      readBy: null,
    })
  })

  test('normalizes a group message', () => {
    expect(
      normalizeGroupMessage({
        id: 'message-2',
        user_id: 'user-2',
        message: 'Welcome',
        created_at: '2026-09-17T12:01:00.000Z',
      })
    ).toEqual({
      id: 'message-2',
      senderId: 'user-2',
      body: 'Welcome',
      createdAt: '2026-09-17T12:01:00.000Z',
      deletedAt: null,
      readAt: null,
      readBy: null,
    })
  })

  test('ignores duplicate realtime messages by ID', () => {
    const first = normalizeDirectMessage({
      id: 'message-3',
      sender_id: 'user-1',
      body: 'First delivery',
      created_at: '2026-09-17T12:02:00.000Z',
    })
    const duplicate = { ...first, body: 'Duplicate delivery' }

    expect(appendUniqueMessage([first], duplicate)).toEqual([first])
  })
})
