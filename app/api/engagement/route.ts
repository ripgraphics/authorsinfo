import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: async () => cookieStore })

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entity_type')
    const entityId = searchParams.get('entity_id')

    if (!entityType || !entityId) {
      return NextResponse.json({ 
        error: 'entity_type and entity_id are required' 
      }, { status: 400 })
    }

    console.log('🔍 GET /api/engagement - Request:', { entityType, entityId })

    // Use the get_entity_engagement() function as documented in COMMENT_SYSTEM_FIXED.md
    const { data: engagementData, error: engagementError } = await supabase
      .rpc('get_entity_engagement', {
        p_entity_type: entityType,
        p_entity_id: entityId
      })

    if (engagementError) {
      console.error('❌ Error calling get_entity_engagement:', engagementError)
      return NextResponse.json({ 
        error: 'Failed to get engagement data',
        details: engagementError.message
      }, { status: 500 })
    }

    // The function returns a single row with the engagement data
    const engagement = engagementData?.[0] || {
      likes_count: 0,
      comments_count: 0,
      recent_likes: [],
      recent_comments: []
    }

    // Transform the data to include user information
    const recentLikes = Array.isArray(engagement.recent_likes) ? engagement.recent_likes : []
    const recentComments = Array.isArray(engagement.recent_comments) ? engagement.recent_comments : []

    // Get all unique user IDs
    const userIds = new Set<string>()
    recentLikes.forEach((like: any) => {
      if (like?.user_id) userIds.add(like.user_id)
    })
    recentComments.forEach((comment: any) => {
      if (comment?.user_id) userIds.add(comment.user_id)
    })

    // Fetch user profiles
    let userProfiles: Record<string, any> = {}
    if (userIds.size > 0) {
      // Fetch user names from users table and location/avatar_image_id from profiles
      const userIdsArray = Array.from(userIds)
      const [usersResult, profilesResult] = await Promise.all([
        supabase
          .from('users')
          .select('id, name')
          .in('id', userIdsArray),
        supabase
          .from('profiles')
          .select('user_id, location, avatar_image_id')
          .in('user_id', userIdsArray)
      ])

      const users = usersResult.data || []
      const profiles = profilesResult.data || []
      
      // Create profile map by user_id
      const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]))
      
      if (users) {
        users.forEach((user: any) => {
          const profile = profileMap.get(user.id)
          userProfiles[user.id] = {
            id: user.id,
            name: user.name || 'Unknown User',
            avatar_url: null,
            location: profile?.location || null
          }
        })
      }
      
      // Fetch avatars from images table via profiles.avatar_image_id
      try {
        // Get unique avatar_image_ids from profiles
        const avatarImageIds = Array.from(new Set(
          profiles
            .map((p: any) => p.avatar_image_id)
            .filter(Boolean)
        ))
        
        if (avatarImageIds.length > 0) {
          // Fetch image URLs from images table
          const { data: images } = await supabase
            .from('images')
            .select('id, url')
            .in('id', avatarImageIds)
          
          if (images && images.length > 0) {
            // Create map of image_id to url
            const imageIdToUrl = new Map(images.map((img: any) => [img.id, img.url]))
            
            // Map user_id to avatar_url
            profiles.forEach((profile: any) => {
              if (profile.avatar_image_id && imageIdToUrl.has(profile.avatar_image_id) && userProfiles[profile.user_id]) {
                userProfiles[profile.user_id].avatar_url = imageIdToUrl.get(profile.avatar_image_id) || null
              }
            })
          }
        }
      } catch (avatarError) {
        // Non-fatal; avatars will be null if not found
        console.log('Error fetching avatars:', avatarError)
      }
    }

    // Transform recent_likes to include user object
    const transformedLikes = recentLikes.map((like: any, index: number) => ({
      id: like.user_id || `like-${index}`,
      user: userProfiles[like.user_id] || {
        id: like.user_id || '',
        name: 'Unknown User',
        avatar_url: null,
        location: null
      },
      reaction_type: like.reaction_type || 'like',
      created_at: like.created_at || new Date().toISOString()
    }))

    // Transform recent_comments to include user object
    const transformedComments = recentComments.map((comment: any, index: number) => ({
      id: comment.id || `comment-${index}`,
      user: userProfiles[comment.user_id] || {
        id: comment.user_id || '',
        name: 'Unknown User',
        avatar_url: null,
        location: null
      },
      comment_text: comment.comment_text || comment.content || '',
      created_at: comment.created_at || new Date().toISOString()
    }))

    console.log('✅ GET /api/engagement - Response:', {
      likes_count: engagement.likes_count || 0,
      comments_count: engagement.comments_count || 0,
      recent_likes: transformedLikes,
      recent_comments: transformedComments
    })

    return NextResponse.json({
      likes_count: engagement.likes_count || 0,
      comments_count: engagement.comments_count || 0,
      recent_likes: transformedLikes,
      recent_comments: transformedComments
    })

  } catch (error) {
    console.error('❌ GET /api/engagement - Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: async () => cookieStore })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    console.log('📝 POST /api/engagement - Request body:', body)

    // Handle different request formats
    if (body.entity_id && body.entity_type) {
      // Direct engagement request
      const { entity_id, entity_type, engagement_type, content, parent_id } = body

      if (!engagement_type) {
        return NextResponse.json({ 
          error: 'Missing required field: engagement_type' 
        }, { status: 400 })
      }

      console.log('📝 Creating engagement:', { entity_id, entity_type, engagement_type, user_id: user.id })

      // Handle different engagement types using the existing engagement tables
      switch (engagement_type) {
        case 'like':
          return await handleLikeWithFunction(supabase, user.id, entity_id, entity_type)
        
        case 'comment':
          if (!content) {
            return NextResponse.json({ 
              error: 'Comment text is required for comment engagement' 
            }, { status: 400 })
          }
          return await handleCommentWithFunction(supabase, user.id, entity_id, entity_type, content, parent_id)
        
        case 'share':
          return await handleShare(supabase, user.id, entity_id, entity_type)
        
        case 'bookmark':
          return await handleBookmark(supabase, user.id, entity_id, entity_type)
        
        default:
          return NextResponse.json({ 
            error: 'Invalid engagement type. Supported types: like, comment, share, bookmark' 
          }, { status: 400 })
      }
    } else {
      return NextResponse.json({ 
        error: 'Missing required fields: entity_id, entity_type' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Engagement API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handle like engagement using toggle_entity_like() function as documented
async function handleLikeWithFunction(supabase: any, userId: string, entityId: string, entityType: string) {
  try {
    console.log('🔍 Calling toggle_entity_like function:', { userId, entityType, entityId })
    
    const { data: result, error } = await supabase
      .rpc('toggle_entity_like', {
        p_user_id: userId,
        p_entity_type: entityType,
        p_entity_id: entityId
      })

    if (error) {
      console.error('❌ Error calling toggle_entity_like:', error)
      return NextResponse.json({ 
        error: 'Failed to toggle like',
        details: error.message
      }, { status: 500 })
    }

    const liked = result === true
    const response = {
      action: liked ? 'liked' : 'unliked',
      message: liked ? 'Post liked successfully' : 'Post unliked successfully',
      liked: liked
    }

    console.log('✅ Like toggled successfully:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in handleLikeWithFunction:', error)
    return NextResponse.json({ 
      error: 'Failed to handle like',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handle comment engagement using add_entity_comment() function as documented
async function handleCommentWithFunction(supabase: any, userId: string, entityId: string, entityType: string, commentText: string, parentId?: string) {
  try {
    const trimmed = commentText?.trim() || ''
    if (trimmed.length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }
    if (trimmed.length > 1500) {
      return NextResponse.json({ error: 'Comment too long (max 1500 characters)' }, { status: 400 })
    }

    console.log('🔍 Calling add_entity_comment function:', { userId, entityType, entityId, commentText: trimmed.substring(0, 100) + '...', parentId })

    const { data: commentId, error } = await supabase
      .rpc('add_entity_comment', {
        p_user_id: userId,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_comment_text: trimmed,
        p_parent_comment_id: parentId || null
      })

    if (error) {
      console.error('❌ Error calling add_entity_comment:', error)
      return NextResponse.json({ 
        error: 'Failed to add comment',
        details: error.message
      }, { status: 500 })
    }

    const response = {
      action: 'commented',
      message: 'Comment added successfully',
      comment_id: commentId
    }

    console.log('✅ Comment added successfully:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in handleCommentWithFunction:', error)
    return NextResponse.json({ 
      error: 'Failed to add comment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handle like engagement using direct table operations (fallback)
// Use likes table for all entity types (activity_likes doesn't exist)
async function handleLike(supabase: any, userId: string, entityId: string, entityType: string) {
  try {
    // Use likes table for all entity types
    const { data: existingLike, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing like:', checkError)
      return NextResponse.json({ 
        error: 'Failed to check existing like',
        details: checkError.message
      }, { status: 500 })
    }

    if (existingLike) {
      // Unlike - remove the like
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        console.error('Error removing like:', deleteError)
        return NextResponse.json({ 
          error: 'Failed to remove like',
          details: deleteError.message
        }, { status: 500 })
      }

      const response = {
        action: 'unliked',
        message: 'Like removed successfully'
      }

      console.log('✅ Like removed successfully:', response)
      return NextResponse.json(response)
    } else {
      // Like - add the like
      const { data: likeData, error: insertError } = await supabase
        .from('likes')
        .insert({
          user_id: userId,
          entity_type: entityType,
          entity_id: entityId
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error adding like:', insertError)
        return NextResponse.json({ 
          error: 'Failed to add like',
          details: insertError.message
        }, { status: 500 })
      }

      const response = {
        action: 'liked',
        message: 'Like added successfully',
        like_id: likeData.id
      }

      console.log('✅ Like added successfully:', response)
      return NextResponse.json(response)
    }

  } catch (error) {
    console.error('Error in handleLike:', error)
    return NextResponse.json({ 
      error: 'Failed to handle like',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handle comment engagement using direct table operations
// Use comments table for all entity types (activity_comments may not exist)
async function handleComment(supabase: any, userId: string, entityId: string, entityType: string, commentText: string, parentId?: string) {
  try {
    const trimmed = commentText?.trim() || ''
    if (trimmed.length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }
    if (trimmed.length > 1500) {
      return NextResponse.json({ error: 'Comment too long (max 1500 characters)' }, { status: 400 })
    }

    // Use comments table for all entity types
    const { data: commentData, error: insertError } = await supabase
      .from('comments')
      .insert({
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        content: trimmed,
        parent_id: parentId || null,
        is_deleted: false,
        is_hidden: false
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error adding comment:', insertError)
      return NextResponse.json({ 
        error: 'Failed to add comment',
        details: insertError.message
      }, { status: 500 })
    }

    const response = {
      action: 'commented',
      message: 'Comment added successfully',
      comment_id: commentData.id
    }

    console.log('✅ Comment added successfully:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in handleComment:', error)
    return NextResponse.json({ 
      error: 'Failed to add comment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handle share engagement
async function handleShare(supabase: any, userId: string, entityId: string, entityType: string) {
  try {
    // Share functionality placeholder
    return NextResponse.json({
      action: 'shared',
      message: 'Share functionality coming soon',
      note: 'Shares table not yet implemented'
    })

  } catch (error) {
    console.error('Error in handleShare:', error)
    return NextResponse.json({ 
      error: 'Share functionality not yet implemented',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handle bookmark engagement
async function handleBookmark(supabase: any, userId: string, entityId: string, entityType: string) {
  try {
    // Bookmark functionality placeholder
    return NextResponse.json({
      action: 'bookmarked',
      message: 'Bookmark functionality coming soon',
      note: 'Bookmarks table not yet implemented'
    })

  } catch (error) {
    console.error('Error in handleBookmark:', error)
    return NextResponse.json({ 
      error: 'Bookmark functionality not yet implemented',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}