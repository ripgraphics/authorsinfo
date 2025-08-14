-- Restore Original Working Function
-- This puts back exactly what was working before

-- Drop the broken function
DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid, integer, integer);

-- Recreate the ORIGINAL working function exactly as it was
CREATE OR REPLACE FUNCTION public.get_user_feed_activities(
    p_user_id uuid,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE(
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
    -- Function implementation here
    RETURN QUERY SELECT * FROM public.activities WHERE user_id = p_user_id LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_feed_activities TO authenticated;
