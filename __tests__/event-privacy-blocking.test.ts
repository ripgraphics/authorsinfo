/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { GET as getParticipants, POST as createParticipant } from '@/app/api/events/[id]/participants/route'
import { GET as getComments } from '@/app/api/events/[id]/comments/route'

const viewerId = '11111111-1111-4111-8111-111111111111'
const blockedId = '22222222-2222-4222-8222-222222222222'
const eventId = '33333333-3333-4333-8333-333333333333'
const mockFrom = jest.fn()
const mockGetUser = jest.fn()

jest.mock('@/lib/supabase/client-helper', () => ({
  createClient: () => ({ auth: { getUser: mockGetUser }, from: (...args: unknown[]) => (globalThis as { eventMockFrom: typeof mockFrom }).eventMockFrom(...args) }),
  createRouteHandlerClientAsync: async () => ({ auth: { getUser: mockGetUser }, from: (...args: unknown[]) => (globalThis as { eventMockFrom: typeof mockFrom }).eventMockFrom(...args) }),
}))
jest.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => (globalThis as { eventMockFrom: typeof mockFrom }).eventMockFrom(...args),
  },
}))

jest.mock('@/lib/messaging/blocking', () => ({
  getBlockedUserIds: jest.fn().mockResolvedValue(new Set(['22222222-2222-4222-8222-222222222222'])),
}))

function query(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
    insert: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
}

function context() {
  return { params: Promise.resolve({ id: eventId }) }
}

function request(path: string) {
  return new NextRequest(`http://localhost${path}`)
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(globalThis as { eventMockFrom: typeof mockFrom }).eventMockFrom = mockFrom
  mockGetUser.mockResolvedValue({ data: { user: { id: viewerId } }, error: null })
})

test('denies anonymous access to private event participants', async () => {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
  mockFrom.mockImplementation((table: string) =>
    table === 'events'
      ? query({ data: { id: eventId, visibility: 'private', created_by: viewerId }, error: null })
      : query({ data: [], error: null })
  )

  const response = await getParticipants(request(`/api/events/${eventId}/participants`), context())

  expect(response.status).toBe(403)
})

test('denies a non-member private event comment read', async () => {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'events') return query({ data: { id: eventId, visibility: 'private', created_by: '44444444-4444-4444-8444-444444444444' }, error: null })
    if (table === 'event_participants') return query({ data: null, error: null })
    return query({ data: [], error: null })
  })

  const response = await getComments(request(`/api/events/${eventId}/comments`), context())

  expect(response.status).toBe(403)
})

test('allows a private event member and hides reciprocal-blocked participants', async () => {
  let participantQueryCount = 0
  mockFrom.mockImplementation((table: string) => {
    if (table === 'events') return query({ data: { id: eventId, visibility: 'private', created_by: '44444444-4444-4444-8444-444444444444' }, error: null })
    if (table === 'event_participants') {
      participantQueryCount += 1
      return participantQueryCount === 1
        ? query({ data: { id: 'membership-1' }, error: null })
        : query({
            data: [
              { id: 'participant-1', user_id: viewerId },
              { id: 'participant-2', user_id: blockedId },
            ],
            error: null,
          })
    }
    return query({
      data: [],
      error: null,
    })
  })

  const response = await getParticipants(request(`/api/events/${eventId}/participants`), context())

  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({
    data: [{ id: 'participant-1', user_id: viewerId }],
  })
})

test('rejects a duplicate RSVP before inserting', async () => {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'events') return query({ data: { id: eventId }, error: null })
    if (table === 'event_participants') return query({ data: { id: 'existing-rsvp' }, error: null })
    return query({ data: null, error: null })
  })

  const response = await createParticipant(
    new NextRequest(`http://localhost/api/events/${eventId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ rsvp_status: 'attending' }),
      headers: { 'Content-Type': 'application/json' },
    }),
    context()
  )

  expect(response.status).toBe(400)
})

test('returns conflict when RSVP insert races with another RSVP', async () => {
  let participantQueryCount = 0
  mockFrom.mockImplementation((table: string) => {
    if (table === 'events') return query({ data: { id: eventId }, error: null })
    if (table === 'event_participants') {
      participantQueryCount += 1
      return participantQueryCount === 1
        ? query({ data: null, error: null })
        : query({ data: null, error: { code: '23505', message: 'duplicate key' } })
    }
    return query({ data: null, error: null })
  })

  const response = await createParticipant(
    new NextRequest(`http://localhost/api/events/${eventId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ rsvp_status: 'attending' }),
      headers: { 'Content-Type': 'application/json' },
    }),
    context()
  )

  expect(response.status).toBe(409)
})
