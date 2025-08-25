-- TEST POST CREATION AND DATA
-- This script tests the post creation system and checks the data
-- Date: 2025-08-24

-- =====================================================
-- STEP 1: CHECK RECENT POSTS
-- =====================================================

-- Check the most recent posts to see what's actually stored
SELECT 
    'RECENT_POSTS_CHECK' as info,
    id,
    user_id,
    activity_type,
    content_type,
    text,
    image_url,
    entity_type,
    entity_id,
    created_at,
    updated_at
FROM public.activities 
WHERE activity_type = 'post_created'
ORDER BY created_at DESC 
LIMIT 5;

-- =====================================================
-- STEP 2: CHECK POSTS FOR SPECIFIC AUTHOR
-- =====================================================

-- Check posts for the specific author mentioned in the issue
SELECT 
    'AUTHOR_POSTS_CHECK' as info,
    id,
    user_id,
    activity_type,
    content_type,
    text,
    image_url,
    entity_type,
    entity_id,
    created_at
FROM public.activities 
WHERE entity_type = 'author' 
  AND entity_id = 'e31e061d-a4a8-4cc8-af18-754786ad5ee3'
  AND activity_type = 'post_created'
ORDER BY created_at DESC;

-- =====================================================
-- STEP 3: CHECK POSTS BY USER
-- =====================================================

-- Check posts by the current user (if any)
SELECT 
    'USER_POSTS_CHECK' as info,
    id,
    user_id,
    activity_type,
    content_type,
    text,
    image_url,
    entity_type,
    entity_id,
    created_at
FROM public.activities 
WHERE activity_type = 'post_created'
  AND user_id IS NOT NULL
ORDER BY created_at DESC 
LIMIT 10;

-- =====================================================
-- STEP 4: CHECK ACTIVITIES TABLE STRUCTURE
-- =====================================================

-- Verify the activities table has the correct columns
SELECT 
    'ACTIVITIES_TABLE_STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'activities' 
  AND column_name IN ('text', 'image_url', 'content_type', 'activity_type', 'entity_type', 'entity_id')
ORDER BY column_name;
