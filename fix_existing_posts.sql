-- FIX EXISTING POSTS IN DATABASE
-- This script fixes existing posts that have text content stored in the wrong place
-- Date: 2025-08-24

-- =====================================================
-- STEP 1: CHECK CURRENT POSTS DATA
-- =====================================================

-- Check what's currently in the posts
SELECT 
    'CURRENT_POSTS_DATA' as info,
    id,
    user_id,
    activity_type,
    content_type,
    text,
    data,
    entity_type,
    entity_id,
    created_at
FROM public.activities 
WHERE activity_type IN ('post', 'post_created')
ORDER BY created_at DESC 
LIMIT 10;

-- =====================================================
-- STEP 2: FIX POSTS WITH TEXT IN DATA FIELD
-- =====================================================

-- Update posts where text is empty but data contains text content
UPDATE public.activities 
SET 
    text = COALESCE(
        data->>'text',
        data->>'content', 
        data->>'body',
        'Post content'
    ),
    content_type = COALESCE(
        data->>'contentType',
        data->>'type',
        CASE 
            WHEN data->>'image_url' IS NOT NULL THEN 'image'
            ELSE 'text'
        END
    ),
    image_url = COALESCE(
        data->>'image_url',
        data->>'images',
        data->>'media_url'
    ),
    link_url = COALESCE(
        data->>'link_url',
        data->>'url'
    ),
    hashtags = COALESCE(
        data->>'hashtags',
        '{}'::text[]
    ),
    updated_at = NOW()
WHERE 
    activity_type IN ('post', 'post_created')
    AND (text IS NULL OR text = '')
    AND data IS NOT NULL
    AND data != '{}'::jsonb;

-- =====================================================
-- STEP 3: VERIFY THE FIX
-- =====================================================

-- Check the posts after the fix
SELECT 
    'POSTS_AFTER_FIX' as info,
    id,
    user_id,
    activity_type,
    content_type,
    text,
    data,
    entity_type,
    entity_id,
    created_at
FROM public.activities 
WHERE activity_type IN ('post', 'post_created')
ORDER BY created_at DESC 
LIMIT 10;

-- =====================================================
-- STEP 4: COUNT FIXED POSTS
-- =====================================================

-- Count how many posts were fixed
SELECT 
    'FIX_SUMMARY' as info,
    COUNT(*) as total_posts,
    COUNT(CASE WHEN text IS NOT NULL AND text != '' THEN 1 END) as posts_with_text,
    COUNT(CASE WHEN text IS NULL OR text = '' THEN 1 END) as posts_without_text
FROM public.activities 
WHERE activity_type IN ('post', 'post_created');
