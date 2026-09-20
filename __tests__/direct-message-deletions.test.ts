/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { DELETE, POST } from '@/app/api/messages/direct/[id]/deletions/route'
import { requireUser } from '@/lib/auth/require-auth'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/lib/error-handler', () => ({ nextErrorResponse: jest.fn(() => NextResponse.json({ error: 'Operation failed' }, { status: 500 })) }))

const userId = '11111111-1111-4111-8111-111111111111'
const conversationId = '22222222-2222-4222-8222-222222222222'
const messageId = '33333333-3333-4333-8333-333333333333'
const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)

function query(result: { data: unknown; error: unknown }) {
  return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue(result), insert: jest.fn().mockResolvedValue(result), delete: jest.fn().mockReturnThis() }
}

let messages: ReturnType<typeof query>
let deletions: ReturnType<typeof query>

beforeEach(() => {
  jest.clearAllMocks()
  messages = query({ data: { id: messageId }, error: null })
  deletions = query({ data: null, error: null })
  mockFrom.mockImplementation((table: string) => table === 'direct_conversation_messages' ? messages : deletions)
  mockRequireUser.mockResolvedValue({ ok: true, context: { user: { id: userId }, supabase: { from: mockFrom } } } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

const context = { params: Promise.resolve({ id: conversationId }) }

test('deletes a message only for the authenticated user', async () => {
  const response = await POST(new NextRequest(`http://localhost/api/messages/direct/${conversationId}/deletions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message_id: messageId }) }), context)
  expect(response.status).toBe(204)
  expect(deletions.insert).toHaveBeenCalledWith(expect.objectContaining({ message_id: messageId, user_id: userId }))
})

test('restores a message for the authenticated user only', async () => {
  const response = await DELETE(new NextRequest(`http://localhost/api/messages/direct/${conversationId}/deletions?message_id=${messageId}`, { method: 'DELETE' }), context)
  expect(response.status).toBe(204)
  expect(deletions.eq).toHaveBeenCalledWith('user_id', userId)
})