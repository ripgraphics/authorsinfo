/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { POST } from '@/app/api/messages/group/[id]/invitations/route'
import { createGroupInvitation } from '@/app/actions/groups/manage-invitations'

jest.mock('@/app/actions/groups/manage-invitations', () => ({
  createGroupInvitation: jest.fn(),
}))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() => NextResponse.json({ error: 'Operation failed' }, { status: 500 })),
}))

const groupId = '11111111-1111-4111-8111-111111111111'
const inviteeId = '22222222-2222-4222-8222-222222222222'
const mockCreateInvitation = jest.mocked(createGroupInvitation)

function request(body: unknown) {
  return new NextRequest(`http://localhost/api/messages/group/${groupId}/invitations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

test('rejects malformed invitation requests', async () => {
  const response = await POST(request({}), { params: Promise.resolve({ id: groupId }) })

  expect(response.status).toBe(400)
  expect(mockCreateInvitation).not.toHaveBeenCalled()
})

test('delegates a validated user invitation to the existing policy action', async () => {
  mockCreateInvitation.mockResolvedValue({
    success: true,
    invitation: { id: 'invitation-1', group_id: groupId, invitee_user_id: inviteeId },
  })

  const response = await POST(
    request({ invitee_user_id: inviteeId, message: 'Join us' }),
    { params: Promise.resolve({ id: groupId }) }
  )

  expect(response.status).toBe(201)
  expect(mockCreateInvitation).toHaveBeenCalledWith({
    groupId,
    inviteeUserId: inviteeId,
    message: 'Join us',
  })
  await expect(response.json()).resolves.toEqual({
    id: 'invitation-1',
    group_id: groupId,
    invitee_user_id: inviteeId,
  })
})

test('returns a permission denial without exposing implementation details', async () => {
  mockCreateInvitation.mockResolvedValue({
    success: false,
    error: 'You do not have permission to invite members',
  })

  const response = await POST(
    request({ invitee_user_id: inviteeId }),
    { params: Promise.resolve({ id: groupId }) }
  )

  expect(response.status).toBe(403)
  await expect(response.json()).resolves.toEqual({
    error: 'You do not have permission to invite members',
  })
})
