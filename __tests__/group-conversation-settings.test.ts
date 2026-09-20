/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { GET, PATCH } from '@/app/api/messages/group/[id]/settings/route'

const userId = '11111111-1111-4111-8111-111111111111'
const channelId = '22222222-2222-4222-8222-222222222222'
const groupId = '33333333-3333-4333-8333-333333333333'

function query(result: { data: unknown; error: unknown }) {
  const chain = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    is: jest.fn(() => chain),
    or: jest.fn(() => chain),
    maybeSingle: jest.fn(async () => result),
    upsert: jest.fn(() => chain),
    single: jest.fn(async () => result),
  }
  return chain
}

const channel = query({ data: { id: channelId, group_id: groupId }, error: null })
const membership = query({ data: { group_id: groupId }, error: null })
const settings = query({
  data: { channel_id: channelId, user_id: userId, is_archived: false, is_muted: true },
  error: null,
})
const supabase = {
  from: jest.fn((table: string) => {
    if (table === 'group_chat_channels') return channel
    if (table === 'group_members') return membership
    return settings
  }),
}

jest.mock('@/lib/auth/require-auth', () => ({
  requireUser: jest.fn(async () => ({ ok: true, context: { user: { id: userId }, supabase } })),
}))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() => NextResponse.json({ error: 'Operation failed' }, { status: 500 })),
}))

test('loads settings only for active members of a non-event group channel', async () => {
  const response = await GET(
    new NextRequest(`http://localhost/api/messages/group/${channelId}/settings`),
    { params: Promise.resolve({ id: channelId }) },
  )
  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toMatchObject({ channel_id: channelId, is_muted: true })
  expect(channel.or).toHaveBeenCalledWith('is_event_channel.is.null,is_event_channel.eq.false')
  expect(membership.eq).toHaveBeenCalledWith('status', 'active')
})

test('persists per-user mute/archive settings for a group channel', async () => {
  const response = await PATCH(
    new NextRequest(`http://localhost/api/messages/group/${channelId}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_muted: true, is_archived: true }),
    }),
    { params: Promise.resolve({ id: channelId }) },
  )
  expect(response.status).toBe(200)
  expect(settings.upsert).toHaveBeenCalledWith(
    expect.objectContaining({ channel_id: channelId, user_id: userId, is_muted: true, is_archived: true }),
    { onConflict: 'channel_id,user_id' },
  )
})
