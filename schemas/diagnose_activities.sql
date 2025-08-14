-- Diagnose Activities Table Issues
-- This will show us exactly what's happening

-- 1. Check if activities table has any data at all
SELECT 'Total activities count:' as info, COUNT(*) as count FROM public.activities;

-- 2. Check if there are any activities for your specific user
SELECT 'Activities for your user:' as info, COUNT(*) as count 
FROM public.activities 
WHERE user_id = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3';

-- 3. Show all activities (if any exist)
SELECT 'All activities:' as info, id, user_id, activity_type, created_at 
FROM public.activities 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Check if the function actually returns anything
SELECT 'Function test result:' as info, COUNT(*) as count 
FROM public.get_user_feed_activities('e06cdf85-b449-4dcb-b943-068aaad8cfa3', 10, 0);

-- 5. Check if posts are being created as activities
SELECT 'Recent posts/activities:' as info, 
       a.id, 
       a.activity_type, 
       a.created_at,
       a.data
FROM public.activities a
WHERE a.activity_type LIKE '%post%' 
   OR a.activity_type LIKE '%created%'
ORDER BY a.created_at DESC
LIMIT 5;

-- 6. Check if there's a mismatch between user IDs
SELECT 'User ID check:' as info,
       'Your user ID' as type,
       'e06cdf85-b449-4dcb-b943-068aaad8cfa3' as user_id
UNION ALL
SELECT 'User ID check:' as info,
       'Activities user IDs' as type,
       string_agg(DISTINCT user_id::text, ', ') as user_id
FROM public.activities;
