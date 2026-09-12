/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { DELETE, POST } from '@/app/api/groups/[id]/chat/reactions/route'
import { requireUser } from '@/lib/auth/require-auth'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() =>
    NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  ),
}))

const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)
const groupId = '11111111-1111-4111-8111-111111111111'
const messageId = '44444444-4444-4444-8444-444444444444'
const userId = '33333333-3333-4333-8333-333333333333'
const context = { params: Promise.resolve({ id: groupId }) }

function query(result: { data: unknown; error: unknown }) {
  const builder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
  return builder
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: userId }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)
  mockFrom.mockImplementation((table: string) => {
    if (table === 'group_members') return query({ data: { group_id: groupId }, error: null })
    if (table === 'group_chat_messages') return query({ data: { id: messageId }, error: null })
    if (table === 'group_chat_message_reactions') {
      return query({ data: { id: '55555555-5555-4555-8555-555555555555' }, error: null })
    }
    throw new Error(`Unexpected table ${table}`)
  })
})

test('requires authentication before adding a reaction', async () => {
  mockRequireUser.mockResolvedValue({
    ok: false,
    response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
  })
  expect(
    (
      await POST(
        new NextRequest(`http://localhost/api/groups/${groupId}/chat/reactions`, {
          method: 'POST',
          body: JSON.stringify({ message_id: messageId, reaction: '👍' }),
        }),
        context
      )
    ).status
  ).toBe(401)
})

test('inserts a reaction for the authenticated user only', async () => {
  const reactionQuery = query({ data: { id: '55555555-5555-4555-8555-555555555555' }, error: null })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'group_members') return query({ data: { group_id: groupId }, error: null })
    if (table === 'group_chat_messages') return query({ data: { id: messageId }, error: null })
    if (table === 'group_chat_message_reactions') return reactionQuery
    throw new Error(`Unexpected table ${table}`)
  })
  const response = await POST(
    new NextRequest(`http://localhost/api/groups/${groupId}/chat/reactions`, {
      method: 'POST',
      body: JSON.stringify({ message_id: messageId, reaction: '👍', user_id: 'forged' }),
    }),
    context
  )
  expect(response.status).toBe(400)
  expect(reactionQuery.insert).not.toHaveBeenCalled()
})

test('removes only the authenticated user reaction', async () => {
  const reactionQuery = query({ data: null, error: null })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'group_members') return query({ data: { group_id: groupId }, error: null })
    if (table === 'group_chat_messages') return query({ data: { id: messageId }, error: null })
    if (table === 'group_chat_message_reactions') return reactionQuery
    throw new Error(`Unexpected table ${table}`)
  })
  const response = await DELETE(
    new NextRequest(
      `http://localhost/api/groups/${groupId}/chat/reactions?message_id=${messageId}&reaction=%F0%9F%91%8D`,
      { method: 'DELETE' }
    ),
    context
  )
  expect(response.status).toBe(204)
  expect(reactionQuery.eq).toHaveBeenCalledWith('user_id', userId)
})
