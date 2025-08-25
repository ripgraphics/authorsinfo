-- CHECK CURRENT POSTS DATA IN ACTIVITIES TABLE
-- This script diagnoses why posts content isn't displaying properly
-- Date: 2025-08-24
-- Run this using: supabase db push

-- =====================================================
-- STEP 1: CHECK ACTIVITIES TABLE STRUCTURE
-- =====================================================

-- Verify the activities table has the correct columns
SELECT 
    'ACTIVITIES_TABLE_COLUMNS' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'activities' 
  AND column_name IN ('text', 'image_url', 'content_type', 'data', 'metadata')
ORDER BY column_name;

-- =====================================================
-- STEP 2: CHECK CURRENT POSTS DATA
-- =====================================================

-- Check recent posts to see what data is actually stored
SELECT 
    'RECENT_POSTS_DATA' as info,
    id,
    user_id,
    activity_type,
    content_type,
    text,
    image_url,
    LEFT(data::text, 100) as data_preview,
    LEFT(metadata::text, 100) as metadata_preview,
    created_at
FROM public.activities 
WHERE activity_type = 'post_created' 
   OR content_type IS NOT NULL
ORDER BY created_at DESC 
LIMIT 10;

-- =====================================================
-- STEP 3: CHECK POSTS CONTENT COVERAGE
-- =====================================================

-- Check how many posts have actual content
SELECT 
    'POSTS_CONTENT_COVERAGE' as info,
    COUNT(*) as total_posts,
    COUNT(CASE WHEN text IS NOT NULL AND text != '' THEN 1 END) as posts_with_text,
    COUNT(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 END) as posts_with_images,
    COUNT(CASE WHEN data IS NOT NULL AND data != '{}'::jsonb THEN 1 END) as posts_with_data,
    COUNT(CASE WHEN metadata IS NOT NULL AND metadata != '{}'::jsonb THEN 1 END) as posts_with_metadata,
    ROUND(
        (COUNT(CASE WHEN text IS NOT NULL AND text != '' THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 
        2
    ) as text_coverage_percentage
FROM public.activities 
WHERE activity_type = 'post_created' 
   OR content_type IS NOT NULL;

-- =====================================================
-- STEP 4: CHECK SPECIFIC POST BY ID
-- =====================================================

-- Check the specific post mentioned in the debug logs
SELECT 
    'SPECIFIC_POST_CHECK' as info,
    id,
    user_id,
    activity_type,
    content_type,
    text,
    image_url,
    data,
    metadata,
    created_at,
    updated_at
FROM public.activities 
WHERE id IN (
    'ce83a4d2-d849-426d-bec5-89e45b55c0f2',
    'a0e17759-d56b-4b84-87fa-f7bb91985aa4',
    '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb',
    'ba178471-415b-4cac-8235-0627e975cf74'
);

-- =====================================================
-- STEP 5: CHECK USER POSTS
-- =====================================================

-- Check posts for the specific user/author
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
WHERE entity_type = 'author' 
  AND entity_id = 'e31e061d-a4a8-4cc8-af18-754786ad5ee3'
ORDER BY created_at DESC;
