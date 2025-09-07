-- =============================================================================
-- MIGRATION: Resolve Function Return Type Conflicts
-- =============================================================================
-- 
-- This migration resolves the conflicting return types in get_user_feed_activities
-- function by dropping all versions and creating a single, correct one.
--
-- =============================================================================

-- Drop ALL conflicting functions to start fresh
DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid, integer, integer);
DROP FUNCTION IF EXISTS public.get_user_activities_simple(uuid, integer, integer);
DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid, integer, integer);

-- Create the CORRECT function that matches the FeedPost interface
CREATE OR REPLACE FUNCTION public.get_user_feed_activities(
    p_user_id uuid,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    user_id uuid,
    user_name text,
    user_avatar_url text,
    activity_type text,
    data jsonb,
    created_at timestamptz,
    is_public boolean,
    like_count integer,
    comment_count integer,
    share_count integer,
    view_count integer,
    is_liked boolean,
    entity_type text,
    entity_id uuid,
    content_type text,
    text text,
    image_url text,
    link_url text,
    content_summary text,
    hashtags text[],
    visibility text,
    engagement_score numeric,
    updated_at timestamptz,
    cross_posted_to text[],
    collaboration_type text,
    ai_enhanced boolean,
    ai_enhanced_text text,
    ai_enhanced_performance numeric,
    metadata jsonb,
    publish_status text,
    published_at timestamptz,
    is_featured boolean,
    is_pinned boolean,
    bookmark_count integer,
    trending_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        act.id,
        act.user_id,
        COALESCE(usr.name, 'Unknown User') as user_name,
        '/placeholder.svg?height=200&width=200' as user_avatar_url,
        act.activity_type,
        COALESCE(act.data, '{}'::jsonb) as data,
        act.created_at,
        COALESCE(act.visibility = 'public', true) as is_public,
        COALESCE(act.like_count, 0) as like_count,
        COALESCE(act.comment_count, 0) as comment_count,
        COALESCE(act.share_count, 0) as share_count,
        COALESCE(act.view_count, 0) as view_count,
        false as is_liked, -- Default to false since we don't have user-specific like tracking yet
        COALESCE(act.entity_type, 'user') as entity_type,
        COALESCE(act.entity_id, act.user_id) as entity_id,
        COALESCE(act.content_type, 'text') as content_type,
        COALESCE(act.text, '') as text,
        COALESCE(act.image_url, '') as image_url,
        COALESCE(act.link_url, '') as link_url,
        COALESCE(act.content_summary, '') as content_summary,
        COALESCE(act.hashtags, '{}'::text[]) as hashtags,
        COALESCE(act.visibility, 'public') as visibility,
        COALESCE(act.engagement_score, 0) as engagement_score,
        COALESCE(act.updated_at, act.created_at) as updated_at,
        COALESCE(act.cross_posted_to, '{}'::text[]) as cross_posted_to,
        COALESCE(act.collaboration_type, 'individual') as collaboration_type,
        COALESCE(act.ai_enhanced, false) as ai_enhanced,
        COALESCE(act.ai_enhanced_text, '') as ai_enhanced_text,
        COALESCE(act.ai_enhanced_performance, 0) as ai_enhanced_performance,
        COALESCE(act.metadata, '{}'::jsonb) as metadata,
        COALESCE(act.publish_status, 'published') as publish_status,
        COALESCE(act.published_at, act.created_at) as published_at,
        COALESCE(act.is_featured, false) as is_featured,
        COALESCE(act.is_pinned, false) as is_pinned,
        COALESCE(act.bookmark_count, 0) as bookmark_count,
        COALESCE(act.trending_score, 0) as trending_score
    FROM public.activities act
    LEFT JOIN public.users usr ON act.user_id = usr.id
    WHERE act.user_id = p_user_id
      AND COALESCE(act.visibility, 'public') IN ('public', 'friends', 'followers')
    ORDER BY act.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_feed_activities(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_feed_activities(uuid, integer, integer) TO service_role;

-- Add function comment
COMMENT ON FUNCTION public.get_user_feed_activities(uuid, integer, integer) IS 
'Get user-specific feed activities with enterprise features. Returns activities in the format expected by the FeedPost interface.';

-- Verify the function was created successfully
SELECT 'Function get_user_feed_activities created successfully' as status;
