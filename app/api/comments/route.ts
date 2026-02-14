import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { createCommentSchema } from '@/lib/validations/comment'
import { logger } from '@/lib/logger'
import type { Database, Json } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = (await createRouteHandlerClientAsync()) as any

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      logger.warn({ err: authError }, 'Authentication failed for comment creation')
      return NextResponse.json(
        {
          error: 'Authentication required',
          details: authError?.message || 'User not found',
        },
        { status: 401 }
      )
    }

    const json = await request.json()

    // Validate input with Zod
    const validationResult = createCommentSchema.safeParse(json)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { post_id, user_id, content, entity_type, entity_id, parent_comment_id } =
      validationResult.data

    // Verify the user is posting as themselves
    if (user.id !== user_id) {
      logger.warn(
        { authUser: user.id, requestUser: user_id },
        'User ID mismatch in comment creation'
      )
      return NextResponse.json(
        {
          error: 'You can only post comments as yourself',
          details: 'Authentication user ID does not match request user ID',
        },
        { status: 403 }
      )
    }

    // If this is a reply, validate the parent comment exists using the unified comments table
    if (parent_comment_id) {
      const { data: parentComment } = await supabase
        .from('comments')
        .select('id')
        .eq('id', parent_comment_id)
        .single()

      if (!parentComment) {
        console.error('Parent comment not found:', parent_comment_id)
        return NextResponse.json(
          {
            error: 'Parent comment not found',
            details: 'The comment you are replying to does not exist',
          },
          { status: 404 }
        )
      }
    }

    // Use the unified comments table for all entity types
    const commentInsertData: Database['public']['Tables']['comments']['Insert'] = {
      user_id,
      content: content.trim(),
      entity_type,
      entity_id,
      parent_comment_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_hidden: false,
      is_deleted: false,
    }

    const { data: comment, error: insertError } = await supabase
      .from('comments')
      .insert([commentInsertData])
      .select(
        `
        *,
        user:users!comments_user_id_fkey(
          id,
          email,
          name
        )
      `
      )
      .single()

    if (insertError) {
      console.error('Error inserting comment:', insertError)
      return NextResponse.json(
        {
          error: 'Failed to create comment',
          details: insertError.message,
        },
        { status: 500 }
      )
    }

    if (!comment) {
      console.error('Comment is null after insertion')
      return NextResponse.json(
        {
          error: 'Failed to create comment',
          details: 'Comment was not created successfully',
        },
        { status: 500 }
      )
    }

    console.log('Comment created successfully:', (comment as Record<string, unknown>).id)

    // Try to update the comment count in the activities table if this is an activity post
    const { data: activity, error: activityFetchError } = await supabase
      .from('posts')
      .select('id, comment_count')
      .eq('id', post_id)
      .single()

    if (activityFetchError) {
      console.log('Post is not an activity, skipping comment count update')
    } else if (activity) {
      const activityData = activity as { id: string; comment_count: number }
      console.log('Updating activity comment count for activity:', activityData?.id)
      const currentCount = activityData?.comment_count || 0
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          comment_count: currentCount + 1,
        })
        .eq('id', post_id)

      if (updateError) {
        console.warn('Warning: Failed to update activity comment count:', updateError)
      } else {
        console.log('Activity comment count updated successfully')
      }
    }

    // Format the response
    const commentData = comment as Record<string, unknown>
    const userData = (commentData.user as Record<string, unknown>) || null
    const formattedComment = {
      id: commentData.id,
      content: commentData.content,
      created_at: commentData.created_at,
      updated_at: commentData.updated_at,
      user: {
        id: userData?.id,
        name: (userData?.name as string) || (userData?.email as string) || 'User',
        avatar_url: null,
      },
      post_id: entity_id,
      entity_type,
      entity_id,
    }

    return NextResponse.json({
      success: true,
      comment: formattedComment,
      message: 'Comment created successfully',
    })
  } catch (error) {
    console.error('=== Unexpected Error in Comments API ===')
    console.error('Error details:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = (await createRouteHandlerClientAsync()) as any
    const { searchParams } = new URL(request.url)

    // Add a test endpoint for debugging
    if (searchParams.get('test') === 'true') {
      console.log('=== Testing Comment API ===')
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json(
          {
            error: 'Authentication failed',
            details: authError?.message || 'User not found',
          },
          { status: 401 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Comment API is working',
        user: { id: user.id, email: user.email },
        timestamp: new Date().toISOString(),
      })
    }

    const post_id = searchParams.get('post_id')
    const entity_type = searchParams.get('entity_type')
    const entity_id = searchParams.get('entity_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!post_id) {
      return NextResponse.json(
        {
          error: 'post_id is required',
        },
        { status: 400 }
      )
    }

    // Use the unified comments table for all entity types
    let query = supabase
      .from('comments')
      .select(
        `
        *,
        user:users!comments_user_id_fkey(
          id,
          email,
          name
        )
      `,
        { count: 'exact' }
      )
      .eq('is_hidden', false)
      .eq('is_deleted', false)
      .is('parent_comment_id', null) // Only top-level comments
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by entity type and id if provided
    if (entity_type && entity_id) {
      query = query.eq('entity_type', entity_type).eq('entity_id', entity_id)
    } else {
      // Fallback to post_id for legacy compatibility
      query = query.eq('entity_id', post_id)
    }

    const { data: comments, error, count } = await query

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json(
        {
          error: 'Failed to fetch comments',
          details: error.message,
        },
        { status: 500 }
      )
    }

    // Fetch replies for all parent comments
    let repliesData: any[] = []
    if (comments && comments.length > 0) {
      const parentCommentIds = comments.map((c: any) => c.id)
      
      const { data: replies, error: repliesError } = await supabase
        .from('comments')
        .select(
          `
          *,
          user:users!comments_user_id_fkey(
            id,
            email,
            name
          )
        `
        )
        .in('parent_comment_id', parentCommentIds)
        .eq('is_hidden', false)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })

      if (!repliesError && replies) {
        repliesData = replies
      }
    }

    // Format the comments and nest replies
    const formattedComments =
      comments?.map((comment: Record<string, unknown>) => {
        const userData = (comment.user as Record<string, unknown>) || {}
        
        // Find all replies for this comment
        const commentReplies = repliesData
          .filter((reply: any) => reply.parent_comment_id === comment.id)
          .map((reply: any) => {
            const replyUserData = (reply.user as Record<string, unknown>) || {}
            return {
              id: reply.id,
              content: reply.content,
              created_at: reply.created_at,
              updated_at: reply.updated_at,
              user: {
                id: replyUserData.id,
                name: (replyUserData.name as string) || (replyUserData.email as string) || 'User',
                avatar_url: null,
              },
              entity_type: reply.entity_type,
              entity_id: reply.entity_id,
              parent_comment_id: reply.parent_comment_id,
            }
          })

        return {
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          user: {
            id: userData.id,
            name: (userData.name as string) || (userData.email as string) || 'User',
            avatar_url: null,
          },
          entity_type: comment.entity_type,
          entity_id: comment.entity_id,
          parent_comment_id: comment.parent_comment_id,
          replies: commentReplies,
          reply_count: commentReplies.length,
        }
      }) || []

    return NextResponse.json({
      success: true,
      data: formattedComments,
      count,
      limit,
      offset,
    })
  } catch (error) {
    console.error('=== Unexpected Error in GET Comments ===')
    console.error('Error details:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

