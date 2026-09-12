/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { GET, POST } from '@/app/api/groups/[id]/chat/read-state/route'
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
const channelId = '22222222-2222-4222-8222-222222222222'
const userId = '33333333-3333-4333-8333-333333333333'
const context = { params: Promise.resolve({ id: groupId }) }

function query(result: { data: unknown; error: unknown }) {
  const builder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
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
    if (table === 'group_chat_channels') return query({ data: { id: channelId }, error: null })
    if (table === 'group_chat_channel_read_state') {
      return query({
        data: { channel_id: channelId, user_id: userId, last_read_at: null },
        error: null,
      })
    }
    throw new Error(`Unexpected table ${table}`)
  })
})

test('requires authentication before reading state', async () => {
  mockRequireUser.mockResolvedValue({
    ok: false,
    response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
  })
  expect(
    (
      await GET(
        new NextRequest(
          `http://localhost/api/groups/${groupId}/chat/read-state?channel_id=${channelId}`
        ),
        context
      )
    ).status
  ).toBe(401)
})

test('reads state only for an active member and matching channel', async () => {
  const response = await GET(
    new NextRequest(
      `http://localhost/api/groups/${groupId}/chat/read-state?channel_id=${channelId}`
    ),
    context
  )
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({
    channel_id: channelId,
    user_id: userId,
    last_read_at: null,
  })
})

test('upserts the authenticated user read cursor', async () => {
  const stateQuery = query({
    data: { channel_id: channelId, user_id: userId, last_read_at: '2026-09-11T12:00:00.000Z' },
    error: null,
  })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'group_members') return query({ data: { group_id: groupId }, error: null })
    if (table === 'group_chat_channels') return query({ data: { id: channelId }, error: null })
    if (table === 'group_chat_channel_read_state') return stateQuery
    throw new Error(`Unexpected table ${table}`)
  })
  const response = await POST(
    new NextRequest(`http://localhost/api/groups/${groupId}/chat/read-state`, {
      method: 'POST',
      body: JSON.stringify({ channel_id: channelId, last_read_at: '2026-09-11T12:00:00.000Z' }),
      headers: { 'Content-Type': 'application/json' },
    }),
    context
  )
  expect(response.status).toBe(200)
  expect(stateQuery.upsert).toHaveBeenCalledWith(
    {
      channel_id: channelId,
      user_id: userId,
      last_read_at: '2026-09-11T12:00:00.000Z',
    },
    { onConflict: 'channel_id,user_id' }
  )
})

test('supports marking a conversation unread by clearing the cursor', async () => {
  const stateQuery = query({
    data: { channel_id: channelId, user_id: userId, last_read_at: null },
    error: null,
  })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'group_members') return query({ data: { group_id: groupId }, error: null })
    if (table === 'group_chat_channels') return query({ data: { id: channelId }, error: null })
    if (table === 'group_chat_channel_read_state') return stateQuery
    throw new Error(`Unexpected table ${table}`)
  })
  const response = await POST(
    new NextRequest(`http://localhost/api/groups/${groupId}/chat/read-state`, {
      method: 'POST',
      body: JSON.stringify({ channel_id: channelId, mark_unread: true }),
      headers: { 'Content-Type': 'application/json' },
    }),
    context
  )
  expect(response.status).toBe(200)
  expect(stateQuery.upsert).toHaveBeenCalledWith(
    { channel_id: channelId, user_id: userId, last_read_at: null },
    { onConflict: 'channel_id,user_id' }
  )
})
