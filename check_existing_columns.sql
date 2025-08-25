-- CHECK EXISTING ENGAGEMENT COLUMNS
-- This script will show you what columns already exist and what still needs to be added

-- =====================================================
-- STEP 1: CHECK WHICH COLUMNS ALREADY EXIST
-- =====================================================

SELECT '=== CHECKING EXISTING COLUMNS ===' as step;

-- Check which engagement columns already exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('like_count', 'comment_count', 'share_count', 'bookmark_count', 'user_has_reacted') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM information_schema.columns 
WHERE table_name = 'activities' 
  AND table_schema = 'public'
  AND column_name IN ('like_count', 'comment_count', 'share_count', 'bookmark_count', 'user_has_reacted')
ORDER BY column_name;

-- =====================================================
-- STEP 2: CHECK WHICH COLUMNS ARE MISSING
-- =====================================================

SELECT '=== CHECKING MISSING COLUMNS ===' as step;

-- Show which columns are missing
SELECT 
    'like_count' as column_name,
    'integer' as data_type,
    '0' as default_value
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activities' AND column_name = 'like_count'
)
UNION ALL
SELECT 
    'comment_count' as column_name,
    'integer' as data_type,
    '0' as default_value
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activities' AND column_name = 'comment_count'
)
UNION ALL
SELECT 
    'share_count' as column_name,
    'integer' as data_type,
    '0' as default_value
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activities' AND column_name = 'share_count'
)
UNION ALL
SELECT 
    'bookmark_count' as column_name,
    'integer' as data_type,
    '0' as default_value
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activities' AND column_name = 'bookmark_count'
)
UNION ALL
SELECT 
    'user_has_reacted' as column_name,
    'boolean' as data_type,
    'false' as default_value
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activities' AND column_name = 'user_has_reacted'
);

-- =====================================================
-- STEP 3: CHECK IF TRIGGERS EXIST
-- =====================================================

SELECT '=== CHECKING EXISTING TRIGGERS ===' as step;

-- Check if engagement triggers already exist
SELECT 
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
-- STEP 4: CHECK IF FUNCTIONS EXIST
-- =====================================================

SELECT '=== CHECKING EXISTING FUNCTIONS ===' as step;

-- Check if engagement functions already exist
SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name IS NOT NULL THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN ('get_entity_engagement', 'toggle_entity_like', 'add_engagement_comment')
ORDER BY routine_name;

-- =====================================================
-- STEP 5: SUMMARY OF WHAT NEEDS TO BE DONE
-- =====================================================

SELECT '=== SUMMARY OF WHAT NEEDS TO BE DONE ===' as step;

-- Count existing vs missing columns
SELECT 
    'COLUMNS STATUS' as info,
    COUNT(CASE WHEN column_name IN ('like_count', 'comment_count', 'share_count', 'bookmark_count', 'user_has_reacted') THEN 1 END) as existing_columns,
    5 - COUNT(CASE WHEN column_name IN ('like_count', 'comment_count', 'share_count', 'bookmark_count', 'user_has_reacted') THEN 1 END) as missing_columns,
    CASE 
        WHEN COUNT(CASE WHEN column_name IN ('like_count', 'comment_count', 'share_count', 'bookmark_count', 'user_has_reacted') THEN 1 END) = 5 
        THEN '✅ ALL COLUMNS EXIST - Ready for next step' 
        ELSE '⚠️ Some columns missing - Need to add them first' 
    END as status
FROM information_schema.columns 
WHERE table_name = 'activities' 
  AND table_schema = 'public';

-- =====================================================
-- NEXT STEPS
-- =====================================================

SELECT '=== NEXT STEPS ===' as step;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.columns 
              WHERE table_name = 'activities' AND column_name IN ('like_count', 'comment_count', 'share_count', 'bookmark_count', 'user_has_reacted')) = 5
        THEN '✅ All columns exist! Next: Run the triggers and functions creation part of the fix script.'
        ELSE '⚠️ Some columns missing! First: Add the missing columns, then create triggers and functions.'
    END as next_action;
