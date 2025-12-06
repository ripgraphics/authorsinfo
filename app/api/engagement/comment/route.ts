import { NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerClientAsync()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const { entity_type, entity_id, comment_text, parent_id, parent_comment_id } = await request.json()
    
    if (!entity_type || !entity_id || !comment_text) {
      return NextResponse.json(
        { error: 'Missing required fields: entity_type, entity_id, comment_text' },
        { status: 400 }
      )
    }

    console.log('🔍 Processing comment:', {
      user_id: user.id,
      entity_type,
      entity_id,
      comment_text: comment_text.substring(0, 100) + '...',
      parent_comment_id: parent_comment_id || parent_id || null
    })

    // Use the add_entity_comment() function as documented in COMMENT_SYSTEM_FIXED.md
    const { data: commentId, error: insertError } = await supabaseAdmin
      .rpc('add_entity_comment', {
        p_user_id: user.id,
        p_entity_type: entity_type,
        p_entity_id: entity_id,
        p_comment_text: comment_text.trim(),
        p_parent_comment_id: parent_comment_id || parent_id || null
      })

    if (insertError) {
      console.error('❌ Error calling add_entity_comment:', insertError)
      return NextResponse.json(
        { error: 'Failed to add comment' },
        { status: 500 }
      )
    }

    // Update engagement counts in activities table if this is an activity
    if (entity_type === 'activity') {
      try {
        // Get current comment count for this activity
        const { data: commentCount, error: countError } = await supabaseAdmin
          .from('engagement_comments')
          .select('id', { count: 'exact' })
          .eq('entity_type', entity_type)
          .eq('entity_id', entity_id)

        if (!countError && commentCount !== null) {
          // Update the activities table with new comment count
          const { error: updateError } = await supabaseAdmin
            .from('activities')
            .update({
              comment_count: commentCount.length,
              updated_at: new Date().toISOString()
            })
            .eq('id', entity_id)

          if (updateError) {
            console.warn('⚠️ Warning: Failed to update activity comment count:', updateError)
            // Don't fail the request for this, just log it
          }
        }
      } catch (error) {
        console.warn('⚠️ Warning: Failed to update activity comment count:', error)
        // Don't fail the request for this, just log it
      }
    }

    console.log('✅ Comment added successfully:', {
      comment_id: commentId,
      entity_type,
      entity_id
    })

    return NextResponse.json({
      success: true,
      comment_id: commentId,
      message: 'Comment added successfully'
    })

  } catch (error) {
    console.error('❌ Unexpected error in comment API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
