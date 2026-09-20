/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { DELETE, GET, POST } from '@/app/api/messages/direct/[id]/pins/route'
import { requireUser } from '@/lib/auth/require-auth'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/lib/error-handler', () => ({ nextErrorResponse: jest.fn(() => NextResponse.json({ error: 'Operation failed' }, { status: 500 })) }))

const userId = '11111111-1111-4111-8111-111111111111'
const conversationId = '22222222-2222-4222-8222-222222222222'
const messageId = '33333333-3333-4333-8333-333333333333'
const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)

function query(result: { data: unknown; error: unknown }) {
  return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue(result), insert: jest.fn().mockReturnThis(), delete: jest.fn().mockReturnThis() }
}

let messages: ReturnType<typeof query>
let pins: ReturnType<typeof query>

beforeEach(() => {
  jest.clearAllMocks()
  messages = query({ data: { id: messageId }, error: null })
  pins = query({ data: { message_id: messageId, pinned_by: userId }, error: null })
  mockFrom.mockImplementation((table: string) => table === 'direct_conversation_messages' ? messages : pins)
  mockRequireUser.mockResolvedValue({ ok: true, context: { user: { id: userId }, supabase: { from: mockFrom } } } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

const context = { params: Promise.resolve({ id: conversationId }) }

test('pins an authorized message for the authenticated user', async () => {
  const response = await POST(new NextRequest(`http://localhost/api/messages/direct/${conversationId}/pins`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message_id: messageId }) }), context)
  expect(response.status).toBe(201)
  expect(pins.insert).toHaveBeenCalledWith({ message_id: messageId, pinned_by: userId })
})

test('unpins only the authenticated user pin', async () => {
  const response = await DELETE(new NextRequest(`http://localhost/api/messages/direct/${conversationId}/pins?message_id=${messageId}`, { method: 'DELETE' }), context)
  expect(response.status).toBe(204)
  expect(pins.eq).toHaveBeenCalledWith('pinned_by', userId)
})