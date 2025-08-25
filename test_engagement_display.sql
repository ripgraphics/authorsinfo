-- TEST ENGAGEMENT DISPLAY FUNCTIONALITY
-- This script tests if engagement data is being properly stored and retrieved

-- =====================================================
-- STEP 1: CHECK CURRENT ENGAGEMENT DATA
-- =====================================================

SELECT '=== CHECKING CURRENT ENGAGEMENT DATA ===' as test_step;

-- Check if any activities have engagement data
SELECT 
    'ACTIVITIES WITH ENGAGEMENT' as info,
    COUNT(*) as total_activities,
    COUNT(CASE WHEN like_count > 0 THEN 1 END) as with_likes,
    COUNT(CASE WHEN comment_count > 0 THEN 1 END) as with_comments,
    COUNT(CASE WHEN share_count > 0 THEN 1 END) as with_shares,
    COUNT(CASE WHEN bookmark_count > 0 THEN 1 END) as with_bookmarks
FROM public.activities;

-- Show sample activities with engagement data
SELECT 
    'SAMPLE ACTIVITIES WITH ENGAGEMENT' as info,
    id,
    activity_type,
    content_type,
    like_count,
    comment_count,
    share_count,
    bookmark_count,
    created_at
FROM public.activities 
WHERE like_count > 0 OR comment_count > 0
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- STEP 2: TEST THE FIXED FUNCTION
-- =====================================================

SELECT '=== TESTING FIXED FUNCTION ===' as test_step;

-- Test the get_user_feed_activities function
-- Replace 'YOUR_USER_ID_HERE' with an actual user ID from your database
SELECT 
    'FUNCTION TEST' as info,
    id,
    user_id,
    activity_type,
    like_count,
    comment_count,
    share_count,
    bookmark_count,
    user_has_reacted
FROM public.get_user_feed_activities(
    (SELECT id FROM public.users LIMIT 1), -- Use first available user
    5, -- Limit to 5 results
    0  -- No offset
)
LIMIT 3;

-- =====================================================
-- STEP 3: CHECK ENGAGEMENT TABLES
-- =====================================================

SELECT '=== CHECKING ENGAGEMENT TABLES ===' as test_step;

-- Check engagement_likes table
SELECT 
    'ENGAGEMENT_LIKES' as table_name,
    COUNT(*) as total_likes,
    COUNT(DISTINCT entity_id) as unique_entities,
    COUNT(DISTINCT user_id) as unique_users
FROM public.engagement_likes;

-- Check engagement_comments table
SELECT 
    'ENGAGEMENT_COMMENTS' as table_name,
    COUNT(*) as total_comments,
    COUNT(DISTINCT entity_id) as unique_entities,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(CASE WHEN is_deleted = false THEN 1 END) as active_comments
FROM public.engagement_comments;

-- =====================================================
-- STEP 4: VERIFY TRIGGERS ARE WORKING
-- =====================================================

SELECT '=== VERIFYING TRIGGERS ===' as test_step;

-- Check if triggers exist
SELECT 
    'TRIGGERS STATUS' as info,
    trigger_name,
    event_manipulation,
    event_object_table,
    CASE 
        WHEN trigger_name IS NOT NULL THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND event_object_table IN ('engagement_likes', 'engagement_comments')
ORDER BY trigger_name;

-- =====================================================
-- STEP 5: MANUAL ENGAGEMENT TEST
-- =====================================================

SELECT '=== MANUAL ENGAGEMENT TEST ===' as test_step;

-- This section shows you how to manually test engagement
-- You can run these commands in your Supabase SQL Editor to test

-- 1. Create a test like (replace with actual values)
-- INSERT INTO public.engagement_likes (user_id, entity_type, entity_id, created_at)
-- VALUES ('YOUR_USER_ID', 'activity', 'ACTIVITY_ID', NOW());

-- 2. Create a test comment (replace with actual values)
-- INSERT INTO public.engagement_comments (user_id, entity_type, entity_id, comment_text, created_at)
-- VALUES ('YOUR_USER_ID', 'activity', 'ACTIVITY_ID', 'Test comment', NOW());

-- 3. Check if the triggers updated the activities table
-- SELECT id, like_count, comment_count FROM public.activities WHERE id = 'ACTIVITY_ID';

-- =====================================================
-- STEP 6: SUMMARY AND NEXT STEPS
-- =====================================================

SELECT '=== SUMMARY AND NEXT STEPS ===' as test_step;

-- Show what needs to be done
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM public.activities WHERE like_count > 0 OR comment_count > 0) > 0
        THEN '✅ Engagement data exists in activities table'
        ELSE '⚠️ No engagement data found in activities table'
    END as engagement_status;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.triggers 
              WHERE trigger_schema = 'public' 
              AND event_object_table IN ('engagement_likes', 'engagement_comments')) >= 2
        THEN '✅ Engagement triggers are set up'
        ELSE '⚠️ Engagement triggers are missing'
    END as trigger_status;

-- =====================================================
-- NEXT STEPS
-- =====================================================

SELECT '=== NEXT STEPS ===' as test_step;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM public.activities WHERE like_count > 0 OR comment_count > 0) > 0
        THEN '✅ Engagement system is working! Try liking/commenting on a post and refreshing the page.'
        ELSE '⚠️ Engagement system needs testing. Create a test like/comment and verify it appears in the activities table.'
    END as next_action;
