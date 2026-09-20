/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { POST } from '@/app/api/messages/group/[id]/reports/route'
import { requireUser } from '@/lib/auth/require-auth'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() => NextResponse.json({ error: 'Operation failed' }, { status: 500 })),
}))

const userId = '11111111-1111-4111-8111-111111111111'
const groupId = '22222222-2222-4222-8222-222222222222'
const messageId = '33333333-3333-4333-8333-333333333333'
const channelId = '44444444-4444-4444-8444-444444444444'
const senderId = '55555555-5555-4555-8555-555555555555'
const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)

function query(data: unknown, error: unknown = null) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
    single: jest.fn().mockResolvedValue({ data, error }),
    insert: jest.fn().mockReturnThis(),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: userId }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

function request(body: unknown, origin = 'http://localhost') {
  return new NextRequest(`http://localhost/api/messages/group/${groupId}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin },
    body: JSON.stringify(body),
  })
}

test('reports a message from an authorized group channel', async () => {
  const membership = query({ group_id: groupId })
  const message = query({ id: messageId, channel_id: channelId, user_id: senderId })
  const channel = query({ id: channelId })
  const report = query({ id: 'report-id', message_id: messageId, reason: 'harassment' })
  mockFrom.mockImplementation((table: string) => ({
    group_members: membership,
    group_chat_messages: message,
    group_chat_channels: channel,
    group_chat_reports: report,
  }[table]))

  const response = await POST(request({ message_id: messageId, reason: 'harassment' }), {
    params: Promise.resolve({ id: groupId }),
  })

  expect(response.status).toBe(201)
  expect(report.insert).toHaveBeenCalledWith({
    message_id: messageId,
    reporter_id: userId,
    reported_user_id: senderId,
    reason: 'harassment',
  })
})

test('rejects reports from non-members and invalid reasons', async () => {
  const membership = query(null)
  mockFrom.mockReturnValue(membership)
  expect((await POST(request({ message_id: messageId, reason: 'harassment' }), {
    params: Promise.resolve({ id: groupId }),
  })).status).toBe(403)

  expect((await POST(request({ message_id: messageId, reason: 'not-a-reason' }), {
    params: Promise.resolve({ id: groupId }),
  })).status).toBe(400)
})

test('rejects cross-origin report attempts', async () => {
  const response = await POST(request({ message_id: messageId, reason: 'spam' }, 'https://evil.example'), {
    params: Promise.resolve({ id: groupId }),
  })
  expect(response.status).toBe(403)
})
