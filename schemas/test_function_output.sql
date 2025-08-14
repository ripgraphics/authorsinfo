-- Test Function Output vs Frontend Expectations

-- 1. What does the function actually return?
SELECT 'Function output:' as info, 
       id, 
       user_id, 
       activity_type, 
       created_at,
       data
FROM public.get_user_feed_activities('e06cdf85-b449-4dcb-b943-068aaad8cfa3', 10, 0)
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check if there are any NULL values causing issues
SELECT 'Function output with NULL check:' as info, 
       id, 
       user_id, 
       activity_type, 
       created_at,
       data,
       CASE WHEN id IS NULL THEN 'NULL ID' ELSE 'OK' END as id_status,
       CASE WHEN user_id IS NULL THEN 'NULL USER_ID' ELSE 'OK' END as user_id_status,
       CASE WHEN activity_type IS NULL THEN 'NULL TYPE' ELSE 'OK' END as type_status
FROM public.get_user_feed_activities('e06cdf85-b449-4dcb-b943-068aaad8cfa3', 10, 0)
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check the exact data structure of one activity
SELECT 'Single activity detail:' as info, 
       id, 
       user_id, 
       activity_type, 
       created_at,
       data,
       jsonb_typeof(data) as data_type,
       data->>'content' as content,
       data->>'post_id' as post_id
FROM public.activities 
WHERE user_id = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3'
  AND activity_type = 'post_created'
ORDER BY created_at DESC
LIMIT 1;

-- 4. Test if the function returns the same as direct query
SELECT 'Direct query vs Function:' as info,
       'Direct query count' as source,
       COUNT(*) as count
FROM public.activities 
WHERE user_id = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3'
UNION ALL
SELECT 'Direct query vs Function:' as info,
       'Function count' as source,
       COUNT(*) as count
FROM public.get_user_feed_activities('e06cdf85-b449-4dcb-b943-068aaad8cfa3', 10, 0);
