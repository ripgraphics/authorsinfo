'use server'

import { createServerActionClientAsync } from '@/lib/supabase/client-helper'
import { supabaseAdmin } from '@/lib/supabase/server'

export interface FollowStatusResult {
  success: boolean
  isFollowing?: boolean
  error?: string
}

/**
 * Get follow status for a group
 */
export async function getGroupFollowStatus(
  groupId: string,
  userId: string
): Promise<FollowStatusResult> {
  try {
    // Check if user follows the group
    const { data: follow, error } = await supabaseAdmin
      .from('group_followers')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error checking follow status:', error)
      return {
        success: false,
        error: error.message || 'Failed to check follow status',
      }
    }

    return {
      success: true,
      isFollowing: !!follow,
    }
  } catch (error) {
    console.error('Unexpected error checking follow status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}
