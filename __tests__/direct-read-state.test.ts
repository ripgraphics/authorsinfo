/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { GET, POST } from '@/app/api/messages/direct/[id]/read-state/route'
import { requireUser } from '@/lib/auth/require-auth'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() =>
    NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  ),
}))

const userId = '11111111-1111-4111-8111-111111111111'
const conversationId = '22222222-2222-4222-8222-222222222222'
const messageId = '33333333-3333-4333-8333-333333333333'
const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)

function query(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
    upsert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
  }
}

let conversations: ReturnType<typeof query>
let readStates: ReturnType<typeof query>
let messages: ReturnType<typeof query>

beforeEach(() => {
  jest.clearAllMocks()
  conversations = query({ data: { id: conversationId }, error: null })
  readStates = query({
    data: { conversation_id: conversationId, user_id: userId, last_read_message_id: messageId },
    error: null,
  })
  messages = query({ data: { id: messageId, created_at: '2026-09-16T12:00:00.000Z' }, error: null })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'direct_conversations') return conversations
    if (table === 'direct_conversation_read_state') return readStates
    if (table === 'direct_conversation_messages') return messages
    throw new Error(`Unexpected table ${table}`)
  })
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: userId }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

const context = { params: Promise.resolve({ id: conversationId }) }

function request(body?: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/messages/direct/${conversationId}/read-state`, {
    method: body ? 'POST' : 'GET',
    ...(body
      ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : {}),
  })
}

test('loads read state only for an authorized participant', async () => {
  expect((await GET(request(), context)).status).toBe(200)
  expect(readStates.eq).toHaveBeenCalledWith('conversation_id', conversationId)
})

test('upserts read state using the authenticated owner', async () => {
  expect((await POST(request({ last_read_message_id: messageId }), context)).status).toBe(200)
  expect(messages.update).toHaveBeenCalledWith({
    read_at: expect.any(String),
    read_by: userId,
  })
  expect(readStates.upsert).toHaveBeenCalledWith({
    conversation_id: conversationId,
    user_id: userId,
    last_read_message_id: messageId,
  })
})

test('rejects malformed read-state payloads', async () => {
  expect((await POST(request({ last_read_message_id: 'not-a-uuid' }), context)).status).toBe(400)
  expect(readStates.upsert).not.toHaveBeenCalled()
})

test('denies access when the conversation cannot be resolved', async () => {
  conversations.maybeSingle.mockResolvedValue({ data: null, error: null })
  expect((await GET(request(), context)).status).toBe(403)
  expect(mockFrom).not.toHaveBeenCalledWith('direct_conversation_read_state')
})
