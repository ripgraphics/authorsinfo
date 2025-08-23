-- =============================================================================
-- MIGRATION: Create Entity Timeline Function
-- =============================================================================
-- 
-- This migration creates a new function specifically for entity timelines
-- that can handle authors, books, publishers, and groups, not just users.
--
-- =============================================================================

-- Create the entity timeline function
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
    -- Enhanced columns for better post display
    content_type text,
    text text,
    image_url text,
    link_url text,
    content_summary text,
    hashtags text[],
    visibility text,
    engagement_score numeric,
    updated_at text,
    -- Enterprise features
    cross_posted_to text[],
    collaboration_type text,
    ai_enhanced boolean,
    ai_enhanced_text text,
    ai_enhanced_performance numeric,
    metadata jsonb
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Return activities related to the specified entity
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
        -- Enhanced columns
        COALESCE(a.content_type, 'text')::text as content_type,
        COALESCE(a.text, a.data->>'content', a.data->>'text', '')::text as text,
        COALESCE(a.image_url, a.data->>'image_url', a.data->>'images', '')::text as image_url,
        COALESCE(a.link_url, a.data->>'link_url', a.data->>'url', '')::text as link_url,
        COALESCE(a.content_summary, a.data->>'content_summary', a.data->>'summary', '')::text as content_summary,
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
        -- Handle cross_posted_to array properly
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
    WHERE (
        -- Activities by the entity (if it's a user)
        (p_entity_type = 'user' AND a.user_id = p_entity_id)
        OR
        -- Activities about the entity
        (a.entity_type = p_entity_type AND a.entity_id = p_entity_id)
        OR
        -- Activities in the data field that reference the entity
        (a.data ? p_entity_type AND (a.data->>p_entity_type)::uuid = p_entity_id)
        OR
        -- Book-related activities for authors
        (p_entity_type = 'author' AND a.data ? 'book_id' AND EXISTS (
            SELECT 1 FROM public.books b 
            WHERE b.id = (a.data->>'book_id')::uuid 
            AND b.author_id = p_entity_id
        ))
        OR
        -- Book-related activities for publishers
        (p_entity_type = 'publisher' AND a.data ? 'book_id' AND EXISTS (
            SELECT 1 FROM public.books b 
            WHERE b.id = (a.data->>'book_id')::uuid 
            AND b.publisher_id = p_entity_id
        ))
    )
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
GRANT EXECUTE ON FUNCTION public.get_entity_timeline_activities(text, uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_entity_timeline_activities(text, uuid, integer, integer) TO service_role;

-- Add function comment
COMMENT ON FUNCTION public.get_entity_timeline_activities(text, uuid, integer, integer) IS 
'Get timeline activities for any entity type (user, author, book, publisher, group). Returns activities by, about, or related to the specified entity.';
