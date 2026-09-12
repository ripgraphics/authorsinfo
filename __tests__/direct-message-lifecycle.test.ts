/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { DELETE, PATCH } from '@/app/api/messages/direct/[id]/messages/[messageId]/route'
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
    maybeSingle: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
    update: jest.fn().mockReturnThis(),
  }
}

let messages: ReturnType<typeof query>

beforeEach(() => {
  jest.clearAllMocks()
  messages = query({
    data: {
      id: messageId,
      conversation_id: conversationId,
      sender_id: userId,
      body: 'Edited message',
      edited_at: '2026-09-11T00:00:00.000Z',
      deleted_at: null,
    },
    error: null,
  })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'direct_conversation_messages') return messages
    throw new Error(`Unexpected table ${table}`)
  })
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: userId }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

const context = {
  params: Promise.resolve({ id: conversationId, messageId }),
}

function request(body?: Record<string, unknown>, method = 'PATCH') {
  return new NextRequest(
    `http://localhost/api/messages/direct/${conversationId}/messages/${messageId}`,
    {
      method,
      ...(body
        ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
        : {}),
    }
  )
}

test('edits only a message owned by the authenticated sender', async () => {
  const response = await PATCH(request({ body: ' Edited message ' }), context)

  expect(response.status).toBe(200)
  expect(messages.eq).toHaveBeenCalledWith('sender_id', userId)
  expect(messages.update).toHaveBeenCalledWith({
    body: 'Edited message',
    edited_at: expect.any(String),
  })
})

test('soft deletes only a message owned by the authenticated sender', async () => {
  const response = await DELETE(request(undefined, 'DELETE'), context)

  expect(response.status).toBe(200)
  expect(messages.eq).toHaveBeenCalledWith('sender_id', userId)
  expect(messages.update).toHaveBeenCalledWith({ deleted_at: expect.any(String) })
})

test('rejects invalid edit bodies', async () => {
  const response = await PATCH(request({ body: 'x'.repeat(10001) }), context)

  expect(response.status).toBe(400)
  expect(messages.update).not.toHaveBeenCalled()
})

test('rejects cross-origin lifecycle writes', async () => {
  const crossOrigin = request({ body: 'Edited' })
  crossOrigin.headers.set('origin', 'https://untrusted.example')

  expect((await PATCH(crossOrigin, context)).status).toBe(403)
  expect(messages.update).not.toHaveBeenCalled()
})
