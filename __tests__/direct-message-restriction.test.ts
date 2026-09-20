/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { GET, PATCH } from '@/app/api/messages/direct/[id]/restriction/route'
import { requireUser } from '@/lib/auth/require-auth'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() => NextResponse.json({ error: 'Operation failed' }, { status: 500 })),
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
    maybeSingle: jest.fn().mockResolvedValue(result),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  }
}

let conversations: ReturnType<typeof query>
let restrictions: ReturnType<typeof query>

beforeEach(() => {
  jest.clearAllMocks()
  conversations = query({ data: { id: conversationId, user_low_id: userId, user_high_id: otherUserId }, error: null })
  restrictions = query({ data: null, error: null })
  mockFrom.mockImplementation((table: string) => table === 'direct_conversations' ? conversations : restrictions)
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: userId }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

const context = { params: Promise.resolve({ id: conversationId }) }

test('reports the current participant restriction state', async () => {
  const response = await GET(new NextRequest(`http://localhost/api/messages/direct/${conversationId}/restriction`), context)
  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({ restricted: false, restricted_user_id: otherUserId })
})

test('restricts and unrestricts the other participant', async () => {
  const restrictResponse = await PATCH(
    new NextRequest(`http://localhost/api/messages/direct/${conversationId}/restriction`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restricted: true }),
    }), context
  )
  expect(restrictResponse.status).toBe(200)
  expect(restrictions.insert).toHaveBeenCalledWith({ user_id: userId, restricted_user_id: otherUserId })

  const unrestrictResponse = await PATCH(
    new NextRequest(`http://localhost/api/messages/direct/${conversationId}/restriction`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restricted: false }),
    }), context
  )
  expect(unrestrictResponse.status).toBe(200)
  expect(restrictions.delete).toHaveBeenCalled()
})

test('denies a user outside the conversation', async () => {
  conversations.maybeSingle.mockResolvedValue({ data: null, error: null })
  const response = await GET(new NextRequest(`http://localhost/api/messages/direct/${conversationId}/restriction`), context)
  expect(response.status).toBe(403)
})
