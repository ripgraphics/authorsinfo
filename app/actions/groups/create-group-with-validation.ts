'use server'

import { createServerActionClientAsync } from '@/lib/supabase/client-helper'
import { validateAndFilterPayload } from '@/lib/schema/schema-validators'
import { supabaseAdmin } from '@/lib/supabase/server'

export interface CreateGroupParams {
  name: string
  description?: string | null
  is_private?: boolean
  is_discoverable?: boolean
  join_method?: 'open' | 'approval' | 'invite_only'
  tags?: string[] | null
  category?: string | null
  location?: string | null
  cover_image_url?: string | null
  avatar_url?: string | null
  settings?: Record<string, any>
}

export interface CreateGroupResult {
  success: boolean
  group?: any
  error?: string
  warnings?: string[]
  removedColumns?: string[]
}

/**
 * Create a new group with schema validation
 * Automatically adds creator as owner member
 */
export async function createGroupWithValidation(
  params: CreateGroupParams
): Promise<CreateGroupResult> {
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
    if (!params.name || params.name.trim().length === 0) {
      return {
        success: false,
        error: 'Group name is required',
      }
    }

    if (params.name.length > 255) {
      return {
        success: false,
        error: 'Group name must be 255 characters or less',
      }
    }

    // Prepare payload with defaults
    const payload = {
      name: params.name.trim(),
      description: params.description?.trim() || null,
      is_private: params.is_private ?? false,
      is_discoverable: params.is_discoverable ?? true,
      join_method: params.join_method || 'open',
      tags: params.tags || null,
      category: params.category || null,
      location: params.location || null,
      cover_image_url: params.cover_image_url || null,
      avatar_url: params.avatar_url || null,
      created_by: user.id,
      member_count: 1, // Will be set by trigger, but set initial value
      status: 'active',
      settings: params.settings || {},
    }

    // Validate and filter payload against actual schema
    const {
      payload: filteredPayload,
      removedColumns,
      warnings,
    } = await validateAndFilterPayload('groups', payload)

    // Log warnings if any columns were removed
    if (removedColumns.length > 0) {
      console.warn(`Removed non-existent columns from groups insert:`, removedColumns)
    }

    // Insert the filtered payload
    const { data: group, error } = await (supabase.from('groups') as any)
      .insert([filteredPayload])
      .select()
      .single()

    if (error) {
      console.error('Error creating group:', error)
      return {
        success: false,
        error: error.message || 'Failed to create group',
        warnings: warnings.length > 0 ? warnings : undefined,
        removedColumns: removedColumns.length > 0 ? removedColumns : undefined,
      }
    }

    // Create default roles for the group
    await createDefaultGroupRoles(group.id)

    // Add creator as owner member
    const ownerRoleId = await getOwnerRoleId(group.id)
    if (ownerRoleId) {
      const { error: memberError } = await supabaseAdmin.from('group_members').insert({
        group_id: group.id,
        user_id: user.id,
        role_id: ownerRoleId,
        status: 'active',
        joined_at: new Date().toISOString(),
      })

      if (memberError) {
        console.error('Error adding creator as member:', memberError)
        // Don't fail the group creation, but log the error
      }
    }

    // Create default group settings
    await createDefaultGroupSettings(group.id)

    return {
      success: true,
      group,
      warnings: warnings.length > 0 ? warnings : undefined,
      removedColumns: removedColumns.length > 0 ? removedColumns : undefined,
    }
  } catch (error) {
    console.error('Unexpected error creating group:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Create default roles for a new group
 */
async function createDefaultGroupRoles(groupId: string): Promise<void> {
  try {
    const defaultRoles = [
      {
        name: 'Owner',
        description: 'Full control over the group',
        permissions: ['*'], // All permissions
        is_default: false,
        is_system_role: true,
        display_order: 0,
      },
      {
        name: 'Admin',
        description: 'Can manage group settings, members, and content',
        permissions: [
          'manage_group',
          'manage_members',
          'manage_content',
          'manage_roles',
          'invite_members',
          'remove_members',
          'create_events',
          'manage_events',
          'view_content',
          'create_content',
          'delete_content',
        ],
        is_default: false,
        is_system_role: true,
        display_order: 1,
      },
      {
        name: 'Moderator',
        description: 'Can moderate content and members',
        permissions: ['view_content', 'create_content', 'delete_content', 'manage_content'],
        is_default: false,
        is_system_role: true,
        display_order: 2,
      },
      {
        name: 'Member',
        description: 'Standard group member',
        permissions: ['view_content', 'create_content'],
        is_default: true,
        is_system_role: true,
        display_order: 3,
      },
    ]

    const { error } = await supabaseAdmin.from('group_roles').insert(
      defaultRoles.map((role) => ({
        ...role,
        group_id: groupId,
        permissions: role.permissions,
      }))
    )

    if (error) {
      console.error('Error creating default roles:', error)
    }
  } catch (error) {
    console.error('Unexpected error creating default roles:', error)
  }
}

/**
 * Get the owner role ID for a group
 */
async function getOwnerRoleId(groupId: string): Promise<number | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('group_roles')
      .select('id')
      .eq('group_id', groupId)
      .eq('name', 'Owner')
      .single()

    if (error || !data) {
      return null
    }

    return data.id
  } catch (error) {
    console.error('Error getting owner role ID:', error)
    return null
  }
}

/**
 * Create default group settings
 */
async function createDefaultGroupSettings(groupId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('group_settings').insert({
      group_id: groupId,
      settings: {},
      feature_flags: {
        posts: true,
        events: true,
        discussions: true,
        polls: true,
      },
      moderation_settings: {
        require_approval: false,
        auto_moderate: false,
      },
      notification_settings: {},
    })

    if (error) {
      console.error('Error creating default settings:', error)
    }
  } catch (error) {
    console.error('Unexpected error creating default settings:', error)
  }
}
