-- Test Script for Database Functions
-- This script tests if our functions are working correctly

-- Test 1: Check if get_user_feed_activities function exists and works
SELECT 'Testing get_user_feed_activities function...' as test;

-- Check function signature
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'get_user_feed_activities';

-- Test 2: Check if get_entity_timeline_activities function exists and works
SELECT 'Testing get_entity_timeline_activities function...' as test;

SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'get_entity_timeline_activities';

-- Test 3: Check activities table structure
SELECT 'Checking activities table structure...' as test;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'activities' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 4: Check if we have any activities to test with
SELECT 'Checking for test data...' as test;

SELECT 
    COUNT(*) as total_activities,
    COUNT(CASE WHEN activity_type = 'post_created' THEN 1 END) as posts,
    COUNT(CASE WHEN activity_type = 'like' THEN 1 END) as likes,
    COUNT(CASE WHEN activity_type = 'comment' THEN 1 END) as comments
FROM public.activities;

-- Test 5: Try to call the function with a sample user ID (if any exist)
SELECT 'Testing function calls...' as test;

-- Get a sample user ID
DO $$
DECLARE
    sample_user_id uuid;
    activity_count integer;
BEGIN
    -- Get a sample user ID
    SELECT user_id INTO sample_user_id 
    FROM public.activities 
    LIMIT 1;
    
    IF sample_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with user ID: %', sample_user_id;
        
        -- Test the function
        SELECT COUNT(*) INTO activity_count
        FROM public.get_user_feed_activities(sample_user_id, 5, 0);
        
        RAISE NOTICE 'Function returned % activities', activity_count;
    ELSE
        RAISE NOTICE 'No activities found to test with';
    END IF;
END $$;

-- Test 6: Check enterprise columns
SELECT 'Checking enterprise columns...' as test;

SELECT 
    publish_status,
    published_at,
    is_featured,
    is_pinned,
    bookmark_count,
    trending_score
FROM public.activities 
LIMIT 3;
