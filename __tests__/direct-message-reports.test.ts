/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { POST } from '@/app/api/messages/direct/[id]/report/route'
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
const messageId = '44444444-4444-4444-8444-444444444444'
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
let reports: ReturnType<typeof query>

beforeEach(() => {
  jest.clearAllMocks()
  conversations = query({
    data: { id: conversationId, user_low_id: userId, user_high_id: otherUserId },
    error: null,
  })
  messages = query({ data: { id: messageId, sender_id: otherUserId }, error: null })
  reports = query({ data: { id: 'report-id' }, error: null })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'direct_conversations') return conversations
    if (table === 'direct_conversation_messages') return messages
    if (table === 'direct_message_reports') return reports
    throw new Error(`Unexpected table ${table}`)
  })
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: userId }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

const context = { params: Promise.resolve({ id: conversationId }) }

test('reports a message from an authorized conversation', async () => {
  const response = await POST(
    new NextRequest(`http://localhost/api/messages/direct/${conversationId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: messageId, reason: 'harassment' }),
    }),
    context
  )

  expect(response.status).toBe(201)
  expect(reports.insert).toHaveBeenCalledWith({
    message_id: messageId,
    reporter_id: userId,
    reported_user_id: otherUserId,
    reason: 'harassment',
  })
})

test('rejects invalid report reasons', async () => {
  const response = await POST(
    new NextRequest(`http://localhost/api/messages/direct/${conversationId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: messageId, reason: 'x'.repeat(501) }),
    }),
    context
  )

  expect(response.status).toBe(400)
  expect(reports.insert).not.toHaveBeenCalled()
})

test('denies non-participants from reporting', async () => {
  conversations.maybeSingle.mockResolvedValue({ data: null, error: null })

  const response = await POST(
    new NextRequest(`http://localhost/api/messages/direct/${conversationId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: messageId, reason: 'harassment' }),
    }),
    context
  )

  expect(response.status).toBe(403)
  expect(reports.insert).not.toHaveBeenCalled()
})
