/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { GET } from '@/app/api/messages/direct/[id]/route'
import { requireUser } from '@/lib/auth/require-auth'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() =>
    NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  ),
}))
jest.mock('@/lib/services/notification-dispatcher', () => ({
  NotificationDispatcher: { dispatch: jest.fn().mockResolvedValue(null) },
}))

const userId = '11111111-1111-4111-8111-111111111111'
const conversationId = '22222222-2222-4222-8222-222222222222'
const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)

function query(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
}

let conversations: ReturnType<typeof query>
let messages: ReturnType<typeof query>

beforeEach(() => {
  jest.clearAllMocks()
  conversations = query({
    data: {
      id: conversationId,
      user_low_id: userId,
      user_high_id: '33333333-3333-4333-8333-333333333333',
    },
    error: null,
  })
  messages = query({ data: [], error: null })
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

test('accepts a bounded cursor for loading older direct messages', async () => {
  const cursor = '2026-09-11T00:00:00.000Z'
  const request = new NextRequest(
    `http://localhost/api/messages/direct/${conversationId}?limit=25&before=${encodeURIComponent(cursor)}`
  )
  const response = await GET(request, { params: Promise.resolve({ id: conversationId }) })

  expect(response.status).toBe(200)
  expect(messages.lt).toHaveBeenCalledWith('created_at', cursor)
  expect(messages.limit).toHaveBeenCalledWith(25)
})

test('rejects malformed history cursors', async () => {
  const request = new NextRequest(
    `http://localhost/api/messages/direct/${conversationId}?before=not-a-date`
  )

  expect((await GET(request, { params: Promise.resolve({ id: conversationId }) })).status).toBe(400)
  expect(mockFrom).not.toHaveBeenCalledWith('direct_conversation_messages')
})
