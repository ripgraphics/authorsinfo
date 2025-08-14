-- Debug Activity Feed Issues
-- This script will help identify why the feed is showing no activities

-- 1. Check if activities table has data
SELECT 'Activities table count:' as info, COUNT(*) as count FROM public.activities;

-- 2. Check sample activities
SELECT 'Sample activities:' as info, id, user_id, activity_type, created_at FROM public.activities LIMIT 5;

-- 3. Check if users table has data
SELECT 'Users table count:' as info, COUNT(*) as count FROM public.users;

-- 4. Check sample users
SELECT 'Sample users:' as info, id, name, email FROM public.users LIMIT 5;

-- 5. Test the function directly
SELECT 'Function test result:' as info, COUNT(*) as count FROM public.get_user_feed_activities(NULL, 10, 0);

-- 6. Check if there's a mismatch between activities.user_id and users.id
SELECT 'User ID mismatch check:' as info, 
       COUNT(DISTINCT a.user_id) as activities_user_ids,
       COUNT(DISTINCT u.id) as users_ids,
       COUNT(DISTINCT a.user_id) - COUNT(DISTINCT u.id) as mismatch_count
FROM public.activities a
FULL OUTER JOIN public.users u ON a.user_id = u.id;

-- 7. Check specific activity with user join
SELECT 'Activity with user join test:' as info,
       a.id,
       a.user_id,
       a.activity_type,
       u.name as user_name,
       a.created_at
FROM public.activities a
LEFT JOIN public.users u ON a.user_id = u.id
LIMIT 3;

-- 8. Check if the function is being called from the right place
-- This will show the current function definition
SELECT 'Current function definition:' as info,
       pg_get_functiondef(oid) as function_body
FROM pg_proc 
WHERE proname = 'get_user_feed_activities' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
