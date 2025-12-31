'use server'

import { createServerActionClientAsync } from '@/lib/supabase/client-helper'
import { validateAndFilterPayload } from '@/lib/schema/schema-validators'
import { supabaseAdmin } from '@/lib/supabase/server'

export interface UpdateGroupParams {
  groupId: string
  name?: string
  description?: string | null
  is_private?: boolean
  is_discoverable?: boolean
  join_method?: 'open' | 'approval' | 'invite_only'
  tags?: string[] | null
  category?: string | null
  location?: string | null
  cover_image_url?: string | null
  avatar_url?: string | null
  status?: 'active' | 'archived' | 'suspended'
  settings?: Record<string, any>
}

export interface UpdateGroupResult {
  success: boolean
  group?: any
  error?: string
  warnings?: string[]
  removedColumns?: string[]
}

/**
 * Update a group with schema validation and permission checks
 */
export async function updateGroupWithValidation(
  params: UpdateGroupParams
): Promise<UpdateGroupResult> {
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

    // Verify group exists
    const { data: existingGroup, error: fetchError } = await supabase
      .from('groups')
      .select('id, created_by')
      .eq('id', params.groupId)
      .single()

    if (fetchError || !existingGroup) {
      return {
        success: false,
        error: 'Group not found',
      }
    }

    // Check permission (owner or admin)
    const hasPermission = await checkGroupPermission(params.groupId, user.id, 'manage_group')
    if (!hasPermission) {
      return {
        success: false,
        error: 'You do not have permission to update this group',
      }
    }

    // Build update payload from provided params
    const updatePayload: Record<string, any> = {}

    if (params.name !== undefined) {
      if (params.name.trim().length === 0) {
        return {
          success: false,
          error: 'Group name cannot be empty',
        }
      }
      if (params.name.length > 255) {
        return {
          success: false,
          error: 'Group name must be 255 characters or less',
        }
      }
      updatePayload.name = params.name.trim()
    }

    if (params.description !== undefined) {
      updatePayload.description = params.description?.trim() || null
    }

    if (params.is_private !== undefined) {
      updatePayload.is_private = params.is_private
    }

    if (params.is_discoverable !== undefined) {
      updatePayload.is_discoverable = params.is_discoverable
    }

    if (params.join_method !== undefined) {
      updatePayload.join_method = params.join_method
    }

    if (params.tags !== undefined) {
      updatePayload.tags = params.tags
    }

    if (params.category !== undefined) {
      updatePayload.category = params.category
    }

    if (params.location !== undefined) {
      updatePayload.location = params.location
    }

    if (params.cover_image_url !== undefined) {
      updatePayload.cover_image_url = params.cover_image_url
    }

    if (params.avatar_url !== undefined) {
      updatePayload.avatar_url = params.avatar_url
    }

    if (params.status !== undefined) {
      updatePayload.status = params.status
    }

    if (params.settings !== undefined) {
      updatePayload.settings = params.settings
    }

    // Validate and filter payload against actual schema
    const {
      payload: filteredPayload,
      removedColumns,
      warnings,
    } = await validateAndFilterPayload('groups', updatePayload)

    // Log warnings if any columns were removed
    if (removedColumns.length > 0) {
      console.warn(`Removed non-existent columns from groups update:`, removedColumns)
    }

    // Update the group
    const { data: group, error } = await (supabase.from('groups') as any)
      .update(filteredPayload)
      .eq('id', params.groupId)
      .select()
      .single()

    if (error) {
      console.error('Error updating group:', error)
      return {
        success: false,
        error: error.message || 'Failed to update group',
        warnings: warnings.length > 0 ? warnings : undefined,
        removedColumns: removedColumns.length > 0 ? removedColumns : undefined,
      }
    }

    return {
      success: true,
      group,
      warnings: warnings.length > 0 ? warnings : undefined,
      removedColumns: removedColumns.length > 0 ? removedColumns : undefined,
    }
  } catch (error) {
    console.error('Unexpected error updating group:', error)
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
      return true // Owners have all permissions
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

    // Check for wildcard permission or specific permission
    return permissions.includes('*') || permissions.includes(permission)
  } catch (error) {
    console.error('Error checking group permission:', error)
    return false
  }
}
