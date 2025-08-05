import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { activity_id, action } = await request.json()

    if (!activity_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate action type
    const validActions = ['like', 'comment', 'share']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action type' },
        { status: 400 }
      )
    }

    // Get current activity
    const { data: activity, error: fetchError } = await supabaseAdmin
      .from('activities')
      .select('id, metadata')
      .eq('id', activity_id)
      .single()

    if (fetchError || !activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    // Update engagement count
    const currentEngagement = activity.metadata?.engagement_count || 0
    const newMetadata = {
      ...activity.metadata,
      engagement_count: currentEngagement + 1,
      last_engagement: new Date().toISOString(),
      engagement_history: [
        ...(activity.metadata?.engagement_history || []),
        {
          action,
          timestamp: new Date().toISOString(),
          user_id: 'anonymous' // In a real app, this would be the authenticated user
        }
      ]
    }

    // Update the activity
    const { error: updateError } = await supabaseAdmin
      .from('activities')
      .update({ metadata: newMetadata })
      .eq('id', activity_id)

    if (updateError) {
      console.error('Error updating activity engagement:', updateError)
      return NextResponse.json(
        { error: 'Failed to update engagement' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      engagement_count: newMetadata.engagement_count,
      action
    })

  } catch (error) {
    console.error('Error in engagement API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 