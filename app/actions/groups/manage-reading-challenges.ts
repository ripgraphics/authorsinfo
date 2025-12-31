'use server'

import { createServerActionClientAsync } from '@/lib/supabase/client-helper'
import { validateAndFilterPayload } from '@/lib/schema/schema-validators'
import { supabaseAdmin } from '@/lib/supabase/server'
import type {
  CreateChallengeInput,
  ProgressUpdate,
  ReadingChallenge,
  UserChallengeProgress,
} from '@/types/group-components'

export interface ChallengeActionResult {
  success: boolean
  challenge?: ReadingChallenge
  challenges?: ReadingChallenge[]
  error?: string
  warnings?: string[]
}

/**
 * Get reading challenges for a group
 */
export async function getGroupReadingChallenges(
  groupId: string,
  filters?: { status?: 'active' | 'completed' | 'cancelled' | 'all' }
): Promise<ChallengeActionResult> {
  try {
    let query = supabaseAdmin
      .from('group_reading_challenges')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    // Apply status filter
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    const { data: challenges, error } = await query

    if (error) {
      console.error('Error fetching reading challenges:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch reading challenges',
      }
    }

    return {
      success: true,
      challenges: challenges || [],
    }
  } catch (error) {
    console.error('Unexpected error fetching reading challenges:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Create a reading challenge
 */
export async function createReadingChallenge(
  groupId: string,
  challengeData: CreateChallengeInput
): Promise<ChallengeActionResult> {
  try {
    const supabase = await createServerActionClientAsync()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Validate required fields
    if (!challengeData.name || !challengeData.start_date || !challengeData.end_date) {
      return {
        success: false,
        error: 'Challenge name, start date, and end date are required',
      }
    }

    // Validate dates
    if (new Date(challengeData.end_date) < new Date(challengeData.start_date)) {
      return {
        success: false,
        error: 'End date must be after start date',
      }
    }

    // Prepare payload
    const payload = {
      group_id: groupId,
      name: challengeData.name.trim(),
      description: challengeData.description?.trim() || null,
      start_date: challengeData.start_date,
      end_date: challengeData.end_date,
      goal_books: challengeData.goal_books || null,
      goal_pages: challengeData.goal_pages || null,
      status: 'active',
      created_by: user.id,
    }

    // Validate and filter payload
    const {
      payload: filteredPayload,
      removedColumns,
      warnings,
    } = await validateAndFilterPayload('group_reading_challenges', payload)

    // Insert challenge
    const { data: challenge, error } = await supabaseAdmin
      .from('group_reading_challenges')
      .insert([filteredPayload])
      .select()
      .single()

    if (error) {
      console.error('Error creating reading challenge:', error)
      return {
        success: false,
        error: error.message || 'Failed to create reading challenge',
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    }

    return {
      success: true,
      challenge,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    console.error('Unexpected error creating reading challenge:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Join a reading challenge
 */
export async function joinReadingChallenge(challengeId: string): Promise<ChallengeActionResult> {
  try {
    const supabase = await createServerActionClientAsync()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Verify challenge exists and is active
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('group_reading_challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (challengeError || !challenge) {
      return {
        success: false,
        error: 'Challenge not found',
      }
    }

    if (challenge.status !== 'active') {
      return {
        success: false,
        error: 'This challenge is not active',
      }
    }

    // Check if user is already a participant
    const { data: existingParticipant } = await supabaseAdmin
      .from('group_reading_challenge_participants')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingParticipant) {
      return {
        success: false,
        error: 'You are already participating in this challenge',
      }
    }

    // Add participant
    const payload = {
      challenge_id: challengeId,
      user_id: user.id,
      books_read: 0,
      pages_read: 0,
    }

    // Validate and filter payload
    const {
      payload: filteredPayload,
      removedColumns,
      warnings,
    } = await validateAndFilterPayload('group_reading_challenge_participants', payload)

    const { error } = await supabaseAdmin
      .from('group_reading_challenge_participants')
      .insert([filteredPayload])

    if (error) {
      console.error('Error joining challenge:', error)
      return {
        success: false,
        error: error.message || 'Failed to join challenge',
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    }

    // Fetch updated challenge
    const { data: updatedChallenge } = await supabaseAdmin
      .from('group_reading_challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    return {
      success: true,
      challenge: updatedChallenge,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    console.error('Unexpected error joining challenge:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Update challenge progress
 */
export async function updateChallengeProgress(
  challengeId: string,
  progress: ProgressUpdate
): Promise<ChallengeActionResult> {
  try {
    const supabase = await createServerActionClientAsync()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Verify participant exists
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('group_reading_challenge_participants')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      return {
        success: false,
        error: 'You are not participating in this challenge',
      }
    }

    // Build update payload
    const updatePayload: Record<string, any> = {}
    if (progress.books_read !== undefined) {
      updatePayload.books_read = progress.books_read
    }
    if (progress.pages_read !== undefined) {
      updatePayload.pages_read = progress.pages_read
    }

    // Validate and filter payload
    const {
      payload: filteredPayload,
      removedColumns,
      warnings,
    } = await validateAndFilterPayload('group_reading_challenge_participants', {
      ...participant,
      ...updatePayload,
    })

    // Update participant
    const { error } = await supabaseAdmin
      .from('group_reading_challenge_participants')
      .update(filteredPayload)
      .eq('id', participant.id)

    if (error) {
      console.error('Error updating progress:', error)
      return {
        success: false,
        error: error.message || 'Failed to update progress',
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    }

    // Fetch updated challenge
    const { data: updatedChallenge } = await supabaseAdmin
      .from('group_reading_challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    return {
      success: true,
      challenge: updatedChallenge,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    console.error('Unexpected error updating progress:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Delete a reading challenge
 */
export async function deleteReadingChallenge(challengeId: string): Promise<ChallengeActionResult> {
  try {
    const supabase = await createServerActionClientAsync()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Verify challenge exists and check permission
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('group_reading_challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (challengeError || !challenge) {
      return {
        success: false,
        error: 'Challenge not found',
      }
    }

    // Check permission (creator or group admin)
    if (challenge.created_by !== user.id) {
      // Check if user is group admin (you may want to use checkGroupPermission here)
      return {
        success: false,
        error: 'You do not have permission to delete this challenge',
      }
    }

    // Delete challenge (participants will be cascade deleted)
    const { error } = await supabaseAdmin
      .from('group_reading_challenges')
      .delete()
      .eq('id', challengeId)

    if (error) {
      console.error('Error deleting challenge:', error)
      return {
        success: false,
        error: error.message || 'Failed to delete challenge',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Unexpected error deleting challenge:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}
