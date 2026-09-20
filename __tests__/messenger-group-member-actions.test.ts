/** @jest-environment node */

import { NextResponse } from 'next/server'
import { DELETE } from '@/app/api/messages/group/[id]/members/[memberId]/route'
import { removeGroupMember } from '@/app/actions/groups/manage-members'

jest.mock('@/app/actions/groups/manage-members', () => ({
  removeGroupMember: jest.fn(),
}))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() => NextResponse.json({ error: 'Operation failed' }, { status: 500 })),
}))

const groupId = '11111111-1111-4111-8111-111111111111'
const memberId = '22222222-2222-4222-8222-222222222222'
const mockRemove = jest.mocked(removeGroupMember)

beforeEach(() => {
  jest.clearAllMocks()
})

test('rejects malformed group or member identifiers', async () => {
  const response = await DELETE(new Request('http://localhost'), {
    params: Promise.resolve({ id: 'bad', memberId }),
  })

  expect(response.status).toBe(400)
  expect(mockRemove).not.toHaveBeenCalled()
})

test('delegates leave or remove authorization to the existing group policy action', async () => {
  mockRemove.mockResolvedValue({ success: true })

  const response = await DELETE(new Request('http://localhost'), {
    params: Promise.resolve({ id: groupId, memberId }),
  })

  expect(response.status).toBe(204)
  expect(mockRemove).toHaveBeenCalledWith({ groupId, userId: memberId })
})

test('sanitizes denied member actions', async () => {
  mockRemove.mockResolvedValue({ success: false, error: 'You do not have permission' })

  const response = await DELETE(new Request('http://localhost'), {
    params: Promise.resolve({ id: groupId, memberId }),
  })

  expect(response.status).toBe(403)
  await expect(response.json()).resolves.toEqual({ error: 'You do not have permission' })
})
