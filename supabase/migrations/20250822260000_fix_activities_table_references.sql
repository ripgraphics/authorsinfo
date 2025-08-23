-- =============================================================================
-- MIGRATION: Fix Activities Table References in Timeline Functions
-- =============================================================================
-- 
-- This migration fixes the activities table references in timeline functions
-- to use the correct table structure with 'visibility' instead of 'is_public'.
--
-- =============================================================================

-- Fix the entity timeline function to use correct activities table structure
CREATE OR REPLACE FUNCTION public.get_entity_timeline_activities(
    p_entity_type text,
    p_entity_id uuid,
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
    metadata jsonb
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Return activities related to the specified entity, including likes
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
        false::boolean as is_liked, -- Will be calculated per user
        COALESCE(a.entity_type, 'user')::text as entity_type,
        COALESCE(a.entity_id::text, a.user_id::text) as entity_id,
        -- Enhanced columns with like activity support
        CASE 
            WHEN a.activity_type = 'like' THEN 'like'
            ELSE COALESCE(a.content_type, 'text')
        END::text as content_type,
        CASE 
            WHEN a.activity_type = 'like' THEN 
                COALESCE(u.name, u.email, 'User') || ' liked ' || COALESCE(a.data->>'liked_activity_content', 'a post')
            ELSE COALESCE(a.text, a.data->>'content', a.data->>'text', '')
        END::text as text,
        CASE 
            WHEN a.activity_type = 'like' THEN 
                -- For likes, show the original post's image if available
                COALESCE(a.data->>'liked_activity_image', '')
            ELSE COALESCE(a.image_url, a.data->>'image_url', a.data->>'images', '')
        END::text as image_url,
        COALESCE(a.link_url, a.data->>'link_url', a.data->>'url', '')::text as link_url,
        CASE 
            WHEN a.activity_type = 'like' THEN 
                COALESCE(u.name, u.email, 'User') || ' liked a post'
            ELSE COALESCE(a.content_summary, a.data->>'content_summary', a.data->>'summary', '')
        END::text as content_summary,
        -- Handle hashtags array properly
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
        -- Enterprise features
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
        a.collaboration_type,
        a.ai_enhanced,
        a.ai_enhanced_text,
        a.ai_enhanced_performance,
        a.metadata
    FROM (
        -- Get regular activities for the entity
        SELECT a.*
        FROM public.activities a
        WHERE a.entity_type = p_entity_type 
        AND a.entity_id = p_entity_id
        AND a.activity_type != 'like'
        
        UNION ALL
        
        -- Get like activities that reference this entity
        SELECT a.*
        FROM public.activities a
        WHERE a.activity_type = 'like'
        AND a.data->>'liked_entity_type' = p_entity_type
        AND a.data->>'liked_entity_id' = p_entity_id::text
    ) a
    LEFT JOIN public.users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Fix the user feed function to use correct activities table structure
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
    metadata jsonb
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Return activities for the user's feed, including likes from followed entities
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
        EXISTS (SELECT 1 FROM public.activity_likes l WHERE l.activity_id = a.id::uuid AND l.user_id = p_user_id)::boolean as is_liked,
        COALESCE(a.entity_type, 'user')::text as entity_type,
        COALESCE(a.entity_id::text, a.user_id::text) as entity_id,
        -- Enhanced columns with like activity support
        CASE 
            WHEN a.activity_type = 'like' THEN 'like'
            ELSE COALESCE(a.content_type, 'text')
        END::text as content_type,
        CASE 
            WHEN a.activity_type = 'like' THEN 
                COALESCE(u.name, u.email, 'User') || ' liked ' || COALESCE(a.data->>'liked_activity_content', 'a post')
            ELSE COALESCE(a.text, a.data->>'content', a.data->>'text', '')
        END::text as text,
        CASE 
            WHEN a.activity_type = 'like' THEN 
                -- For likes, show the original post's image if available
                COALESCE(a.data->>'liked_activity_image', '')
            ELSE COALESCE(a.image_url, a.data->>'image_url', a.data->>'images', '')
        END::text as image_url,
        COALESCE(a.link_url, a.data->>'link_url', a.data->>'url', '')::text as link_url,
        CASE 
            WHEN a.activity_type = 'like' THEN 
                COALESCE(u.name, u.email, 'User') || ' liked a post'
            ELSE COALESCE(a.content_summary, a.data->>'content_summary', a.data->>'summary', '')
        END::text as content_summary,
        -- Handle hashtags array properly
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
        -- Enterprise features
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
        a.collaboration_type,
        a.ai_enhanced,
        a.ai_enhanced_text,
        a.ai_enhanced_performance,
        a.metadata
    FROM (
        -- Get user's own activities
        SELECT a.*
        FROM public.activities a
        WHERE a.user_id = p_user_id
        
        UNION ALL
        
        -- Get activities from followed users (simplified - just user-to-user follows)
        SELECT a.*
        FROM public.activities a
        INNER JOIN public.follows f ON f.follower_id = p_user_id AND f.following_id = a.user_id
        WHERE a.user_id != p_user_id
        AND a.visibility = 'public'
        
        UNION ALL
        
        -- Get like activities from followed users
        SELECT a.*
        FROM public.activities a
        INNER JOIN public.follows f ON f.follower_id = p_user_id AND f.following_id = a.user_id
        WHERE a.activity_type = 'like'
        AND a.user_id != p_user_id
        AND a.visibility = 'public'
    ) a
    LEFT JOIN public.users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_entity_timeline_activities(text, uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_feed_activities(uuid, integer, integer) TO authenticated;
