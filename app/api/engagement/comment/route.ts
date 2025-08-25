import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { entity_type, entity_id, comment_text } = body

    if (!entity_type || !entity_id || !comment_text) {
      return NextResponse.json({ 
        error: 'Missing required fields: entity_type, entity_id, comment_text' 
      }, { status: 400 })
    }

    console.log('🔍 POST /api/engagement/comment - Request:', { entity_type, entity_id, comment_text, user_id: user.id })

    // Add the comment
    const { data: commentData, error: insertError } = await supabase
      .from('engagement_comments')
      .insert({
        user_id: user.id,
        entity_type: entity_type,
        entity_id: entity_id,
        comment_text: comment_text.trim(),
        parent_comment_id: null
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error adding comment:', insertError)
      return NextResponse.json({ 
        error: 'Failed to add comment',
        details: insertError.message
      }, { status: 500 })
    }

    // Update activities table count
    const { error: updateError } = await supabase
      .from('activities')
      .update({ comment_count: supabase.sql`COALESCE(comment_count, 0) + 1` })
      .eq('id', entity_id)

    if (updateError) {
      console.error('Error updating comment count:', updateError)
    }

    const response = {
      action: 'commented',
      message: 'Comment added successfully',
      comment_id: commentData.id
    }

    console.log('✅ Comment handled successfully:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in handleComment:', error)
    return NextResponse.json({ 
      error: 'Failed to add comment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
