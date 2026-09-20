/** @jest-environment node */

import { useRealtimeStore } from '@/lib/stores/realtime-store'

test('disconnect clears account-scoped presence and activity state', () => {
  useRealtimeStore.setState({
    isConnected: true,
    userPresence: new Map([
      ['user-1', { userId: 'user-1', status: 'online', lastSeen: new Date().toISOString(), typing: false }],
    ]),
    onlineUserCount: 1,
    activityFeed: [{
      id: 'activity-1',
      userId: 'user-1',
      type: 'message',
      title: 'Private activity',
      description: 'private',
      entityType: 'message',
      entityId: 'message-1',
      visibility: 'private',
      metadata: {},
      createdAt: new Date().toISOString(),
    }],
  })

  useRealtimeStore.getState().disconnect()

  expect(useRealtimeStore.getState().userPresence.size).toBe(0)
  expect(useRealtimeStore.getState().onlineUserCount).toBe(0)
  expect(useRealtimeStore.getState().activityFeed).toEqual([])
  expect(useRealtimeStore.getState().isConnected).toBe(false)
})
