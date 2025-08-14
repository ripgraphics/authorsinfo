-- Full Diagnostic - Let's see exactly what's happening

-- 1. Total count
SELECT 'Total activities:' as info, COUNT(*) as count FROM public.activities;

-- 2. Activities for your specific user
SELECT 'Your activities count:' as info, COUNT(*) as count 
FROM public.activities 
WHERE user_id = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3';

-- 3. All activities for your user (detailed)
SELECT 'Your activities detail:' as info, 
       id, 
       user_id, 
       activity_type, 
       created_at,
       data
FROM public.activities 
WHERE user_id = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3'
ORDER BY created_at DESC;

-- 4. Test the function directly
SELECT 'Function test - count:' as info, COUNT(*) as count 
FROM public.get_user_feed_activities('e06cdf85-b449-4dcb-b943-068aaad8cfa3', 10, 0);

-- 5. Test the function with actual data
SELECT 'Function test - data:' as info, 
       id, 
       user_id, 
       activity_type, 
       created_at
FROM public.get_user_feed_activities('e06cdf85-b449-4dcb-b943-068aaad8cfa3', 10, 0)
LIMIT 5;

-- 6. Check if there are any recent activities
SELECT 'Recent activities (all users):' as info, 
       id, 
       user_id, 
       activity_type, 
       created_at
FROM public.activities 
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Check activity types
SELECT 'Activity types:' as info, 
       activity_type, 
       COUNT(*) as count
FROM public.activities 
GROUP BY activity_type;
