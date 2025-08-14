-- Fix Function Using ACTUAL Database Schema
-- Based on the real activities table structure: id, user_id, activity_type, data, created_at, entity_type, entity_id, metadata

-- Drop the current function
DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid, integer, integer);

-- Create a function that returns the data structure the frontend expects
-- Using ONLY columns that actually exist in the activities table
CREATE OR REPLACE FUNCTION public.get_user_feed_activities(
    p_user_id uuid,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    user_name character varying,
    user_avatar_url character varying,
    activity_type text,
    data jsonb,
    created_at timestamptz,
    is_public boolean,
    like_count integer,
    comment_count integer,
    is_liked boolean,
    entity_type text,
    entity_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.user_id,
        COALESCE(u.name, 'Unknown User'::character varying) as user_name,
        '/placeholder.svg?height=200&width=200'::character varying as user_avatar_url,
        a.activity_type,
        a.data,
        a.created_at,
        COALESCE(a.metadata->>'privacy_level' = 'public', true) as is_public,
        COALESCE((a.metadata->>'engagement_count')::integer, 0) as like_count,
        0 as comment_count, -- No comment count column exists
        false as is_liked, -- No is_liked column exists
        COALESCE(a.entity_type, 'user') as entity_type,
        COALESCE(a.entity_id::text, a.user_id::text) as entity_id
    FROM public.activities a
    LEFT JOIN public.users u ON a.user_id = u.id
    WHERE a.user_id = p_user_id
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_feed_activities TO authenticated;

-- Test the fixed function
SELECT 'Fixed function test:' as info, COUNT(*) as count 
FROM public.get_user_feed_activities('e06cdf85-b449-4dcb-b943-068aaad8cfa3', 50, 0);

-- Test the data structure with actual user names
SELECT 'Data structure test with names:' as info, 
       id, 
       user_id, 
       user_name, 
       user_avatar_url,
       activity_type, 
       created_at,
       is_public,
       like_count
FROM public.get_user_feed_activities('e06cdf85-b449-4dcb-b943-068aaad8cfa3', 5, 0)
ORDER BY created_at DESC;
