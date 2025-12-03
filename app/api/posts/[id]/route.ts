import { NextRequest, NextResponse } from 'next/server'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Post, UpdatePostData } from '@/types/post'

// GET /api/posts/[id] - Get single post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const supabase = createServerActionClient({ cookies })
    
    // Get current user for visibility checks
    const { data: { user } } = await supabase.auth.getUser()
    
    // Fetch post
    const { data: post, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', postId)
      .eq('activity_type', 'post_created')
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching post:', error)
      return NextResponse.json(
        { error: 'Failed to fetch post' },
        { status: 500 }
      )
    }
    
    // Check visibility permissions
    if (post.visibility === 'private' && (!user || post.user_id !== user.id)) {
      return NextResponse.json(
        { error: 'Post is private' },
        { status: 403 }
      )
    }
    
    if (post.visibility === 'friends' && (!user || post.user_id !== user.id)) {
      // TODO: Implement friends check
      // For now, allow access if user is authenticated
    }
    
    // Increment view count
    await supabase
      .from('activities')
      .update({ 
        view_count: (post.view_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
    
    return NextResponse.json({ post })
    
  } catch (error) {
    console.error('Error in GET /api/posts/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/posts/[id] - Update post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const supabase = createServerActionClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if post exists and user owns it
    const { data: existingPost, error: fetchError } = await supabase
      .from('activities')
      .select('user_id, publish_status, text, data, is_deleted, metadata')
      .eq('id', postId)
      .eq('activity_type', 'post_created')
      .single()
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching existing post:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch post' },
        { status: 500 }
      )
    }
    
    if (existingPost.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own posts' },
        { status: 403 }
      )
    }
    
    if (existingPost.is_deleted) {
      return NextResponse.json(
        { error: 'Cannot edit deleted post' },
        { status: 400 }
      )
    }
    
    // Parse request body
    const body: UpdatePostData = await request.json()
    
    // Validate content if provided
    if (body.content?.text !== undefined) {
      if (body.content.text.trim().length === 0) {
        return NextResponse.json(
          { error: 'Post content cannot be empty' },
          { status: 400 }
        )
      }
      
      if (body.content.text.length > 5000) {
        return NextResponse.json(
          { error: 'Post content exceeds maximum length of 5000 characters' },
          { status: 400 }
        )
      }
    }
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString()
    }
    
    if (body.content) {
      // Save text to the correct 'text' column (not nested in content)
      if (body.content.text !== undefined) {
        updateData.text = body.content.text.trim() || ''
      }
      
      // Save other content fields to the data JSONB field
      updateData.data = {
        ...(existingPost.data || {}),
        ...body.content,
        updated_at: new Date().toISOString()
      }
    }
    
    if (body.image_url !== undefined) {
      updateData.image_url = body.image_url
    }
    
    if (body.link_url !== undefined) {
      updateData.link_url = body.link_url
    }
    
    if (body.visibility !== undefined) {
      updateData.visibility = body.visibility
    }
    
    if (body.content_type !== undefined) {
      updateData.content_type = body.content_type
    }
    
    if (body.content_summary !== undefined) {
      updateData.content_summary = body.content_summary
    }
    
    if (body.tags !== undefined) {
      updateData.tags = body.tags
    }
    
    if (body.metadata !== undefined) {
      updateData.metadata = {
        ...existingPost.metadata,
        ...body.metadata
      }
    }
    
    if (body.publish_status !== undefined) {
      updateData.publish_status = body.publish_status
    }
    
    if (body.is_featured !== undefined) {
      updateData.is_featured = body.is_featured
    }
    
    if (body.is_pinned !== undefined) {
      updateData.is_pinned = body.is_pinned
    }
    
    // Update post
    const { data: updatedPost, error: updateError } = await supabase
      .from('activities')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating post:', updateError)
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      post: updatedPost,
      message: 'Post updated successfully'
    })
    
  } catch (error) {
    console.error('Error in PUT /api/posts/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[id] - Soft delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const supabase = createServerActionClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if post exists and user owns it
    const { data: existingPost, error: fetchError } = await supabase
      .from('activities')
      .select('user_id, publish_status, is_deleted')
      .eq('id', postId)
      .eq('activity_type', 'post_created')
      .single()
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching existing post:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch post' },
        { status: 500 }
      )
    }
    
    if (existingPost.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own posts' },
        { status: 403 }
      )
    }
    
    if (existingPost.is_deleted) {
      return NextResponse.json(
        { error: 'Post is already deleted' },
        { status: 400 }
      )
    }
    
    // Soft delete post
    const { error: deleteError } = await supabase
      .from('activities')
      .update({
        publish_status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
    
    if (deleteError) {
      console.error('Error deleting post:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    })
    
  } catch (error) {
    console.error('Error in DELETE /api/posts/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
