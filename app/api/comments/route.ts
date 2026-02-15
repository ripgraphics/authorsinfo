import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { createCommentSchema } from '@/lib/validations/comment'
import { logger } from '@/lib/logger'
import type { Database, Json } from '@/types/database'
import { getEntityTypeId } from '@/lib/entity-types'

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

    // Accept either entity_id or post_id
    const effectiveEntityId = entity_id || post_id
    if (!effectiveEntityId) {
      return NextResponse.json(
        { error: 'entity_id or post_id is required' },
        { status: 400 }
      )
    }

    // Resolve entity_type to match both UUID and string values in the DB.
    // Comments created via add_entity_comment RPC store entity_type as a UUID,
    // while comments created via direct insert may store it as a string.
    const entityTypeMatchValues: string[] = []
    if (entity_type) {
      entityTypeMatchValues.push(entity_type)
      // Add common aliases
      if (entity_type === 'activity') entityTypeMatchValues.push('post')
      if (entity_type === 'post') entityTypeMatchValues.push('activity')
      // Resolve to UUID from entity_types table
      const entityTypeId = await getEntityTypeId(entity_type)
      if (entityTypeId && !entityTypeMatchValues.includes(entityTypeId)) {
        entityTypeMatchValues.push(entityTypeId)
      }
    }

    // Build base query for top-level comments
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

    // Filter by entity type (matching UUID and string variants) and entity id
    if (entityTypeMatchValues.length > 0) {
      query = query
        .in('entity_type', entityTypeMatchValues)
        .eq('entity_id', effectiveEntityId)
    } else {
      query = query.eq('entity_id', effectiveEntityId)
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

    // Formatted comment shape returned by the API
    interface FormattedComment {
      id: unknown
      content: unknown
      comment_text: unknown
      created_at: unknown
      updated_at: unknown
      user: { id: unknown; name: string; avatar_url: null }
      entity_type: unknown
      entity_id: unknown
      parent_comment_id: unknown
      reply_count: number
      replies: FormattedComment[]
    }

    // Format a single comment row into the API response shape
    const formatComment = (comment: Record<string, unknown>): FormattedComment => {
      const userData = (comment.user as Record<string, unknown>) || {}
      return {
        id: comment.id,
        content: comment.content,
        comment_text: comment.content, // alias used by the UI
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
        reply_count: 0,
        replies: [],
      }
    }

    const formattedComments: FormattedComment[] = (comments || []).map(formatComment)

    // Fetch user profiles for comments that are missing names (fallback)
    const userIdsNeedingProfiles = Array.from(
      new Set(
        formattedComments
          .flatMap((c) => {
            const ids: string[] = []
            if (c.user.name === 'User' && c.user.id) ids.push(c.user.id as unknown as string)
            c.replies?.forEach((r) => {
              if (r.user.name === 'User' && r.user.id) ids.push(r.user.id as unknown as string)
            })
            return ids
          })
      )
    )

    if (userIdsNeedingProfiles.length > 0) {
      const { data: userProfiles } = await supabase
        .from('users')
        .select('id, name, email, username')
        .in('id', userIdsNeedingProfiles)

      if (userProfiles && userProfiles.length > 0) {
        const profileMap = new Map(
          (userProfiles as Array<{ id: string; name?: string; email?: string; username?: string }>).map(
            (up) => [up.id, up]
          )
        )

        // Update comment names with fetched profiles
        const updateCommentName = (c: FormattedComment) => {
          if (c.user.name === 'User' && c.user.id) {
            const profile = profileMap.get(c.user.id as unknown as string)
            if (profile?.name) {
              c.user.name = profile.name
            } else if (profile?.username) {
              c.user.name = profile.username
            } else if (profile?.email) {
              c.user.name = profile.email
            }
          }
          c.replies?.forEach(updateCommentName)
        }

        formattedComments.forEach(updateCommentName)
      }
    }

    // Fetch replies for all top-level comments in one query
    const topLevelIds = formattedComments.map((c: FormattedComment) => c.id)
    if (topLevelIds.length > 0) {
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
        .in('parent_comment_id', topLevelIds)
        .eq('is_hidden', false)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })

      if (!repliesError && replies) {
        // Group replies by parent_comment_id
        const repliesByParent = new Map<string, FormattedComment[]>()
        for (const reply of replies as Record<string, unknown>[]) {
          const parentId = reply.parent_comment_id as string
          if (!repliesByParent.has(parentId)) {
            repliesByParent.set(parentId, [])
          }
          repliesByParent.get(parentId)!.push(formatComment(reply))
        }

        // Attach replies to their parent comments
        for (const comment of formattedComments) {
          const childReplies = repliesByParent.get(comment.id as string) || []
          comment.replies = childReplies
          comment.reply_count = childReplies.length
        }
      }
    }

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

