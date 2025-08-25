import { NextRequest, NextResponse } from 'next/server'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Post, CreatePostData, PostQueryFilters, PostQueryOptions } from '@/types/post'

// GET /api/posts - List posts with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerActionClient({ cookies })
    
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
    
    // Build query using activities table (unified system)
    let query = supabase
      .from('activities')
      .select('*')
      .eq('activity_type', 'post_created')
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
      console.error('Error fetching posts from activities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }
    
    // Get total count for pagination
    let totalCount = 0
    if (count !== null) {
      totalCount = count
    } else {
      // Fallback: count total posts with same filters
      const { count: total } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('activity_type', 'post_created')
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
      offset
    })
    
  } catch (error) {
    console.error('Error in GET /api/posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create new post
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerActionClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, visibility = 'public', scheduled_at, tags, category, location, entity_type, entity_id } = body

    // Create the post in the activities table with enterprise features
    const { data: activity, error } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        activity_type: 'post',
        entity_type: entity_type || 'user',
        entity_id: entity_id || user.id,
        metadata: {
          title: content?.title,
          category,
          location,
          content_safety_score: 1.0,
          age_restriction: 'all',
          sensitive_content: false
        },
        text: content?.text || content?.content || content?.body || 'Post content',
        image_url: content?.image_url || content?.images || content?.media_url,
        link_url: content?.link_url || content?.url,
        hashtags: content?.hashtags || tags || [],
        visibility: visibility || 'public',
        content_type: content?.image_url ? 'image' : (content?.contentType || 'text'),
        publish_status: 'published',
        scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : null,
        published_at: new Date().toISOString(),
        is_featured: false,
        is_pinned: false,
        bookmark_count: 0,
        trending_score: 0,
        engagement_score: 0,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating post in activities:', error)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      activity,
      message: 'Post created successfully in activities table'
    })

  } catch (error) {
    console.error('Error in POST /api/posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
