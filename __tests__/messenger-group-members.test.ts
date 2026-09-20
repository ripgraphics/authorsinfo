/** @jest-environment node */

import { NextResponse } from 'next/server'
import { GET } from '@/app/api/messages/group/[id]/members/route'
import { requireUser } from '@/lib/auth/require-auth'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() => NextResponse.json({ error: 'Operation failed' }, { status: 500 })),
}))

const groupId = '11111111-1111-4111-8111-111111111111'
const userId = '22222222-2222-4222-8222-222222222222'
const mockFrom = jest.fn()
const mockRequireUser = jest.mocked(requireUser)

function query(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: userId }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

test('requires active membership before returning Messenger group members', async () => {
  const membership = query({ data: null, error: null })
  mockFrom.mockReturnValue(membership)

  const response = await GET(new Request(`http://localhost/api/messages/group/${groupId}/members`), {
    params: Promise.resolve({ id: groupId }),
  })

  expect(response.status).toBe(403)
  expect(membership.eq).toHaveBeenCalledWith('group_id', groupId)
  expect(membership.eq).toHaveBeenCalledWith('user_id', userId)
  expect(membership.eq).toHaveBeenCalledWith('status', 'active')
})

test('returns only active member identities for an authorized group', async () => {
  const membership = query({ data: { group_id: groupId }, error: null })
  const members = query({
    data: [
      { user_id: userId, user: { id: userId, name: 'Sam Smith', avatar_url: null } },
    ],
    error: null,
  })
  mockFrom.mockReturnValueOnce(membership).mockReturnValueOnce(members)

  const response = await GET(new Request(`http://localhost/api/messages/group/${groupId}/members`), {
    params: Promise.resolve({ id: groupId }),
  })

  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual([
    { id: userId, name: 'Sam Smith', avatar_url: null },
  ])
  expect(members.eq).toHaveBeenCalledWith('status', 'active')
})
