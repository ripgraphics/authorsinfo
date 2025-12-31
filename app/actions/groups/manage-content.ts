'use server'

import { createServerActionClientAsync } from '@/lib/supabase/client-helper'
import { validateAndFilterPayload } from '@/lib/schema/schema-validators'
import { supabaseAdmin } from '@/lib/supabase/server'
import { notifyGroupAnnouncement } from '@/lib/groups/notifications'

export interface CreateContentParams {
  groupId: string
  contentType: 'post' | 'announcement' | 'discussion' | 'poll'
  title?: string | null
  content: string
  contentHtml?: string | null
  isPinned?: boolean
  visibility?: 'group' | 'members_only' | 'public'
  metadata?: Record<string, any>
}

export interface UpdateContentParams {
  contentId: string
  groupId: string
  title?: string | null
  content?: string
  contentHtml?: string | null
  isPinned?: boolean
  isLocked?: boolean
  visibility?: 'group' | 'members_only' | 'public'
  metadata?: Record<string, any>
}

export interface DeleteContentParams {
  contentId: string
  groupId: string
}

export interface ContentActionResult {
  success: boolean
  content?: any
  error?: string
  warnings?: string[]
}

/**
 * Create group content (post, announcement, discussion, poll)
 */
export async function createGroupContent(
  params: CreateContentParams
): Promise<ContentActionResult> {
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

    // Verify user is a member
    const { data: member } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', params.groupId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!member) {
      return {
        success: false,
        error: 'You must be a member of this group to create content',
      }
    }

    // Check permission for announcements and pinned content
    if (params.contentType === 'announcement' || params.isPinned) {
      const hasPermission = await checkGroupPermission(params.groupId, user.id, 'manage_content')
      if (!hasPermission) {
        return {
          success: false,
          error: 'You do not have permission to create announcements or pin content',
        }
      }
    }

    // Prepare payload
    const payload = {
      group_id: params.groupId,
      user_id: user.id,
      content_type: params.contentType,
      title: params.title?.trim() || null,
      content: params.content.trim(),
      content_html: params.contentHtml || null,
      is_pinned: params.isPinned || false,
      visibility: params.visibility || 'group',
      metadata: params.metadata || {},
      moderation_status: 'approved', // Can be changed to 'pending' if moderation is required
      published_at: new Date().toISOString(),
    }

    // Validate and filter payload
    const {
      payload: filteredPayload,
      removedColumns,
      warnings,
    } = await validateAndFilterPayload('group_content', payload)

    // Insert content
    const { data: content, error } = await (supabaseAdmin.from('group_content') as any)
      .insert([filteredPayload])
      .select(
        `
        *,
        user:users(id, name, email),
        group:groups(id, name)
      `
      )
      .single()

    if (error) {
      console.error('Error creating content:', error)
      return {
        success: false,
        error: error.message || 'Failed to create content',
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    }

    // Send notifications for announcements
    if (params.contentType === 'announcement' && content) {
      await notifyGroupAnnouncement(params.groupId, content.id, content.title || 'New Announcement')
    }

    return {
      success: true,
      content,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    console.error('Unexpected error creating content:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Update group content
 */
export async function updateGroupContent(
  params: UpdateContentParams
): Promise<ContentActionResult> {
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

    // Get existing content
    const { data: existingContent } = await supabaseAdmin
      .from('group_content')
      .select('user_id, group_id')
      .eq('id', params.contentId)
      .eq('group_id', params.groupId)
      .single()

    if (!existingContent) {
      return {
        success: false,
        error: 'Content not found',
      }
    }

    // Check permission (author or admin)
    const isAuthor = existingContent.user_id === user.id
    const hasPermission =
      isAuthor || (await checkGroupPermission(params.groupId, user.id, 'manage_content'))

    if (!hasPermission) {
      return {
        success: false,
        error: 'You do not have permission to update this content',
      }
    }

    // Build update payload
    const updatePayload: Record<string, any> = {}

    if (params.title !== undefined) {
      updatePayload.title = params.title?.trim() || null
    }

    if (params.content !== undefined) {
      updatePayload.content = params.content.trim()
    }

    if (params.contentHtml !== undefined) {
      updatePayload.content_html = params.contentHtml
    }

    if (params.isPinned !== undefined) {
      // Only admins can pin/unpin
      if (params.isPinned && !isAuthor) {
        const canPin = await checkGroupPermission(params.groupId, user.id, 'manage_content')
        if (!canPin) {
          return {
            success: false,
            error: 'You do not have permission to pin content',
          }
        }
      }
      updatePayload.is_pinned = params.isPinned
    }

    if (params.isLocked !== undefined) {
      // Only admins can lock/unlock
      if (!isAuthor) {
        const canLock = await checkGroupPermission(params.groupId, user.id, 'manage_content')
        if (!canLock) {
          return {
            success: false,
            error: 'You do not have permission to lock content',
          }
        }
      }
      updatePayload.is_locked = params.isLocked
    }

    if (params.visibility !== undefined) {
      updatePayload.visibility = params.visibility
    }

    if (params.metadata !== undefined) {
      updatePayload.metadata = params.metadata
    }

    // Validate and filter payload
    const {
      payload: filteredPayload,
      removedColumns,
      warnings,
    } = await validateAndFilterPayload('group_content', updatePayload)

    // Update content
    const { data: content, error } = await (supabaseAdmin.from('group_content') as any)
      .update(filteredPayload)
      .eq('id', params.contentId)
      .eq('group_id', params.groupId)
      .select(
        `
        *,
        user:users(id, name, email),
        group:groups(id, name)
      `
      )
      .single()

    if (error) {
      console.error('Error updating content:', error)
      return {
        success: false,
        error: error.message || 'Failed to update content',
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    }

    return {
      success: true,
      content,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  } catch (error) {
    console.error('Unexpected error updating content:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Delete group content
 */
export async function deleteGroupContent(
  params: DeleteContentParams
): Promise<ContentActionResult> {
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

    // Get existing content
    const { data: existingContent } = await supabaseAdmin
      .from('group_content')
      .select('user_id, group_id')
      .eq('id', params.contentId)
      .eq('group_id', params.groupId)
      .single()

    if (!existingContent) {
      return {
        success: false,
        error: 'Content not found',
      }
    }

    // Check permission (author or admin)
    const isAuthor = existingContent.user_id === user.id
    const hasPermission =
      isAuthor || (await checkGroupPermission(params.groupId, user.id, 'delete_content'))

    if (!hasPermission) {
      return {
        success: false,
        error: 'You do not have permission to delete this content',
      }
    }

    // Delete content
    const { error } = await supabaseAdmin
      .from('group_content')
      .delete()
      .eq('id', params.contentId)
      .eq('group_id', params.groupId)

    if (error) {
      console.error('Error deleting content:', error)
      return {
        success: false,
        error: error.message || 'Failed to delete content',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Unexpected error deleting content:', error)
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
