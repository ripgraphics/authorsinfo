/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { DELETE, GET, POST } from '@/app/api/messages/direct/[id]/reactions/route'
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
const reactionId = '44444444-4444-4444-8444-444444444444'
const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)

function query(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
}

let messages: ReturnType<typeof query>
let reactions: ReturnType<typeof query>

beforeEach(() => {
  jest.clearAllMocks()
  messages = query({ data: { id: messageId }, error: null })
  reactions = query({
    data: { id: reactionId, message_id: messageId, reaction: 'heart', user_id: userId },
    error: null,
  })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'direct_conversation_messages') return messages
    if (table === 'direct_message_reactions') return reactions
    throw new Error(`Unexpected table ${table}`)
  })
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: userId }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

const context = { params: Promise.resolve({ id: conversationId }) }

function request(method: string, queryString = '', body?: Record<string, unknown>) {
  return new NextRequest(
    `http://localhost/api/messages/direct/${conversationId}/reactions${queryString}`,
    {
      method,
      ...(body
        ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
        : {}),
    }
  )
}

test('adds an authenticated reaction to a participant message', async () => {
  const response = await POST(
    request('POST', '', { message_id: messageId, reaction: 'heart' }),
    context
  )

  expect(response.status).toBe(201)
  expect(reactions.insert).toHaveBeenCalledWith({
    message_id: messageId,
    reaction: 'heart',
    user_id: userId,
  })
})

test('lists reactions only after the message is authorized', async () => {
  const response = await GET(request('GET', `?message_id=${messageId}`), context)

  expect(response.status).toBe(200)
  expect(reactions.eq).toHaveBeenCalledWith('message_id', messageId)
})

test('removes only the authenticated users reaction', async () => {
  const response = await DELETE(
    request('DELETE', `?message_id=${messageId}&reaction=heart`),
    context
  )

  expect(response.status).toBe(204)
  expect(reactions.eq).toHaveBeenCalledWith('user_id', userId)
})

test('rejects malformed reactions', async () => {
  const response = await POST(
    request('POST', '', { message_id: 'bad', reaction: 'heart' }),
    context
  )

  expect(response.status).toBe(400)
  expect(reactions.insert).not.toHaveBeenCalled()
})
