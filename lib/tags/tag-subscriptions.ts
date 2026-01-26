/**
 * Tag Subscriptions Service
 * Handles tag following and tag-based feeds
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Subscribe to a tag
 */
export async function subscribeToTag(
  userId: string,
  tagId: string,
  notificationPreferences?: {
    mentions?: boolean
    trending?: boolean
  }
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase.from('tag_subscriptions').insert({
    user_id: userId,
    tag_id: tagId,
    notification_preferences: notificationPreferences || {
      mentions: true,
      trending: false,
    },
  })

  if (error && error.code !== '23505') {
    // Ignore duplicate key errors
    console.error('Error subscribing to tag:', error)
    return false
  }

  return true
}

/**
 * Unsubscribe from a tag
 */
export async function unsubscribeFromTag(userId: string, tagId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tag_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('tag_id', tagId)

  return !error
}

/**
 * Get user's tag subscriptions
 */
export async function getUserTagSubscriptions(userId: string): Promise<Array<{ tagId: string; tagName: string }>> {
  const supabase = await createClient()

  const { data: subscriptions, error } = await supabase
    .from('tag_subscriptions')
    .select(
      `
      tag_id,
      tags!inner (
        id,
        name,
        slug,
        type
      )
    `
    )
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching subscriptions:', error)
    return []
  }

  return (subscriptions || []).map((sub: any) => ({
    tagId: sub.tag_id,
    tagName: sub.tags.name,
    slug: sub.tags.slug,
    type: sub.tags.type,
  }))
}

/**
 * Get tag-based feed for a user
 */
export async function getTagFeed(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<Array<{
  entityType: string
  entityId: string
  context: string
  createdAt: string
  tagId: string
  tagName: string
}>> {
  const supabase = await createClient()

  const { data: feed, error } = await supabase.rpc('get_tag_feed', {
    p_user_id: userId,
    p_limit: limit,
    p_offset: offset,
  })

  if (error) {
    console.error('Error fetching tag feed:', error)
    return []
  }

  return (feed || []).map((item: any) => ({
    entityType: item.entity_type,
    entityId: item.entity_id,
    context: item.context,
    createdAt: item.created_at,
    tagId: item.tag_id,
    tagName: item.tag_name,
  }))
}
