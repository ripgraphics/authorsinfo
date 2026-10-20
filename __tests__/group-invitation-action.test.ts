import { createGroupInvitation } from '@/app/actions/groups/manage-invitations'
import { createServerActionClientAsync } from '@/lib/supabase/client-helper'
import { supabaseAdmin } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/client-helper', () => ({
  createServerActionClientAsync: jest.fn(),
}))
jest.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: { from: jest.fn() },
}))
jest.mock('@/lib/messaging/group-invitation-blocking', () => ({
  isReciprocallyBlockedForGroupInvite: jest.fn().mockResolvedValue(false),
}))

const groupId = '11111111-1111-4111-8111-111111111111'
const inviterId = '22222222-2222-4222-8222-222222222222'
const inviteeId = '33333333-3333-4333-8333-333333333333'
const mockCreateServerClient = jest.mocked(createServerActionClientAsync)
const mockAdminFrom = jest.mocked(supabaseAdmin.from)
const invitation = { id: '44444444-4444-4444-8444-444444444444', group_id: groupId }
let invitationQueryCount: number
let invitationInsert: jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  invitationQueryCount = 0
  invitationInsert = jest.fn().mockReturnThis()
  mockCreateServerClient.mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: inviterId } }, error: null }) },
  } as Awaited<ReturnType<typeof createServerActionClientAsync>>)
  mockAdminFrom.mockImplementation(((table: string) => {
    const query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      insert: jest.fn((payload) => {
        invitationInsert(payload)
        return query
      }),
      single: jest.fn().mockImplementation(async () => {
        if (table === 'groups') return { data: { created_by: inviterId }, error: null }
        if (table === 'group_members') return { data: null, error: null }
        invitationQueryCount += 1
        return invitationQueryCount === 1
          ? { data: null, error: null }
          : { data: invitation, error: null }
      }),
    }
    return query
  }) as typeof supabaseAdmin.from)
})

test('keeps the required group_id in the live invitation insert', async () => {
  const result = await createGroupInvitation({ groupId, inviteeUserId: inviteeId })

  expect(result.success).toBe(true)
  expect(invitationInsert).toHaveBeenCalledWith([
    expect.objectContaining({
      group_id: groupId,
      inviter_id: inviterId,
      invitee_user_id: inviteeId,
      status: 'pending',
    }),
  ])
})
