import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entity_type')
    const entityId = searchParams.get('entity_id')

    if (!entityType || !entityId) {
      return NextResponse.json({ 
        error: 'entity_type and entity_id are required' 
      }, { status: 400 })
    }

    console.log('🔍 GET /api/engagement - Request:', { entityType, entityId })

    // Debug: Check if tables exist and have data
    const { count: likesCount, error: likesCountError } = await supabase
      .from('engagement_likes')
      .select('*', { count: 'exact', head: true })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)

    const { count: commentsCount, error: commentsCountError } = await supabase
      .from('engagement_comments')
      .select('*', { count: 'exact', head: true })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)

    console.log('🔍 Debug - Table counts:', {
      likesCount,
      commentsCount,
      likesCountError,
      commentsCountError
    })

    // Get likes count and recent likes
    const { data: likesData, error: likesError } = await supabase
      .from('engagement_likes')
      .select(`
        id,
        user_id,
        created_at
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (likesError) {
      console.error('❌ Error fetching likes:', likesError)
    }

    // Get user data for likes separately to avoid foreign key issues
    let likesWithUsers: any[] = []
    if (likesData && likesData.length > 0) {
      const userIds = [...new Set(likesData.map(l => l.user_id))]
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds)

      if (usersError) {
        console.error('❌ Error fetching users for likes:', usersError)
      }

      likesWithUsers = likesData.map(like => {
        const user = usersData?.find(u => u.id === like.user_id)
        return {
          ...like,
          user: user || { id: like.user_id, name: 'Unknown User', email: null }
        }
      })
    }

    // Get comments count and recent comments (top-level)
    const { data: commentsData, error: commentsError } = await supabase
      .from('engagement_comments')
      .select(`
        id,
        user_id,
        comment_text,
        parent_comment_id,
        created_at,
        updated_at
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (commentsError) {
      console.error('❌ Error fetching comments:', commentsError)
    }

    // Get user data for comments separately to avoid foreign key issues
    let commentsWithUsers: any[] = []
    let currentUserId: string | null = null
    if (commentsData && commentsData.length > 0) {
      const { data: auth } = await supabase.auth.getUser()
      currentUserId = auth?.user?.id || null

      const userIds = [...new Set(commentsData.map(c => c.user_id))]
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds)

      if (usersError) {
        console.error('❌ Error fetching users:', usersError)
      }

      commentsWithUsers = commentsData.map(comment => {
        const user = usersData?.find(u => u.id === comment.user_id)
        return {
          ...comment,
          user: user || { id: comment.user_id, name: 'Unknown User', email: null },
          replies: [] as any[]
        }
      })

      // Load replies for the fetched parent comments (level 1)
      const parentIds = commentsWithUsers.map(c => c.id)
      const { data: repliesData } = await supabase
        .from('engagement_comments')
        .select('id, user_id, comment_text, parent_comment_id, created_at, updated_at')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .in('parent_comment_id', parentIds)
        .order('created_at', { ascending: true })

      let repliesWithUsers: any[] = []
      if (repliesData && repliesData.length > 0) {
        const replyUserIds = [...new Set(repliesData.map((r: any) => r.user_id))]
        const { data: replyUsers } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', replyUserIds)

        repliesWithUsers = repliesData.map((r: any) => {
          const ru = replyUsers?.find(u => u.id === r.user_id)
          return { ...r, user: ru || { id: r.user_id, name: 'Unknown User', email: null } }
        })
      }

      // Load second-level replies (replies to replies)
      let repliesLevel2: any[] = []
      if (repliesWithUsers.length > 0) {
        const level1Ids = repliesWithUsers.map(r => r.id)
        const { data: r2 } = await supabase
          .from('engagement_comments')
          .select('id, user_id, comment_text, parent_comment_id, created_at, updated_at')
          .eq('entity_type', entityType)
          .eq('entity_id', entityId)
          .in('parent_comment_id', level1Ids)
          .order('created_at', { ascending: true })
        if (r2 && r2.length > 0) {
          const level2UserIds = [...new Set(r2.map((r: any) => r.user_id))]
          const { data: r2Users } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', level2UserIds)
          repliesLevel2 = r2.map((r: any) => {
            const ru = r2Users?.find(u => u.id === r.user_id)
            return { ...r, user: ru || { id: r.user_id, name: 'Unknown User', email: null } }
          })
        }
      }

      const repliesByParent = new Map<string, any[]>()
      for (const r of repliesWithUsers) {
        const list = repliesByParent.get(r.parent_comment_id) || []
        list.push(r)
        repliesByParent.set(r.parent_comment_id, list)
      }
      // attach level2 into level1
      for (const r of repliesLevel2) {
        const list = repliesByParent.get(r.parent_comment_id) || []
        list.push(r)
        repliesByParent.set(r.parent_comment_id, list)
      }
      commentsWithUsers = commentsWithUsers.map(c => ({
        ...c,
        replies: (repliesByParent.get(c.id) || []).map((r1: any) => ({
          ...r1,
          replies: repliesByParent.get(r1.id) || []
        }))
      }))

      // Filter out comments from blocked users or per-user hidden-author rule
      if (currentUserId) {
        const { data: blocks } = await supabase
          .from('blocks')
          .select('blocked_user_id')
          .eq('user_id', currentUserId)

        const blockedSet = new Set((blocks || []).map((b: any) => b.blocked_user_id))
        if (blockedSet.size > 0) {
          commentsWithUsers = commentsWithUsers.filter(c => !blockedSet.has(c.user_id))
        }

        // Hide comments the user has chosen to hide (logged in activity_log)
        const { data: hides } = await supabase
          .from('activity_log')
          .select('target_id, action, target_type')
          .eq('user_id', currentUserId)
          .eq('action', 'hide_comment')
          .in('target_id', commentsWithUsers.map(c => c.id))

        const hiddenSet = new Set((hides || []).map((h: any) => h.target_id))
        if (hiddenSet.size > 0) {
          commentsWithUsers = commentsWithUsers
            .filter(c => !hiddenSet.has(c.id))
            .map(c => ({
              ...c,
              replies: (c.replies || [])
                .filter((r: any) => !hiddenSet.has(r.id))
                .map((r: any) => ({ ...r, replies: (r.replies || []).filter((rr: any) => !hiddenSet.has(rr.id)) }))
            }))
        }

        // Hide all comments authored by a specific user (per viewer)
        const { data: hiddenAuthors } = await supabase
          .from('activity_log')
          .select('target_id')
          .eq('user_id', currentUserId)
          .eq('action', 'hide_user_comments')
          .eq('target_type', 'user')

        const hiddenAuthorSet = new Set((hiddenAuthors || []).map((h: any) => h.target_id))
        if (hiddenAuthorSet.size > 0) {
          commentsWithUsers = commentsWithUsers
            .filter(c => !hiddenAuthorSet.has(c.user_id))
            .map(c => ({
              ...c,
              replies: (c.replies || [])
                .filter((r: any) => !hiddenAuthorSet.has(r.user_id))
                .map((r: any) => ({ ...r, replies: (r.replies || []).filter((rr: any) => !hiddenAuthorSet.has(rr.user_id)) }))
            }))
        }
      }
    }

    // Transform the data to match the expected format
    const response = {
      likes_count: likesData?.length || 0,
      comments_count: commentsData?.length || 0,
      recent_likes: likesWithUsers || [],
      recent_comments: commentsWithUsers || []
    }

    console.log('✅ GET /api/engagement - Response:', response)
    return NextResponse.json(response)

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
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
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
          return await handleLike(supabase, user.id, entity_id, entity_type)
        
        case 'comment':
          if (!content) {
            return NextResponse.json({ 
              error: 'Comment text is required for comment engagement' 
            }, { status: 400 })
          }
          return await handleComment(supabase, user.id, entity_id, entity_type, content, parent_id)
        
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

