-- Create an alias function that calls the working function
-- This way the frontend doesn't need to change

-- Create the alias function
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
    SELECT * FROM public.get_user_activities_simple(p_user_id, p_limit, p_offset);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_feed_activities TO authenticated;
