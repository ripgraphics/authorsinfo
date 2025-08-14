import { NextRequest, NextResponse } from 'next/server'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerActionClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: activityId } = params
    const body = await request.json()
    const { action, comment_text } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    let result, error

    switch (action) {
      case 'like':
        // Toggle like using the database function
        const likeResult = await supabase
          .rpc('toggle_activity_like', {
            p_activity_id: activityId,
            p_user_id: user.id
          })
        
        result = likeResult.data
        error = likeResult.error
        break

      case 'comment':
        if (!comment_text || comment_text.trim().length === 0) {
          return NextResponse.json(
            { error: 'Comment text is required' },
            { status: 400 }
          )
        }

        // Add comment using the database function
        const commentResult = await supabase
          .rpc('add_activity_comment', {
            p_activity_id: activityId,
            p_user_id: user.id,
            p_comment_text: comment_text.trim()
          })
        
        result = commentResult.data
        error = commentResult.error
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: like, comment' },
          { status: 400 }
        )
    }

    if (error) {
      console.error(`Error performing ${action}:`, error)
      return NextResponse.json(
        { error: `Failed to ${action}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `${action} successful`,
      result
    })

  } catch (error) {
    console.error('Unexpected error in engagement API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerActionClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: activityId } = params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all' // 'likes', 'comments', or 'all'

    let data, error

    if (type === 'likes' || type === 'all') {
      // Get likes for the activity
      const { data: likes, error: likesError } = await supabase
        .from('activity_likes')
        .select(`
          id,
          user_id,
          created_at,
          user:user_id(
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq('activity_id', activityId)
        .order('created_at', { ascending: false })

      if (likesError) {
        console.error('Error fetching likes:', likesError)
        return NextResponse.json(
          { error: 'Failed to fetch likes' },
          { status: 500 }
        )
      }

      data = { ...data, likes: likes || [] }
    }

    if (type === 'comments' || type === 'all') {
      // Get comments for the activity
      const { data: comments, error: commentsError } = await supabase
        .from('activity_comments')
        .select(`
          id,
          user_id,
          comment_text,
          created_at,
          updated_at,
          user:user_id(
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq('activity_id', activityId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })

      if (commentsError) {
        console.error('Error fetching comments:', commentsError)
        return NextResponse.json(
          { error: 'Failed to fetch comments' },
          { status: 500 }
        )
      }

      data = { ...data, comments: comments || [] }
    }

    // Process user data to include names and avatars
    if (data.likes) {
      data.likes = data.likes.map((like: any) => ({
        ...like,
        user_name: like.user?.raw_user_meta_data?.name || 
                   like.user?.raw_user_meta_data?.full_name || 
                   like.user?.email || 
                   'Unknown User',
        user_avatar_url: like.user?.raw_user_meta_data?.avatar_url || ''
      }))
    }

    if (data.comments) {
      data.comments = data.comments.map((comment: any) => ({
        ...comment,
        user_name: comment.user?.raw_user_meta_data?.name || 
                   comment.user?.raw_user_meta_data?.full_name || 
                   comment.user?.email || 
                   'Unknown User',
        user_avatar_url: comment.user?.raw_user_meta_data?.avatar_url || ''
      }))
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Unexpected error fetching engagement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
