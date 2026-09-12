import { applyReactionDelete, applyReactionInsert } from '@/lib/chat-reaction-state'

test('deduplicates realtime reaction inserts', () => {
  const first = applyReactionInsert({}, { message_id: 'message-1', reaction: '👍' })
  const second = applyReactionInsert(first, { message_id: 'message-1', reaction: '👍' })
  expect(second).toEqual({ 'message-1': ['👍'] })
})

test('removes reaction rows without affecting other messages', () => {
  const state = {
    'message-1': ['👍', '❤️'],
    'message-2': ['😂'],
  }
  expect(applyReactionDelete(state, { message_id: 'message-1', reaction: '👍' })).toEqual({
    'message-1': ['❤️'],
    'message-2': ['😂'],
  })
})

test('ignores incomplete realtime rows', () => {
  const state = { 'message-1': ['👍'] }
  expect(applyReactionInsert(state, { message_id: null, reaction: '❤️' })).toBe(state)
  expect(applyReactionDelete(state, { message_id: 'message-1', reaction: null })).toBe(state)
})
