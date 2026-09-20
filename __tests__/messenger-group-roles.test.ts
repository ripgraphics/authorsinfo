/** @jest-environment node */

import { NextResponse } from 'next/server'
import { GET } from '@/app/api/messages/group/[id]/roles/route'
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
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
  return chain
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: userId }, supabase: { from: mockFrom } },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

test('denies role discovery to non-members', async () => {
  const membership = query({ data: null, error: null })
  mockFrom.mockReturnValue(membership)
  const response = await GET(new Request('http://localhost'), { params: Promise.resolve({ id: groupId }) })
  expect(response.status).toBe(403)
})

test('returns roles for an authorized Messenger group member', async () => {
  const membership = query({ data: { group_id: groupId }, error: null })
  const roles = query({ data: [{ id: 'role-1', group_id: groupId, name: 'Member', permissions: ['view_content'] }], error: null })
  mockFrom.mockReturnValueOnce(membership).mockReturnValueOnce(roles)
  const response = await GET(new Request('http://localhost'), { params: Promise.resolve({ id: groupId }) })
  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Member' })]))
  expect(roles.order).toHaveBeenCalledWith('name', { ascending: true })
})
