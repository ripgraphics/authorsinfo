/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { GET, PATCH } from '@/app/api/messages/group/invitations/route'
import { requireUser } from '@/lib/auth/require-auth'
import { acceptGroupInvitation, declineGroupInvitation } from '@/app/actions/groups/manage-invitations'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/app/actions/groups/manage-invitations', () => ({
  acceptGroupInvitation: jest.fn(),
  declineGroupInvitation: jest.fn(),
}))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() => NextResponse.json({ error: 'Operation failed' }, { status: 500 })),
}))

const userId = '11111111-1111-4111-8111-111111111111'
const invitationId = '22222222-2222-4222-8222-222222222222'
const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)
const mockAcceptInvitation = jest.mocked(acceptGroupInvitation)
const mockDeclineInvitation = jest.mocked(declineGroupInvitation)

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

test('accepts an inbox invitation through the existing policy action', async () => {
  mockAcceptInvitation.mockResolvedValue({
    success: true,
    invitation: { id: invitationId, status: 'accepted' },
  })
  const request = new NextRequest('http://localhost/api/messages/group/invitations', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'accept', invitation_id: invitationId }),
  })

  const response = await PATCH(request)

  expect(response.status).toBe(200)
  expect(mockAcceptInvitation).toHaveBeenCalledWith({ invitationId })
})

test('rejects cross-origin invitation responses', async () => {
  const request = new NextRequest('http://localhost/api/messages/group/invitations', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      origin: 'https://attacker.example',
    },
    body: JSON.stringify({ action: 'accept', invitation_id: invitationId }),
  })

  expect((await PATCH(request)).status).toBe(403)
  expect(mockAcceptInvitation).not.toHaveBeenCalled()
  expect(mockDeclineInvitation).not.toHaveBeenCalled()
})
