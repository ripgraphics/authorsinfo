/**
 * Tag Notifications Service
 * Handles sending notifications when users are mentioned or tagged
 */

import { createClient } from '@/lib/supabase/server'
import { getEntityTags } from './tag-service'

/**
 * Send notifications for user mentions in content
 */
export async function notifyMentionedUsers(
  entityType: string,
  entityId: string,
  context: 'post' | 'comment' | 'message' | 'photo',
  taggedBy: string,
  content?: string
): Promise<void> {
  const supabase = await createClient()

  // Get all tags for this entity
  const tags = await getEntityTags(entityType, entityId, context)

  // Filter for user mentions
  const userMentions = tags.filter((tag) => {
    const metadata = tag.metadata as any
    return tag.type === 'user' && metadata?.entity_id
  })

  for (const tag of userMentions) {
    const metadata = tag.metadata as any
    const mentionedUserId = metadata?.entity_id as string

    // Don't notify if user mentioned themselves
    if (mentionedUserId === taggedBy) {
      continue
    }

    // Check if notification already exists (avoid duplicates)
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('recipient_id', mentionedUserId)
      .eq('type', 'mention')
      .eq('data->>entity_id', entityId)
      .eq('data->>entity_type', entityType)
      .is('is_read', false)
      .limit(1)
      .single()

    if (existing) {
      continue // Already notified
    }

    // Get tagger info for notification
    const { data: tagger } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', taggedBy)
      .single()

    const taggerName = tagger?.name || 'Someone'

    // Determine notification message based on context
    let title = 'You were mentioned'
    let message = `${taggerName} mentioned you`

    if (context === 'post') {
      title = 'You were mentioned in a post'
      message = `${taggerName} mentioned you in a post`
    } else if (context === 'comment') {
      title = 'You were mentioned in a comment'
      message = `${taggerName} mentioned you in a comment`
    } else if (context === 'message') {
      title = 'You were mentioned in a message'
      message = `${taggerName} mentioned you in a message`
    }

    // Create notification
    await supabase.from('notifications').insert({
      recipient_id: mentionedUserId,
      type: 'mention',
      title,
      message,
      data: {
        entity_id: entityId,
        entity_type: entityType,
        context,
        tagged_by: taggedBy,
        tag_id: tag.id,
        content_preview: content ? content.substring(0, 100) : undefined,
      },
    })
  }
}

/**
 * Send notifications for entity mentions (optional - for entity owners)
 */
export async function notifyEntityOwners(
  entityType: 'author' | 'book' | 'group' | 'event',
  entityId: string,
  mentionedInType: string,
  mentionedInId: string,
  taggedBy: string
): Promise<void> {
  const supabase = await createClient()

  // Get entity owner/creator
  let ownerId: string | null = null

  if (entityType === 'author') {
    // Authors might not have owners, skip for now
    return
  } else if (entityType === 'book') {
    // Books might not have owners, skip for now
    return
  } else if (entityType === 'group') {
    const { data: group } = await supabase
      .from('groups')
      .select('created_by')
      .eq('id', entityId)
      .single()
    ownerId = group?.created_by || null
  } else if (entityType === 'event') {
    const { data: event } = await supabase
      .from('events')
      .select('created_by')
      .eq('id', entityId)
      .single()
    ownerId = event?.created_by || null
  }

  if (!ownerId || ownerId === taggedBy) {
    return
  }

  // Get tagger info
  const { data: tagger } = await supabase
    .from('users')
    .select('name')
    .eq('id', taggedBy)
    .single()

  const taggerName = tagger?.name || 'Someone'

  // Create notification
  await supabase.from('notifications').insert({
    recipient_id: ownerId,
    type: 'entity_mention',
    title: `Your ${entityType} was mentioned`,
    message: `${taggerName} mentioned your ${entityType}`,
    data: {
      entity_id: entityId,
      entity_type: entityType,
      mentioned_in_type: mentionedInType,
      mentioned_in_id: mentionedInId,
      tagged_by: taggedBy,
    },
  })
}
