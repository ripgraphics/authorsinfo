/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { POST } from '@/app/api/events/[id]/register/route'
import { registerForEvent } from '@/lib/events'

const mockGetUser = jest.fn()
const mockRegisterForEvent = jest.mocked(registerForEvent)

jest.mock('@/lib/supabase-server', () => ({
  createClient: () => ({ auth: { getUser: mockGetUser } }),
}))
jest.mock('@/lib/events', () => ({ registerForEvent: jest.fn() }))

const context = { params: Promise.resolve({ id: '33333333-3333-4333-8333-333333333333' }) }

function request() {
  return new NextRequest('http://localhost/api/events/33333333-3333-4333-8333-333333333333/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: { id: '11111111-1111-4111-8111-111111111111' } }, error: null })
})

test('maps private-event registration denial to 403', async () => {
  mockRegisterForEvent.mockRejectedValueOnce(new Error('Event access denied'))

  const response = await POST(request(), context)

  expect(response.status).toBe(403)
})

test('maps duplicate registration to 409', async () => {
  mockRegisterForEvent.mockRejectedValueOnce(new Error('You are already registered for this event'))

  const response = await POST(request(), context)

  expect(response.status).toBe(409)
})
