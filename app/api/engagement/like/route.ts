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

    // Check if user already liked this entity
    const { data: existingLike, error: checkError } = await supabase
      .from('engagement_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing like:', checkError)
      return NextResponse.json({ 
        error: 'Failed to check existing like',
        details: checkError.message
      }, { status: 500 })
    }

    let liked = false
    if (existingLike) {
      // Unlike: remove the like
      const { error: deleteError } = await supabase
        .from('engagement_likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        console.error('Error removing like:', deleteError)
        return NextResponse.json({ 
          error: 'Failed to remove like',
          details: deleteError.message
        }, { status: 500 })
      }

      // Update activities table count - first get current count, then decrement
      const { data: currentActivity, error: fetchError } = await supabase
        .from('activities')
        .select('like_count')
        .eq('id', entity_id)
        .single()

      if (fetchError) {
        console.error('Error fetching current like count:', fetchError)
      } else {
        const currentCount = currentActivity?.like_count || 0
        const newCount = Math.max(currentCount - 1, 0)

        const { error: updateError } = await supabase
          .from('activities')
          .update({ like_count: newCount })
          .eq('id', entity_id)

        if (updateError) {
          console.error('Error updating like count:', updateError)
        } else {
          console.log('✅ Like count updated from', currentCount, 'to', newCount)
        }
      }

      liked = false
    } else {
      // Like: add the like
      const { error: insertError } = await supabase
        .from('engagement_likes')
        .insert({
          user_id: user.id,
          entity_type: entity_type,
          entity_id: entity_id
        })

      if (insertError) {
        console.error('Error adding like:', insertError)
        return NextResponse.json({ 
          error: 'Failed to add like',
          details: insertError.message
        }, { status: 500 })
      }

      // Update activities table count - first get current count, then increment
      const { data: currentActivity, error: fetchError } = await supabase
        .from('activities')
        .select('like_count')
        .eq('id', entity_id)
        .single()

      if (fetchError) {
        console.error('Error fetching current like count:', fetchError)
      } else {
        const currentCount = currentActivity?.like_count || 0
        const newCount = currentCount + 1

        const { error: updateError } = await supabase
          .from('activities')
          .update({ like_count: newCount })
          .eq('id', entity_id)

        if (updateError) {
          console.error('Error updating like count:', updateError)
        } else {
          console.log('✅ Like count updated from', currentCount, 'to', newCount)
        }
      }

      liked = true
    }

    const response = {
      action: liked ? 'liked' : 'unliked',
      message: liked ? 'Post liked successfully' : 'Post unliked successfully',
      liked: liked
    }

    console.log('✅ Like handled successfully:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in handleLike:', error)
    return NextResponse.json({ 
      error: 'Failed to handle like',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
