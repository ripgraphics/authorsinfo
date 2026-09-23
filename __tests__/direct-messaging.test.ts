/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { GET as listConversations, POST as createConversation } from '@/app/api/messages/direct/route'
import { requireUser } from '@/lib/auth/require-auth'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() =>
    NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  ),
}))

const userId = '11111111-1111-4111-8111-111111111111'
const otherUserId = '22222222-2222-4222-8222-222222222222'
const conversationId = '33333333-3333-4333-8333-333333333333'
const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)
let friendships: ReturnType<typeof query>
let requests: ReturnType<typeof query>
let blocks: ReturnType<typeof query>

function query(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
    insert: jest.fn().mockReturnThis(),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
}

let conversations: ReturnType<typeof query>
let messages: ReturnType<typeof query>

beforeEach(() => {
  jest.clearAllMocks()
  conversations = query({ data: null, error: null })
  messages = query({ data: [], error: null })
  friendships = query({ data: { status: 'accepted' }, error: null })
  requests = query({
    data: { status: 'pending', requester_id: userId, recipient_id: otherUserId },
    error: null,
  })
  blocks = query({ data: null, error: null })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'direct_conversations') return conversations
    if (table === 'direct_conversation_messages') return messages
    if (table === 'user_friends') return friendships
    if (table === 'direct_message_requests') return requests
    if (table === 'blocks') return blocks
    throw new Error(`Unexpected table ${table}`)
  })
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: userId }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

function request(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/messages/direct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

test('creates a canonical conversation without accepting a forged sender', async () => {
  conversations.single.mockResolvedValue({
    data: { id: conversationId, user_low_id: userId, user_high_id: otherUserId },
    error: null,
  })

  const response = await createConversation(request({ user_id: otherUserId }))

  expect(response.status).toBe(201)
  expect(conversations.insert).toHaveBeenCalledWith({
    user_low_id: userId,
    user_high_id: otherUserId,
  })
})

test('creates a pending message request for a non-friend target', async () => {
  friendships = query({ data: null, error: null })
  requests = query({
    data: { status: 'pending', requester_id: userId, recipient_id: otherUserId },
    error: null,
  })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'direct_conversations') return conversations
    if (table === 'user_friends') return friendships
    if (table === 'direct_message_requests') return requests
    if (table === 'blocks') return blocks
    throw new Error(`Unexpected table ${table}`)
  })
  conversations.single.mockResolvedValue({
    data: { id: conversationId, user_low_id: userId, user_high_id: otherUserId },
    error: null,
  })

  const response = await createConversation(request({ user_id: otherUserId }))

  expect(response.status).toBe(201)
  expect(response.headers.get('content-type')).toContain('application/json')
  await expect(response.json()).resolves.toEqual(expect.objectContaining({
    request_status: 'pending',
    requester_id: userId,
    recipient_id: otherUserId,
  }))
})

test('recognizes an accepted friendship stored in reverse direction', async () => {
  friendships = query({ data: null, error: null })
  const reverseFriendship = query({ data: { status: 'accepted' }, error: null })
  requests = query({ data: null, error: null })
  let friendshipLookupCount = 0
  mockFrom.mockImplementation((table: string) => {
    if (table === 'direct_conversations') return conversations
    if (table === 'user_friends') {
      friendshipLookupCount += 1
      return friendshipLookupCount === 1 ? friendships : reverseFriendship
    }
    if (table === 'direct_message_requests') return requests
    if (table === 'blocks') return blocks
    throw new Error(`Unexpected table ${table}`)
  })
  conversations.single.mockResolvedValue({
    data: { id: conversationId, user_low_id: userId, user_high_id: otherUserId },
    error: null,
  })

  const response = await createConversation(request({ user_id: otherUserId }))

  expect(response.status).toBe(201)
  await expect(response.json()).resolves.not.toEqual(expect.objectContaining({ request_status: 'pending' }))
})

test('rejects caller-supplied participant identity fields', async () => {
  const response = await createConversation(
    request({ user_id: otherUserId, sender_id: '44444444-4444-4444-8444-444444444444' })
  )

  expect(response.status).toBe(400)
  expect(conversations.insert).not.toHaveBeenCalled()
})

test('requires authentication before creating a conversation', async () => {
  mockRequireUser.mockResolvedValue({
    ok: false,
    response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
  })

  expect((await createConversation(request({ user_id: otherUserId }))).status).toBe(401)
  expect(mockFrom).not.toHaveBeenCalled()
})

test('includes the latest message preview in the conversation list', async () => {
  conversations = query({
    data: [
      {
        id: conversationId,
        user_low_id: userId,
        user_high_id: otherUserId,
        last_message_at: '2026-09-17T12:00:00.000Z',
      },
    ],
    error: null,
  })
  messages = query({
    data: [
      {
        conversation_id: conversationId,
        body: 'Latest message',
        created_at: '2026-09-17T12:00:00.000Z',
      },
    ],
    error: null,
  })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'direct_conversations') return conversations
    if (table === 'direct_conversation_messages') return messages
    if (table === 'blocks') return blocks
    if (table === 'profiles') return query({ data: [], error: null })
    throw new Error(`Unexpected table ${table}`)
  })

  const response = await listConversations()

  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual([
    expect.objectContaining({
      id: conversationId,
      participant_id: otherUserId,
      last_message_preview: 'Latest message',
      last_message_at: '2026-09-17T12:00:00.000Z',
    }),
  ])
  expect(messages.in).toHaveBeenCalledWith('conversation_id', [conversationId])
})
