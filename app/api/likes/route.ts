import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'


export async function POST(request: NextRequest) {
  try {
    console.log('=== Like API Called ===')
    const supabase = await createRouteHandlerClientAsync()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError?.message || 'User not found'
      }, { status: 401 })
    }

    console.log('User authenticated:', { id: user.id, email: user.email })

    const body = await request.json()
    const { activity_id, entity_type, entity_id } = body

    console.log('Like submission data:', { activity_id, entity_type, entity_id, user_id: user.id })

    // Validate required fields
    if (!activity_id) {
      console.error('Missing required field: activity_id')
      return NextResponse.json({ 
        error: 'Missing required field: activity_id'
      }, { status: 400 })
    }

    // Get the original activity to understand what's being liked
    const { data: originalActivity, error: fetchError } = await (supabase
      .from('activities') as any)
      .select('*')
      .eq('id', activity_id)
      .single()

    if (fetchError || !originalActivity) {
      console.error('Error fetching original activity:', fetchError)
      return NextResponse.json({ 
        error: 'Original activity not found',
        details: fetchError?.message || 'Activity does not exist'
      }, { status: 404 })
    }

    // Check if user already liked this activity
    const { data: existingLike, error: checkError } = await supabase
      .from('activity_likes')
      .select('id')
      .eq('activity_id', activity_id)
      .eq('user_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing like:', checkError)
      return NextResponse.json({ 
        error: 'Failed to check like status',
        details: checkError.message
      }, { status: 500 })
    }

    if (existingLike) {
      // User already liked this activity, unlike it
      console.log('User already liked this activity, removing like...')
      
      const { error: deleteError } = await supabase
        .from('activity_likes')
        .delete()
        .eq('activity_id', activity_id)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Error removing like:', deleteError)
        return NextResponse.json({ 
          error: 'Failed to remove like',
          details: deleteError.message
        }, { status: 500 })
      }

      // Decrease like count in activities table
      const { error: updateError } = await (supabase.rpc as any)('decrement_activity_like_count', {
        p_activity_id: activity_id
      })

      if (updateError) {
        console.warn('Warning: Failed to update activity like count:', updateError)
      }

      // Remove the like activity from timeline
      const { error: deleteLikeActivityError } = await (supabase
        .from('activities') as any)
        .delete()
        .eq('user_id', user.id)
        .eq('activity_type', 'like')
        .eq('data->>liked_activity_id', activity_id)

      if (deleteLikeActivityError) {
        console.warn('Warning: Failed to remove like activity from timeline:', deleteLikeActivityError)
      }

      console.log('Like removed successfully')
      return NextResponse.json({ 
        success: true, 
        action: 'unliked',
        message: 'Like removed successfully' 
      })

    } else {
      // User hasn't liked this activity, add like
      console.log('Adding new like...')
      
      const { data: newLike, error: insertError } = await (supabase
        .from('activity_likes') as any)
        .insert([{
          activity_id,
          user_id: user.id,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (insertError) {
        console.error('Error adding like:', insertError)
        return NextResponse.json({ 
          error: 'Failed to add like',
          details: insertError.message
        }, { status: 500 })
      }

      // Increase like count in activities table
      const { error: updateError } = await (supabase.rpc as any)('increment_activity_like_count', {
        p_activity_id: activity_id
      })

      if (updateError) {
        console.warn('Warning: Failed to update activity like count:', updateError)
      }

      // Create a new timeline activity showing the like
      const likeActivityData = {
        liked_activity_id: activity_id,
        liked_activity_type: originalActivity.activity_type,
        liked_activity_content: originalActivity.text || originalActivity.content?.text || 'Post',
        liked_entity_type: originalActivity.entity_type,
        liked_entity_id: originalActivity.entity_id,
        original_user_id: originalActivity.user_id,
        original_user_name: originalActivity.user_name || 'User'
      }

      const { data: likeActivity, error: likeActivityError } = await (supabase
        .from('activities') as any)
        .insert([{
          user_id: user.id,
          activity_type: 'like',
          data: likeActivityData,
          entity_type: originalActivity.entity_type,
          entity_id: originalActivity.entity_id,
          is_public: true,
          visibility: 'public',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (likeActivityError) {
        console.warn('Warning: Failed to create like timeline activity:', likeActivityError)
        // Don't fail the like operation if timeline activity creation fails
      } else {
        console.log('Like timeline activity created:', likeActivity.id)
      }

      console.log('Like added successfully:', newLike.id)
      return NextResponse.json({ 
        success: true, 
        action: 'liked',
        like: newLike,
        likeActivity: likeActivity,
        message: 'Like added successfully' 
      })
    }

  } catch (error) {
    console.error('Error in likes API:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activity_id = searchParams.get('activity_id')
    const user_id = searchParams.get('user_id')

    if (!activity_id) {
      return NextResponse.json({ 
        error: 'Missing required parameter: activity_id' 
      }, { status: 400 })
    }

    const supabase = await createRouteHandlerClientAsync()

    if (user_id) {
      // Check if specific user liked this activity
      const { data: like, error } = await supabase
        .from('activity_likes')
        .select('id, created_at')
        .eq('activity_id', activity_id)
        .eq('user_id', user_id)
        .single()

      if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ 
          error: 'Failed to check like status',
          details: error.message
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        isLiked: !!like,
        like: like || null
      })
    } else {
      // Get all likes for this activity
      const { data: likes, error } = await supabase
        .from('activity_likes')
        .select(`
          id,
          user_id,
          created_at,
          user:users!activity_likes_user_id_fkey(
            id,
            email,
            user_metadata
          )
        `)
        .eq('activity_id', activity_id)
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json({ 
          error: 'Failed to fetch likes',
          details: error.message
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        likes: likes || [],
        count: likes?.length || 0
      })
    }

  } catch (error) {
    console.error('Error in likes GET API:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
