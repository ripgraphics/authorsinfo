import { acceptGroupInvitation, createGroupInvitation } from '@/app/actions/groups/manage-invitations'
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
const roleId = '55555555-5555-4555-8555-555555555555'
const mockCreateServerClient = jest.mocked(createServerActionClientAsync)
const mockAdminFrom = jest.mocked(supabaseAdmin.from)
const invitation = {
  id: '44444444-4444-4444-8444-444444444444',
  group_id: groupId,
  inviter_id: inviterId,
  invitee_user_id: inviteeId,
  invitee_email: null,
  role_id: null,
  status: 'pending',
  expires_at: null,
}
let invitationQueryCount: number
let memberQueryCount: number
let invitationInsert: jest.Mock
let memberInsert: jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  invitationQueryCount = 0
  memberQueryCount = 0
  invitationInsert = jest.fn().mockReturnThis()
  memberInsert = jest.fn().mockReturnThis()
  mockCreateServerClient.mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: inviterId } }, error: null }) },
  } as Awaited<ReturnType<typeof createServerActionClientAsync>>)
  mockAdminFrom.mockImplementation(((table: string) => {
    const query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      insert: jest.fn((payload) => {
        if (table === 'group_invitations') invitationInsert(payload)
        if (table === 'group_members') memberInsert(payload)
        return query
      }),
      update: jest.fn().mockReturnThis(),
      single: jest.fn().mockImplementation(async () => {
        if (table === 'groups') return { data: { created_by: inviterId }, error: null }
        if (table === 'group_roles') return { data: { id: roleId }, error: null }
        if (table === 'group_members') {
          memberQueryCount += 1
          return memberQueryCount === 1
            ? { data: null, error: null }
            : { data: { id: 'member-row', group_id: groupId, user_id: inviteeId }, error: null }
        }
        invitationQueryCount += 1
        return invitationQueryCount === 1 ? { data: null, error: null } : { data: invitation, error: null }
      }),
      then: (resolve: (value: { data: null; error: null }) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(resolve),
    }
    return query
  }) as typeof supabaseAdmin.from)
})

test('accepts an invitation using only live membership columns', async () => {
  const acceptId = '66666666-6666-4666-8666-666666666666'
  mockCreateServerClient.mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: inviteeId } }, error: null }) },
  } as Awaited<ReturnType<typeof createServerActionClientAsync>>)
  mockAdminFrom.mockImplementation(((table: string) => {
    const query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn((payload) => {
        if (table === 'group_members') memberInsert(payload)
        return query
      }),
      update: jest.fn().mockReturnThis(),
      single: jest.fn().mockImplementation(async () => {
        if (table === 'group_invitations') return { data: { ...invitation, id: acceptId }, error: null }
        if (table === 'group_roles') return { data: { id: roleId }, error: null }
        if (table === 'group_members') {
          memberQueryCount += 1
          return memberQueryCount === 1
            ? { data: null, error: null }
            : { data: { id: 'member-row', group_id: groupId, user_id: inviteeId }, error: null }
        }
        return { data: null, error: null }
      }),
      then: (resolve: (value: { data: null; error: null }) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(resolve),
    }
    return query
  }) as typeof supabaseAdmin.from)

  const result = await acceptGroupInvitation({ invitationId: acceptId })

  expect(result.success).toBe(true)
  expect(memberInsert).toHaveBeenCalledWith({
    group_id: groupId,
    user_id: inviteeId,
    role_id: roleId,
    status: 'active',
    joined_at: expect.any(String),
  })
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
