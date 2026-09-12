/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { GET } from '@/app/api/messages/direct/search/route'
import { requireUser } from '@/lib/auth/require-auth'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() =>
    NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  ),
}))

const userId = '11111111-1111-4111-8111-111111111111'
const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)

function query(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    textSearch: jest.fn().mockReturnThis(),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
}

let messages: ReturnType<typeof query>
let conversations: ReturnType<typeof query>

beforeEach(() => {
  jest.clearAllMocks()
  messages = query({ data: [], error: null })
  conversations = query({ data: [{ id: '33333333-3333-4333-8333-333333333333' }], error: null })
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

function request(queryString: string) {
  return new NextRequest(`http://localhost/api/messages/direct/search${queryString}`)
}

test('searches only the authenticated users conversations', async () => {
  const response = await GET(request('?q=hello'))

  expect(response.status).toBe(200)
  expect(conversations.or).toHaveBeenCalledWith(
    `user_low_id.eq.${userId},user_high_id.eq.${userId}`
  )
  expect(messages.in).toHaveBeenCalledWith('conversation_id', [
    '33333333-3333-4333-8333-333333333333',
  ])
  expect(messages.is).toHaveBeenCalledWith('deleted_at', null)
  expect(messages.textSearch).toHaveBeenCalledWith('body', 'hello', { type: 'websearch' })
  expect(messages.limit).toHaveBeenCalledWith(20)
})

test('rejects empty search terms', async () => {
  expect((await GET(request('?q=   '))).status).toBe(400)
  expect(mockFrom).not.toHaveBeenCalled()
})

test('rejects missing search terms', async () => {
  expect((await GET(request(''))).status).toBe(400)
  expect(mockFrom).not.toHaveBeenCalled()
})

test('rejects oversized search terms', async () => {
  expect((await GET(request(`?q=${'x'.repeat(201)}`))).status).toBe(400)
  expect(mockFrom).not.toHaveBeenCalled()
})
