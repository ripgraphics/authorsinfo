-- Direct Fix for get_user_feed_activities Function
-- Run this directly on your local database

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid, integer, integer);

-- Create a simple, working function
CREATE OR REPLACE FUNCTION public.get_user_feed_activities(
    p_user_id uuid,
    p_limit integer DEFAULT 50,
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
        act.id::text as id,
        act.user_id::text as user_id,
        COALESCE(usr.name, 'Unknown User') as user_name,
        '/placeholder.svg?height=200&width=200' as user_avatar_url,
        act.activity_type,
        COALESCE(act.data, '{}'::jsonb) as data,
        act.created_at::text as created_at,
        true as is_public,
        COALESCE(act.like_count, 0) as like_count,
        COALESCE(act.comment_count, 0) as comment_count,
        false as is_liked,
        COALESCE(act.entity_type, 'user') as entity_type,
        COALESCE(act.entity_id::text, act.user_id::text) as entity_id
    FROM public.activities act
    LEFT JOIN public.users usr ON act.user_id = usr.id
    WHERE act.user_id = p_user_id
    ORDER BY act.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_feed_activities TO authenticated;
