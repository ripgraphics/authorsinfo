/** @jest-environment node */

import { NextResponse } from 'next/server'
import { GET } from '@/app/api/messages/group/invitations/route'
import { requireUser } from '@/lib/auth/require-auth'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() => NextResponse.json({ error: 'Operation failed' }, { status: 500 })),
}))

const userId = '11111111-1111-4111-8111-111111111111'
const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)

function query(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: userId, email: 'sam@example.com' }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

test('requires authentication for pending invitations', async () => {
  mockRequireUser.mockResolvedValue({
    ok: false,
    response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
  })

  expect((await GET()).status).toBe(401)
  expect(mockFrom).not.toHaveBeenCalled()
})

test('returns pending invitations addressed to the current user', async () => {
  const invitations = query({
    data: [{ id: 'inv-1', group_id: 'group-1', status: 'pending' }],
    error: null,
  })
  mockFrom.mockReturnValue(invitations)

  const response = await GET()

  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual([
    { id: 'inv-1', group_id: 'group-1', status: 'pending' },
  ])
  expect(invitations.eq).toHaveBeenCalledWith('status', 'pending')
  expect(invitations.or).toHaveBeenCalledWith(
    `invitee_user_id.eq.${userId},invitee_email.eq.sam@example.com`
  )
})
