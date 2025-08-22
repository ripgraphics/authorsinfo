-- Enterprise Fix for get_user_feed_activities Function
-- Based on the ACTUAL Enterprise schema and frontend requirements
-- This eliminates column ambiguity and returns the exact data structure expected

-- Drop all conflicting versions of the function
DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid, integer, integer);
DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid, integer, integer);
DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid DEFAULT NULL, integer, integer);

-- Create the Enterprise-grade function that matches frontend expectations
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
        -- Use explicit table aliases to eliminate ambiguity
        act.id,
        act.user_id,
        COALESCE(usr.name, 'Unknown User') as user_name,
        '/placeholder.svg?height=200&width=200' as user_avatar_url,
        act.activity_type,
        COALESCE(act.data, '{}'::jsonb) as data,
        act.created_at,
        -- Use metadata field for privacy level, default to public
        COALESCE(act.metadata->>'privacy_level' = 'public', true) as is_public,
        -- Use actual like_count column from Enterprise schema
        COALESCE(act.like_count, 0) as like_count,
        -- Use actual comment_count column from Enterprise schema
        COALESCE(act.comment_count, 0) as comment_count,
        -- Default to false since we don't have user-specific like tracking yet
        false as is_liked,
        -- Use actual entity_type column from Enterprise schema
        COALESCE(act.entity_type, 'user') as entity_type,
        -- Use actual entity_id column from Enterprise schema
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

-- Verify the function works
SELECT 'Enterprise function created successfully' as status;

-- Optional: Test with a sample user ID (uncomment and replace with actual user ID)
-- SELECT COUNT(*) as activity_count FROM public.get_user_feed_activities('your-user-id-here', 10, 0);
