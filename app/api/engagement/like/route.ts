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
    const { entity_type, entity_id } = body

    if (!entity_type || !entity_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: entity_type, entity_id' 
      }, { status: 400 })
    }

    console.log('🔍 POST /api/engagement/like - Request:', { entity_type, entity_id, user_id: user.id })

    // Use the toggle_entity_like() function as documented in COMMENT_SYSTEM_FIXED.md
    const { data: liked, error: toggleError } = await supabase
      .rpc('toggle_entity_like', {
        p_user_id: user.id,
        p_entity_type: entity_type,
        p_entity_id: entity_id
      })

    if (toggleError) {
      console.error('❌ Error calling toggle_entity_like:', toggleError)
      return NextResponse.json({ 
        error: 'Failed to toggle like',
        details: toggleError.message
      }, { status: 500 })
    }

    const response = {
      action: liked ? 'liked' : 'unliked',
      message: liked ? 'Post liked successfully' : 'Post unliked successfully',
      liked: liked
    }

    console.log('✅ Like toggled successfully:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in handleLike:', error)
    return NextResponse.json({ 
      error: 'Failed to handle like',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
