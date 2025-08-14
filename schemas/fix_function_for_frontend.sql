-- Fix Function to Return Data Frontend Expects
-- The frontend expects user_name, engagement metrics, etc. that aren't in the basic activities table

-- Drop the current function
DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid, integer, integer);

-- Create a function that returns the data structure the frontend expects
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
        COALESCE(p.display_name, 'Unknown User') as user_name,
        p.avatar_url as user_avatar_url,
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
    LEFT JOIN public.profiles p ON a.user_id = p.id
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

-- Test the data structure
SELECT 'Data structure test:' as info, 
       id, 
       user_id, 
       user_name, 
       user_avatar_url,
       activity_type, 
       created_at
FROM public.get_user_feed_activities('e06cdf85-b449-4dcb-b943-068aaad8cfa3', 5, 0)
ORDER BY created_at DESC;
