'use server'

import { createServerActionClientAsync } from '@/lib/supabase/client-helper'
import { validateAndFilterPayload } from '@/lib/schema/schema-validators'
import { supabaseAdmin } from '@/lib/supabase/server'

export interface CreateInvitationParams {
  groupId: string
  inviteeEmail?: string
  inviteeUserId?: string
  roleId?: number | null
  message?: string | null
  expiresAt?: string | null
}

export interface AcceptInvitationParams {
  invitationId: string
}

export interface DeclineInvitationParams {
  invitationId: string
}

export interface CancelInvitationParams {
  invitationId: string
}

export interface InvitationActionResult {
  success: boolean
  invitation?: any
  member?: any
  error?: string
  warnings?: string[]
}

/**
 * Create a group invitation
 */
export async function createGroupInvitation(
  params: CreateInvitationParams
): Promise<InvitationActionResult> {
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

    // Check permission
    const hasPermission = await checkGroupPermission(params.groupId, user.id, 'invite_members')
    if (!hasPermission) {
      return {
        success: false,
        error: 'You do not have permission to invite members',
      }
    }

    // Validate that either email or userId is provided
    if (!params.inviteeEmail && !params.inviteeUserId) {
      return {
        success: false,
        error: 'Either invitee email or user ID is required',
      }
    }

    // If userId is provided, check if user is already a member
    if (params.inviteeUserId) {
      const { data: existingMember } = await supabaseAdmin
        .from('group_members')
        .select('id')
        .eq('group_id', params.groupId)
        .eq('user_id', params.inviteeUserId)
        .single()

      if (existingMember) {
        return {
          success: false,
          error: 'User is already a member of this group',
        }
      }
    }

    // Check for existing pending invitation
    const existingInvitationQuery = supabaseAdmin
      .from('group_invitations')
      .select('id')
      .eq('group_id', params.groupId)
      .eq('status', 'pending')

    if (params.inviteeEmail) {
      existingInvitationQuery.eq('invitee_email', params.inviteeEmail)
    } else {
      existingInvitationQuery.eq('invitee_user_id', params.inviteeUserId)
    }

    const { data: existingInvitation } = await existingInvitationQuery.single()

    if (existingInvitation) {
      return {
        success: false,
        error: 'A pending invitation already exists for this user',
      }
    }

    // Prepare payload
    const payload = {
      group_id: params.groupId,
      inviter_id: user.id,
      invitee_email: params.inviteeEmail || null,
      invitee_user_id: params.inviteeUserId || null,
      role_id: params.roleId || null,
      message: params.message || null,
      expires_at: params.expiresAt || null,
      status: 'pending',
    }

    // Validate and filter payload
    const {
      payload: filteredPayload,
      removedColumns,
      warnings,
    } = await validateAndFilterPayload('group_invitations', payload)

    // Insert invitation
    const { data: invitation, error } = await (supabaseAdmin.from('group_invitations') as any)
      .insert([filteredPayload])
      .select()
      .single()

    if (error) {
      console.error('Error creating invitation:', error)
      return {
        success: false,
        error: error.message || 'Failed to create invitation',
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    }

    return {
      success: true,
      invitation,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    console.error('Unexpected error creating invitation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Accept a group invitation
 */
export async function acceptGroupInvitation(
  params: AcceptInvitationParams
): Promise<InvitationActionResult> {
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

    // Get invitation
    const { data: invitation, error: fetchError } = await supabaseAdmin
      .from('group_invitations')
      .select('*')
      .eq('id', params.invitationId)
      .single()

    if (fetchError || !invitation) {
      return {
        success: false,
        error: 'Invitation not found',
      }
    }

    // Verify invitation belongs to current user
    const userEmail = user.email
    const isForUser =
      invitation.invitee_user_id === user.id ||
      (invitation.invitee_email && userEmail === invitation.invitee_email)

    if (!isForUser) {
      return {
        success: false,
        error: 'This invitation is not for you',
      }
    }

    // Check if invitation is still valid
    if (invitation.status !== 'pending') {
      return {
        success: false,
        error: `Invitation is ${invitation.status}`,
      }
    }

    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      // Update invitation status to expired
      await supabaseAdmin
        .from('group_invitations')
        .update({ status: 'expired' })
        .eq('id', params.invitationId)

      return {
        success: false,
        error: 'Invitation has expired',
      }
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', invitation.group_id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      // Update invitation status
      await supabaseAdmin
        .from('group_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', params.invitationId)

      return {
        success: false,
        error: 'You are already a member of this group',
      }
    }

    // Get role ID (use invitation role or default role)
    let roleId = invitation.role_id
    if (!roleId) {
      const { data: defaultRole } = await supabaseAdmin
        .from('group_roles')
        .select('id')
        .eq('group_id', invitation.group_id)
        .eq('is_default', true)
        .single()

      roleId = defaultRole?.id || null
    }

    // Add user as member
    const { data: member, error: memberError } = await supabaseAdmin
      .from('group_members')
      .insert({
        group_id: invitation.group_id,
        user_id: user.id,
        role_id: roleId,
        status: 'active',
        joined_at: new Date().toISOString(),
        invited_by: invitation.inviter_id,
      })
      .select(
        `
        *,
        user:users(id, name, email),
        role:group_roles(id, name, description, permissions)
      `
      )
      .single()

    if (memberError) {
      console.error('Error adding member:', memberError)
      return {
        success: false,
        error: 'Failed to join group',
      }
    }

    // Update invitation status
    await supabaseAdmin
      .from('group_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', params.invitationId)

    return {
      success: true,
      invitation: {
        ...invitation,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      },
      member,
    }
  } catch (error) {
    console.error('Unexpected error accepting invitation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Decline a group invitation
 */
export async function declineGroupInvitation(
  params: DeclineInvitationParams
): Promise<InvitationActionResult> {
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

    // Get invitation
    const { data: invitation, error: fetchError } = await supabaseAdmin
      .from('group_invitations')
      .select('*')
      .eq('id', params.invitationId)
      .single()

    if (fetchError || !invitation) {
      return {
        success: false,
        error: 'Invitation not found',
      }
    }

    // Verify invitation belongs to current user or user is admin
    const userEmail = user.email
    const isForUser =
      invitation.invitee_user_id === user.id ||
      (invitation.invitee_email && userEmail === invitation.invitee_email)
    const isAdmin = await checkGroupPermission(invitation.group_id, user.id, 'manage_members')

    if (!isForUser && !isAdmin) {
      return {
        success: false,
        error: 'You do not have permission to decline this invitation',
      }
    }

    // Update invitation status
    const { data: updatedInvitation, error } = await supabaseAdmin
      .from('group_invitations')
      .update({ status: 'declined' })
      .eq('id', params.invitationId)
      .select()
      .single()

    if (error) {
      console.error('Error declining invitation:', error)
      return {
        success: false,
        error: 'Failed to decline invitation',
      }
    }

    return {
      success: true,
      invitation: updatedInvitation,
    }
  } catch (error) {
    console.error('Unexpected error declining invitation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Cancel a group invitation
 */
export async function cancelGroupInvitation(
  params: CancelInvitationParams
): Promise<InvitationActionResult> {
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

    // Get invitation
    const { data: invitation, error: fetchError } = await supabaseAdmin
      .from('group_invitations')
      .select('*')
      .eq('id', params.invitationId)
      .single()

    if (fetchError || !invitation) {
      return {
        success: false,
        error: 'Invitation not found',
      }
    }

    // Check permission (must be inviter or admin)
    const isInviter = invitation.inviter_id === user.id
    const isAdmin = await checkGroupPermission(invitation.group_id, user.id, 'manage_members')

    if (!isInviter && !isAdmin) {
      return {
        success: false,
        error: 'You do not have permission to cancel this invitation',
      }
    }

    // Update invitation status
    const { data: updatedInvitation, error } = await supabaseAdmin
      .from('group_invitations')
      .update({ status: 'cancelled' })
      .eq('id', params.invitationId)
      .select()
      .single()

    if (error) {
      console.error('Error cancelling invitation:', error)
      return {
        success: false,
        error: 'Failed to cancel invitation',
      }
    }

    return {
      success: true,
      invitation: updatedInvitation,
    }
  } catch (error) {
    console.error('Unexpected error cancelling invitation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Check if user has permission in a group
 */
async function checkGroupPermission(
  groupId: string,
  userId: string,
  permission: string
): Promise<boolean> {
  try {
    const { data: group } = await supabaseAdmin
      .from('groups')
      .select('created_by')
      .eq('id', groupId)
      .single()

    if (group?.created_by === userId) {
      return true
    }

    const { data: member } = await supabaseAdmin
      .from('group_members')
      .select(
        `
        role_id,
        group_roles!inner(permissions)
      `
      )
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (!member || !member.group_roles) {
      return false
    }

    const role = Array.isArray(member.group_roles) ? member.group_roles[0] : member.group_roles
    const permissions = role.permissions as string[]

    return permissions.includes('*') || permissions.includes(permission)
  } catch (error) {
    console.error('Error checking group permission:', error)
    return false
  }
}
