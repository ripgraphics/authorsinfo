/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { POST as createConversation } from '@/app/api/messages/direct/route'
import { requireUser } from '@/lib/auth/require-auth'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() =>
    NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  ),
}))

const userId = '11111111-1111-4111-8111-111111111111'
const otherUserId = '22222222-2222-4222-8222-222222222222'
const conversationId = '33333333-3333-4333-8333-333333333333'
const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)

function query(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
    insert: jest.fn().mockReturnThis(),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
}

let conversations: ReturnType<typeof query>

beforeEach(() => {
  jest.clearAllMocks()
  conversations = query({ data: null, error: null })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'direct_conversations') return conversations
    throw new Error(`Unexpected table ${table}`)
  })
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: userId }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

function request(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/messages/direct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

test('creates a canonical conversation without accepting a forged sender', async () => {
  conversations.single.mockResolvedValue({
    data: { id: conversationId, user_low_id: userId, user_high_id: otherUserId },
    error: null,
  })

  const response = await createConversation(request({ user_id: otherUserId }))

  expect(response.status).toBe(201)
  expect(conversations.insert).toHaveBeenCalledWith({
    user_low_id: userId,
    user_high_id: otherUserId,
  })
})

test('rejects caller-supplied participant identity fields', async () => {
  const response = await createConversation(
    request({ user_id: otherUserId, sender_id: '44444444-4444-4444-8444-444444444444' })
  )

  expect(response.status).toBe(400)
  expect(conversations.insert).not.toHaveBeenCalled()
})

test('requires authentication before creating a conversation', async () => {
  mockRequireUser.mockResolvedValue({
    ok: false,
    response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
  })

  expect((await createConversation(request({ user_id: otherUserId }))).status).toBe(401)
  expect(mockFrom).not.toHaveBeenCalled()
})
