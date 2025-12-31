import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Check if activities table has any data
    const {
      data: activities,
      error: activitiesError,
      count,
    } = await supabaseAdmin.from('activities').select('*', { count: 'exact', head: true })

    if (activitiesError) {
      return NextResponse.json(
        {
          error: 'Failed to check activities table',
          details: activitiesError,
        },
        { status: 500 }
      )
    }

    // Check users table
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, permalink')
      .limit(5)

    if (usersError) {
      return NextResponse.json(
        {
          error: 'Failed to check users table',
          details: usersError,
        },
        { status: 500 }
      )
    }

    // Check if there are any activities at all
    const { data: sampleActivities, error: sampleError } = await supabaseAdmin
      .from('activities')
      .select('id, user_id, activity_type, created_at')
      .limit(5)

    return NextResponse.json({
      success: true,
      activities_table: {
        total_count: count || 0,
        has_data: (count || 0) > 0,
        sample_activities: sampleActivities || [],
      },
      users_table: {
        sample_users: users || [],
      },
      database_status: 'connected',
    })
  } catch (error) {
    console.error('Error checking database state:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error,
      },
      { status: 500 }
    )
  }
}
