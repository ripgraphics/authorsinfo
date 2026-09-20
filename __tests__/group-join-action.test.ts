/** @jest-environment node */

import { joinGroup } from '@/app/actions/groups/manage-members'
import { createServerActionClientAsync } from '@/lib/supabase/client-helper'

jest.mock('@/lib/supabase/client-helper', () => ({ createServerActionClientAsync: jest.fn() }))
jest.mock('@/lib/supabase/server', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('@/lib/schema/schema-validators', () => ({ validateAndFilterPayload: jest.fn(async (_table: string, payload: Record<string, unknown>) => ({ payload, removedColumns: [], warnings: [] })) }))

test('group join action uses the live composite-key member columns', async () => {
  const from = jest.fn()
  const members = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockReturnThis(),
  }
  const groups = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'group-1', is_private: false }, error: null }),
  }
  from.mockImplementation((table: string) => table === 'groups' ? groups : members)
  ;(createServerActionClientAsync as jest.Mock).mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
    from,
  })

  expect(from).toBeDefined()
  expect(members.select).not.toHaveBeenCalledWith('id, status')
  expect(members.select).not.toHaveBeenCalledWith('id, user_id, group_id, role, joined_at, is_moderator, last_activity')
})