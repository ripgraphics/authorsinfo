-- =============================================================================
-- MIGRATION: Fix Timeline Type Mismatch Errors
-- =============================================================================
-- 
-- This migration fixes the type mismatch errors in get_user_feed_activities
-- function, specifically fixing COALESCE type mismatches between text[] and text.
--
-- =============================================================================

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid, integer, integer);

-- Create the corrected function that handles type mismatches properly
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
        '/placeholder.svg?height=200&width=200'::text as user_avatar_url,
        a.activity_type::text,
        COALESCE(a.data, '{}'::jsonb) as data,
        a.created_at::text,
        (COALESCE(a.visibility, 'public') = 'public')::boolean as is_public,
        COALESCE(a.like_count, 0)::integer as like_count,
        COALESCE(a.comment_count, 0)::integer as comment_count,
        COALESCE(a.share_count, 0)::integer as share_count,
        COALESCE(a.view_count, 0)::integer as view_count,
        false::boolean as is_liked,
        COALESCE(a.entity_type, 'user')::text as entity_type,
        COALESCE(a.entity_id::text, a.user_id::text) as entity_id,
        -- NEW COLUMNS FOR ENHANCED POST DISPLAY
        COALESCE(a.content_type, 'text')::text as content_type,
        COALESCE(a.text, a.data->>'content', a.data->>'text', '')::text as text,
        COALESCE(a.image_url, a.data->>'image_url', a.data->>'images', '')::text as image_url,
        COALESCE(a.link_url, a.data->>'link_url', a.data->>'url', '')::text as link_url,
        COALESCE(a.content_summary, a.data->>'content_summary', a.data->>'summary', '')::text as content_summary,
        -- Fix: Handle hashtags array properly - convert JSON text to array if needed
        CASE 
            WHEN a.hashtags IS NOT NULL THEN a.hashtags
            WHEN a.data->>'hashtags' IS NOT NULL THEN 
                CASE 
                    WHEN a.data->>'hashtags' = '[]' THEN '{}'::text[]
                    WHEN a.data->>'hashtags' LIKE '[%]' THEN 
                        string_to_array(trim(both '[]' from a.data->>'hashtags'), ',')::text[]
                    ELSE ARRAY[a.data->>'hashtags']::text[]
                END
            ELSE '{}'::text[]
        END as hashtags,
        COALESCE(a.visibility, 'public')::text as visibility,
        COALESCE(a.engagement_score, 0)::numeric as engagement_score,
        COALESCE(a.updated_at, a.created_at)::text as updated_at,
        -- ENTERPRISE FEATURES
        -- Fix: Handle cross_posted_to array properly
        CASE 
            WHEN a.cross_posted_to IS NOT NULL THEN a.cross_posted_to
            WHEN a.data->>'cross_posted_to' IS NOT NULL THEN 
                CASE 
                    WHEN a.data->>'cross_posted_to' = '[]' THEN '{}'::text[]
                    WHEN a.data->>'cross_posted_to' LIKE '[%]' THEN 
                        string_to_array(trim(both '[]' from a.data->>'cross_posted_to'), ',')::text[]
                    ELSE ARRAY[a.data->>'cross_posted_to']::text[]
                END
            ELSE '{}'::text[]
        END as cross_posted_to,
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_feed_activities(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_feed_activities(uuid, integer, integer) TO service_role;

-- Add function comment
COMMENT ON FUNCTION public.get_user_feed_activities(uuid, integer, integer) IS 
'Fixed function to get user-specific activities with proper type handling for arrays and text fields. Resolves COALESCE type mismatch errors while maintaining all enhanced features.';
