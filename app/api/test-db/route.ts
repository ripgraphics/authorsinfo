import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    console.log('🧪 Testing database connectivity...')
    
    const supabase = createRouteHandlerClient({ 
      cookies
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.id)

    // Test if tables exist and have data
    const results: any = {}

    // Test activities table
    try {
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('id, content_type')
        .limit(5)

      if (activitiesError) {
        results.activities = { error: activitiesError.message }
      } else {
        results.activities = { count: activities?.length || 0, sample: activities?.slice(0, 2) }
      }
    } catch (error) {
      results.activities = { error: 'Table access failed' }
    }

    // Test activity_likes table
    try {
      const { data: likes, error: likesError } = await supabase
        .from('activity_likes')
        .select('id, activity_id, user_id')
        .limit(5)

      if (likesError) {
        results.activity_likes = { error: likesError.message }
      } else {
        results.activity_likes = { count: likes?.length || 0, sample: likes?.slice(0, 2) }
      }
    } catch (error) {
      results.activity_likes = { error: 'Table access failed' }
    }

    // Test activity_comments table
    try {
      const { data: comments, error: commentsError } = await supabase
        .from('activity_comments')
        .select('id, activity_id, user_id, comment_text')
        .limit(5)

      if (commentsError) {
        results.activity_comments = { error: commentsError.message }
      } else {
        results.activity_comments = { count: comments?.length || 0, sample: comments?.slice(0, 2) }
      }
    } catch (error) {
      results.activity_comments = { error: 'Table access failed' }
    }

    console.log('📊 Database test results:', results)

    return NextResponse.json({
      success: true,
      message: 'Database connectivity test completed',
      results
    })

  } catch (error) {
    console.error('❌ Database test error:', error)
    return NextResponse.json(
      { 
        error: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
