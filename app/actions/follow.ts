'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/server'

export interface FollowResponse {
  success: boolean
  error?: string
  isFollowing?: boolean
}

// Helper function to convert followingId to UUID
function convertToUUID(followingId: string | number): string {
  if (typeof followingId === 'string') {
    return followingId
  }
  return followingId.toString()
}

// Cache for target type lookups to avoid repeated database calls
const targetTypeCache = new Map<string, string>()

// Helper function to get target type ID with caching
async function getTargetTypeId(targetType: string): Promise<string | null> {
  // Check cache first
  if (targetTypeCache.has(targetType)) {
    return targetTypeCache.get(targetType)!
  }

  // Get target type ID using admin client
  const { data: targetTypeData, error: targetTypeError } = await supabaseAdmin
    .from('follow_target_types')
    .select('id')
    .eq('name', targetType)
    .single()

  if (targetTypeError || !targetTypeData) {
    console.error('Server: Target type error:', targetTypeError)
    return null
  }

  // Cache the result
  targetTypeCache.set(targetType, targetTypeData.id)
  return targetTypeData.id
}

export async function followEntity(followingId: string | number, targetType: string): Promise<FollowResponse> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Prevent users from following themselves
    if (user.id === followingId) {
      return { success: false, error: 'You cannot follow yourself' }
    }

    // Get target type ID with caching
    const targetTypeId = await getTargetTypeId(targetType)
    if (!targetTypeId) {
      return { success: false, error: `Invalid target type: ${targetType}` }
    }

    // Convert followingId to UUID string
    const followingIdUUID = convertToUUID(followingId)

    // Check if already following using direct SQL
    const { data: existingFollow, error: checkError } = await supabaseAdmin
      .rpc('check_existing_follow', {
        p_follower_id: user.id,
        p_following_id: followingIdUUID,
        p_target_type_id: targetTypeId
      })

    if (existingFollow && existingFollow.follow_exists) {
      return { success: false, error: 'Already following this entity' }
    }

    // Insert follow record using direct SQL to bypass any triggers
    const { data, error } = await supabaseAdmin
      .rpc('insert_follow_record', {
        p_follower_id: user.id,
        p_following_id: followingIdUUID,
        p_target_type_id: targetTypeId
      })

    if (error) {
      console.error('Server: Error following entity:', error)
      return { success: false, error: error.message || 'Database error occurred' }
    }

    // Revalidate relevant pages
    revalidatePath('/profile/[id]', 'page')
    revalidatePath('/books/[id]', 'page')

    return { success: true }
  } catch (error: any) {
    console.error('Server: Error following entity:', error)
    return { success: false, error: error?.message || 'An unexpected error occurred' }
  }
}

export async function unfollowEntity(followingId: string | number, targetType: string): Promise<FollowResponse> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Prevent users from unfollowing themselves
    if (user.id === followingId) {
      return { success: false, error: 'You cannot unfollow yourself' }
    }

    // Get target type ID with caching
    const targetTypeId = await getTargetTypeId(targetType)
    if (!targetTypeId) {
      return { success: false, error: `Invalid target type: ${targetType}` }
    }

    // Convert followingId to UUID string
    const followingIdUUID = convertToUUID(followingId)

    // Delete follow record using direct SQL
    const { data, error } = await supabaseAdmin
      .rpc('delete_follow_record', {
        p_follower_id: user.id,
        p_following_id: followingIdUUID,
        p_target_type_id: targetTypeId
      })

    if (error) {
      console.error('Server: Error unfollowing entity:', error)
      return { success: false, error: error.message || 'Database error occurred' }
    }

    if (!data) {
      return { success: false, error: 'Not following this entity' }
    }

    // Revalidate relevant pages
    revalidatePath('/profile/[id]', 'page')
    revalidatePath('/books/[id]', 'page')

    return { success: true }
  } catch (error: any) {
    console.error('Server: Error unfollowing entity:', error)
    return { success: false, error: error?.message || 'An unexpected error occurred' }
  }
}

export async function isFollowing(followingId: string | number, targetType: string): Promise<FollowResponse> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: true, isFollowing: false }
    }

    // Get target type ID with caching
    const targetTypeId = await getTargetTypeId(targetType)
    if (!targetTypeId) {
      return { success: false, error: `Invalid target type: ${targetType}`, isFollowing: false }
    }

    // Convert followingId to UUID string
    const followingIdUUID = convertToUUID(followingId)

    // Check follow status using direct SQL
    const { data, error } = await supabaseAdmin
      .rpc('check_is_following', {
        p_follower_id: user.id,
        p_following_id: followingIdUUID,
        p_target_type_id: targetTypeId
      })

    if (error) {
      console.error('Server: Error checking follow status:', error)
      return { success: false, error: error.message, isFollowing: false }
    }

    return { success: true, isFollowing: data || false }
  } catch (error: any) {
    console.error('Server: Error checking follow status:', error)
    return { success: false, error: error?.message || 'An unexpected error occurred', isFollowing: false }
  }
} 