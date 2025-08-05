import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

/**
 * Generates a profile URL using the user's permalink instead of ID (client-side)
 * Falls back to ID if permalink is not available
 */
export async function getProfileUrlClient(userId: string): Promise<string> {
  try {
    const supabase = createClientComponentClient()
    
    // Get the user's permalink
    const { data: user, error } = await supabase
      .from('users')
      .select('permalink')
      .eq('id', userId)
      .single()

    if (error || !user || !user.permalink) {
      // Fallback to ID if permalink is not available
      return `/profile/${userId}`
    }

    return `/profile/${user.permalink}`
  } catch (error) {
    console.error('Error getting profile URL:', error)
    // Fallback to ID
    return `/profile/${userId}`
  }
}

/**
 * Generates a profile URL using the user's permalink (synchronous version)
 * Use this when you already have the user object with permalink
 */
export function getProfileUrlFromUser(user: { id: string; permalink?: string | null }): string {
  if (user.permalink) {
    return `/profile/${user.permalink}`
  }
  return `/profile/${user.id}`
}

/**
 * Generates a profile URL using the user's permalink (synchronous version)
 * Use this when you already have the permalink
 */
export function getProfileUrlFromPermalink(permalink: string): string {
  return `/profile/${permalink}`
}

/**
 * Converts a permalink or UUID to a UUID for database queries (client-side)
 * Use this in API endpoints when you need to convert permalinks to UUIDs
 */
export async function getUserIdFromPermalink(identifier: string): Promise<string | null> {
  try {
    const supabase = createClientComponentClient()
    
    // Check if the identifier looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier)
    
    if (isUUID) {
      // If it's already a UUID, verify it exists and return it
      const { data: user, error } = await supabase
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
      const { data: user, error } = await supabase
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