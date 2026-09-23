import { isReciprocallyBlockedForGroupInvite } from '@/lib/messaging/group-invitation-blocking'

const inviterId = '11111111-1111-4111-8111-111111111111'
const inviteeId = '22222222-2222-4222-8222-222222222222'

function client(result: { data: { id: string } | null; error: unknown }) {
  const query = {
    select: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
  }
  return { from: jest.fn().mockReturnValue(query), query }
}

test('allows a group invitation when neither user has blocked the other', async () => {
  const supabase = client({ data: null, error: null })

  await expect(isReciprocallyBlockedForGroupInvite(supabase as any, inviterId, inviteeId)).resolves.toBe(false)
  expect(supabase.query.or).toHaveBeenCalledWith(
    `and(user_id.eq.${inviterId},blocked_user_id.eq.${inviteeId}),and(user_id.eq.${inviteeId},blocked_user_id.eq.${inviterId})`
  )
})

test('rejects a group invitation when either user has blocked the other', async () => {
  const supabase = client({ data: { id: 'block-row' }, error: null })

  await expect(isReciprocallyBlockedForGroupInvite(supabase as any, inviterId, inviteeId)).resolves.toBe(true)
})

test('fails closed when the block lookup fails', async () => {
  const supabase = client({ data: null, error: new Error('block lookup failed') })

  await expect(isReciprocallyBlockedForGroupInvite(supabase as any, inviterId, inviteeId)).rejects.toThrow('block lookup failed')
})
