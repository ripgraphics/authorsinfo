-- Restore Working Activity Feed Function
-- This fixes the function to return the correct data structure

-- Drop the broken function first
DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid, integer, integer);

-- Recreate the function with the correct implementation
CREATE OR REPLACE FUNCTION public.get_user_feed_activities(
    p_user_id uuid DEFAULT NULL,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    activity_type text,
    entity_type text,
    entity_id text,
    is_public boolean,
    metadata jsonb,
    created_at timestamp with time zone,
    user_name text,
    user_avatar_url text,
    like_count bigint,
    comment_count bigint,
    is_liked boolean
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
        a.activity_type,
        COALESCE(a.entity_type, 'user') as entity_type,
        COALESCE(a.entity_id::text, '') as entity_id,
        true as is_public, -- Default to public
        COALESCE(a.data, '{}'::jsonb) as metadata, -- Map data field to metadata
        a.created_at,
        COALESCE(u.name, 'Unknown User') as user_name,
        NULL as user_avatar_url, -- No avatar field yet
        0 as like_count, -- Default to 0
        0 as comment_count, -- Default to 0
        false as is_liked -- Default to false
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

-- Test the function
-- SELECT * FROM public.get_user_feed_activities('your-user-id', 5, 0);
