/** @jest-environment node */

import { NextResponse } from 'next/server'
import { PATCH } from '@/app/api/messages/group/[id]/members/[memberId]/route'
import { requireUser } from '@/lib/auth/require-auth'
import { supabaseAdmin } from '@/lib/supabase/server'

jest.mock('@/lib/auth/require-auth', () => ({ requireUser: jest.fn() }))
jest.mock('@/lib/supabase/server', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('@/lib/error-handler', () => ({
  nextErrorResponse: jest.fn(() => NextResponse.json({ error: 'Operation failed' }, { status: 500 })),
}))

const groupId = '11111111-1111-4111-8111-111111111111'
const actorId = '22222222-2222-4222-8222-222222222222'
const targetId = '33333333-3333-4333-8333-333333333333'
const roleId = '44444444-4444-4444-8444-444444444444'
const mockFrom = jest.mocked(supabaseAdmin.from)
const mockRequireUser = jest.mocked(requireUser)

function query(data: unknown, error: unknown = null) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
    single: jest.fn().mockResolvedValue({ data, error }),
  }
  return chain
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireUser.mockResolvedValue({
    ok: true,
    context: { user: { id: actorId }, supabase: {} },
  } as unknown as Awaited<ReturnType<typeof requireUser>>)
})

test('denies self role changes before querying the database', async () => {
  const response = await PATCH(
    new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ role_id: roleId }) }),
    { params: Promise.resolve({ id: groupId, memberId: actorId }) },
  )
  expect(response.status).toBe(403)
  expect(mockFrom).not.toHaveBeenCalled()
})

test('allows an owner to assign an existing non-owner role', async () => {
  const group = query({ created_by: actorId })
  const actor = query({ role_id: null, role: { permissions: [], name: 'Owner' } })
  const target = query({ user_id: targetId, role_id: null, role: { name: 'Member' } })
  const role = query({ id: roleId, name: 'Moderator' })
  const updated = query({ user_id: targetId, role_id: roleId, role: { id: roleId, name: 'Moderator' } })
  let memberQueryCount = 0
  let roleQueryCount = 0
  mockFrom.mockImplementation((table: string) => {
    if (table === 'groups') return group as never
    if (table === 'group_roles') {
      roleQueryCount += 1
      return roleQueryCount === 1 ? role as never : updated as never
    }
    memberQueryCount += 1
    if (memberQueryCount === 1) return actor as never
    if (memberQueryCount === 2) return target as never
    return updated as never
  })
  const response = await PATCH(
    new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ role_id: roleId }) }),
    { params: Promise.resolve({ id: groupId, memberId: targetId }) },
  )
  expect(response.status).toBe(200)
  expect(updated.update).toHaveBeenCalledWith({ role_id: roleId })
})
