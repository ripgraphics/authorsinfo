/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { DELETE, POST } from '@/app/api/users/block/route'

const userId = '11111111-1111-4111-8111-111111111111'
const blockedUserId = '22222222-2222-4222-8222-222222222222'
const mockCreateClient = jest.fn()

jest.mock('@/lib/supabase/client-helper', () => ({
  createRouteHandlerClientAsync: () => mockCreateClient(),
}))

jest.mock('@/lib/error-handler', () => ({
  badRequestError: (message: string) => ({ error: message }),
  handleDatabaseError: jest.fn(() => ({ message: 'Database failure', statusCode: 500 })),
  nextErrorResponse: jest.fn(() => NextResponse.json({ error: 'Operation failed' }, { status: 500 })),
  unauthorizedError: () => ({ error: 'Authentication required' }),
}))

function query(result: { data?: unknown; error?: unknown } = {}) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: result.data ?? null, error: result.error ?? null }),
    insert: jest.fn().mockResolvedValue({ data: null, error: result.error ?? null }),
    delete: jest.fn().mockReturnThis(),
  }
}

function request(body?: Record<string, unknown>, method = 'POST') {
  return new NextRequest('http://localhost/api/users/block', {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

test('requires authentication before blocking', async () => {
  mockCreateClient.mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: new Error('Unauthenticated') }) },
  })

  expect((await POST(request({ user_id: blockedUserId }))).status).toBe(401)
})

test('rejects a block request without a user id', async () => {
  mockCreateClient.mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }) },
  })

  expect((await POST(request())).status).toBe(400)
})

test('does not duplicate an existing block', async () => {
  const blocks = query({ data: { id: 'block-1' } })
  mockCreateClient.mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }) },
    from: jest.fn().mockReturnValue(blocks),
  })

  expect((await POST(request({ user_id: blockedUserId }))).status).toBe(200)
  expect(blocks.insert).not.toHaveBeenCalled()
  expect(blocks.eq).toHaveBeenNthCalledWith(1, 'user_id', userId)
  expect(blocks.eq).toHaveBeenNthCalledWith(2, 'blocked_user_id', blockedUserId)
})

test('unblocks only the authenticated user relationship', async () => {
  const blocks = query()
  mockCreateClient.mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }) },
    from: jest.fn().mockReturnValue(blocks),
  })

  expect((await DELETE(request({ user_id: blockedUserId }), 'DELETE' as never)).status).toBe(200)
  expect(blocks.eq).toHaveBeenNthCalledWith(1, 'user_id', userId)
  expect(blocks.eq).toHaveBeenNthCalledWith(2, 'blocked_user_id', blockedUserId)
})