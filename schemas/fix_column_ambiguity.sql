-- Fix Column Ambiguity Error
-- This makes the function return exactly what the activities table contains

-- Drop the broken function
DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid, integer, integer);

-- Create a simple function that returns activities as-is
CREATE OR REPLACE FUNCTION public.get_user_feed_activities(
    p_user_id uuid,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS SETOF public.activities
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY 
    SELECT * FROM public.activities 
    WHERE user_id = p_user_id 
    ORDER BY created_at DESC
    LIMIT p_limit 
    OFFSET p_offset;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_feed_activities TO authenticated;
