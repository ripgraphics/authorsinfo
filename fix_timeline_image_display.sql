-- =============================================================================
-- COMPREHENSIVE TIMELINE IMAGE DISPLAY FIX
-- =============================================================================
-- 
-- ISSUE: The get_user_feed_activities function is not returning the new columns
-- that were added to the activities table (image_url, text, content_type, etc.)
-- This causes the frontend to show "No content available" for posts with images
-- and prevents proper image rendering in the timeline.
--
-- SOLUTION: Update the function to return all the new columns and provide
-- backward compatibility for old posts that still use the data JSONB field.
--
-- =============================================================================

-- Step 1: Drop the existing function
DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid, integer, integer);

-- Step 2: Create the enhanced function that returns all new columns
CREATE OR REPLACE FUNCTION public.get_user_feed_activities(
    p_user_id uuid,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
) RETURNS TABLE(
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
    view_count integer,
    is_liked boolean,
    entity_type text,
    entity_id text,
    -- NEW COLUMNS FOR ENHANCED POST DISPLAY
    content_type text,
    text text,
    image_url text,
    link_url text,
    content_summary text,
    hashtags text[],
    visibility text,
    engagement_score numeric,
    updated_at text,
    -- ENTERPRISE FEATURES
    cross_posted_to text[],
    collaboration_type text,
    ai_enhanced boolean,
    ai_enhanced_text text,
    ai_enhanced_performance numeric,
    metadata jsonb
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Return activities from the enhanced activities table with all new columns
    RETURN QUERY
    SELECT 
        a.id::text,
        a.user_id::text,
        COALESCE(u.name, u.email, 'Unknown User')::text as user_name,
        '/placeholder.svg?height=200&width=200'::text as user_avatar_url, -- Fixed: no avatar_url column
        a.activity_type::text,
        COALESCE(a.data, '{}'::jsonb) as data,
        a.created_at::text,
        (COALESCE(a.visibility, 'public') = 'public')::boolean as is_public,
        COALESCE(a.like_count, 0)::integer as like_count,
        COALESCE(a.comment_count, 0)::integer as comment_count,
        COALESCE(a.share_count, 0)::integer as share_count,
        COALESCE(a.view_count, 0)::integer as view_count,
        false::boolean as is_liked, -- TODO: Implement like checking
        COALESCE(a.entity_type, 'user')::text as entity_type,
        COALESCE(a.entity_id::text, a.user_id::text) as entity_id,
        -- NEW COLUMNS FOR ENHANCED POST DISPLAY
        COALESCE(a.content_type, 'text')::text as content_type,
        COALESCE(a.text, a.data->>'content', a.data->>'text', '')::text as text,
        COALESCE(a.image_url, a.data->>'image_url', a.data->>'images', '')::text as image_url,
        COALESCE(a.link_url, a.data->>'link_url', a.data->>'url', '')::text as link_url,
        COALESCE(a.content_summary, a.data->>'content_summary', a.data->>'summary', '')::text as content_summary,
        COALESCE(a.hashtags, a.data->>'hashtags', '{}'::text[]) as hashtags,
        COALESCE(a.visibility, 'public')::text as visibility,
        COALESCE(a.engagement_score, 0)::numeric as engagement_score,
        COALESCE(a.updated_at, a.created_at)::text as updated_at,
        -- ENTERPRISE FEATURES
        COALESCE(a.cross_posted_to, '{}'::text[]) as cross_posted_to,
        COALESCE(a.collaboration_type, 'individual')::text as collaboration_type,
        COALESCE(a.ai_enhanced, false)::boolean as ai_enhanced,
        COALESCE(a.ai_enhanced_text, '')::text as ai_enhanced_text,
        COALESCE(a.ai_enhanced_performance, 0)::numeric as ai_enhanced_performance,
        COALESCE(a.metadata, '{}'::jsonb) as metadata
    FROM public.activities a
    LEFT JOIN public.users u ON a.user_id = u.id
    WHERE a.user_id = p_user_id
      AND COALESCE(a.visibility, 'public') IN ('public', 'friends', 'followers')
    ORDER BY a.created_at DESC
    LIMIT p_limit OFFSET p_offset;
    
    -- If no activities found, return empty result
    IF NOT FOUND THEN
        RETURN;
    END IF;
END;
$$;

-- Step 3: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_feed_activities(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_feed_activities(uuid, integer, integer) TO service_role;

-- Step 4: Add function comment
COMMENT ON FUNCTION public.get_user_feed_activities(uuid, integer, integer) IS 
'Enhanced function to get user-specific activities with all new columns for proper timeline display including images, text, and enterprise features. Provides backward compatibility for old posts while supporting new enhanced post structure.';

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Test the function with a sample user (replace with actual user ID)
-- SELECT * FROM public.get_user_feed_activities('your-user-id-here', 5, 0);

-- Check if the function returns the expected columns
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'get_user_feed_activities' 
-- ORDER BY ordinal_position;

-- =============================================================================
-- MIGRATION NOTES
-- =============================================================================
--
-- This fix addresses the following issues:
-- 1. Missing image_url column in function return
-- 2. Missing text column in function return  
-- 3. Missing content_type column in function return
-- 4. Missing enterprise feature columns
-- 5. Backward compatibility for old posts using data JSONB field
--
-- The function now provides:
-- - Direct access to new columns (image_url, text, content_type, etc.)
-- - Fallback to data JSONB field for old posts
-- - All enterprise features (AI enhancement, collaboration, etc.)
-- - Proper content type detection for frontend rendering
--
-- Frontend components should now receive:
-- - image_url: Direct image URL or extracted from data field
-- - text: Post text content or extracted from data field
-- - content_type: Proper content type for rendering logic
-- - All other enterprise features for enhanced functionality
--
-- =============================================================================
