import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // 2. Get request data
    const { content } = await request.json()
    
    if (!content || !content.text || content.text.trim().length === 0) {
      return NextResponse.json({ error: 'Post content is required' }, { status: 400 })
    }

    // 3. Create simple post - just the essentials
    const postData = {
      user_id: userId,
      content: content.text.trim(),
      created_at: new Date().toISOString()
    }

    // 4. Insert the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single()

    if (postError) {
      console.error('Post creation failed:', postError)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    // 5. Create activity record
    const activityData = {
      user_id: userId,
      activity_type: 'post_created',
      entity_type: 'user',
      entity_id: userId,
      data: {
        post_id: post.id,
        content: content.text.trim()
      }
    }

    await supabase.from('activities').insert(activityData)

    return NextResponse.json({
      success: true,
      post: { id: post.id, content: post.content },
      message: 'Post created successfully'
    })

  } catch (error) {
    console.error('Post creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 