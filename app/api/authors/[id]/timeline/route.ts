import { NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await context.params
    const authorId = resolvedParams.id

    if (!authorId) {
      return NextResponse.json({ error: 'Author ID is required' }, { status: 400 })
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Use the entity timeline function for author timelines
    // This gets posts ABOUT the author, not BY the author
    const { data: activities, error } = await supabaseAdmin.rpc('get_entity_timeline_activities', {
      p_entity_type: 'author',
      p_entity_id: authorId,
      p_limit: limit,
      p_offset: offset,
    })

    if (error) {
      console.error('Error fetching author timeline activities:', error)
      return NextResponse.json(
        {
          error: 'Failed to fetch author timeline activities',
          details: error.message,
        },
        { status: 500 }
      )
    }

    // Debug: Log what we got from the database
    console.log('=== AUTHOR TIMELINE API DEBUG ===')
    console.log('Author ID:', authorId)
    console.log('Raw activities from DB:', activities)
    console.log('Number of activities:', activities?.length || 0)
    if (activities && activities.length > 0) {
      console.log('First activity sample:', activities[0])
      console.log('First activity text field:', activities[0]?.text)
      console.log('First activity data field:', activities[0]?.data)
      console.log('First activity content_type:', activities[0]?.content_type)
      console.log('First activity activity_type:', activities[0]?.activity_type)
      console.log(
        'First activity ALL fields:',
        Object.keys(activities[0]).map((key) => `${key}: ${activities[0][key]}`)
      )
    }
    console.log('================================')

    // FALLBACK: If RPC function returns no data, try direct query
    let fallbackActivities: any[] | null = null
    if (!activities || activities.length === 0) {
      console.log('⚠️ RPC function returned no data, trying direct query...')

      const { data: directData, error: directError } = await supabaseAdmin
        .from('activities')
        .select('*')
        .eq('entity_type', 'author')
        .eq('entity_id', authorId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (directError) {
        console.error('Direct query error:', directError)
      } else {
        fallbackActivities = directData || null
        console.log('✅ Direct query returned:', fallbackActivities?.length || 0, 'activities')
        if (fallbackActivities && fallbackActivities.length > 0) {
          const firstActivity = fallbackActivities[0]
          console.log('First direct query activity:', firstActivity)
          console.log('First direct query text field:', firstActivity?.text)
          console.log(
            'First direct query ALL fields:',
            Object.keys(firstActivity || {}).map((key) => `${key}: ${(firstActivity as any)[key]}`)
          )
        }
      }
    }

    // Use fallback data if RPC function failed
    const finalActivities = activities || fallbackActivities || []
    console.log('🔍 Final activities to transform:', finalActivities?.length || 0)
    if (finalActivities && finalActivities.length > 0) {
      console.log('🔍 First final activity before transform:', finalActivities[0])
    }

    // Transform the data to match the expected structure
    const transformedActivities =
      finalActivities?.map((activity: any) => ({
        id: activity.id,
        user_id: activity.user_id,
        user_name: activity.user_name,
        user_avatar_url: activity.user_avatar_url,
        activity_type: activity.activity_type,
        data: activity.data,
        created_at: activity.created_at,
        is_public: activity.is_public,
        like_count: activity.like_count,
        comment_count: activity.comment_count,
        share_count: activity.share_count,
        view_count: activity.view_count,
        is_liked: activity.is_liked,
        entity_type: activity.entity_type,
        entity_id: activity.entity_id,
        // New enhanced columns
        content_type: activity.content_type,
        text: activity.text,
        image_url: activity.image_url,
        link_url: activity.link_url,
        content_summary: activity.content_summary,
        hashtags: activity.hashtags,
        visibility: activity.visibility,
        engagement_score: activity.engagement_score,
        updated_at: activity.updated_at,
        // Enterprise features
        cross_posted_to: activity.cross_posted_to,
        collaboration_type: activity.collaboration_type,
        ai_enhanced: activity.ai_enhanced,
        ai_enhanced_text: activity.ai_enhanced_text,
        ai_enhanced_performance: activity.ai_enhanced_performance,
        metadata: activity.metadata,
        // User reaction information
        user_reaction_type: activity.user_reaction_type,
      })) || []

    // Debug: Log the transformed data
    console.log('=== TRANSFORMED DATA DEBUG ===')
    console.log('Transformed activities count:', transformedActivities.length)
    if (transformedActivities.length > 0) {
      console.log('First transformed activity:', transformedActivities[0])
      console.log('First transformed text field:', transformedActivities[0]?.text)
      console.log('First transformed data field:', transformedActivities[0]?.data)
    }
    console.log('================================')

    return NextResponse.json({
      activities: transformedActivities,
      total: transformedActivities.length,
      limit,
      offset,
    })
  } catch (err) {
    console.error('Internal server error in author timeline route:', err)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
