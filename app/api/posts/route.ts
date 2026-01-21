import { NextRequest, NextResponse } from 'next/server'
import { createServerActionClientAsync } from '@/lib/supabase/client-helper'
import { validateAndFilterPayload } from '@/lib/schema/schema-validators'

import { Post, CreatePostData, PostQueryFilters, PostQueryOptions } from '@/types/post'

// GET /api/posts - List posts with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerActionClientAsync()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const userId = searchParams.get('user_id')
    const entityType = searchParams.get('entity_type')
    const entityId = searchParams.get('entity_id')
    const contentType = searchParams.get('content_type')
    const visibility = searchParams.get('visibility')
    const publishStatus = searchParams.get('publish_status') || 'published'
    const tags = searchParams.get('tags')?.split(',')
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    // Build query using posts table
    let query = (supabase.from('posts') as any)
      .select('*')
      .eq('publish_status', publishStatus)
      .neq('visibility', 'private')

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    if (entityId) {
      query = query.eq('entity_id', entityId)
    }

    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    if (visibility) {
      query = query.eq('visibility', visibility)
    }

    if (tags && tags.length > 0) {
      query = query.overlaps('hashtags', tags)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: posts, error, count } = await query

    if (error) {
      console.error('Error fetching posts from database:', error)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    // Get total count for pagination
    let totalCount = 0
    if (count !== null) {
      totalCount = count
    } else {
      // Fallback: count total posts with same filters
      const { count: total } = await (supabase.from('posts') as any)
        .select('*', { count: 'exact', head: true })
        .eq('publish_status', publishStatus)
        .neq('visibility', 'private')

      totalCount = total || 0
    }

    const hasMore = offset + limit < totalCount
    const nextOffset = hasMore ? offset + limit : undefined

    return NextResponse.json({
      posts: posts || [],
      total: totalCount,
      has_more: hasMore,
      next_offset: nextOffset,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error in GET /api/posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/posts - Create new post with server-side permission enforcement
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerActionClientAsync()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      content,
      visibility = 'public',
      scheduled_at,
      tags,
      category,
      location,
      entity_type,
      entity_id,
    } = body

    // Determine timeline owner for permission checks (only for user timelines)
    const targetEntityType = entity_type || 'user'
    const targetEntityId = entity_id || user.id

    if (targetEntityType === 'user' && targetEntityId !== user.id) {
      // Owner preference from user_privacy_settings.default_privacy_level
      const { data: privacy } = await (supabase.from('user_privacy_settings') as any)
        .select('default_privacy_level')
        .eq('user_id', targetEntityId)
        .maybeSingle()

      const level = (privacy?.default_privacy_level as string | undefined) || 'public'

      if (level === 'private') {
        return NextResponse.json({ error: 'Posting disabled by owner' }, { status: 403 })
      }

      if (level === 'friends' || level === 'followers') {
        // followers: follower OR friend; friends: mutual follow OR friendship
        if (level === 'friends') {
          const { data: friendship } = await (supabase.from('user_friends') as any)
            .select('status')
            .or(
              `and(user_id.eq.${user.id},friend_id.eq.${targetEntityId}),and(user_id.eq.${targetEntityId},friend_id.eq.${user.id})`
            )
            .maybeSingle()
          if (friendship?.status !== 'accepted') {
            return NextResponse.json({ error: 'Only friends can post' }, { status: 403 })
          }
        } else {
          // Get user target type ID for follows table
          const { data: userTargetType } = await (supabase.from('follow_target_types') as any)
            .select('id')
            .eq('name', 'user')
            .single()

          if (!userTargetType) {
            return NextResponse.json({ error: 'Invalid follow target type' }, { status: 500 })
          }

          const { data: followData } = await (supabase.from('follows') as any)
            .select('follower_id, following_id')
            .eq('target_type_id', userTargetType.id)
            .or(
              `and(follower_id.eq.${user.id},following_id.eq.${targetEntityId}),and(follower_id.eq.${targetEntityId},following_id.eq.${user.id})`
            )
          const isFollower =
            followData?.some(
              (r: any) => r.follower_id === user.id && r.following_id === targetEntityId
            ) || false
          const theyFollowYou =
            followData?.some(
              (r: any) => r.follower_id === targetEntityId && r.following_id === user.id
            ) || false
          const isFriend = isFollower && theyFollowYou
          const allowed = isFollower || isFriend
          if (!allowed) {
            return NextResponse.json({ error: 'Only followers can post' }, { status: 403 })
          }
        }
      }

      // level === 'public' -> allow any authenticated user by default
    }

    // Prepare payload for posts table
    const payload = {
      user_id: user.id,
      entity_type: targetEntityType,
      entity_id: targetEntityId,
      metadata: {
        title: content?.title,
        category,
        location,
        content_safety_score: 1.0,
        age_restriction: 'all',
        sensitive_content: false,
      },
      content: content?.text || content?.content || content?.body || 'Post content',
      image_url: content?.image_url || content?.images || content?.media_url,
      link_url: content?.link_url || content?.url,
      hashtags: content?.hashtags || tags || [],
      visibility: visibility || 'public',
      content_type: content?.image_url ? 'image' : content?.contentType || 'text',
      publish_status: 'published',
      scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : null,
      published_at: new Date().toISOString(),
      is_featured: false,
      is_pinned: false,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }

    // Validate and filter payload against actual schema
    const {
      payload: filteredPayload,
      removedColumns,
      warnings,
    } = await validateAndFilterPayload('posts', payload)

    // Log warnings if any columns were removed
    if (removedColumns.length > 0) {
      console.warn(`Removed non-existent columns from posts insert:`, removedColumns)
    }

    // Create the post in the posts table with filtered payload
    const { data: activity, error } = await (supabase.from('posts') as any)
      .insert(filteredPayload)
      .select('*')
      .single()

    if (error) {
      console.error('Error creating post in database:', error)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      activity,
      message: 'Post created successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

