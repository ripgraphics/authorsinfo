/**
 * Tag Permissions Service
 * Handles tag admin/curator permissions
 */

import { createClient } from '@/lib/supabase/server'

export type TagPermissionLevel = 'viewer' | 'curator' | 'moderator' | 'admin'

export interface TagPermission {
  tagId: string
  userId: string
  permissionLevel: TagPermissionLevel
  canCurate: boolean
  canApprove: boolean
  canMerge: boolean
  canDelete: boolean
}

/**
 * Check if user has permission for a tag
 */
export async function checkTagPermission(
  userId: string,
  tagId: string,
  requiredLevel: TagPermissionLevel
): Promise<boolean> {
  const supabase = await createClient()

  // Check if user is tag creator
  const { data: tag } = await supabase
    .from('tags')
    .select('created_by')
    .eq('id', tagId)
    .single()

  if (tag?.created_by === userId) {
    return true // Creator has all permissions
  }

  // Check explicit permissions
  const { data: permission } = await supabase
    .from('tag_permissions')
    .select('permission_level')
    .eq('tag_id', tagId)
    .eq('user_id', userId)
    .single()

  if (!permission) {
    return false
  }

  // Check permission hierarchy
  const levels: Record<TagPermissionLevel, number> = {
    viewer: 1,
    curator: 2,
    moderator: 3,
    admin: 4,
  }

  return levels[permission.permission_level as TagPermissionLevel] >= levels[requiredLevel]
}

/**
 * Grant permission to a user for a tag
 */
export async function grantTagPermission(
  tagId: string,
  userId: string,
  permissionLevel: TagPermissionLevel,
  grantedBy: string
): Promise<boolean> {
  const supabase = await createClient()

  // Verify grantor has permission
  const canGrant = await checkTagPermission(grantedBy, tagId, 'admin')
  if (!canGrant) {
    return false
  }

  const permissions: Record<TagPermissionLevel, { canCurate: boolean; canApprove: boolean; canMerge: boolean; canDelete: boolean }> = {
    viewer: { canCurate: false, canApprove: false, canMerge: false, canDelete: false },
    curator: { canCurate: true, canApprove: false, canMerge: false, canDelete: false },
    moderator: { canCurate: true, canApprove: true, canMerge: false, canDelete: false },
    admin: { canCurate: true, canApprove: true, canMerge: true, canDelete: true },
  }

  const { error } = await supabase.from('tag_permissions').upsert({
    tag_id: tagId,
    user_id: userId,
    permission_level: permissionLevel,
    ...permissions[permissionLevel],
    updated_at: new Date().toISOString(),
  })

  return !error
}

/**
 * Get permissions for a tag
 */
export async function getTagPermissions(tagId: string): Promise<TagPermission[]> {
  const supabase = await createClient()

  const { data: permissions, error } = await supabase
    .from('tag_permissions')
    .select('*')
    .eq('tag_id', tagId)

  if (error) {
    console.error('Error fetching permissions:', error)
    return []
  }

  return (permissions || []).map((p: any) => ({
    tagId: p.tag_id,
    userId: p.user_id,
    permissionLevel: p.permission_level,
    canCurate: p.can_curate,
    canApprove: p.can_approve,
    canMerge: p.can_merge,
    canDelete: p.can_delete,
  }))
}
