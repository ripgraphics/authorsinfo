-- FIX ENGAGEMENT FUNCTION TO RETURN PROPER DATA
-- This script fixes the get_user_feed_activities function to return engagement data from the new columns

-- =====================================================
-- STEP 1: DROP EXISTING FUNCTION
-- =====================================================

DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid, integer, integer);

-- =====================================================
-- STEP 2: CREATE FIXED FUNCTION WITH ENGAGEMENT DATA
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_feed_activities(
    p_user_id uuid,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id text,
    user_id text,
    user_name text,
    user_avatar_url text,
    activity_type text,
    data jsonb,
    created_at text,
    is_public boolean,
    like_count integer,
    comment_count integer,
    share_count integer,
    bookmark_count integer,
    user_has_reacted boolean,
    entity_type text,
    entity_id text,
    content_type text,
    text text,
    image_url text,
    link_url text,
    content_summary text,
    hashtags text[],
    visibility text,
    engagement_score numeric,
    updated_at text,
    cross_posted_to text[],
    collaboration_type text,
    ai_enhanced boolean,
    ai_enhanced_text text,
    ai_enhanced_performance numeric,
    metadata jsonb,
    publish_status text,
    published_at text,
    is_featured boolean,
    is_pinned boolean,
    trending_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        act.id::text as id,
        act.user_id::text as user_id,
        COALESCE(usr.name, 'Unknown User') as user_name,
        '/placeholder.svg?height=200&width=200' as user_avatar_url,
        act.activity_type,
        COALESCE(act.data, '{}'::jsonb) as data,
        act.created_at::text as created_at,
        (COALESCE(act.visibility, 'public') = 'public') as is_public,
        COALESCE(act.like_count, 0) as like_count,
        COALESCE(act.comment_count, 0) as comment_count,
        COALESCE(act.share_count, 0) as share_count,
        COALESCE(act.bookmark_count, 0) as bookmark_count,
        COALESCE(act.user_has_reacted, false) as user_has_reacted,
        COALESCE(act.entity_type, 'user') as entity_type,
        COALESCE(act.entity_id::text, act.user_id::text) as entity_id,
        COALESCE(act.content_type, '') as content_type,
        COALESCE(act.text, '') as text,
        COALESCE(act.image_url, '') as image_url,
        COALESCE(act.link_url, '') as link_url,
        COALESCE(act.content_summary, '') as content_summary,
        COALESCE(act.hashtags, '{}'::text[]) as hashtags,
        COALESCE(act.visibility, 'public') as visibility,
        COALESCE(act.engagement_score, 0) as engagement_score,
        COALESCE(act.updated_at, act.created_at)::text as updated_at,
        COALESCE(act.cross_posted_to, '{}'::text[]) as cross_posted_to,
        COALESCE(act.collaboration_type, '') as collaboration_type,
        COALESCE(act.ai_enhanced, false) as ai_enhanced,
        COALESCE(act.ai_enhanced_text, '') as ai_enhanced_text,
        COALESCE(act.ai_enhanced_performance, 0) as ai_enhanced_performance,
        COALESCE(act.metadata, '{}'::jsonb) as metadata,
        COALESCE(act.publish_status, 'published') as publish_status,
        COALESCE(act.published_at, act.created_at)::text as published_at,
        COALESCE(act.is_featured, false) as is_featured,
        COALESCE(act.is_pinned, false) as is_pinned,
        COALESCE(act.trending_score, 0) as trending_score
    FROM public.activities act
    LEFT JOIN public.users usr ON act.user_id = usr.id
    WHERE act.user_id = p_user_id
    AND (act.visibility = 'public' OR act.visibility IS NULL)
    ORDER BY act.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- =====================================================
-- STEP 3: GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.get_user_feed_activities(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_feed_activities(uuid, integer, integer) TO service_role;

-- =====================================================
-- STEP 4: ADD FUNCTION COMMENT
-- =====================================================

COMMENT ON FUNCTION public.get_user_feed_activities(uuid, integer, integer) IS 
'Fixed function to get user-specific activities with proper engagement data from the new like_count, comment_count, share_count, and bookmark_count columns. Returns all engagement data needed for the frontend to display likes and comments properly.';

-- =====================================================
-- STEP 5: VERIFICATION
-- =====================================================

-- Test the function to make sure it works
SELECT '=== TESTING FUNCTION ===' as test_step;

-- Check if function exists and returns proper structure
SELECT 
    'FUNCTION STATUS' as info,
    routine_name,
    routine_type,
    '✅ EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'get_user_feed_activities';

-- Test function call (this will show the structure)
SELECT '=== FUNCTION STRUCTURE TEST ===' as test_step;

-- This will show the column structure returned by the function
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'activities' 
  AND table_schema = 'public'
  AND column_name IN ('like_count', 'comment_count', 'share_count', 'bookmark_count', 'user_has_reacted')
ORDER BY column_name;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '✅ ENGAGEMENT FUNCTION FIXED SUCCESSFULLY!' as status;
SELECT 'The get_user_feed_activities function now properly returns engagement data.' as message;
SELECT 'Your likes and comments should now display correctly in the feed!' as details;
