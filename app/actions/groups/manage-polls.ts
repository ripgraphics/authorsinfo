'use server'

import { createServerActionClientAsync } from '@/lib/supabase/client-helper'
import { validateAndFilterPayload } from '@/lib/schema/schema-validators'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { CreatePollInput, Poll, PollVote } from '@/types/group-components'

export interface PollActionResult {
  success: boolean
  poll?: Poll
  polls?: Poll[]
  error?: string
  warnings?: string[]
}

/**
 * Get polls for a group
 */
export async function getGroupPolls(
  groupId: string,
  filters?: { status?: 'active' | 'expired' | 'all' }
): Promise<PollActionResult> {
  try {
    const supabase = await createServerActionClientAsync()

    let query = supabaseAdmin
      .from('group_polls')
      .select('id, group_id, question, created_by, created_at, updated_at, is_active, options, expires_at, is_anonymous, allows_multiple_votes')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    // Apply status filter
    if (filters?.status === 'active') {
      const now = new Date().toISOString()
      query = query.or(`expires_at.is.null,expires_at.gt.${now}`)
    } else if (filters?.status === 'expired') {
      const now = new Date().toISOString()
      query = query.lte('expires_at', now)
    }

    const { data: polls, error } = await query

    if (error) {
      console.error('Error fetching polls:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch polls',
      }
    }

    return {
      success: true,
      polls: polls || [],
    }
  } catch (error) {
    console.error('Unexpected error fetching polls:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Create a new poll
 */
export async function createGroupPoll(
  groupId: string,
  pollData: CreatePollInput
): Promise<PollActionResult> {
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
    if (!pollData.question || !pollData.options || pollData.options.length < 2) {
      return {
        success: false,
        error: 'Poll must have a question and at least 2 options',
      }
    }

    // Prepare payload
    const payload = {
      group_id: groupId,
      question: pollData.question.trim(),
      options: pollData.options,
      is_anonymous: pollData.is_anonymous ?? false,
      allows_multiple_votes: pollData.allows_multiple_votes ?? false,
      expires_at: pollData.expires_at || null,
      created_by: user.id,
    }

    // Validate and filter payload
    const {
      payload: filteredPayload,
      removedColumns,
      warnings,
    } = await validateAndFilterPayload('group_polls', payload)

    // Insert poll
    const { data: poll, error } = await supabaseAdmin
      .from('group_polls')
      .insert([filteredPayload])
      .select()
      .single()

    if (error) {
      console.error('Error creating poll:', error)
      return {
        success: false,
        error: error.message || 'Failed to create poll',
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    }

    return {
      success: true,
      poll,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    console.error('Unexpected error creating poll:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Vote on a poll
 */
export async function voteOnPoll(pollId: string, optionIndex: number): Promise<PollActionResult> {
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

    // Verify poll exists and get poll details
    const { data: poll, error: pollError } = await supabaseAdmin
      .from('group_polls')
      .select('id, question, options, allows_multiple_votes, expires_at, created_by')
      .eq('id', pollId)
      .single()

    if (pollError || !poll) {
      return {
        success: false,
        error: 'Poll not found',
      }
    }

    // Check if poll has expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return {
        success: false,
        error: 'This poll has expired',
      }
    }

    // Check if option index is valid
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return {
        success: false,
        error: 'Invalid poll option',
      }
    }

    // Check if user already voted (if not allowing multiple votes)
    if (!poll.allows_multiple_votes) {
      const { data: existingVote } = await supabaseAdmin
        .from('group_poll_votes')
        .select('id')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .single()

      if (existingVote) {
        return {
          success: false,
          error: 'You have already voted on this poll',
        }
      }
    }

    // Create vote
    const payload = {
      poll_id: pollId,
      user_id: user.id,
      option_index: optionIndex,
    }

    // Validate and filter payload
    const {
      payload: filteredPayload,
      removedColumns,
      warnings,
    } = await validateAndFilterPayload('group_poll_votes', payload)

    const { data: vote, error } = await supabaseAdmin
      .from('group_poll_votes')
      .insert([filteredPayload])
      .select()
      .single()

    if (error) {
      console.error('Error voting on poll:', error)
      return {
        success: false,
        error: error.message || 'Failed to vote on poll',
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    }

    // Fetch updated poll
    const { data: updatedPoll } = await supabaseAdmin
      .from('group_polls')
      .select('id, group_id, question, created_by, created_at, updated_at, is_active, options, expires_at, is_anonymous, allows_multiple_votes')
      .eq('id', pollId)
      .single()

    return {
      success: true,
      poll: updatedPoll || undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    console.error('Unexpected error voting on poll:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Get poll results with vote counts
 */
export async function getPollResults(pollId: string): Promise<{
  success: boolean
  results?: { optionIndex: number; option: string; voteCount: number; percentage: number }[]
  totalVotes?: number
  error?: string
}> {
  try {
    // Get poll
    const { data: poll, error: pollError } = await supabaseAdmin
      .from('group_polls')
      .select('id, question, options, created_at')
      .eq('id', pollId)
      .single()

    if (pollError || !poll) {
      return {
        success: false,
        error: 'Poll not found',
      }
    }

    // Get all votes for this poll
    const { data: votes, error: votesError } = await supabaseAdmin
      .from('group_poll_votes')
      .select('option_index')
      .eq('poll_id', pollId)

    if (votesError) {
      console.error('Error fetching poll votes:', votesError)
      return {
        success: false,
        error: 'Failed to fetch poll results',
      }
    }

    // Count votes per option
    const voteCounts: Record<number, number> = {}
    poll.options.forEach((_: string, index: number) => {
      voteCounts[index] = 0
    })

    votes?.forEach((vote) => {
      voteCounts[vote.option_index] = (voteCounts[vote.option_index] || 0) + 1
    })

    const totalVotes = votes?.length || 0

    // Calculate results with percentages
    const results = poll.options.map((option: string, index: number) => ({
      optionIndex: index,
      option,
      voteCount: voteCounts[index] || 0,
      percentage: totalVotes > 0 ? Math.round(((voteCounts[index] || 0) / totalVotes) * 100) : 0,
    }))

    return {
      success: true,
      results,
      totalVotes,
    }
  } catch (error) {
    console.error('Unexpected error getting poll results:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Delete a poll
 */
export async function deleteGroupPoll(pollId: string): Promise<PollActionResult> {
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

    // Verify poll exists and check permission (creator or admin)
    const { data: poll, error: pollError } = await supabaseAdmin
      .from('group_polls')
      .select('id, created_by, group_id')
      .eq('id', pollId)
      .single()

    if (pollError || !poll) {
      return {
        success: false,
        error: 'Poll not found',
      }
    }

    // Check permission (creator or group admin)
    if (poll.created_by !== user.id) {
      // Check if user is group admin (you may want to use checkGroupPermission here)
      // For now, only allow creator to delete
      return {
        success: false,
        error: 'You do not have permission to delete this poll',
      }
    }

    // Delete poll (votes will be cascade deleted if FK is set up)
    const { error } = await supabaseAdmin.from('group_polls').delete().eq('id', pollId)

    if (error) {
      console.error('Error deleting poll:', error)
      return {
        success: false,
        error: error.message || 'Failed to delete poll',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Unexpected error deleting poll:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}
