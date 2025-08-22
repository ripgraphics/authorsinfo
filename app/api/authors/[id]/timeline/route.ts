import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { params } = context;
    const resolvedParams = await params;
    const authorId = resolvedParams.id;
    
    if (!authorId) {
      return NextResponse.json({ error: 'Author ID is required' }, { status: 400 });
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Use the same database function that works for profiles
    // This ensures consistent data structure across all entities
    const { data: activities, error } = await supabaseAdmin
      .rpc('get_user_feed_activities', {
        p_user_id: authorId,
        p_limit: limit,
        p_offset: offset
      });

    if (error) {
      console.error('Error fetching author timeline activities:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch author timeline activities',
        details: error.message 
      }, { status: 500 });
    }

    // Transform the data to match the expected structure
    const transformedActivities = activities?.map((activity: any) => ({
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
      metadata: activity.metadata
    })) || [];

    return NextResponse.json({
      activities: transformedActivities,
      total: transformedActivities.length,
      limit,
      offset
    });

  } catch (err) {
    console.error('Internal server error in author timeline route:', err);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
