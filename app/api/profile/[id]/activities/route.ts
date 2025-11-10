import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    
    // Enterprise: Extract query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const filter = searchParams.get('filter') || 'all'
    const search = searchParams.get('search') || ''
    
    // Performance: Calculate offset for pagination
    const offset = (page - 1) * limit
    
    // First resolve the user ID (handle both UUID and permalink)
    let userId = id
    
    // Check if the ID looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    
    if (!isUUID) {
      // Try to find user by permalink
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, name, email')
        .eq('permalink', id)
        .single()
      
      if (userError || !user) {
        console.error('User not found for permalink:', id, userError)
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      
      userId = user.id
    }
    
    // Enterprise: Build optimized query with filters
    let query = supabaseAdmin
      .from('activities')
      .select(`
        id,
        activity_type,
        entity_type,
        entity_id,
        data,
        created_at,
        user_id
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Apply activity type filter
    if (filter !== 'all') {
      query = query.eq('activity_type', filter)
    }

    // Apply search filter (if implemented)
    if (search) {
      // Note: Full-text search would require additional setup
      // For now, we'll filter client-side
    }

    const { data: activities, error, count } = await query
    
    if (error) {
      console.error('Error fetching activities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      )
    }
    
    // Ensure activities is not null
    if (!activities) {
      return NextResponse.json({
        success: true,
        activities: [],
        has_more: false,
        total_count: 0,
        page,
        limit,
        analytics: {
          total_activities: 0,
          engagement_rate: 0,
          top_activity_type: 'book_added',
          average_engagement: 0,
          revenue_generated: 0,
          growth_rate: 0
        }
      })
    }

    // Enhance activities with entity details (handle missing entities gracefully)
    const enhancedActivities = await Promise.all(
      activities.map(async (activity) => {
        let entityDetails = null
        
        try {
          // Only fetch entity details if entity_type and entity_id are present
          if (activity.entity_type && activity.entity_id) {
            // Fetch entity details based on entity_type
            switch (activity.entity_type) {
              case 'book':
                const { data: book } = await supabaseAdmin
                  .from('books')
                  .select(`
                    id, 
                    title, 
                    synopsis,
                    author_id,
                    cover_image_id
                  `)
                  .eq('id', activity.entity_id)
                  .single()
                
                if (book) {
                  // Get author details if available
                  let authorDetails = null
                  if (book.author_id) {
                    const { data: author } = await supabaseAdmin
                      .from('authors')
                      .select('id, name')
                      .eq('id', book.author_id)
                      .single()
                    authorDetails = author
                  }
                  
                  // Get cover image if available
                  let coverImage = null
                  if (book.cover_image_id) {
                    const { data: image } = await supabaseAdmin
                      .from('images')
                      .select('url, alt_text')
                      .eq('id', book.cover_image_id)
                      .single()
                    coverImage = image
                  }
                  
                  entityDetails = {
                    ...book,
                    cover_image: coverImage,
                    author: authorDetails
                  }
                }
                break
                
              case 'author':
                const { data: author } = await supabaseAdmin
                  .from('authors')
                  .select('id, name, bio')
                  .eq('id', activity.entity_id)
                  .single()
                entityDetails = author
                break
                
              case 'publisher':
                const { data: publisher } = await supabaseAdmin
                  .from('publishers')
                  .select('id, name, website')
                  .eq('id', activity.entity_id)
                  .single()
                entityDetails = publisher
                break
                
              case 'user':
                const { data: user } = await supabaseAdmin
                  .from('users')
                  .select('id, name, email')
                  .eq('id', activity.entity_id)
                  .single()
                entityDetails = user
                break
                
              case 'group':
                const { data: group } = await supabaseAdmin
                  .from('groups')
                  .select('id, name, description')
                  .eq('id', activity.entity_id)
                  .single()
                entityDetails = group
                break
            }
          }
        } catch (entityError) {
          console.error(`Error fetching ${activity.entity_type} details:`, entityError)
          // Continue without entity details rather than failing
        }

        // Handle both old and new data structures for post content
        let postContent = null
        if (activity.activity_type === 'post_created' && activity.data) {
          // Try to get content from multiple possible fields
          postContent = activity.data.content || 
                       activity.data.text || 
                       activity.data.content_summary || 
                       'No content available'
        }

        return {
          ...activity,
          entity_details: entityDetails,
          post_content: postContent, // Add this for timeline display
          metadata: {
            engagement_count: 0,
            is_premium: false,
            privacy_level: 'public'
          }
        }
      })
    )

    // Enterprise: Calculate analytics
    const analytics = await calculateTimelineAnalytics(userId)
    
    // Enterprise: Determine if there are more activities
    const hasMore = count ? (offset + limit) < count : false

    const response = {
      success: true,
      activities: enhancedActivities,
      has_more: hasMore,
      total_count: count,
      page,
      limit,
      analytics
    }
    
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in profile activities API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Enterprise: Analytics calculation function
async function calculateTimelineAnalytics(userId: string) {
  try {
    // Get total activities count
    const { count: totalActivities } = await supabaseAdmin
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get activities from last 30 days for engagement calculation
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentActivities } = await supabaseAdmin
      .from('activities')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Calculate engagement metrics (simplified without metadata)
    const recentActivitiesCount = recentActivities?.length || 0
    const totalEngagement = recentActivitiesCount * 2 // Simulated engagement
    
    // Engagement calculation based on activity count
    const engagementRate = recentActivitiesCount > 0 
      ? Math.min(Math.round((totalEngagement / recentActivitiesCount) * 10), 100)
      : 0
    
    // Get top activity type
    const { data: activityTypes } = await supabaseAdmin
      .from('activities')
      .select('activity_type')
      .eq('user_id', userId)

    // Average engagement based on activity diversity
    const uniqueActivityTypes = new Set(activityTypes?.map(a => a.activity_type) || []).size
    const averageEngagement = Math.round(uniqueActivityTypes * 1.5) // More types = higher engagement

    const activityTypeCounts = activityTypes?.reduce((acc, activity) => {
      acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const topActivityType = Object.entries(activityTypeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'book_added'

    // Calculate real growth rate based on activity trends
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: weeklyActivities } = await supabaseAdmin
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())
    
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    
    const { count: previousWeekActivities } = await supabaseAdmin
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', fourteenDaysAgo.toISOString())
      .lt('created_at', sevenDaysAgo.toISOString())
    
    // Calculate growth rate as percentage change
    const thisWeek = weeklyActivities || 0
    const lastWeek = previousWeekActivities || 0
    const growthRate = lastWeek > 0 
      ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
      : thisWeek > 0 ? 100 : 0

    // Calculate revenue (simplified without metadata)
    const revenueGenerated = recentActivitiesCount * 0.5 // Simulated revenue

    return {
      total_activities: totalActivities || 0,
      engagement_rate: engagementRate,
      top_activity_type: topActivityType,
      average_engagement: averageEngagement,
      revenue_generated: revenueGenerated,
      growth_rate: growthRate
    }
  } catch (error) {
    console.error('Error calculating analytics:', error)
    return {
      total_activities: 0,
      engagement_rate: 0,
      top_activity_type: 'book_added',
      average_engagement: 0,
      revenue_generated: 0,
      growth_rate: 0
    }
  }
}