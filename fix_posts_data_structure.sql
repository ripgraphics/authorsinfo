-- FIX POSTS DATA STRUCTURE
-- This script reformats existing posts data to put content in the right columns
-- Based on actual data from info.md - content is in content_summary, needs to be in text
-- Date: 2025-08-23
-- Run this using: supabase db push

-- =====================================================
-- STEP 1: SHOW CURRENT STATE
-- =====================================================

-- Show what we're working with
SELECT 
    'CURRENT DATA STRUCTURE' as info,
    COUNT(*) as total_activities,
    COUNT(CASE WHEN content_summary IS NOT NULL AND content_summary != '' THEN 1 END) as activities_with_content_summary,
    COUNT(CASE WHEN text IS NOT NULL AND text != '' THEN 1 END) as activities_with_text,
    COUNT(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 END) as activities_with_images
FROM public.activities 
WHERE content_type IS NOT NULL;

-- =====================================================
-- STEP 2: FIX TEXT CONTENT - MOVE FROM content_summary TO text
-- =====================================================

-- Update posts to move content from content_summary to text column
UPDATE public.activities 
SET text = content_summary
WHERE (text IS NULL OR text = '') 
  AND content_summary IS NOT NULL 
  AND content_summary != '';

-- =====================================================
-- STEP 3: FIX DATA JSONB STRUCTURE
-- =====================================================

-- Update posts to have proper data JSONB structure
UPDATE public.activities 
SET data = CASE 
    -- For posts with text content
    WHEN text IS NOT NULL AND text != '' THEN
        jsonb_build_object(
            'text', text,
            'content', text,
            'type', content_type,
            'content_summary', content_summary,
            'created_at', created_at::text,
            'updated_at', COALESCE(updated_at, created_at)::text,
            'has_content', true,
            'content_length', length(text),
            'is_structured', true,
            'fix_date', NOW()::text
        )
    
    -- For posts without text content
    ELSE
        jsonb_build_object(
            'type', content_type,
            'content_summary', COALESCE(content_summary, 'Content available'),
            'created_at', created_at::text,
            'updated_at', COALESCE(updated_at, created_at)::text,
            'has_content', false,
            'is_structured', true,
            'fix_date', NOW()::text
        )
    END
WHERE (data IS NULL OR data = '{}'::jsonb) 
  AND content_type IS NOT NULL;

-- =====================================================
-- STEP 4: ENSURE IMAGE_URL IS PROPERLY FORMATTED
-- =====================================================

-- Clean up image_url formatting (remove extra spaces, ensure proper comma separation)
UPDATE public.activities 
SET image_url = TRIM(REGEXP_REPLACE(image_url, '\s*,\s*', ',', 'g'))
WHERE image_url IS NOT NULL 
  AND image_url != '' 
  AND content_type = 'image';

-- =====================================================
-- STEP 5: FINAL VERIFICATION
-- =====================================================

-- Show the final state
SELECT 
    'POSTS DATA STRUCTURE FIXED' as status,
    COUNT(*) as total_activities,
    COUNT(CASE WHEN text IS NOT NULL AND text != '' THEN 1 END) as activities_with_text,
    COUNT(CASE WHEN data IS NOT NULL AND data != '{}'::jsonb THEN 1 END) as activities_with_data,
    COUNT(CASE WHEN content_type = 'image' AND image_url IS NOT NULL THEN 1 END) as activities_with_images,
    ROUND(
        (COUNT(CASE WHEN text IS NOT NULL AND text != '' THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 
        2
    ) as text_coverage_percentage
FROM public.activities 
WHERE content_type IS NOT NULL;

-- Show sample of fixed posts
SELECT 
    'SAMPLE OF FIXED POSTS' as info,
    id,
    user_id,
    activity_type,
    content_type,
    LEFT(text, 50) as text_preview,
    LEFT(image_url, 50) as image_url_preview,
    LEFT(data::text, 100) as data_preview,
    created_at
FROM public.activities 
WHERE content_type IS NOT NULL
  AND (text IS NOT NULL AND text != '')
ORDER BY created_at DESC 
LIMIT 10;

-- =====================================================
-- STEP 6: CREATE MONITORING VIEW
-- =====================================================

-- Create a view for monitoring post content structure
CREATE OR REPLACE VIEW posts_structure_monitoring AS
SELECT 
    a.id,
    a.user_id,
    a.activity_type,
    a.content_type,
    a.text,
    a.content_summary,
    a.image_url,
    a.data->>'text' as data_text,
    a.data->>'type' as data_type,
    a.created_at,
    a.updated_at,
    CASE 
        WHEN a.text IS NOT NULL AND a.text != '' THEN 'Has Text'
        ELSE 'Missing Text'
    END as text_status,
    CASE 
        WHEN a.content_summary IS NOT NULL AND a.content_summary != '' THEN 'Has Summary'
        ELSE 'Missing Summary'
    END as summary_status,
    CASE 
        WHEN a.data IS NOT NULL AND a.data != '{}'::jsonb THEN 'Has Data'
        ELSE 'Missing Data'
    END as data_status,
    CASE 
        WHEN a.content_type = 'image' AND a.image_url IS NOT NULL THEN 'Has Images'
        WHEN a.content_type = 'image' AND (a.image_url IS NULL OR a.image_url = '') THEN 'Missing Images'
        ELSE 'Not Image Post'
    END as image_status
FROM public.activities a
WHERE a.content_type IS NOT NULL
ORDER BY a.created_at DESC;

-- =====================================================
-- STEP 7: FINAL SUMMARY
-- =====================================================

-- Show what this fix accomplished
SELECT 
    'FIX SUMMARY' as info,
    'This script has:' as action,
    '1. Moved content from content_summary to text column' as step1,
    '2. Created proper data JSONB structures' as step2,
    '3. Cleaned up image_url formatting' as step3,
    '4. Created monitoring view for future structure' as step4,
    'Your posts should now display content correctly!' as result;
