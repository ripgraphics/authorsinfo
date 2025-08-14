-- Debug User Names Issue
-- Check what the function is actually returning vs what should be returned

-- 1. Check what the function returns for user names
SELECT 'Function returns for names:' as info,
       user_name,
       user_id
FROM public.get_user_feed_activities('e06cdf85-b449-4dcb-b943-068aaad8cfa3', 5, 0);

-- 2. Check what users table actually has
SELECT 'Users table has:' as info,
       name,
       id
FROM public.users 
WHERE id = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3';

-- 3. Check the JOIN in the function
SELECT 'Manual JOIN test:' as info,
       a.id,
       a.user_id,
       u.name as user_name_from_join,
       a.activity_type
FROM public.activities a
LEFT JOIN public.users u ON a.user_id = u.id
WHERE a.user_id = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3'
ORDER BY a.created_at DESC
LIMIT 3;
