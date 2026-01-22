import { NextRequest, NextResponse } from 'next/server'
import { createServerActionClientAsync } from '@/lib/supabase/client-helper'
import { validateAndFilterPayload } from '@/lib/schema/schema-validators'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerActionClientAsync()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
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
      const result = await (supabase.rpc as any)('get_public_feed_activities', {
        p_current_user_id: user.id,
        p_limit: limit,
        p_offset: offset,
      })

      data = result.data
      error = result.error
    } else {
      // Get user-specific activities
      const result = await (supabase.rpc as any)('get_user_feed_activities', {
        p_user_id: user.id,
        p_limit: limit,
        p_offset: offset,
      })

      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Error fetching activities:', error)
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
    }

    // Apply additional filters if provided
    let filteredData: any[] = data || []

    if (activityType) {
      filteredData = filteredData.filter((activity: any) => activity.activity_type === activityType)
    }

    if (entityType) {
      filteredData = filteredData.filter((activity: any) => activity.entity_type === entityType)
    }

    // Fetch dynamic engagement counts for feed activities
    let countsMap: Record<string, { likes_count: number; comments_count: number }> = {}
    if (filteredData.length > 0) {
      try {
        const postIds = filteredData.map((row: any) => row.id)
        const postTypes = filteredData.map((row: any) => row.entity_type === 'book' ? 'book' : 'post')
        
        const { data: batchCounts, error: batchError } = await (supabase.rpc as any)('get_multiple_entities_engagement', {
          p_entity_ids: postIds,
          p_entity_types: postTypes
        })
        
        if (!batchError && Array.isArray(batchCounts)) {
          countsMap = batchCounts.reduce((acc: any, item: any) => {
            acc[item.entity_id] = {
              likes_count: Number(item.likes_count || 0),
              comments_count: Number(item.comments_count || 0)
            }
            return acc
          }, {})
        }
      } catch (e) {
        console.error('Error fetching batch engagement counts in feed:', e)
      }
    }

    const activitiesWithCounts = filteredData.map((activity: any) => {
      const engagement = countsMap[activity.id] || { likes_count: 0, comments_count: 0 }
      return {
        ...activity,
        like_count: engagement.likes_count,
        comment_count: engagement.comments_count
      }
    })

    return NextResponse.json({
      activities: activitiesWithCounts,
      pagination: {
        limit,
        offset,
        total: activitiesWithCounts.length,
        has_more: activitiesWithCounts.length === limit,
      },
    })
  } catch (error) {
    console.error('Unexpected error in activities API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerActionClientAsync()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
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
      event_id,
    } = body

    // Validate required fields
    if (!activity_type) {
      return NextResponse.json({ error: 'Activity type is required' }, { status: 400 })
    }

    // Prepare payload
    const payload = {
      user_id: user.id,
      activity_type,
      entity_type,
      entity_id,
      is_public,
      metadata,
      group_id,
      book_id,
      author_id,
      event_id,
    }

    // Validate and filter payload against actual schema
    const {
      payload: filteredPayload,
      removedColumns,
      warnings,
    } = await validateAndFilterPayload('activities', payload)

    // Log warnings if any columns were removed
    if (removedColumns.length > 0) {
      console.warn(`Removed non-existent columns from activities insert:`, removedColumns)
    }

    // Create the activity with filtered payload
    const { data: activity, error } = await (supabase.from('posts') as any)
      .insert(filteredPayload)
      .select()
      .single()

    if (error) {
      console.error('Error creating activity:', error)
      return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: 'Activity created successfully',
        activity,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error creating activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/activities/[id] - Update activity
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerActionClientAsync()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { id, text, image_url, link_url, visibility } = body

    // Check if activity exists and user owns it
    const { data: existingActivity, error: fetchError } = await supabase
      .from('posts')
      .select('user_id, activity_type, content_type, text, image_url, link_url, visibility')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    if ((existingActivity as any).user_id !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own activities' }, { status: 403 })
    }

    // Allow editing of various post-like activity types
    const editableActivityTypes = [
      'post_created',
      'book_review',
      'book_share',
      'reading_progress',
      'book_added',
      'author_follow',
      'book_recommendation',
    ]
    const isEditableActivity =
      editableActivityTypes.includes((existingActivity as any).activity_type) ||
      (existingActivity as any).content_type === 'text' ||
      (existingActivity as any).content_type === 'image' ||
      (existingActivity as any).content_type === 'video'

    if (!isEditableActivity) {
      return NextResponse.json(
        { error: `Activity type '${(existingActivity as any).activity_type}' cannot be edited` },
        { status: 400 }
      )
    }

    // Update the activity
    const { data: updatedActivity, error: updateError } = await (supabase.from('posts') as any)
      .update({
        text: text || (existingActivity as any).text,
        image_url: image_url !== undefined ? image_url : (existingActivity as any).image_url,
        link_url: link_url !== undefined ? link_url : (existingActivity as any).link_url,
        visibility: visibility || (existingActivity as any).visibility,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating activity:', updateError)
      return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      activity: updatedActivity,
      message: 'Activity updated successfully',
    })
  } catch (error) {
    console.error('Error updating activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/activities/[id] - Delete activity
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerActionClientAsync()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing activity ID' }, { status: 400 })
    }

    // Check if activity exists and user owns it
    const { data: existingActivity, error: fetchError } = await supabase
      .from('posts')
      .select('user_id, activity_type, entity_type, content_type')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching activity for deletion:', fetchError)
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
    }

    if (!existingActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    if ((existingActivity as any).user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own activities' },
        { status: 403 }
      )
    }

    // More flexible validation - allow deletion of various activity types
    const allowedActivityTypes = ['post_created', 'book_added', 'review_created', 'list_created']
    const isDeletableActivity =
      allowedActivityTypes.includes((existingActivity as any).activity_type) ||
      (existingActivity as any).content_type === 'text' ||
      (existingActivity as any).content_type === 'image' ||
      (existingActivity as any).content_type === 'video'

    if (!isDeletableActivity) {
      console.log('Activity type not allowed for deletion:', {
        activityType: (existingActivity as any).activity_type,
        contentType: (existingActivity as any).content_type,
        entityType: (existingActivity as any).entity_type,
      })
      return NextResponse.json(
        { error: `Activity type '${(existingActivity as any).activity_type}' cannot be deleted` },
        { status: 400 }
      )
    }

    // Hard delete the activity (activities table doesn't have is_deleted column)
    const { error: deleteError } = await (supabase.from('posts') as any).delete().eq('id', id)

    if (deleteError) {
      console.error('Error deleting activity:', deleteError)
      return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Activity deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

