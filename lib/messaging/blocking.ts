import type { AuthenticatedRoute } from '@/lib/auth/require-auth'

type BlockIdRow = { id: string }
type OwnBlockRow = { blocked_user_id: string }
type ReciprocalBlockRow = { user_id: string }

export async function isBlockedByEitherUser(
  context: AuthenticatedRoute,
  otherUserId: string
): Promise<boolean> {
  const ownBlock = await context.supabase
    .from('blocks')
    .select('id')
    .eq('user_id', context.user.id)
    .eq('blocked_user_id', otherUserId)
    .maybeSingle()
  if (ownBlock.error) throw ownBlock.error
  if (ownBlock.data as unknown as BlockIdRow | null) return true

  const reciprocalBlock = await context.supabase
    .from('blocks')
    .select('id')
    .eq('user_id', otherUserId)
    .eq('blocked_user_id', context.user.id)
    .maybeSingle()
  if (reciprocalBlock.error) throw reciprocalBlock.error
  return Boolean(reciprocalBlock.data as unknown as BlockIdRow | null)
}

export async function getBlockedUserIds(context: AuthenticatedRoute): Promise<Set<string>> {
  const [ownBlocks, reciprocalBlocks] = await Promise.all([
    context.supabase
      .from('blocks')
      .select('blocked_user_id')
      .eq('user_id', context.user.id),
    context.supabase
      .from('blocks')
      .select('user_id')
      .eq('blocked_user_id', context.user.id),
  ])
  if (ownBlocks.error) throw ownBlocks.error
  if (reciprocalBlocks.error) throw reciprocalBlocks.error

  const ownBlockRows = (ownBlocks.data ?? []) as unknown as OwnBlockRow[]
  const reciprocalBlockRows = (reciprocalBlocks.data ?? []) as unknown as ReciprocalBlockRow[]
  return new Set([
    ...ownBlockRows.map((row) => row.blocked_user_id),
    ...reciprocalBlockRows.map((row) => row.user_id),
  ])
}
