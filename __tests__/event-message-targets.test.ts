/** @jest-environment node */

import { NextResponse } from 'next/server'
import { GET } from '@/app/api/messages/entity/event/[id]/targets/route'
import { requireUser } from '@/lib/auth/require-auth'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() => NextResponse.json({ error: 'Operation failed' }, { status: 500 })),
}))

const eventId = '11111111-1111-4111-8111-111111111111'
const ownerId = '22222222-2222-4222-8222-222222222222'
const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)

function query(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
    maybeSingle: jest.fn().mockResolvedValue(result),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: ownerId }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

test('requires authentication to resolve event message targets', async () => {
  mockRequireUser.mockResolvedValue({
    ok: false,
    response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
  })

  expect((await GET(new Request(`http://localhost/api/messages/entity/event/${eventId}/targets`), { params: Promise.resolve({ id: eventId }) })).status).toBe(401)
})

test('returns the event creator as the authorized primary target', async () => {
  const events = query({ data: { id: eventId, title: 'Event', created_by: ownerId, status: 'published', visibility: 'public' }, error: null })
  const permissions = query({ data: [], error: null })
  mockFrom.mockReturnValueOnce(events).mockReturnValueOnce(permissions)

  const response = await GET(
    new Request(`http://localhost/api/messages/entity/event/${eventId}/targets`),
    { params: Promise.resolve({ id: eventId }) }
  )

  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({
    entity_type: 'event',
    entity_id: eventId,
    title: 'Event',
    targets: [{ user_id: ownerId, role: 'owner' }],
  })
  expect(permissions.eq).toHaveBeenCalledWith('is_admin', true)
})

test('includes platform admins without duplicating the event owner', async () => {
  const events = query({ data: { id: eventId, title: 'Event', created_by: ownerId, status: 'published', visibility: 'public' }, error: null })
  const permissions = query({
    data: [{ user_id: ownerId }, { user_id: '33333333-3333-4333-8333-333333333333' }],
    error: null,
  })
  mockFrom.mockImplementation((table: string) => (table === 'events' ? events : permissions))

  const response = await GET(
    new Request(`http://localhost/api/messages/entity/event/${eventId}/targets`),
    { params: Promise.resolve({ id: eventId }) }
  )

  await expect(response.json()).resolves.toEqual({
    entity_type: 'event',
    entity_id: eventId,
    title: 'Event',
    targets: [
      { user_id: ownerId, role: 'owner' },
      { user_id: '33333333-3333-4333-8333-333333333333', role: 'admin' },
    ],
  })
})

test('denies private event targets to unrelated users', async () => {
  const events = query({
    data: { id: eventId, title: 'Private Event', created_by: '44444444-4444-4444-8444-444444444444', status: 'draft', visibility: 'private' },
    error: null,
  })
  const permissions = query({ data: [], error: null })
  mockFrom.mockReturnValueOnce(events).mockReturnValueOnce(permissions)

  const response = await GET(
    new Request(`http://localhost/api/messages/entity/event/${eventId}/targets`),
    { params: Promise.resolve({ id: eventId }) }
  )

  expect(response.status).toBe(403)
  await expect(response.json()).resolves.toEqual({ error: 'Event messaging access denied' })
})
