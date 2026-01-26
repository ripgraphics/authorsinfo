/**
 * Tag Approval Service
 * Handles approval workflow for mentions requiring approval
 */

import { createClient } from '@/lib/supabase/server'

export interface PendingTagging {
  id: string
  tagId: string
  tagName: string
  entityType: string
  entityId: string
  context: string
  taggedBy: string
  taggedByName: string
  createdAt: string
  metadata?: Record<string, any>
}

/**
 * Create a pending tagging (requires approval)
 */
export async function createPendingTagging(
  tagId: string,
  entityType: string,
  entityId: string,
  context: string,
  taggedBy: string,
  position?: { start: number; end: number }
): Promise<string | null> {
  const supabase = await createClient()

  // Create tagging with pending status in metadata
  const { data: tagging, error } = await supabase
    .from('taggings')
    .insert({
      tag_id: tagId,
      entity_type: entityType,
      entity_id: entityId,
      tagged_by: taggedBy,
      context,
      position_start: position?.start || null,
      position_end: position?.end || null,
      metadata: {
        approval_status: 'pending',
        created_at: new Date().toISOString(),
      },
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating pending tagging:', error)
    return null
  }

  // Log in audit
  await supabase.from('tag_audit_log').insert({
    tagging_id: tagging.id,
    action: 'create',
    actor_id: taggedBy,
    entity_type: entityType,
    entity_id: entityId,
    new_value: {
      approval_status: 'pending',
    },
    reason: 'Requires approval',
  })

  return tagging.id
}

/**
 * Get pending taggings for an entity
 */
export async function getPendingTaggings(
  entityType: string,
  entityId: string
): Promise<PendingTagging[]> {
  const supabase = await createClient()

  const { data: taggings, error } = await supabase
    .from('taggings')
    .select(
      `
      id,
      tag_id,
      entity_type,
      entity_id,
      context,
      tagged_by,
      created_at,
      metadata,
      tags (
        id,
        name
      )
    `
    )
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('metadata->>approval_status', 'pending')

  if (error) {
    console.error('Error fetching pending taggings:', error)
    return []
  }

  const pending: PendingTagging[] = []

  for (const tagging of taggings || []) {
    const tag = (tagging as any).tags

    // Get tagged by user name
    const { data: user } = await supabase
      .from('users')
      .select('name')
      .eq('id', tagging.tagged_by)
      .single()

    pending.push({
      id: tagging.id,
      tagId: tagging.tag_id,
      tagName: tag?.name || 'Unknown',
      entityType: tagging.entity_type,
      entityId: tagging.entity_id,
      context: tagging.context,
      taggedBy: tagging.tagged_by,
      taggedByName: user?.name || 'Unknown',
      createdAt: tagging.created_at,
      metadata: tagging.metadata as Record<string, any>,
    })
  }

  return pending
}

/**
 * Approve a pending tagging
 */
export async function approveTagging(
  taggingId: string,
  approvedBy: string
): Promise<boolean> {
  const supabase = await createClient()

  // Update tagging metadata
  const { error: updateError } = await supabase
    .from('taggings')
    .update({
      metadata: {
        approval_status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      },
    })
    .eq('id', taggingId)

  if (updateError) {
    console.error('Error approving tagging:', updateError)
    return false
  }

  // Log in audit
  await supabase.from('tag_audit_log').insert({
    tagging_id: taggingId,
    action: 'approve',
    actor_id: approvedBy,
    new_value: {
      approval_status: 'approved',
    },
  })

  return true
}

/**
 * Reject a pending tagging
 */
export async function rejectTagging(
  taggingId: string,
  rejectedBy: string,
  reason?: string
): Promise<boolean> {
  const supabase = await createClient()

  // Delete the tagging
  const { error: deleteError } = await supabase.from('taggings').delete().eq('id', taggingId)

  if (deleteError) {
    console.error('Error rejecting tagging:', deleteError)
    return false
  }

  // Log in audit
  await supabase.from('tag_audit_log').insert({
    tagging_id: taggingId,
    action: 'reject',
    actor_id: rejectedBy,
    old_value: {
      approval_status: 'pending',
    },
    reason: reason || 'Rejected by entity owner',
  })

  return true
}
