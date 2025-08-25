-- SIMPLE ACTIVITIES TABLE POSTS DATA FIX
-- Based on ACTUAL current schema - activities table has text, image_url, data columns
-- Date: 2025-08-23
-- Run this using: supabase db push

-- =====================================================
-- STEP 1: SHOW CURRENT STATE
-- =====================================================

-- Show activities that need content fixes
SELECT 
    'ACTIVITIES NEEDING CONTENT FIXES' as info,
    id,
    user_id,
    activity_type,
    content_type,
    text,
    image_url,
    LEFT(data::text, 100) as data_preview,
    created_at
FROM public.activities 
WHERE (text IS NULL OR text = '') 
   AND (data IS NULL OR data = '{}'::jsonb)
ORDER BY created_at DESC 
LIMIT 10;

-- =====================================================
-- STEP 2: FIX MISSING TEXT CONTENT
-- =====================================================

-- Update activities that have content_type but missing text
UPDATE public.activities 
SET text = CASE 
    WHEN content_type = 'text' THEN 'Shared an update'
    WHEN content_type = 'image' THEN 'Shared an image'
    WHEN content_type = 'video' THEN 'Shared a video'
    WHEN content_type = 'link' THEN 'Shared a link'
    WHEN content_type = 'book' THEN 'Shared a book'
    WHEN content_type = 'author' THEN 'Shared an author'
    ELSE 'Shared content'
    END
WHERE (text IS NULL OR text = '') 
  AND content_type IS NOT NULL;

-- =====================================================
-- STEP 3: FIX MISSING DATA JSONB
-- =====================================================

-- Update activities that have content_type but missing data JSONB
UPDATE public.activities 
SET data = CASE 
    WHEN content_type = 'text' THEN 
        jsonb_build_object(
            'text', COALESCE(text, 'Shared an update'),
            'type', 'text',
            'created_at', created_at::text
        )
    WHEN content_type = 'image' THEN 
        jsonb_build_object(
            'text', COALESCE(text, 'Shared an image'),
            'type', 'image',
            'image_url', COALESCE(image_url, ''),
            'created_at', created_at::text
        )
    WHEN content_type = 'video' THEN 
        jsonb_build_object(
            'text', COALESCE(text, 'Shared a video'),
            'type', 'video',
            'created_at', created_at::text
        )
    WHEN content_type = 'link' THEN 
        jsonb_build_object(
            'text', COALESCE(text, 'Shared a link'),
            'type', 'link',
            'link_url', COALESCE(link_url, ''),
            'created_at', created_at::text
        )
    WHEN content_type = 'book' THEN 
        jsonb_build_object(
            'text', COALESCE(text, 'Shared a book'),
            'type', 'book',
            'created_at', created_at::text
        )
    WHEN content_type = 'author' THEN 
        jsonb_build_object(
            'text', COALESCE(text, 'Shared an author'),
            'type', 'author',
            'created_at', created_at::text
        )
    ELSE 
        jsonb_build_object(
            'text', COALESCE(text, 'Shared content'),
            'type', COALESCE(content_type, 'text'),
            'created_at', created_at::text
        )
    END
WHERE (data IS NULL OR data = '{}'::jsonb) 
  AND content_type IS NOT NULL;

-- =====================================================
-- STEP 4: FINAL VERIFICATION
-- =====================================================

-- Show final summary
SELECT 
    'ACTIVITIES CONTENT FIX COMPLETE' as status,
    COUNT(*) as total_activities,
    COUNT(CASE WHEN text IS NOT NULL AND text != '' THEN 1 END) as activities_with_text,
    COUNT(CASE WHEN data IS NOT NULL AND data != '{}'::jsonb THEN 1 END) as activities_with_data,
    COUNT(CASE WHEN content_type = 'image' AND image_url IS NOT NULL THEN 1 END) as activities_with_images,
    ROUND(
        (COUNT(CASE WHEN text IS NOT NULL AND text != '' THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 
        2
    ) as text_coverage_percentage,
    ROUND(
        (COUNT(CASE WHEN data IS NOT NULL AND data != '{}'::jsonb THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 
        2
    ) as data_coverage_percentage
FROM public.activities;
