/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { PATCH } from '@/app/api/messages/requests/route'
import { requireUser } from '@/lib/auth/require-auth'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() => NextResponse.json({ error: 'Operation failed' }, { status: 500 })),
}))

const requesterId = '11111111-1111-4111-8111-111111111111'
const recipientId = '22222222-2222-4222-8222-222222222222'
const requestId = '33333333-3333-4333-8333-333333333333'
const conversationId = '44444444-4444-4444-8444-444444444444'
const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)

function query(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    update: jest.fn().mockReturnThis(),
  }
}

let requests: ReturnType<typeof query>

beforeEach(() => {
  jest.clearAllMocks()
  requests = query({
    data: {
      id: requestId,
      conversation_id: conversationId,
      requester_id: requesterId,
      recipient_id: recipientId,
      status: 'pending',
      created_at: '2026-09-19T12:00:00.000Z',
      responded_at: null,
    },
    error: null,
  })
  mockFrom.mockReturnValue(requests)
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: recipientId }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

function updateRequest(action: string, requestIdValue = requestId) {
  return new NextRequest('http://localhost/api/messages/requests', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id: requestIdValue, action }),
  })
}

test('allows the recipient to accept a pending request', async () => {
  const response = await PATCH(updateRequest('accept'))

  expect(response.status).toBe(200)
  expect(requests.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'accepted' }))
})

test('rejects a non-recipient from accepting a request', async () => {
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: '99999999-9999-4999-8999-999999999999' }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)

  const response = await PATCH(updateRequest('accept'))

  expect(response.status).toBe(403)
  expect(requests.update).not.toHaveBeenCalled()
})

test('allows the requester to cancel a pending request', async () => {
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: requesterId }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)

  const response = await PATCH(updateRequest('cancel'))

  expect(response.status).toBe(200)
  expect(requests.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'cancelled' }))
})
