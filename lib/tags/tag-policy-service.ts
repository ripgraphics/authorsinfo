/**
 * Tag Policy Service
 * Handles tag policy enforcement and opt-out controls
 */

import { createClient } from '@/lib/supabase/server'

export interface TagPolicyCheck {
  allowed: boolean
  requiresApproval: boolean
  reason?: string
}

/**
 * Check if tagging is allowed for an entity
 */
export async function checkTagPolicy(
  entityType: string,
  entityId: string,
  tagType: 'user' | 'entity' | 'topic' | 'collaborator' | 'location' | 'taxonomy',
  tagId?: string
): Promise<TagPolicyCheck> {
  const supabase = await createClient()

  // Get policy for this entity
  const { data: policy } = await supabase
    .from('tag_policies')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .single()

  // If no specific policy, check for global defaults
  if (!policy) {
    // Default: allow all
    return { allowed: true, requiresApproval: false }
  }

  // Check if tag type is allowed
  if (policy.allowed_tag_types && !policy.allowed_tag_types.includes(tagType)) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: `Tag type ${tagType} is not allowed for this entity`,
    }
  }

  // Check type-specific restrictions
  if (tagType === 'user' && !policy.allow_user_mentions) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: 'User mentions are not allowed for this entity',
    }
  }

  if (tagType === 'entity' && !policy.allow_entity_mentions) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: 'Entity mentions are not allowed for this entity',
    }
  }

  if (tagType === 'topic' && !policy.allow_hashtags) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: 'Hashtags are not allowed for this entity',
    }
  }

  // Check if tag is blocked
  if (tagId && policy.blocked_tag_ids && policy.blocked_tag_ids.includes(tagId)) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: 'This tag is blocked for this entity',
    }
  }

  // Check if approval is required
  const requiresApproval = policy.require_approval || false

  return {
    allowed: true,
    requiresApproval,
  }
}

/**
 * Create or update tag policy for an entity
 */
export async function setTagPolicy(
  entityType: string,
  entityId: string,
  policy: {
    allowUserMentions?: boolean
    allowEntityMentions?: boolean
    allowHashtags?: boolean
    requireApproval?: boolean
    blockedTagIds?: string[]
    allowedTagTypes?: string[]
  }
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tag_policies')
    .upsert({
      entity_type: entityType,
      entity_id: entityId,
      allow_user_mentions: policy.allowUserMentions ?? true,
      allow_entity_mentions: policy.allowEntityMentions ?? true,
      allow_hashtags: policy.allowHashtags ?? true,
      require_approval: policy.requireApproval ?? false,
      blocked_tag_ids: policy.blockedTagIds || [],
      allowed_tag_types: policy.allowedTagTypes || [
        'user',
        'entity',
        'topic',
        'collaborator',
        'location',
        'taxonomy',
      ],
      updated_at: new Date().toISOString(),
    })

  return !error
}
