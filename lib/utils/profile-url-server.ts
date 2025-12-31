import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * Converts a permalink or UUID to a UUID for database queries (server-side)
 * Use this in API endpoints when you need to convert permalinks to UUIDs
 */
export async function getUserIdFromPermalinkServer(identifier: string): Promise<string | null> {
  try {
    // Check if the identifier looks like a UUID
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier)

    if (isUUID) {
      // If it's already a UUID, verify it exists and return it
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', identifier)
        .single()

      if (error || !user) {
        return null
      }

      return user.id
    } else {
      // If it's a permalink, find the user by permalink
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('permalink', identifier)
        .single()

      if (error || !user) {
        return null
      }

      return user.id
    }
  } catch (error) {
    console.error('Error converting permalink to UUID:', error)
    return null
  }
}
