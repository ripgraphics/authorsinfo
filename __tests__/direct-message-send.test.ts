/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { POST } from '@/app/api/messages/direct/[id]/route'
import { requireUser } from '@/lib/auth/require-auth'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() => NextResponse.json({ error: 'Operation failed' }, { status: 500 })),
}))
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server')
  return { ...actual, after: jest.fn((callback: () => void) => callback()) }
})
jest.mock('@/lib/services/notification-dispatcher', () => ({
  NotificationDispatcher: { dispatch: jest.fn().mockResolvedValue(undefined) },
}))

const userId = '11111111-1111-4111-8111-111111111111'
const otherUserId = '22222222-2222-4222-8222-222222222222'
const conversationId = '33333333-3333-4333-8333-333333333333'
const parentMessageId = '44444444-4444-4444-8444-444444444444'
const messageId = '55555555-5555-4555-8555-555555555555'
const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)

function query(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
    insert: jest.fn().mockReturnThis(),
  }
}

let conversations: ReturnType<typeof query>
let messages: ReturnType<typeof query>

beforeEach(() => {
  jest.clearAllMocks()
  conversations = query({
    data: { id: conversationId, user_low_id: userId, user_high_id: otherUserId },
    error: null,
  })
  messages = query({
    data: { id: messageId, conversation_id: conversationId, sender_id: userId, body: 'Reply' },
    error: null,
  })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'direct_conversations') return conversations
    if (table === 'direct_conversation_messages') return messages
    throw new Error(`Unexpected table ${table}`)
  })
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: userId }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

const context = { params: Promise.resolve({ id: conversationId }) }

function request(body: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/messages/direct/${conversationId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

test('accepts a reply parent from the same conversation', async () => {
  messages.maybeSingle.mockResolvedValueOnce({ data: { id: parentMessageId }, error: null })
  messages.single.mockResolvedValueOnce({
    data: { id: messageId, conversation_id: conversationId, sender_id: userId, body: 'Reply' },
    error: null,
  })

  const response = await POST(request({ body: 'Reply', reply_to_message_id: parentMessageId }), context)

  expect(response.status).toBe(201)
  expect(messages.insert).toHaveBeenCalledWith({
    conversation_id: conversationId,
    sender_id: userId,
    body: 'Reply',
    mention_user_ids: [],
    reply_to_message_id: parentMessageId,
  })
})

test('rejects a reply parent that is not in the conversation', async () => {
  messages.maybeSingle.mockResolvedValueOnce({ data: null, error: null })

  const response = await POST(request({ body: 'Reply', reply_to_message_id: parentMessageId }), context)

  expect(response.status).toBe(404)
  expect(messages.insert).not.toHaveBeenCalled()
})