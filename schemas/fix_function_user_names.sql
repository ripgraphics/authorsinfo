-- Fix Function User Names Issue
-- The function should return user names but it's not working

-- 1. Check what the current function returns vs manual query
SELECT 'Current function returns:' as info,
       user_name,
       user_id
FROM public.get_user_feed_activities('e06cdf85-b449-4dcb-b943-068aaad8cfa3', 3, 0);

-- 2. Now fix the function to properly return user names
DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid, integer, integer);

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
        u.name::character varying as user_name,  -- Explicit cast and alias
        '/placeholder.svg?height=200&width=200'::character varying as user_avatar_url,
        a.activity_type,
        a.data,
        a.created_at,
        true as is_public,  -- Simplified since metadata fields don't exist
        0 as like_count,    -- Simplified since these columns don't exist
        0 as comment_count,
        false as is_liked,
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

-- 3. Test the fixed function
SELECT 'Fixed function returns:' as info,
       user_name,
       user_id
FROM public.get_user_feed_activities('e06cdf85-b449-4dcb-b943-068aaad8cfa3', 3, 0);
