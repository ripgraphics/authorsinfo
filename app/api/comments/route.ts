import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { post_id, user_id, content, entity_type, entity_id } = body

    // Validate required fields
    if (!post_id || !user_id || !content || !entity_type || !entity_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: post_id, user_id, content, entity_type, entity_id' 
      }, { status: 400 })
    }

    // Verify the user is posting as themselves
    if (user.id !== user_id) {
      return NextResponse.json({ 
        error: 'You can only post comments as yourself' 
      }, { status: 403 })
    }

    // Create the comment using the actual table structure
    const { data: comment, error: insertError } = await supabase
      .from('comments')
      .insert([{
        user_id,
        feed_entry_id: post_id, // Use feed_entry_id as per table structure
        content: content.trim(),
        entity_type,
        entity_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_hidden: false,
        is_deleted: false
      }])
      .select(`
        *,
        user:users!comments_user_id_fkey(
          id,
          email,
          user_metadata
        )
      `)
      .single()

    if (insertError) {
      console.error('Error inserting comment:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create comment',
        details: insertError.message 
      }, { status: 500 })
    }

    // Update the post's comment count in the activities table
    const { data: currentPost, error: fetchError } = await supabase
      .from('activities')
      .select('comment_count')
      .eq('id', post_id)
      .single()

    if (fetchError) {
      console.warn('Warning: Failed to fetch current comment count:', fetchError)
    } else {
      const currentCount = currentPost?.comment_count || 0
      const { error: updateError } = await supabase
        .from('activities')
        .update({ 
          comment_count: currentCount + 1
        })
        .eq('id', post_id)

      if (updateError) {
        console.warn('Warning: Failed to update post comment count:', updateError)
      }
    }

    // Format the response
    const formattedComment = {
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      user: {
        id: comment.user?.id,
        name: comment.user?.user_metadata?.full_name || comment.user?.email || 'User',
        avatar_url: comment.user?.user_metadata?.avatar_url
      },
      post_id: comment.feed_entry_id, // Map back to post_id for frontend compatibility
      entity_type: comment.entity_type,
      entity_id: comment.entity_id
    }

    return NextResponse.json({
      success: true,
      comment: formattedComment,
      message: 'Comment created successfully'
    })

  } catch (error) {
    console.error('Error in comments API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const post_id = searchParams.get('post_id')
    const entity_type = searchParams.get('entity_type')
    const entity_id = searchParams.get('entity_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!post_id) {
      return NextResponse.json({ 
        error: 'post_id is required' 
      }, { status: 400 })
    }

    // Build the query using the actual table structure
    let query = supabase
      .from('comments')
      .select(`
        *,
        user:users!comments_user_id_fkey(
          id,
          email,
          user_metadata
        )
      `)
      .eq('feed_entry_id', post_id) // Use feed_entry_id as per table structure
      .eq('is_hidden', false)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (entity_type && entity_id) {
      query = query.eq('entity_type', entity_type).eq('entity_id', entity_id)
    }

    const { data: comments, error, count } = await query

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch comments',
        details: error.message 
      }, { status: 500 })
    }

    // Format the comments
    const formattedComments = comments?.map(comment => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      user: {
        id: comment.user?.id,
        name: comment.user?.user_metadata?.full_name || comment.user?.email || 'User',
        avatar_url: comment.user?.user_metadata?.avatar_url
      },
      post_id: comment.feed_entry_id, // Map back to post_id for frontend compatibility
      entity_type: comment.entity_type,
      entity_id: comment.entity_id
    })) || []

    return NextResponse.json({
      success: true,
      comments: formattedComments,
      total: count || formattedComments.length,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error in comments API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
