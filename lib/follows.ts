import { supabaseClient } from '@/lib/supabase-client'
import { Database } from '@/types/database'
import { FollowTargetType } from './follows-server'

interface FollowData {
  id: string
  follower_id: string
  following_id: string | number
  target_type_id: number
  created_at: string
  updated_at: string
}

interface FollowTargetTypeData {
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
export async function followEntity(followingId: string | number, targetType: FollowTargetType) {
  const targetTypeData = await getFollowTargetType(targetType)
  if (!targetTypeData) {
    throw new Error(`Invalid target type: ${targetType}`)
  }

  const { data, error } = await supabaseClient
    .from('follows')
    .insert({
      following_id: followingId,
      target_type_id: targetTypeData.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error following entity:', error)
    throw error
  }

  return data
}

// Unfollow an entity
export async function unfollowEntity(followingId: string | number, targetType: FollowTargetType) {
  const { error } = await supabaseClient
    .from('follows')
    .delete()
    .eq('following_id', followingId)
    .eq('target_type_id', targetType)

  if (error) {
    console.error('Error unfollowing entity:', error)
    throw error
  }
}

// Check if a user is following an entity
export async function isFollowing(followingId: string | number, targetType: FollowTargetType) {
  const { data, error } = await supabaseClient
    .from('follows')
    .select('id')
    .eq('following_id', followingId)
    .eq('target_type_id', targetType)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking follow status:', error)
    throw error
  }

  return !!data
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