/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import {
  PATCH,
  DELETE,
} from '@/app/api/messages/group/[id]/invitations/route'
import {
  acceptGroupInvitation,
  cancelGroupInvitation,
  declineGroupInvitation,
} from '@/app/actions/groups/manage-invitations'

jest.mock('@/app/actions/groups/manage-invitations', () => ({
  acceptGroupInvitation: jest.fn(),
  cancelGroupInvitation: jest.fn(),
  declineGroupInvitation: jest.fn(),
}))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() => NextResponse.json({ error: 'Operation failed' }, { status: 500 })),
}))

const groupId = '11111111-1111-4111-8111-111111111111'
const invitationId = '22222222-2222-4222-8222-222222222222'
const actions = {
  accept: jest.mocked(acceptGroupInvitation),
  decline: jest.mocked(declineGroupInvitation),
  cancel: jest.mocked(cancelGroupInvitation),
}

function request(method: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/messages/group/${groupId}/invitations`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

beforeEach(() => jest.clearAllMocks())

test.each(['accept', 'decline', 'cancel'] as const)('routes %s to the existing invitation policy', async (action) => {
  actions[action].mockResolvedValue({ success: true, invitation: { id: invitationId, status: action } })

  const response = await PATCH(
    request('PATCH', { action, invitation_id: invitationId }),
    { params: Promise.resolve({ id: groupId }) }
  )

  expect(response.status).toBe(200)
  expect(actions[action]).toHaveBeenCalledWith({ invitationId })
})

test('rejects unknown lifecycle actions', async () => {
  const response = await PATCH(
    request('PATCH', { action: 'approve', invitation_id: invitationId }),
    { params: Promise.resolve({ id: groupId }) }
  )

  expect(response.status).toBe(400)
})

test('supports DELETE as an explicit invitation cancellation', async () => {
  actions.cancel.mockResolvedValue({ success: true, invitation: { id: invitationId } })

  const response = await DELETE(
    request('DELETE', { invitation_id: invitationId }),
    { params: Promise.resolve({ id: groupId }) }
  )

  expect(response.status).toBe(200)
  expect(actions.cancel).toHaveBeenCalledWith({ invitationId })
})
