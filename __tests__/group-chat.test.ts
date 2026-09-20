/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { GET, POST } from '@/app/api/groups/[id]/chat/route'
import { requireUser } from '@/lib/auth/require-auth'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() =>
    NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  ),
}))
jest.mock('@/lib/supabase-server', () => ({ createClient: () => ({ from: mockFrom }) }))

const groupId = '11111111-1111-4111-8111-111111111111'
const channelId = '22222222-2222-4222-8222-222222222222'
const userId = '33333333-3333-4333-8333-333333333333'
const context = { params: Promise.resolve({ id: groupId }) }
const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)

function query(result: { data: unknown; error: unknown }) {
  const builder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
  return builder
}

let membership: ReturnType<typeof query>
let channel: ReturnType<typeof query>
let messages: ReturnType<typeof query>

function request(body?: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/groups/${groupId}/chat?channel_id=${channelId}`, {
    method: body ? 'POST' : 'GET',
    ...(body
      ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : {}),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  membership = query({ data: { group_id: groupId, status: 'active' }, error: null })
  channel = query({ data: { id: channelId }, error: null })
  messages = query({ data: [], error: null })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'group_members') return membership
    if (table === 'group_chat_channels') return channel
    if (table === 'group_chat_messages') return messages
    throw new Error(`Unexpected table ${table}`)
  })
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: userId }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

test('requires authentication before reading any messages', async () => {
  mockRequireUser.mockResolvedValue({
    ok: false,
    response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
  })
  expect((await GET(request(), context)).status).toBe(401)
  expect(mockFrom).not.toHaveBeenCalled()
})

test('denies members without active membership', async () => {
  membership.maybeSingle.mockResolvedValue({ data: null, error: null })
  expect((await GET(request(), context)).status).toBe(403)
  expect(mockFrom).not.toHaveBeenCalledWith('group_chat_messages')
})

test('denies suspended members before reading history', async () => {
  membership.maybeSingle.mockResolvedValue({ data: null, error: null })
  membership.eq.mockImplementation((column: string, value: string) => {
    if (column === 'status' && value === 'active') return membership
    return membership
  })

  expect((await GET(request(), context)).status).toBe(403)
  expect(mockFrom).not.toHaveBeenCalledWith('group_chat_messages')
})

test('checks that the channel belongs to the requested group', async () => {
  channel.maybeSingle.mockResolvedValue({ data: null, error: null })
  expect((await GET(request(), context)).status).toBe(404)
  expect(channel.eq).toHaveBeenCalledWith('group_id', groupId)
  expect(mockFrom).not.toHaveBeenCalledWith('group_chat_messages')
})

test('reads bounded visible history using the live channel schema', async () => {
  expect((await GET(request(), context)).status).toBe(200)
  expect(membership.eq).toHaveBeenCalledWith('user_id', userId)
  expect(membership.eq).toHaveBeenCalledWith('status', 'active')
  expect(messages.eq).toHaveBeenCalledWith('channel_id', channelId)
  expect(messages.or).toHaveBeenCalledWith('is_hidden.is.null,is_hidden.eq.false')
  expect(messages.limit).toHaveBeenCalledWith(50)
  expect(messages.eq).not.toHaveBeenCalledWith('group_id', groupId)
})

test('lists the accessible group channel when no channel is selected', async () => {
  const channelList = query({
    data: [{ id: channelId, group_id: groupId, name: 'General', description: null }],
    error: null,
  })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'group_members') return membership
    if (table === 'group_chat_channels') return channelList
    if (table === 'group_chat_messages') return messages
    throw new Error(`Unexpected table ${table}`)
  })

  const response = await GET(
    new NextRequest(`http://localhost/api/groups/${groupId}/chat`),
    context
  )

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual([
    { id: channelId, group_id: groupId, name: 'General', description: null },
  ])
  expect(channelList.order).toHaveBeenCalledWith('created_at', { ascending: true })
})

test('rejects caller-supplied sender identity', async () => {
  const response = await POST(
    request({ channel_id: channelId, message: 'Hello', body: 'Hello', user_id: 'forged' }),
    context
  )
  expect(response.status).toBe(400)
  expect(messages.insert).not.toHaveBeenCalled()
})

test('requires authentication before sending', async () => {
  mockRequireUser.mockResolvedValue({
    ok: false,
    response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
  })
  expect((await POST(request({ channel_id: channelId, message: 'Hello' }), context)).status).toBe(
    401
  )
  expect(mockFrom).not.toHaveBeenCalled()
})

test.each(['', '   ', 'x'.repeat(10001)])(
  'rejects empty or oversized messages',
  async (message) => {
    expect((await POST(request({ channel_id: channelId, message }), context)).status).toBe(400)
    expect(messages.insert).not.toHaveBeenCalled()
  }
)

test('rejects malformed JSON without exposing parser errors', async () => {
  const malformed = new NextRequest('http://localhost/api/chat', { method: 'POST', body: '{' })
  expect((await POST(malformed, context)).status).toBe(400)
})

test('rejects cross-origin writes', async () => {
  const crossOrigin = request({ channel_id: channelId, message: 'Hello' })
  crossOrigin.headers.set('origin', 'https://untrusted.example')
  expect((await POST(crossOrigin, context)).status).toBe(403)
  expect(messages.insert).not.toHaveBeenCalled()
})

test('does not bypass event-specific access requirements', async () => {
  await GET(request(), context)
  expect(channel.is).toHaveBeenCalledWith('event_id', null)
  expect(channel.or).toHaveBeenCalledWith('is_event_channel.is.null,is_event_channel.eq.false')
})

test('denies event channels even for active group members', async () => {
  channel.is.mockImplementation((column: string, value: null) => {
    if (column === 'event_id') return channel
    return channel
  })
  channel.maybeSingle.mockResolvedValue({ data: null, error: null })

  expect((await GET(request(), context)).status).toBe(404)
  expect(messages.limit).not.toHaveBeenCalled()
})

test('fails closed on membership lookup errors', async () => {
  membership.maybeSingle.mockResolvedValue({ data: null, error: { message: 'database error' } })
  expect((await POST(request({ channel_id: channelId, message: 'Hello' }), context)).status).toBe(
    500
  )
  expect(messages.insert).not.toHaveBeenCalled()
})

test('inserts only validated fields with the authenticated sender', async () => {
  const response = await POST(request({ channel_id: channelId, message: ' Hello ' }), context)
  expect(response.status).toBe(201)
  expect(messages.insert).toHaveBeenCalledWith({
    channel_id: channelId,
    message: 'Hello',
    user_id: userId,
    is_hidden: false,
  })
})

test('does not expose database details', async () => {
  messages = query({ data: null, error: { message: 'secret database details' } })
  const response = await GET(request(), context)
  expect(response.status).toBe(500)
  expect(JSON.stringify(await response.json())).not.toContain('secret database details')
})
