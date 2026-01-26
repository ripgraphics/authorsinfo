/**
 * Tag Avatar Helper
 * Utility to fetch avatar URLs from images table
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Get avatar URL from avatar_image_id
 */
export async function getAvatarUrlFromImageId(imageId: string | null | undefined): Promise<string | null> {
  if (!imageId) return null

  const supabase = await createClient()

  const { data: image, error } = await supabase
    .from('images')
    .select('url')
    .eq('id', imageId)
    .single()

  if (error || !image?.url) {
    return null
  }

  return image.url
}

/**
 * Batch fetch avatar URLs for multiple image IDs
 */
export async function getAvatarUrlsFromImageIds(
  imageIds: (string | null | undefined)[]
): Promise<Map<string, string>> {
  const validIds = imageIds.filter((id): id is string => Boolean(id))
  if (validIds.length === 0) return new Map()

  const supabase = await createClient()

  const { data: images, error } = await supabase
    .from('images')
    .select('id, url')
    .in('id', validIds)

  if (error || !images) {
    return new Map()
  }

  return new Map(images.map((img) => [img.id, img.url]))
}

/**
 * Get avatar URL for a user
 */
export async function getUserAvatarUrl(userId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_image_id')
    .eq('user_id', userId)
    .single()

  if (!profile?.avatar_image_id) {
    return null
  }

  return getAvatarUrlFromImageId(profile.avatar_image_id)
}
