/** @jest-environment node */

import { NextResponse } from 'next/server'
import { GET } from '@/app/api/messages/route'
import { requireUser } from '@/lib/auth/require-auth'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))

const mockFrom = jest.fn()
jest.mock('@/lib/supabase-server', () => ({ createClient: () => ({ from: mockFrom }) }))

const userId = '33333333-3333-4333-8333-333333333333'
const groupId = '11111111-1111-4111-8111-111111111111'
const channelId = '22222222-2222-4222-8222-222222222222'
const mockRequireUser = jest.mocked(requireUser)

function query(result: { data: unknown; error: unknown }) {
  const builder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
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
})

test('requires authentication for the inbox summary', async () => {
  mockRequireUser.mockResolvedValue({
    ok: false,
    response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
  })

  expect((await GET()).status).toBe(401)
  expect(mockFrom).not.toHaveBeenCalled()
})

test('returns only authorized group channels with their latest visible message', async () => {
  const memberships = query({ data: [{ group_id: groupId }], error: null })
  const channels = query({
    data: [{ id: channelId, group_id: groupId, name: 'General', description: null }],
    error: null,
  })
  const messages = query({
    data: [
      {
        id: '44444444-4444-4444-8444-444444444444',
        channel_id: channelId,
        user_id: userId,
        message: 'Latest message',
        created_at: '2026-09-11T10:00:00.000Z',
      },
    ],
    error: null,
  })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'group_members') return memberships
    if (table === 'group_chat_channels') return channels
    if (table === 'group_chat_channel_read_state')
      return query({ data: { last_read_at: null }, error: null })
    if (table === 'group_chat_messages') return messages
    throw new Error(`Unexpected table ${table}`)
  })

  const response = await GET()

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual([
    {
      id: channelId,
      group_id: groupId,
      name: 'General',
      description: null,
      latest_message: {
        id: '44444444-4444-4444-8444-444444444444',
        channel_id: channelId,
        user_id: userId,
        message: 'Latest message',
        created_at: '2026-09-11T10:00:00.000Z',
      },
      unread_count: 1,
    },
  ])
  expect(memberships.eq).toHaveBeenCalledWith('user_id', userId)
  expect(memberships.eq).toHaveBeenCalledWith('status', 'active')
  expect(channels.is).toHaveBeenCalledWith('event_id', null)
  expect(messages.or).toHaveBeenCalledWith('is_hidden.is.null,is_hidden.eq.false')
})
