-- Fix Function Using Real Database Schema
-- Based on the working profile page, the users table has: id, name, email, created_at, permalink

-- Drop the current function
DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid, integer, integer);

-- Create a function that returns the data structure the frontend expects
-- Using the ACTUAL columns that exist in the users table
CREATE OR REPLACE FUNCTION public.get_user_feed_activities(
    p_user_id uuid,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
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
        COALESCE(u.name, 'Unknown User') as user_name,
        '/placeholder.svg?height=200&width=200' as user_avatar_url, -- Using placeholder since no avatar column exists
        a.activity_type,
        a.data,
        a.created_at,
        COALESCE(a.is_public, true) as is_public,
        COALESCE(a.like_count, 0) as like_count,
        COALESCE(a.comment_count, 0) as comment_count,
        COALESCE(a.is_liked, false) as is_liked,
        COALESCE(a.entity_type, 'user') as entity_type,
        COALESCE(a.entity_id, a.user_id::text) as entity_id
    FROM public.activities a
    LEFT JOIN public.users u ON a.user_id = u.id  -- Join with users table (not profiles)
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
       created_at
FROM public.get_user_feed_activities('e06cdf85-b449-4dcb-b943-068aaad8cfa3', 5, 0)
ORDER BY created_at DESC;
