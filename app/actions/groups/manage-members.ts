'use server'

import { createServerActionClientAsync } from '@/lib/supabase/client-helper'
import { validateAndFilterPayload } from '@/lib/schema/schema-validators'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * Ensure a default Member role exists for a group
 * Returns the role ID, or null if creation failed
 */
async function ensureDefaultMemberRole(groupId: string): Promise<number | null> {
  try {
    // OPTIMIZED: Single query instead of 2
    // Order by is_default DESC to get default role first, then fallback to any role
    const { data: existingRole, error: fetchError } = await supabaseAdmin
      .from('group_roles')
      .select('id')
      .eq('group_id', groupId)
      .order('is_default', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchError) {
      console.error('Error checking for existing roles:', fetchError)
      return null
    }

    if (existingRole) {
      return existingRole.id
    }

    // Create default Member role
    const { data: newRole, error: createError } = await supabaseAdmin
      .from('group_roles')
      .insert({
        group_id: groupId,
        name: 'Member',
        description: 'Standard group member',
        permissions: ['view_content', 'create_content'],
        is_default: true,
        is_system_role: true,
        display_order: 3,
      })
      .select('id')
      .single()

    if (createError) {
      console.error('Error creating default Member role:', createError)
      return null
    }

    return newRole?.id || null
  } catch (error) {
    console.error('Exception ensuring default Member role:', error)
    return null
  }
}

export interface AddMemberParams {
  groupId: string
  userId: string
  roleId?: number | null
  status?: 'active' | 'pending' | 'invited'
}

export interface UpdateMemberParams {
  groupId: string
  userId: string
  roleId?: number | null
  status?: 'active' | 'inactive' | 'banned'
  notificationPreferences?: Record<string, any>
}

export interface RemoveMemberParams {
  groupId: string
  userId: string
}

export interface MemberActionResult {
  success: boolean
  member?: any
  error?: string
  warnings?: string[]
}

/**
 * Add a member to a group with validation
 */
