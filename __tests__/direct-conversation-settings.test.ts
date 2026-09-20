/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { GET, PATCH } from '@/app/api/messages/direct/[id]/settings/route'
import { requireUser } from '@/lib/auth/require-auth'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/lib/error-handler', () => ({ nextErrorResponse: jest.fn(() => NextResponse.json({ error: 'Operation failed' }, { status: 500 })) }))

const userId = '11111111-1111-4111-8111-111111111111'
const conversationId = '22222222-2222-4222-8222-222222222222'
const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)

function query(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    upsert: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
  }
}

let conversations: ReturnType<typeof query>
let settings: ReturnType<typeof query>

beforeEach(() => {
  jest.clearAllMocks()
  conversations = query({ data: { id: conversationId }, error: null })
  settings = query({ data: { conversation_id: conversationId, user_id: userId, is_archived: false, is_muted: true }, error: null })
  mockFrom.mockImplementation((table: string) => table === 'direct_conversations' ? conversations : settings)
  mockRequireUser.mockResolvedValue({ ok: true, context: { user: { id: userId }, supabase: { from: mockFrom } } } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

const context = { params: Promise.resolve({ id: conversationId }) }

test('loads per-user settings for an authorized conversation', async () => {
  expect((await GET(new NextRequest(`http://localhost/api/messages/direct/${conversationId}/settings`), context)).status).toBe(200)
  expect(settings.eq).toHaveBeenCalledWith('user_id', userId)
})

test('persists mute and archive settings for the authenticated user', async () => {
  const response = await PATCH(new NextRequest(`http://localhost/api/messages/direct/${conversationId}/settings`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_muted: true, is_archived: true }),
  }), context)
  expect(response.status).toBe(200)
  expect(settings.upsert).toHaveBeenCalledWith(expect.objectContaining({ conversation_id: conversationId, user_id: userId, is_muted: true, is_archived: true }))
})