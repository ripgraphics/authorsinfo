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

  // First get the follows data
  const { data: followsData, error: followsError, count } = await supabaseAdmin
    .from('follows')
    .select('follower_id, created_at', { count: 'exact' })
    .eq('following_id', followingId)
    .eq('target_type_id', targetTypeData.id)
    .order('created_at', { ascending: false })
    .range(start, start + limit - 1)

  if (followsError) {
    console.error('Error getting follows:', followsError)
    throw followsError
  }

  if (!followsData || followsData.length === 0) {
    return {
      followers: [],
      count: count || 0
    }
  }

  // Get user IDs from follows
  const followerIds = followsData.map(follow => follow.follower_id)

  // Fetch user details from auth using admin API
  const { data: authUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

  if (usersError) {
    console.error('Error getting user details:', usersError)
    // Return follows data with fallback names if user fetch fails
    return {
      followers: followsData.map(follow => ({
        id: follow.follower_id,
        name: 'Unknown User',
        email: 'unknown@email.com',
        followSince: follow.created_at
      })),
      count: count || 0
    }
  }

  // Create a map of user data for quick lookup
  const userMap = new Map()
  authUsers?.users?.forEach(user => {
    const name = user.user_metadata?.name || user.user_metadata?.full_name || 'Unknown User'
    userMap.set(user.id, {
      id: user.id,
      name: name,
      email: user.email || 'unknown@email.com'
    })
  })

  return {
    followers: followsData.map(follow => {
      const userData = userMap.get(follow.follower_id) || {
        id: follow.follower_id,
        name: 'Unknown User',
        email: 'unknown@email.com'
      }
      return {
        ...userData,
        followSince: follow.created_at
      }
    }),
    count: count || 0
  }
} 