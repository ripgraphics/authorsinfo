/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { POST } from '@/app/api/messages/direct/[id]/route'
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
const otherUserId = '22222222-2222-4222-8222-222222222222'
const conversationId = '33333333-3333-4333-8333-333333333333'
const messageId = '44444444-4444-4444-8444-444444444444'
const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)

function query(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
    insert: jest.fn().mockReturnThis(),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
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
    data: { id: messageId, conversation_id: conversationId, sender_id: userId, body: 'Hello' },
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

test('dispatches a notification to the other participant after sending', async () => {
  const { NotificationDispatcher } = await import('@/lib/services/notification-dispatcher')
  const response = await POST(
    new NextRequest(`http://localhost/api/messages/direct/${conversationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'Hello' }),
    }),
    context
  )

  expect(response.status).toBe(201)
  expect(NotificationDispatcher.dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      recipient_id: otherUserId,
      source_user_id: userId,
    })
  )
})
