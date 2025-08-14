-- Fix Function Limit Issue
-- The function is only returning 10 activities instead of all 32

-- 1. First, let's see what the function is actually returning
SELECT 'Function output (limited to 10):' as info, 
       id, 
       user_id, 
       activity_type, 
       created_at,
       data
FROM public.get_user_feed_activities('e06cdf85-b449-4dcb-b943-068aaad8cfa3', 10, 0)
ORDER BY created_at DESC;

-- 2. Now let's see what we're missing (activities 11-32)
SELECT 'Missing activities (11-32):' as info, 
       id, 
       user_id, 
       activity_type, 
       created_at,
       data
FROM public.activities 
WHERE user_id = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3'
ORDER BY created_at DESC
LIMIT 32 OFFSET 10;

-- 3. Fix the function to return more activities by default
DROP FUNCTION IF EXISTS public.get_user_feed_activities(uuid, integer, integer);

CREATE OR REPLACE FUNCTION public.get_user_feed_activities(
    p_user_id uuid,
    p_limit integer DEFAULT 50,  -- Increased from 20 to 50
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

-- 4. Test the fixed function
SELECT 'Fixed function test:' as info, COUNT(*) as count 
FROM public.get_user_feed_activities('e06cdf85-b449-4dcb-b943-068aaad8cfa3', 50, 0);
