/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { GET, POST } from '@/app/api/messages/direct/[id]/route'
import { requireUser } from '@/lib/auth/require-auth'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('next/server', () => ({
  ...jest.requireActual('next/server'),
  after: (callback: () => unknown) => {
    void callback()
  },
}))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() =>
    NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  ),
}))
jest.mock('@/lib/services/notification-dispatcher', () => ({
  NotificationDispatcher: { dispatch: jest.fn().mockResolvedValue(null) },
}))

const userId = '11111111-1111-4111-8111-111111111111'
const otherUserId = '22222222-2222-4222-8222-222222222222'
const conversationId = '33333333-3333-4333-8333-333333333333'
const messageId = '44444444-4444-4444-8444-444444444444'
const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)

function query(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
    insert: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
}

let conversations: ReturnType<typeof query>
let messages: ReturnType<typeof query>
let readState: ReturnType<typeof query>

beforeEach(() => {
  jest.clearAllMocks()
  conversations = query({
    data: { id: conversationId, user_low_id: userId, user_high_id: otherUserId },
    error: null,
  })
  messages = query({
    data: { id: messageId, conversation_id: conversationId, sender_id: userId, body: 'Hello' },
    error: null,
  })
  readState = query({ data: null, error: null })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'direct_conversations') return conversations
    if (table === 'direct_conversation_messages') return messages
    if (table === 'direct_conversation_read_state') return readState
    throw new Error(`Unexpected table ${table}`)
  })
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: userId }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

function request(body?: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/messages/direct/${conversationId}`, {
    method: body ? 'POST' : 'GET',
    ...(body
      ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : {}),
  })
}

const context = { params: Promise.resolve({ id: conversationId }) }

test('loads only bounded history for a participant', async () => {
  const response = await GET(request(), context)

  expect(response.status).toBe(200)
  expect(conversations.eq).toHaveBeenCalledWith('id', conversationId)
  expect(messages.eq).toHaveBeenCalledWith('conversation_id', conversationId)
  expect(messages.limit).toHaveBeenCalledWith(50)
})

test('inserts a message using the authenticated sender', async () => {
  const response = await POST(request({ body: ' Hello ' }), context)

  expect(response.status).toBe(201)
  expect(messages.insert).toHaveBeenCalledWith({
    conversation_id: conversationId,
    sender_id: userId,
    body: 'Hello',
  })
})

test('rejects caller-supplied sender identity', async () => {
  const response = await POST(request({ body: 'Hello', sender_id: otherUserId }), context)

  expect(response.status).toBe(400)
  expect(messages.insert).not.toHaveBeenCalled()
})

test('rejects a non-participant conversation', async () => {
  conversations.maybeSingle.mockResolvedValue({ data: null, error: null })

  expect((await GET(request(), context)).status).toBe(403)
  expect(mockFrom).not.toHaveBeenCalledWith('direct_conversation_messages')
})

test.each(['', '   ', 'x'.repeat(10001)])('rejects invalid message bodies', async (body) => {
  expect((await POST(request({ body }), context)).status).toBe(400)
  expect(messages.insert).not.toHaveBeenCalled()
})
