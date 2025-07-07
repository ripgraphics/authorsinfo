'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function createPhotoAlbum(data: {
  name: string
  description?: string
  privacyLevel: 'public' | 'friends' | 'private' | 'custom'
  showInFeed: boolean
  selectedUsers?: string[]
}) {
  try {
    const supabase = createServerActionClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    // Determine privacy settings
    let isPublic = false
    let allowedViewers: string[] = []

    switch (data.privacyLevel) {
      case 'public':
        isPublic = true
        break
      case 'friends':
        // Get user's friends
        const { data: friends } = await supabase
          .from('user_friends')
          .select('friend_id')
          .eq('user_id', user.id)
          .eq('status', 'accepted')
        
        if (friends) {
          allowedViewers = friends.map(f => f.friend_id)
        }
        break
      case 'private':
        isPublic = false
        break
      case 'custom':
        allowedViewers = data.selectedUsers || []
        break
    }

    // Create the album
    const { data: album, error: albumError } = await supabase
      .from('photo_albums')
      .insert({
        name: data.name.trim(),
        description: data.description?.trim(),
        is_public: isPublic,
        owner_id: user.id,
        album_type: 'user',
        entity_type: 'user',
        entity_id: user.id,
        metadata: {
          privacy_level: data.privacyLevel,
          show_in_feed: data.showInFeed,
          allowed_viewers: allowedViewers,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (albumError) throw albumError

    // If custom permissions, create album shares
    if (data.privacyLevel === 'custom' && data.selectedUsers && data.selectedUsers.length > 0) {
      const shareRecords = data.selectedUsers.map(userId => ({
        album_id: album.id,
        share_type: 'view',
        shared_by: user.id,
        shared_with: userId,
        access_token: null,
        expires_at: null
      }))

      const { error: shareError } = await supabase
        .from('album_shares')
        .insert(shareRecords)

      if (shareError) {
        console.error('Error creating album shares:', shareError)
      }
    }

    revalidatePath('/profile/[id]', 'page')
    return { album }
  } catch (error) {
    console.error('Error creating photo album:', error)
    return { error: 'Failed to create album' }
  }
}

export async function updatePhotoAlbum(albumId: string, data: {
  name?: string
  description?: string
  privacyLevel?: 'public' | 'friends' | 'private' | 'custom'
  showInFeed?: boolean
  selectedUsers?: string[]
  coverImageId?: string
}) {
  try {
    const supabase = createServerActionClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    // Check if user owns the album
    const { data: existingAlbum, error: fetchError } = await supabase
      .from('photo_albums')
      .select('owner_id')
      .eq('id', albumId)
      .single()

    if (fetchError || !existingAlbum) {
      return { error: 'Album not found' }
    }

    if (existingAlbum.owner_id !== user.id) {
      return { error: 'Unauthorized' }
    }

    // Determine privacy settings
    let isPublic = false
    let allowedViewers: string[] = []

    if (data.privacyLevel) {
      switch (data.privacyLevel) {
        case 'public':
          isPublic = true
          break
        case 'friends':
          // Get user's friends
          const { data: friends } = await supabase
            .from('user_friends')
            .select('friend_id')
            .eq('user_id', user.id)
            .eq('status', 'accepted')
          
          if (friends) {
            allowedViewers = friends.map(f => f.friend_id)
          }
          break
        case 'private':
          isPublic = false
          break
        case 'custom':
          allowedViewers = data.selectedUsers || []
          break
      }
    }

    // Update album
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.description !== undefined) updateData.description = data.description?.trim()
    if (data.privacyLevel !== undefined) updateData.is_public = isPublic
    if (data.coverImageId !== undefined) updateData.cover_image_id = data.coverImageId

    // Update metadata
    const { data: currentAlbum } = await supabase
      .from('photo_albums')
      .select('metadata')
      .eq('id', albumId)
      .single()

    const currentMetadata = currentAlbum?.metadata || {}
    const newMetadata = {
      ...currentMetadata,
      ...(data.privacyLevel && { privacy_level: data.privacyLevel }),
      ...(data.showInFeed !== undefined && { show_in_feed: data.showInFeed }),
      ...(data.selectedUsers && { allowed_viewers: allowedViewers }),
      updated_at: new Date().toISOString()
    }

    updateData.metadata = newMetadata

    const { error: updateError } = await supabase
      .from('photo_albums')
      .update(updateData)
      .eq('id', albumId)

    if (updateError) throw updateError

    // Handle custom permissions
    if (data.privacyLevel === 'custom') {
      // Remove existing shares
      await supabase
        .from('album_shares')
        .delete()
        .eq('album_id', albumId)

      // Create new shares if users are selected
      if (data.selectedUsers && data.selectedUsers.length > 0) {
        const shareRecords = data.selectedUsers.map(userId => ({
          album_id: albumId,
          share_type: 'view',
          shared_by: user.id,
          shared_with: userId,
          access_token: null,
          expires_at: null
        }))

        const { error: shareError } = await supabase
          .from('album_shares')
          .insert(shareRecords)

        if (shareError) {
          console.error('Error updating album shares:', shareError)
        }
      }
    }

    revalidatePath('/profile/[id]', 'page')
    return { success: true }
  } catch (error) {
    console.error('Error updating photo album:', error)
    return { error: 'Failed to update album' }
  }
}

export async function getUserPhotoAlbums(userId: string, currentUserId?: string) {
  try {
    const supabase = createServerActionClient({ cookies })
    
    let query = supabase
      .from('photo_albums')
      .select(`
        id,
        name,
        description,
        is_public,
        cover_image_id,
        created_at,
        updated_at,
        metadata,
        album_images(
          id,
          image_id,
          display_order,
          is_cover,
          is_featured,
          images(
            id,
            url,
            thumbnail_url
          )
        )
      `)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    // If not own profile, only show public albums or albums shared with current user
    if (currentUserId && currentUserId !== userId) {
      query = query.or(`is_public.eq.true,album_shares.shared_with.eq.${currentUserId}`)
    }

    const { data, error } = await query

    if (error) throw error

    const formattedAlbums = (data || []).map((album: any) => ({
      id: album.id,
      name: album.name,
      description: album.description,
      is_public: album.is_public,
      cover_image_id: album.cover_image_id,
      cover_image_url: album.album_images?.[0]?.images?.thumbnail_url || album.album_images?.[0]?.images?.url,
      photo_count: album.album_images?.length || 0,
      created_at: album.created_at,
      updated_at: album.updated_at,
      metadata: album.metadata
    }))

    return { albums: formattedAlbums }
  } catch (error) {
    console.error('Error fetching user photo albums:', error)
    return { error: 'Failed to fetch albums' }
  }
}

export async function getFeedActivities(limit = 20, offset = 0) {
  try {
    const supabase = createServerActionClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    // Use the database function to get feed activities
    const { data, error } = await supabase
      .rpc('get_user_feed_activities', {
        p_user_id: user.id,
        p_limit: limit,
        p_offset: offset
      })

    if (error) throw error

    return { activities: data || [] }
  } catch (error) {
    console.error('Error fetching feed activities:', error)
    return { error: 'Failed to fetch feed activities' }
  }
}

export async function likeActivity(activityId: string) {
  try {
    const supabase = createServerActionClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('activity_likes')
      .select('id')
      .eq('activity_id', activityId)
      .eq('user_id', user.id)
      .single()

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('activity_likes')
        .delete()
        .eq('activity_id', activityId)
        .eq('user_id', user.id)

      if (error) throw error
      return { liked: false }
    } else {
      // Like
      const { error } = await supabase
        .from('activity_likes')
        .insert({
          activity_id: activityId,
          user_id: user.id
        })

      if (error) throw error
      return { liked: true }
    }
  } catch (error) {
    console.error('Error toggling activity like:', error)
    return { error: 'Failed to update like' }
  }
}

export async function addActivityComment(activityId: string, content: string) {
  try {
    const supabase = createServerActionClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    const { data, error } = await supabase
      .from('activity_comments')
      .insert({
        activity_id: activityId,
        user_id: user.id,
        content: content.trim()
      })
      .select(`
        id,
        content,
        created_at,
        user:user_id(
          id,
          name,
          avatar_url
        )
      `)
      .single()

    if (error) throw error

    return { comment: data }
  } catch (error) {
    console.error('Error adding activity comment:', error)
    return { error: 'Failed to add comment' }
  }
} 