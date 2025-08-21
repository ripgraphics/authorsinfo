import { NextRequest, NextResponse } from 'next/server'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// POST /api/posts/[id]/restore - Restore deleted post
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerActionClient({ cookies })
    const postId = params.id
    
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
      .from('posts')
      .select('user_id, is_deleted, publish_status')
      .eq('id', postId)
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
        { error: 'You can only restore your own posts' },
        { status: 403 }
      )
    }
    
    if (!existingPost.is_deleted) {
      return NextResponse.json(
        { error: 'Post is not deleted' },
        { status: 400 }
      )
    }
    
    // Restore post
    const { data: restoredPost, error: restoreError } = await supabase
      .from('posts')
      .update({
        is_deleted: false,
        publish_status: 'published',
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select()
      .single()
    
    if (restoreError) {
      console.error('Error restoring post:', restoreError)
      return NextResponse.json(
        { error: 'Failed to restore post' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      post: restoredPost,
      message: 'Post restored successfully'
    })
    
  } catch (error) {
    console.error('Error in POST /api/posts/[id]/restore:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