// Handle like engagement
async function handleLike(supabase: any, userId: string, entityId: string, entityType: string) {
  try {
    // Check if user already liked this entity
    const { data: existingLike, error: checkError } = await supabase
      .from('engagement_likes')
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

    let liked = false
    if (existingLike) {
      // Unlike: remove the like
      const { error: deleteError } = await supabase
        .from('engagement_likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        console.error('Error removing like:', deleteError)
        return NextResponse.json({ 
          error: 'Failed to remove like',
          details: deleteError.message
        }, { status: 500 })
      }

      // Recompute and update reaction count (all reactions) if activity
      const { count: newCount } = await supabase
        .from('engagement_likes')
        .select('id', { count: 'exact', head: true })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)

      if (entityType === 'activity') {
        const { error: updateError } = await supabase
          .from('activities')
          .update({ like_count: newCount || 0 })
          .eq('id', entityId)

        if (updateError) {
          console.error('Error updating like count:', updateError)
        }
      }

      liked = false
    } else {
      // Like: add the like
      const { error: insertError } = await supabase
        .from('engagement_likes')
        .insert({
          user_id: userId,
          entity_type: entityType,
          entity_id: entityId
        })

      if (insertError) {
        console.error('Error adding like:', insertError)
        return NextResponse.json({ 
          error: 'Failed to add like',
          details: insertError.message
        }, { status: 500 })
      }

      // Recompute and update reaction count (all reactions) if activity
      const { count: newCount } = await supabase
        .from('engagement_likes')
        .select('id', { count: 'exact', head: true })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)

      if (entityType === 'activity') {
        const { error: updateError } = await supabase
          .from('activities')
          .update({ like_count: newCount || 0 })
          .eq('id', entityId)

        if (updateError) {
          console.error('Error updating like count:', updateError)
        }
      }

      liked = true
    }

    const response = {
      action: liked ? 'liked' : 'unliked',
      message: liked ? 'Post liked successfully' : 'Post unliked successfully',
      liked: liked
    }

    console.log('✅ Like handled successfully:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in handleLike:', error)
    return NextResponse.json({ 
      error: 'Failed to handle like',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handle comment engagement
async function handleComment(supabase: any, userId: string, entityId: string, entityType: string, commentText: string, parentId?: string) {
  try {
    const trimmed = commentText?.trim() || ''
    if (trimmed.length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }
    if (trimmed.length > 1500) {
      return NextResponse.json({ error: 'Comment too long (max 1500 characters)' }, { status: 400 })
    }

    // Permission enforcement: owner, friends (mutual follows), or followers (per owner policy)
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, user_id')
      .eq('id', entityId)
      .single()

    if (activityError || !activity) {
      console.error('Error loading activity for permission check:', activityError)
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const ownerUserId = activity.user_id
    if (ownerUserId !== userId) {
      // Default policy is public (any authenticated user), owner can tighten
      let postingPolicy: 'public' | 'friends' | 'followers' | 'private' = 'public'
      const { data: ownerPrivacy } = await supabase
        .from('user_privacy_settings')
        .select('default_privacy_level')
        .eq('user_id', ownerUserId)
        .maybeSingle()

      const level = ownerPrivacy?.default_privacy_level as string | undefined
      if (level === 'followers') postingPolicy = 'followers'
      else if (level === 'friends') postingPolicy = 'friends'
      else if (level === 'private') postingPolicy = 'private'
      else postingPolicy = 'public'

      // Check relationship using follows table
      const [{ data: youFollow }, { data: theyFollow }] = await Promise.all([
        supabase
          .from('follows')
          .select('id')
          .eq('follower_id', userId)
          .eq('following_id', ownerUserId)
          .limit(1),
        supabase
          .from('follows')
          .select('id')
          .eq('follower_id', ownerUserId)
          .eq('following_id', userId)
          .limit(1)
      ])

      const isFollower = (youFollow?.length || 0) > 0
      const isFriend = isFollower && (theyFollow?.length || 0) > 0
      const allowed = (
        postingPolicy === 'public' ? true :
        postingPolicy === 'followers' ? (isFollower || isFriend) :
        postingPolicy === 'friends' ? isFriend :
        false
      )
      if (!allowed) {
        return NextResponse.json({ error: 'You do not have permission to comment on this post' }, { status: 403 })
      }
    }

    // Add the comment
    const { data: commentData, error: insertError } = await supabase
      .from('engagement_comments')
      .insert({
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        comment_text: trimmed,
        parent_comment_id: parentId || null
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

    // Recompute and update comment count if activity
    const { count: newCount } = await supabase
      .from('engagement_comments')
      .select('id', { count: 'exact', head: true })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)

    if (entityType === 'activity') {
      const { error: updateError } = await supabase
        .from('activities')
        .update({ comment_count: newCount || 0 })
        .eq('id', entityId)

      if (updateError) {
        console.error('Error updating comment count:', updateError)
      }
    }

    const response = {
      action: 'commented',
      message: 'Comment added successfully',
      comment_id: commentData.id
    }

    console.log('✅ Comment handled successfully:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in handleComment:', error)
    return NextResponse.json({ 
      error: 'Failed to add comment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handle share engagement (placeholder for future implementation)
async function handleShare(supabase: any, userId: string, entityId: string, entityType: string) {
  try {
    // TODO: Implement share functionality when shares table is created
    console.log('Share functionality not yet implemented')
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

// Handle bookmark engagement (placeholder for future implementation)
async function handleBookmark(supabase: any, userId: string, entityId: string, entityType: string) {
  try {
    // TODO: Implement bookmark functionality when bookmarks table is created
    console.log('Bookmark functionality not yet implemented')
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
