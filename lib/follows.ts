import { supabaseClient } from '@/lib/supabase-client'
import { Database } from '@/types/database'
import { FollowTargetType } from './follows-server'
import { createBrowserClient } from '@supabase/ssr'

interface FollowData {
  id: string
  follower_id: string
  following_id: string | number
  target_type_id: number
  created_at: string
  updated_at: string
}

export interface FollowTargetTypeData {
  id: number
  name: string
  description: string
}

interface FollowResponse {
  success: boolean
  error?: string
  isFollowing?: boolean
}

interface FollowCountResponse {
  count: number
  error?: string
}

// Get all available target types
export async function getFollowTargetTypes(): Promise<FollowTargetTypeData[]> {
  const { data, error } = await supabaseClient
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
  const { data, error } = await supabaseClient
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

// Follow an entity
export async function followEntity(followingId: string | number, targetType: FollowTargetType): Promise<FollowResponse> {
  try {
    // Get current user
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    console.log('Getting target type for:', targetType)
  const targetTypeData = await getFollowTargetType(targetType)
    console.log('Target type data:', targetTypeData)
  if (!targetTypeData) {
      return { success: false, error: `Invalid target type: ${targetType}` }
  }

    console.log('Inserting follow record:', {
      follower_id: user.id,
      following_id: followingId,
      target_type_id: targetTypeData.id
    })
  const { data, error } = await supabaseClient
    .from('follows')
    .insert({
        follower_id: user.id,
      following_id: followingId,
      target_type_id: targetTypeData.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error following entity:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return { success: false, error: error.message || 'Database error occurred' }
  }

    return { success: true }
  } catch (error: any) {
    console.error('Error following entity:', error)
    console.error('Error type:', typeof error)
    console.error('Error stringified:', JSON.stringify(error, null, 2))
    return { success: false, error: error?.message || error?.toString() || 'An unexpected error occurred' }
  }
}

// Unfollow an entity
export async function unfollowEntity(followingId: string | number, targetType: FollowTargetType): Promise<FollowResponse> {
  try {
    // Get current user
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    console.log('Getting target type for unfollow:', targetType)
    const targetTypeData = await getFollowTargetType(targetType)
    console.log('Target type data for unfollow:', targetTypeData)
    if (!targetTypeData) {
      return { success: false, error: `Invalid target type: ${targetType}` }
    }

    console.log('Deleting follow record:', {
      follower_id: user.id,
      following_id: followingId,
      target_type_id: targetTypeData.id
    })
  const { error } = await supabaseClient
    .from('follows')
    .delete()
      .eq('follower_id', user.id)
    .eq('following_id', followingId)
      .eq('target_type_id', targetTypeData.id)

  if (error) {
      console.error('Error unfollowing entity:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error unfollowing entity:', error)
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
}

// Check if a user is following an entity
export async function isFollowing(followingId: string | number, targetType: FollowTargetType) {
  try {
    // Get current user
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return false
    }

    console.log('Getting target type for isFollowing:', targetType)
    const targetTypeData = await getFollowTargetType(targetType)
    console.log('Target type data for isFollowing:', targetTypeData)
    if (!targetTypeData) {
      return false
    }

    console.log('Checking follow status:', {
      follower_id: user.id,
      following_id: followingId,
      target_type_id: targetTypeData.id
    })
  const { data, error } = await supabaseClient
    .from('follows')
    .select('id')
      .eq('follower_id', user.id)
    .eq('following_id', followingId)
      .eq('target_type_id', targetTypeData.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking follow status:', error)
      return false
  }

  return !!data
  } catch (error) {
    console.error('Error checking follow status:', error)
    return false
  }
}

// Get followers count for an entity
export async function getFollowersCount(followingId: string | number, targetType: FollowTargetType) {
  const targetTypeData = await getFollowTargetType(targetType)
  if (!targetTypeData) {
    throw new Error(`Invalid target type: ${targetType}`)
  }

  const { count, error } = await supabaseClient
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
  const start = (page - 1) * limit

  const { data, error, count } = await supabaseClient
    .from('follows')
    .select(`
      id,
      follower_id,
      users!follows_follower_id_fkey (
        id,
        name,
        email
      )
    `, { count: 'exact' })
    .eq('following_id', followingId)
    .eq('target_type_id', targetType)
    .order('created_at', { ascending: false })
    .range(start, start + limit - 1)

  if (error) {
    console.error('Error getting followers:', error)
    throw error
  }

  return {
    followers: data?.map(follow => ({
      id: follow.users.id,
      name: follow.users.name,
      email: follow.users.email
    })) || [],
    count: count || 0
  }
}

// Get all entities a user is following of a specific type
export async function getUserFollows(targetType: FollowTargetType, page = 1, limit = 10) {
  const start = (page - 1) * limit

  const { data, error, count } = await supabaseClient
    .from('follows')
    .select(`
      id,
      following_id,
      created_at
    `, { count: 'exact' })
    .eq('target_type_id', targetType)
    .order('created_at', { ascending: false })
    .range(start, start + limit - 1)

  if (error) {
    console.error('Error getting user follows:', error)
    throw error
  }

  return {
    follows: data || [],
    count: count || 0
  }
}