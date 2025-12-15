import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'


export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const supabase = await createRouteHandlerClientAsync()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    // 2. Get request data
    const { content, entity_type, entity_id, visibility = 'public' } = await request.json()
    
    if (!content || !content.text || content.text.trim().length === 0) {
      return NextResponse.json({ error: 'Post content is required' }, { status: 400 })
    }

    // 3. Create post in activities table
    const postData = {
      user_id: userId,
      text: content.text.trim(),
      activity_type: 'post_created',
      content_type: 'text',
      visibility: visibility,
      publish_status: 'published',
      entity_type: entity_type || 'user',
      entity_id: entity_id || userId,
      created_at: new Date().toISOString()
    }

    // 4. Insert the post into activities table
    const { data: post, error: postError } = await (supabase
      .from('activities') as any)
      .insert(postData)
      .select()
      .single()

    if (postError) {
      console.error('Post creation failed:', postError)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      post: { id: post.id, text: post.text },
      message: 'Post created successfully'
    })

  } catch (error) {
    console.error('Post creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 