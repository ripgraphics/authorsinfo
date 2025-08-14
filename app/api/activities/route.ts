import { NextRequest, NextResponse } from 'next/server'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'user' // 'user' or 'public'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const activityType = searchParams.get('activity_type')
    const entityType = searchParams.get('entity_type')

    let data, error

    if (type === 'public') {
      // Get public feed activities
      const result = await supabase
        .rpc('get_public_feed_activities', {
          p_current_user_id: user.id,
          p_limit: limit,
          p_offset: offset
        })
      
      data = result.data
      error = result.error
    } else {
      // Get user-specific activities
      const result = await supabase
        .rpc('get_user_feed_activities', {
          p_user_id: user.id,
          p_limit: limit,
          p_offset: offset
        })
      
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Error fetching activities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      )
    }

    // Apply additional filters if provided
    let filteredData = data || []
    
    if (activityType) {
      filteredData = filteredData.filter(activity => 
        activity.activity_type === activityType
      )
    }
    
    if (entityType) {
      filteredData = filteredData.filter(activity => 
        activity.entity_type === entityType
      )
    }

    return NextResponse.json({
      activities: filteredData,
      pagination: {
        limit,
        offset,
        total: filteredData.length,
        has_more: filteredData.length === limit
      }
    })

  } catch (error) {
    console.error('Unexpected error in activities API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      activity_type,
      entity_type,
      entity_id,
      is_public = true,
      metadata = {},
      group_id,
      book_id,
      author_id,
      event_id
    } = body

    // Validate required fields
    if (!activity_type) {
      return NextResponse.json(
        { error: 'Activity type is required' },
        { status: 400 }
      )
    }

    // Create the activity
    const { data: activity, error } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        activity_type,
        entity_type,
        entity_id,
        is_public,
        metadata,
        group_id,
        book_id,
        author_id,
        event_id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating activity:', error)
      return NextResponse.json(
        { error: 'Failed to create activity' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Activity created successfully',
      activity
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error creating activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
