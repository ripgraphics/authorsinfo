/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { GET, PATCH, POST } from '@/app/api/messages/calls/[id]/route'
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
const callId = '44444444-4444-4444-8444-444444444444'
const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)

function query(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
}

let config: ReturnType<typeof query>
let conversations: ReturnType<typeof query>
let calls: ReturnType<typeof query>

function setProviderSettings(settings: Record<string, string | null>) {
  config = query({
    data: Object.entries(settings).map(([key, value]) => ({
      setting_key: key,
      setting_value: value,
    })),
    error: null,
  })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'call_provider_config') return config
    if (table === 'direct_conversations') return conversations
    if (table === 'call_sessions') return calls
    throw new Error(`Unexpected table ${table}`)
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  conversations = query({
    data: { id: conversationId, user_low_id: userId, user_high_id: otherUserId },
    error: null,
  })
  calls = query({
    data: {
      id: callId,
      conversation_id: conversationId,
      initiator_id: userId,
      recipient_id: otherUserId,
      media_type: 'audio',
      status: 'ringing',
    },
    error: null,
  })
  setProviderSettings({
    calls_enabled: 'false',
    turn_url: null,
    signaling_server_url: null,
  })
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: userId }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

function callRequest(mediaType: 'audio' | 'video' = 'audio') {
  return new NextRequest('http://localhost/api/messages/calls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id: conversationId, media_type: mediaType }),
  })
}

function callSessionRequest(method: 'GET' | 'PATCH', body?: Record<string, string>) {
  return new NextRequest(`http://localhost/api/messages/calls/${callId}`, {
    method,
    ...(body ? {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    } : {}),
  })
}

test('rejects call creation when calls are disabled', async () => {
  const response = await POST(callRequest())

  expect(response.status).toBe(503)
  expect(calls.insert).not.toHaveBeenCalled()
})

test('allows direct call creation when TURN and external signaling are missing', async () => {
  setProviderSettings({
    calls_enabled: 'true',
    turn_url: null,
    signaling_server_url: null,
  })

  const response = await POST(callRequest())

  expect(response.status).toBe(201)
  expect(calls.insert).toHaveBeenCalledWith({
    conversation_id: conversationId,
    initiator_id: userId,
    recipient_id: otherUserId,
    media_type: 'audio',
    status: 'ringing',
  })
})

test('creates a call when fully configured and enabled', async () => {
  setProviderSettings({
    calls_enabled: 'true',
    turn_url: 'turn:turn.example.com:3478',
    signaling_server_url: 'wss://signal.example.com',
  })

  const response = await POST(callRequest('video'))

  expect(response.status).toBe(201)
  expect(calls.insert).toHaveBeenCalledWith({
    conversation_id: conversationId,
    initiator_id: userId,
    recipient_id: otherUserId,
    media_type: 'video',
    status: 'ringing',
  })
})

test('denies non-participants from starting calls', async () => {
  setProviderSettings({
    calls_enabled: 'true',
    turn_url: 'turn:turn.example.com:3478',
    signaling_server_url: 'wss://signal.example.com',
  })
  conversations.maybeSingle.mockResolvedValue({ data: null, error: null })

  const response = await POST(callRequest())

  expect(response.status).toBe(403)
  expect(calls.insert).not.toHaveBeenCalled()
})

test('denies non-participants from reading a call session', async () => {
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: '99999999-9999-4999-8999-999999999999' }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)

  const response = await GET(callSessionRequest('GET'), { params: Promise.resolve({ id: callId }) })

  expect(response.status).toBe(403)
})

test('denies non-participants from updating a call session', async () => {
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: '99999999-9999-4999-8999-999999999999' }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)

  const response = await PATCH(
    callSessionRequest('PATCH', { status: 'ended' }),
    { params: Promise.resolve({ id: callId }) }
  )

  expect(response.status).toBe(403)
})
