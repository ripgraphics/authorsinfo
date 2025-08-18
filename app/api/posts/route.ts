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
    
    // Build query
    let query = supabase
      .from('posts')
      .select('*')
      .eq('publish_status', publishStatus)
      .eq('is_deleted', false)
      .eq('is_hidden', false)
    
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
      query = query.overlaps('tags', tags)
    }
    
    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1)
    
    // Execute query
    const { data: posts, error, count } = await query
    
    if (error) {
      console.error('Error fetching posts:', error)
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
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('publish_status', publishStatus)
        .eq('is_deleted', false)
        .eq('is_hidden', false)
      
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
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Parse request body
    const body: CreatePostData = await request.json()
    
    // Validate required fields
    if (!body.content?.text || body.content.text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Post content is required' },
        { status: 400 }
      )
    }
    
    if (body.content.text.length > 5000) {
      return NextResponse.json(
        { error: 'Post content exceeds maximum length of 5000 characters' },
        { status: 400 }
      )
    }
    
    // Prepare post data
    const postData = {
      user_id: user.id,
      content: {
        text: body.content.text.trim(),
        type: body.content.type || 'text',
        summary: body.content.summary,
        hashtags: body.content.hashtags || [],
        mentions: body.content.mentions || []
      },
      image_url: body.image_url,
      link_url: body.link_url,
      visibility: body.visibility || 'public',
      content_type: body.content_type || 'text',
      content_summary: body.content_summary || body.content.text.substring(0, 200),
      tags: body.tags || body.content.hashtags || [],
      metadata: body.metadata || {},
      entity_type: body.entity_type || 'user',
      entity_id: body.entity_id || user.id,
      publish_status: body.publish_status || 'published',
      is_deleted: false,
      is_hidden: false,
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      view_count: 0,
      engagement_score: 0,
      is_featured: false,
      is_pinned: false,
      is_verified: false,
      last_activity_at: new Date().toISOString(),
      enterprise_features: {
        created_at: new Date().toISOString(),
        content_moderation: {
          status: 'pending'
        }
      }
    }
    
    // Insert post
    const { data: post, error: insertError } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single()
    
    if (insertError) {
      console.error('Error inserting post:', insertError)
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      )
    }
    
    // Update user's last activity
    await supabase
      .from('users')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', user.id)
    
    return NextResponse.json({
      success: true,
      post,
      message: 'Post created successfully'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error in POST /api/posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
