import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Get all activities
    const { data: activities, error } = await supabaseAdmin
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching activities:', error)
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
    }

    // Get users to see what user IDs exist
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .limit(10)

    if (usersError) {
      console.error('Error fetching users:', usersError)
    }

    // Get count of activities
    const { count: totalActivities } = await supabaseAdmin
      .from('activities')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      total_activities: totalActivities || 0,
      activities: activities || [],
      users: users || [],
      message: 'Debug information retrieved successfully',
    })
  } catch (error) {
    console.error('Error in debug activities API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
