type BlockLookupClient = {
  from(table: 'blocks'): {
    select(columns: string): {
      or(filters: string): {
        maybeSingle(): Promise<{ data: { id: string } | null; error: unknown }>
      }
    }
  }
}

export async function isReciprocallyBlockedForGroupInvite(
  supabase: BlockLookupClient,
  inviterId: string,
  inviteeId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('blocks')
    .select('id')
    .or(
      `and(user_id.eq.${inviterId},blocked_user_id.eq.${inviteeId}),and(user_id.eq.${inviteeId},blocked_user_id.eq.${inviterId})`
    )
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}
