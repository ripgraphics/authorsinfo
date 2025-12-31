'use server'

import { createServerActionClientAsync } from '@/lib/supabase/client-helper'
import { validateAndFilterPayload } from '@/lib/schema/schema-validators'
import { supabaseAdmin } from '@/lib/supabase/server'

export interface CreateRoleParams {
  groupId: string
  name: string
  description?: string | null
  permissions: string[]
  isDefault?: boolean
  displayOrder?: number
}

export interface UpdateRoleParams {
  groupId: string
  roleId: number
  name?: string
  description?: string | null
  permissions?: string[]
  isDefault?: boolean
  displayOrder?: number
}

export interface DeleteRoleParams {
  groupId: string
  roleId: number
}

export interface RoleActionResult {
  success: boolean
  role?: any
  error?: string
  warnings?: string[]
}

/**
 * Create a new role for a group
 */
export async function createGroupRole(params: CreateRoleParams): Promise<RoleActionResult> {
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
    const hasPermission = await checkGroupPermission(params.groupId, user.id, 'manage_roles')
    if (!hasPermission) {
      return {
        success: false,
        error: 'You do not have permission to create roles',
      }
    }

    // Validate role name
    if (!params.name || params.name.trim().length === 0) {
      return {
        success: false,
        error: 'Role name is required',
      }
    }

    // Check if role name already exists
    const { data: existingRole } = await supabaseAdmin
      .from('group_roles')
      .select('id')
      .eq('group_id', params.groupId)
      .eq('name', params.name.trim())
      .single()

    if (existingRole) {
      return {
        success: false,
        error: 'A role with this name already exists',
      }
    }

    // If setting as default, unset other defaults
    if (params.isDefault) {
      await supabaseAdmin
        .from('group_roles')
        .update({ is_default: false })
        .eq('group_id', params.groupId)
        .eq('is_default', true)
    }

    // Prepare payload
    const payload = {
      group_id: params.groupId,
      name: params.name.trim(),
      description: params.description?.trim() || null,
      permissions: params.permissions || [],
      is_default: params.isDefault || false,
      is_system_role: false,
      display_order: params.displayOrder || 0,
    }

    // Validate and filter payload
    const {
      payload: filteredPayload,
      removedColumns,
      warnings,
    } = await validateAndFilterPayload('group_roles', payload)

    // Insert role
    const { data: role, error } = await (supabaseAdmin.from('group_roles') as any)
      .insert([filteredPayload])
      .select()
      .single()

    if (error) {
      console.error('Error creating role:', error)
      return {
        success: false,
        error: error.message || 'Failed to create role',
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    }

    return {
      success: true,
      role,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    console.error('Unexpected error creating role:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Update a group role
 */
export async function updateGroupRole(params: UpdateRoleParams): Promise<RoleActionResult> {
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
    const hasPermission = await checkGroupPermission(params.groupId, user.id, 'manage_roles')
    if (!hasPermission) {
      return {
        success: false,
        error: 'You do not have permission to update roles',
      }
    }

    // Check if role is a system role (cannot update name or delete)
    const { data: existingRole } = await supabaseAdmin
      .from('group_roles')
      .select('is_system_role, name')
      .eq('id', params.roleId)
      .eq('group_id', params.groupId)
      .single()

    if (!existingRole) {
      return {
        success: false,
        error: 'Role not found',
      }
    }

    // Build update payload
    const updatePayload: Record<string, any> = {}

    if (params.name !== undefined) {
      if (!params.name || params.name.trim().length === 0) {
        return {
          success: false,
          error: 'Role name cannot be empty',
        }
      }
      if (existingRole.is_system_role) {
        return {
          success: false,
          error: 'Cannot rename system roles',
        }
      }
      updatePayload.name = params.name.trim()
    }

    if (params.description !== undefined) {
      updatePayload.description = params.description?.trim() || null
    }

    if (params.permissions !== undefined) {
      updatePayload.permissions = params.permissions
    }

    if (params.isDefault !== undefined) {
      // If setting as default, unset other defaults
      if (params.isDefault) {
        await supabaseAdmin
          .from('group_roles')
          .update({ is_default: false })
          .eq('group_id', params.groupId)
          .neq('id', params.roleId)
          .eq('is_default', true)
      }
      updatePayload.is_default = params.isDefault
    }

    if (params.displayOrder !== undefined) {
      updatePayload.display_order = params.displayOrder
    }

    // Validate and filter payload
    const {
      payload: filteredPayload,
      removedColumns,
      warnings,
    } = await validateAndFilterPayload('group_roles', updatePayload)

    // Update role
    const { data: role, error } = await (supabaseAdmin.from('group_roles') as any)
      .update(filteredPayload)
      .eq('id', params.roleId)
      .eq('group_id', params.groupId)
      .select()
      .single()

    if (error) {
      console.error('Error updating role:', error)
      return {
        success: false,
        error: error.message || 'Failed to update role',
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    }

    return {
      success: true,
      role,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    console.error('Unexpected error updating role:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Delete a group role
 */
export async function deleteGroupRole(params: DeleteRoleParams): Promise<RoleActionResult> {
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
    const hasPermission = await checkGroupPermission(params.groupId, user.id, 'manage_roles')
    if (!hasPermission) {
      return {
        success: false,
        error: 'You do not have permission to delete roles',
      }
    }

    // Check if role is a system role
    const { data: existingRole } = await supabaseAdmin
      .from('group_roles')
      .select('is_system_role')
      .eq('id', params.roleId)
      .eq('group_id', params.groupId)
      .single()

    if (!existingRole) {
      return {
        success: false,
        error: 'Role not found',
      }
    }

    if (existingRole.is_system_role) {
      return {
        success: false,
        error: 'Cannot delete system roles',
      }
    }

    // Check if any members have this role
    const { data: members } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', params.groupId)
      .eq('role_id', params.roleId)
      .limit(1)

    if (members && members.length > 0) {
      return {
        success: false,
        error: 'Cannot delete role that is assigned to members. Please reassign members first.',
      }
    }

    // Delete role
    const { error } = await supabaseAdmin
      .from('group_roles')
      .delete()
      .eq('id', params.roleId)
      .eq('group_id', params.groupId)

    if (error) {
      console.error('Error deleting role:', error)
      return {
        success: false,
        error: error.message || 'Failed to delete role',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Unexpected error deleting role:', error)
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