export async function addGroupMember(params: AddMemberParams): Promise<MemberActionResult> {
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
    const hasPermission = await checkGroupPermission(params.groupId, user.id, 'manage_members')
    if (!hasPermission) {
      return {
        success: false,
        error: 'You do not have permission to add members',
      }
    }

    // Verify group exists
    const { data: group } = await supabase
      .from('groups')
      .select('id, join_method')
      .eq('id', params.groupId)
      .single()

    if (!group) {
      return {
        success: false,
        error: 'Group not found',
      }
    }

    // Check if member already exists
    const { data: existingMember } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', params.groupId)
      .eq('user_id', params.userId)
      .single()

    if (existingMember) {
      return {
        success: false,
        error: 'User is already a member of this group',
      }
    }

    // Get default role if roleId not provided
    let roleId = params.roleId
    if (!roleId) {
      const { data: defaultRole } = await supabaseAdmin
        .from('group_roles')
        .select('id')
        .eq('group_id', params.groupId)
        .eq('is_default', true)
        .single()

      roleId = defaultRole?.id || null
    }

    // Prepare payload
    const payload = {
      group_id: params.groupId,
      user_id: params.userId,
      role_id: roleId,
      status: params.status || 'active',
      joined_at: new Date().toISOString(),
      invited_by: user.id,
    }

    // Validate and filter payload
    const {
      payload: filteredPayload,
      removedColumns,
      warnings,
    } = await validateAndFilterPayload('group_members', payload)

    // Insert member
    const { data: member, error } = await (supabaseAdmin.from('group_members') as any)
      .insert([filteredPayload])
      .select(
        `
        *,
        user:users(id, name, email),
        role:group_roles(id, name, description, permissions)
      `
      )
      .single()

    if (error) {
      console.error('Error adding member:', error)
      return {
        success: false,
        error: error.message || 'Failed to add member',
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    }

    return {
      success: true,
      member,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    console.error('Unexpected error adding member:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Update a group member with validation
 */
export async function updateGroupMember(params: UpdateMemberParams): Promise<MemberActionResult> {
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

    // Check permission (admin or user updating themselves)
    const isSelfUpdate = user.id === params.userId
    if (!isSelfUpdate) {
      const hasPermission = await checkGroupPermission(params.groupId, user.id, 'manage_members')
      if (!hasPermission) {
        return {
          success: false,
          error: 'You do not have permission to update this member',
        }
      }
    }

    // Build update payload
    const updatePayload: Record<string, any> = {}

    if (params.roleId !== undefined) {
      if (!isSelfUpdate) {
        updatePayload.role_id = params.roleId
      } else {
        return {
          success: false,
          error: 'You cannot change your own role',
        }
      }
    }

    if (params.status !== undefined) {
      if (!isSelfUpdate && params.status === 'banned') {
        // Only admins can ban
        updatePayload.status = params.status
      } else if (params.status !== 'banned') {
        updatePayload.status = params.status
      } else {
        return {
          success: false,
          error: 'You cannot ban yourself',
        }
      }
    }

    if (params.notificationPreferences !== undefined) {
      updatePayload.notification_preferences = params.notificationPreferences
    }

    // Validate and filter payload
    const {
      payload: filteredPayload,
      removedColumns,
      warnings,
    } = await validateAndFilterPayload('group_members', updatePayload)

    // Update member
    const { data: member, error } = await (supabaseAdmin.from('group_members') as any)
      .update(filteredPayload)
      .eq('group_id', params.groupId)
      .eq('user_id', params.userId)
      .select(
        `
        *,
        user:users(id, name, email),
        role:group_roles(id, name, description, permissions)
      `
      )
      .single()

    if (error) {
      console.error('Error updating member:', error)
      return {
        success: false,
        error: error.message || 'Failed to update member',
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    }

    return {
      success: true,
      member,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    console.error('Unexpected error updating member:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Remove a member from a group
 */
export async function removeGroupMember(params: RemoveMemberParams): Promise<MemberActionResult> {
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

    // Check permission (admin or user leaving themselves)
    const isSelfRemove = user.id === params.userId
    if (!isSelfRemove) {
      const hasPermission = await checkGroupPermission(params.groupId, user.id, 'remove_members')
      if (!hasPermission) {
        return {
          success: false,
          error: 'You do not have permission to remove this member',
        }
      }
    }

    // Prevent owner from being removed
    if (!isSelfRemove) {
      const { data: group } = await supabaseAdmin
        .from('groups')
        .select('created_by')
        .eq('id', params.groupId)
        .single()

      if (group?.created_by === params.userId) {
        return {
          success: false,
          error: 'Cannot remove the group owner',
        }
      }
    }

    // Delete member
    const { error } = await supabaseAdmin
      .from('group_members')
      .delete()
      .eq('group_id', params.groupId)
      .eq('user_id', params.userId)

    if (error) {
      console.error('Error removing member:', error)
      return {
        success: false,
        error: error.message || 'Failed to remove member',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Unexpected error removing member:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Join a group (self-join for public groups)
 */
export async function joinGroup(groupId: string): Promise<MemberActionResult> {
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

    // Verify group exists and get join method
    // Note: join_method column may not exist in all schemas, so we'll handle gracefully
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('id, is_private')
      .eq('id', groupId)
      .maybeSingle()

    if (groupError) {
      console.error('Error fetching group:', JSON.stringify(groupError, null, 2))
      console.error('Group ID:', groupId)
      return {
        success: false,
        error: groupError.message || 'Failed to fetch group information',
      }
    }

    if (!group) {
      return {
        success: false,
        error: 'Group not found',
      }
    }

    // Check if group allows joining
    if (group.is_private) {
      return {
        success: false,
        error: 'Cannot join private groups. You need an invitation.',
      }
    }

    // Default to 'open' join method (join_method column may not exist in all schemas)
    const joinMethod = 'open' as string
    if (joinMethod === 'invite_only') {
      return {
        success: false,
        error: 'This group is invite-only. You need an invitation to join.',
      }
    }

    // Check if member already exists
    const { data: existingMember } = await supabaseAdmin
      .from('group_members')
      .select('id, status')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      if (existingMember.status === 'active') {
        return {
          success: false,
          error: 'You are already a member of this group',
        }
      } else if (existingMember.status === 'pending') {
        return {
          success: false,
          error: 'You have a pending membership request for this group',
        }
      }
    }

    // Ensure a default Member role exists for the group
    const roleId = await ensureDefaultMemberRole(groupId)

    // Determine status based on join method
    const status = joinMethod === 'approval' ? 'pending' : 'active'

    // Prepare payload
    const payload = {
      group_id: groupId,
      user_id: user.id,
      role_id: roleId,
      status: status,
      joined_at: new Date().toISOString(),
      invited_by: null, // Self-join, no inviter
    }

    // Validate and filter payload
    const {
      payload: filteredPayload,
      removedColumns,
      warnings,
    } = await validateAndFilterPayload('group_members', payload)

    // Log for debugging
    if (removedColumns.length > 0 || !filteredPayload.group_id) {
      console.error('Payload validation issues:', {
        removedColumns,
        hasGroupId: !!filteredPayload.group_id,
        filteredPayload: Object.keys(filteredPayload),
        originalPayload: Object.keys(payload),
      })
    }

    // Ensure required fields are present
    if (!filteredPayload.group_id) {
      filteredPayload.group_id = groupId
    }
    if (!filteredPayload.user_id) {
      filteredPayload.user_id = user.id
    }

    // Insert member (select only basic fields - relationships may not be configured)
    const { data: member, error } = await (supabaseAdmin.from('group_members') as any)
      .insert([filteredPayload])
      .select('id, user_id, group_id, role, joined_at, is_moderator, last_activity')
      .single()

    if (error) {
      console.error('Error joining group:', error)
      return {
        success: false,
        error: error.message || 'Failed to join group',
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    }

    return {
      success: true,
      member,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    console.error('Unexpected error joining group:', error)
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
    // Check if user is owner
    const { data: group } = await supabaseAdmin
      .from('groups')
      .select('created_by')
      .eq('id', groupId)
      .single()

    if (group?.created_by === userId) {
      return true
    }

    // Check role permissions
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
