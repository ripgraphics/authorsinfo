import { supabaseAdmin } from '@/lib/supabase-admin'
import { Database } from '@/types/database'

export type FollowTargetType = 'user' | 'book' | 'author' | 'publisher' | 'group'

interface FollowTargetTypeData {
  id: number
  name: string
  description: string
}

// Get all available target types
export async function getFollowTargetTypes(): Promise<FollowTargetTypeData[]> {
  const { data, error } = await supabaseAdmin
    .from('follow_target_types')
    .select('*')
    .order('id')

  if (error) {
    console.error('Error fetching follow target types:', error)
    return []
  }

  return data || []
}

// Get a specific target type by name
export async function getFollowTargetType(name: FollowTargetType): Promise<FollowTargetTypeData | null> {
  const { data, error } = await supabaseAdmin
    .from('follow_target_types')
    .select('*')
    .eq('name', name)
    .single()

  if (error) {
    console.error(`Error fetching follow target type ${name}:`, error)
    return null
  }

  return data
}

// Get followers count for an entity
export async function getFollowersCount(followingId: string | number, targetType: FollowTargetType) {
  const targetTypeData = await getFollowTargetType(targetType)
  if (!targetTypeData) {
    throw new Error(`Invalid target type: ${targetType}`)
  }

  const { count, error } = await supabaseAdmin
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', followingId)
    .eq('target_type_id', targetTypeData.id)

  if (error) {
    console.error('Error getting followers count:', error)
    throw error
  }

  return count || 0
}

// Get followers for an entity with pagination
export async function getFollowers(followingId: string | number, targetType: FollowTargetType, page = 1, limit = 10) {
  const targetTypeData = await getFollowTargetType(targetType)
  if (!targetTypeData) {
    throw new Error(`Invalid target type: ${targetType}`)
  }
  
  const start = (page - 1) * limit

  const { data, error, count } = await supabaseAdmin
    .from('follows')
    .select(`
      id,
      follower_id,
      created_at,
      users:follower_id (
        id,
        name,
        email
      )
    `, { count: 'exact' })
    .eq('following_id', followingId)
    .eq('target_type_id', targetTypeData.id)
    .order('created_at', { ascending: false })
    .range(start, start + limit - 1)

  if (error) {
    console.error('Error getting followers:', error)
    throw error
  }

  return {
    followers: data?.map(follow => ({
      id: follow.users?.id || follow.follower_id,
      name: follow.users?.name || 'Unknown User',
      email: follow.users?.email || 'unknown@email.com',
      followSince: follow.created_at
    })) || [],
    count: count || 0
  }
} 