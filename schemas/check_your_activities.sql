-- Check Your Specific Activities and Function Results

-- 1. How many activities do YOU have specifically?
SELECT 'Your activities count:' as info, COUNT(*) as count 
FROM public.activities 
WHERE user_id = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3';

-- 2. What are YOUR recent activities?
SELECT 'Your recent activities:' as info, 
       id, 
       user_id, 
       activity_type, 
       created_at,
       data
FROM public.activities 
WHERE user_id = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Test the function directly - does it return anything?
SELECT 'Function returns count:' as info, COUNT(*) as count 
FROM public.get_user_feed_activities('e06cdf85-b449-4dcb-b943-068aaad8cfa3', 10, 0);

-- 4. Test the function with actual data - what does it return?
SELECT 'Function returns data:' as info, 
       id, 
       user_id, 
       activity_type, 
       created_at
FROM public.get_user_feed_activities('e06cdf85-b449-4dcb-b943-068aaad8cfa3', 10, 0)
LIMIT 5;

-- 5. Check if there's a data type issue
SELECT 'Your post activities:' as info, 
       id, 
       user_id, 
       activity_type, 
       created_at,
       data
FROM public.activities 
WHERE user_id = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3'
  AND activity_type = 'post_created'
ORDER BY created_at DESC
LIMIT 5;
