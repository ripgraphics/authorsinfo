import { getDirectMessengerRoute, getMessengerInboxRoute } from '@/lib/messaging/routes'

test('uses the canonical Messenger route for direct conversations', () => {
  expect(getDirectMessengerRoute('conversation/1')).toBe('/messages/direct/conversation%2F1')
})

test('uses the canonical unified inbox route', () => {
  expect(getMessengerInboxRoute()).toBe('/messages')
})
