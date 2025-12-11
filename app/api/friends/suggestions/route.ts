import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'


export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()
    
    // Get the current user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('User authentication error:', userError)
      return NextResponse.json({ error: 'Failed to authenticate user' }, { status: 500 })
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get friend suggestions
    const { data: suggestions, error } = await supabase
      .from('friend_suggestions')
      .select(`
        id,
        suggested_user_id,
        mutual_friends_count,
        suggestion_score,
        is_dismissed
      `)
      .eq('user_id', user.id)
      .eq('is_dismissed', false)
      .order('suggestion_score', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching suggestions:', error)
      return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 })
    }

    // Get user details for each suggestion
    const suggestionsWithUserDetails = await Promise.all(
      (suggestions || []).map(async (suggestion) => {
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', suggestion.suggested_user_id)
          .single()

        return {
          ...suggestion,
          suggested_user: {
            id: userData?.id || suggestion.suggested_user_id,
            name: userData?.name || userData?.email || 'Unknown User',
            email: userData?.email || ''
          }
        }
      })
    )

    if (error) {
      console.error('Error fetching suggestions:', error)
      return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      suggestions: suggestionsWithUserDetails || []
    })

  } catch (error) {
    console.error('Error in friend suggestions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()
    
    // Get the current user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('User authentication error:', userError)
      return NextResponse.json({ error: 'Failed to authenticate user' }, { status: 500 })
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate new suggestions
    const { error } = await supabase.rpc('generate_friend_suggestions', {
      target_user_id: user.id
    })

    if (error) {
      console.error('Error generating suggestions:', error)
      return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Friend suggestions generated successfully'
    })

  } catch (error) {
    console.error('Error generating suggestions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()
    
    // Get the current user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('User authentication error:', userError)
      return NextResponse.json({ error: 'Failed to authenticate user' }, { status: 500 })
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { suggestionId, action } = await request.json()
    
    if (!suggestionId || !action) {
      return NextResponse.json({ error: 'Suggestion ID and action are required' }, { status: 400 })
    }

    if (!['dismiss', 'accept'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (action === 'dismiss') {
      // Mark suggestion as dismissed
      const { error: updateError } = await supabase
        .from('friend_suggestions')
        .update({ is_dismissed: true })
        .eq('id', suggestionId)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error dismissing suggestion:', updateError)
        return NextResponse.json({ error: 'Failed to dismiss suggestion' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Suggestion dismissed'
      })
    } else {
      // Accept suggestion by sending friend request
      const { data: suggestion, error: fetchError } = await supabase
        .from('friend_suggestions')
        .select('suggested_user_id')
        .eq('id', suggestionId)
        .eq('user_id', user.id)
        .single()

      if (fetchError || !suggestion) {
        return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })
      }

      // Send friend request
      const { error: requestError } = await supabase
        .from('user_friends')
        .insert({
          user_id: user.id,
          friend_id: suggestion.suggested_user_id,
          requested_by: user.id,
          status: 'pending',
          requested_at: new Date().toISOString()
        })

      if (requestError) {
        console.error('Error sending friend request:', requestError)
        return NextResponse.json({ error: 'Failed to send friend request' }, { status: 500 })
      }

      // Mark suggestion as dismissed
      await supabase
        .from('friend_suggestions')
        .update({ is_dismissed: true })
        .eq('id', suggestionId)

      return NextResponse.json({
        success: true,
        message: 'Friend request sent'
      })
    }

  } catch (error) {
    console.error('Error handling suggestion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 