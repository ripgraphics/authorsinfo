import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * Enterprise-Grade Engagement API
 * 
 * Handles:
 * - Reactions (like, love, etc.)
 * - Comments
 * - Shares
 * - Bookmarks
 * - Views
 */

export async function POST(request: NextRequest) {
  try {
    console.log('=== ENTERPRISE ENGAGEMENT API START ===')
    
    // Authentication
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = session.user
    console.log('User authenticated:', user.id)

    // Parse request
    const requestBody = await request.json()
    console.log('Engagement request body:', JSON.stringify(requestBody, null, 2))
    
    const { post_id, action_type, action_data } = requestBody

    // Validation
    if (!post_id || !action_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validActionTypes = ['reaction', 'comment', 'share', 'bookmark', 'view']
    if (!validActionTypes.includes(action_type)) {
      return NextResponse.json({ error: 'Invalid action type' }, { status: 400 })
    }

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', post_id)
      .eq('activity_type', 'post_created')
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check visibility permissions
    if (post.visibility === 'private' && post.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    let engagementResult: any = null

    // Handle different action types
    switch (action_type) {
      case 'reaction':
        engagementResult = await handleReaction(supabase, user.id, post_id, action_data)
        break
      case 'comment':
        engagementResult = await handleComment(supabase, user.id, post_id, action_data)
        break
      case 'share':
        engagementResult = await handleShare(supabase, user.id, post_id, action_data)
        break
      case 'bookmark':
        engagementResult = await handleBookmark(supabase, user.id, post_id, action_data)
        break
      case 'view':
        engagementResult = await handleView(supabase, user.id, post_id, action_data)
        break
      default:
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 })
    }

    if (engagementResult.error) {
      return NextResponse.json({ error: engagementResult.error }, { status: 500 })
    }

    // Update post engagement counts
    await updatePostEngagementCounts(supabase, post_id)

    console.log('=== ENTERPRISE ENGAGEMENT API SUCCESS ===')
    return NextResponse.json({
      success: true,
      action_type,
      post_id,
      result: engagementResult
    })

  } catch (error) {
    console.error('=== ENTERPRISE ENGAGEMENT API ERROR ===')
    console.error('Error in engagement:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Handle reaction actions
 */
async function handleReaction(supabase: any, userId: string, postId: string, actionData: any) {
  try {
    const reactionType = actionData?.reaction_type || 'like'
    
    // Check if user already reacted
    const { data: existingReaction } = await supabase
      .from('post_reactions')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('reaction_type', reactionType)
      .single()

    if (existingReaction) {
      // Remove reaction
      const { error: deleteError } = await supabase
        .from('post_reactions')
        .delete()
        .eq('id', existingReaction.id)

      if (deleteError) {
        console.error('Error removing reaction:', deleteError)
        return { error: 'Failed to remove reaction' }
      }

      return { action: 'removed', reaction_type: reactionType }
    } else {
      // Add reaction
      const { error: insertError } = await supabase
        .from('post_reactions')
        .insert({
          post_id: postId,
          user_id: userId,
          reaction_type: reactionType
        })

      if (insertError) {
        console.error('Error adding reaction:', insertError)
        return { error: 'Failed to add reaction' }
      }

      return { action: 'added', reaction_type: reactionType }
    }
  } catch (error) {
    console.error('Error in handleReaction:', error)
    return { error: 'Failed to handle reaction' }
  }
}

/**
 * Handle comment actions
 */
async function handleComment(supabase: any, userId: string, postId: string, actionData: any) {
  try {
    const content = actionData?.content
    if (!content || content.trim().length === 0) {
      return { error: 'Comment content is required' }
    }

    if (content.length > 1000) {
      return { error: 'Comment too long (max 1000 characters)' }
    }

    const { data: comment, error: insertError } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content: content.trim()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error adding comment:', insertError)
      return { error: 'Failed to add comment' }
    }

    return { action: 'added', comment_id: comment.id, content: comment.content }
  } catch (error) {
    console.error('Error in handleComment:', error)
    return { error: 'Failed to handle comment' }
  }
}

/**
 * Handle share actions
 */
async function handleShare(supabase: any, userId: string, postId: string, actionData: any) {
  try {
    const shareType = actionData?.share_type || 'general'
    
    // Check if user already shared
    const { data: existingShare } = await supabase
      .from('post_shares')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    if (existingShare) {
      return { error: 'Already shared this post' }
    }

    const { error: insertError } = await supabase
      .from('post_shares')
      .insert({
        post_id: postId,
        user_id: userId,
        share_type: shareType
      })

    if (insertError) {
      console.error('Error adding share:', insertError)
      return { error: 'Failed to add share' }
    }

    return { action: 'added', share_type: shareType }
  } catch (error) {
    console.error('Error in handleShare:', error)
    return { error: 'Failed to handle share' }
  }
}

/**
 * Handle bookmark actions
 */
async function handleBookmark(supabase: any, userId: string, postId: string, actionData: any) {
  try {
    // Check if user already bookmarked
    const { data: existingBookmark } = await supabase
      .from('post_bookmarks')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    if (existingBookmark) {
      // Remove bookmark
      const { error: deleteError } = await supabase
        .from('post_bookmarks')
        .delete()
        .eq('id', existingBookmark.id)

      if (deleteError) {
        console.error('Error removing bookmark:', deleteError)
        return { error: 'Failed to remove bookmark' }
      }

      return { action: 'removed' }
    } else {
      // Add bookmark
      const { error: insertError } = await supabase
        .from('post_bookmarks')
        .insert({
          post_id: postId,
          user_id: userId
        })

      if (insertError) {
        console.error('Error adding bookmark:', insertError)
        return { error: 'Failed to add bookmark' }
      }

      return { action: 'added' }
    }
  } catch (error) {
    console.error('Error in handleBookmark:', error)
    return { error: 'Failed to handle bookmark' }
  }
}

/**
 * Handle view actions
 */
async function handleView(supabase: any, userId: string, postId: string, actionData: any) {
  try {
    // For views, we just update the post view count
    const { error: updateError } = await supabase
      .from('activities')
      .update({
        view_count: supabase.sql`COALESCE(view_count, 0) + 1`
      })
      .eq('id', postId)

    if (updateError) {
      console.error('Error updating view count:', updateError)
      return { error: 'Failed to update view count' }
    }

    return { action: 'viewed' }
  } catch (error) {
    console.error('Error in handleView:', error)
    return { error: 'Failed to handle view' }
  }
}

/**
 * Update post engagement counts
 */
async function updatePostEngagementCounts(supabase: any, postId: string) {
  try {
    // Get counts from engagement tables
    const [reactionsResult, commentsResult, sharesResult, bookmarksResult] = await Promise.all([
      supabase.from('post_reactions').select('id', { count: 'exact' }).eq('post_id', postId),
      supabase.from('post_comments').select('id', { count: 'exact' }).eq('post_id', postId),
      supabase.from('post_shares').select('id', { count: 'exact' }).eq('post_id', postId),
      supabase.from('post_bookmarks').select('id', { count: 'exact' }).eq('post_id', postId)
    ])

    const likeCount = reactionsResult.count || 0
    const commentCount = commentsResult.count || 0
    const shareCount = sharesResult.count || 0
    const bookmarkCount = bookmarksResult.count || 0

    // Update post with new counts
    const { error: updateError } = await supabase
      .from('activities')
      .update({
        like_count: likeCount,
        comment_count: commentCount,
        share_count: shareCount,
        bookmark_count: bookmarkCount,
        engagement_score: likeCount + commentCount + shareCount + bookmarkCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)

    if (updateError) {
      console.error('Error updating post engagement counts:', updateError)
    }
  } catch (error) {
    console.error('Error in updatePostEngagementCounts:', error)
  }
}

/**
 * GET endpoint for fetching engagement data
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = session.user

    // Query parameters
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('post_id')
    const actionType = searchParams.get('action_type')

    if (!postId || !actionType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    let data: any = null
    let error: any = null

    // Fetch data based on action type
    switch (actionType) {
      case 'reactions':
        const { data: reactions, error: reactionsError } = await supabase
          .from('post_reactions')
          .select('id, reaction_type, created_at')
          .eq('post_id', postId)
          .order('created_at', { ascending: false })

        data = reactions
        error = reactionsError
        break

              case 'comments':
          const { data: comments, error: commentsError } = await supabase
            .from('post_comments')
            .select('id, content, created_at')
            .eq('post_id', postId)
            .order('created_at', { ascending: false })

          data = comments
          error = commentsError
          break

      case 'shares':
        const { data: shares, error: sharesError } = await supabase
          .from('post_shares')
          .select('id, share_type, created_at')
          .eq('post_id', postId)
          .order('created_at', { ascending: false })

        data = shares
        error = sharesError
        break

      case 'bookmarks':
        const { data: bookmarks, error: bookmarksError } = await supabase
          .from('post_bookmarks')
          .select('id, created_at')
          .eq('post_id', postId)
          .order('created_at', { ascending: false })

        data = bookmarks
        error = bookmarksError
        break

      default:
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 })
    }

    if (error) {
      console.error('Error fetching engagement data:', error)
      return NextResponse.json({ error: 'Failed to fetch engagement data' }, { status: 500 })
    }

    return NextResponse.json({ data, count: data?.length || 0 })

  } catch (error) {
    console.error('Error in engagement GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
