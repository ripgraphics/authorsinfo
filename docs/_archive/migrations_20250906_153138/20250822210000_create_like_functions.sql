-- Create functions for managing like counts in activities table

-- Function to increment like count
CREATE OR REPLACE FUNCTION public.increment_activity_like_count(p_activity_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.activities 
    SET like_count = COALESCE(like_count, 0) + 1
    WHERE id = p_activity_id;
END;
$$;

-- Function to decrement like count
CREATE OR REPLACE FUNCTION public.decrement_activity_like_count(p_activity_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.activities 
    SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
    WHERE id = p_activity_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.increment_activity_like_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_activity_like_count(uuid) TO authenticated;
