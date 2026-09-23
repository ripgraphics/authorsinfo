/** @jest-environment node */

import { NextRequest } from 'next/server'
import { PATCH } from '@/app/api/events/[id]/participants/[participantId]/route'

const creatorId = '11111111-1111-4111-8111-111111111111'
const memberId = '22222222-2222-4222-8222-222222222222'
const eventId = '33333333-3333-4333-8333-333333333333'
const participantId = '44444444-4444-4444-8444-444444444444'
const mockGetUser = jest.fn()
const mockFrom = jest.fn()

jest.mock('@/lib/supabase/client-helper', () => ({
  createRouteHandlerClientAsync: async () => ({ auth: { getUser: mockGetUser }, from: mockFrom }),
}))

function query(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
    update: jest.fn().mockReturnThis(),
  }
}

function context() {
  return { params: Promise.resolve({ id: eventId, participantId }) }
}

function request(body: unknown) {
  return new NextRequest(`http://localhost/api/events/${eventId}/participants/${participantId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: { id: creatorId } }, error: null })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'events') return query({ data: { created_by: creatorId }, error: null })
    if (table === 'event_participants') return query({ data: { id: participantId, user_id: memberId, role: 'attendee' }, error: null })
    return query({ data: null, error: null })
  })
})

test('allows the event creator to assign a co-host role', async () => {
  const participantQuery = query({ data: { id: participantId, event_id: eventId, user_id: memberId, role: 'co-host' }, error: null })
  mockFrom.mockImplementation((table: string) => table === 'events' ? query({ data: { created_by: creatorId }, error: null }) : participantQuery)

  const response = await PATCH(request({ role: 'co-host' }), context())

  expect(response.status).toBe(200)
})

test('rejects a non-creator role mutation', async () => {
  mockGetUser.mockResolvedValue({ data: { user: { id: memberId } }, error: null })

  const response = await PATCH(request({ role: 'co-host' }), context())

  expect(response.status).toBe(403)
})

test('rejects creator self-demotion', async () => {
  mockFrom.mockImplementation((table: string) => table === 'events' ? query({ data: { created_by: creatorId }, error: null }) : query({ data: { id: participantId, user_id: creatorId, role: 'host' }, error: null }))

  const response = await PATCH(request({ role: 'attendee' }), context())

  expect(response.status).toBe(400)
})
