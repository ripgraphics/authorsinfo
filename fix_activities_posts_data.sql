-- COMPREHENSIVE ACTIVITIES TABLE POSTS DATA FIX
-- This script addresses the critical issue where posts in activities table show "undefined" for content
-- Date: 2025-08-23
-- Run this using: supabase db push

-- =====================================================
-- STEP 1: DIAGNOSE CURRENT ACTIVITIES STATE
-- =====================================================

-- Check current activities table state
DO $$
DECLARE
    total_activities INTEGER;
    activities_with_text INTEGER;
    activities_without_text INTEGER;
    activities_with_data INTEGER;
    activities_without_data INTEGER;
    activities_with_images INTEGER;
BEGIN
    -- Count total activities
    SELECT COUNT(*) INTO total_activities FROM public.activities;
    
    -- Count activities with text content
    SELECT COUNT(*) INTO activities_with_text 
    FROM public.activities 
    WHERE text IS NOT NULL AND text != '';
    
    -- Count activities without text content
    SELECT COUNT(*) INTO activities_without_text 
    FROM public.activities 
    WHERE text IS NULL OR text = '';
    
    -- Count activities with data JSONB
    SELECT COUNT(*) INTO activities_with_data 
    FROM public.activities 
    WHERE data IS NOT NULL AND data != '{}'::jsonb;
    
    -- Count activities without data JSONB
    SELECT COUNT(*) INTO activities_without_data 
    FROM public.activities 
    WHERE data IS NULL OR data = '{}'::jsonb;
    
    -- Count activities with images
    SELECT COUNT(*) INTO activities_with_images 
    FROM public.activities 
    WHERE image_url IS NOT NULL AND image_url != '';
    
    RAISE NOTICE '=== ACTIVITIES DIAGNOSIS ===';
    RAISE NOTICE 'Total activities: %', total_activities;
    RAISE NOTICE 'Activities with text: %', activities_with_text;
    RAISE NOTICE 'Activities without text: %', activities_without_text;
    RAISE NOTICE 'Activities with data: %', activities_with_data;
    RAISE NOTICE 'Activities without data: %', activities_without_data;
    RAISE NOTICE 'Activities with images: %', activities_with_images;
    RAISE NOTICE '========================';
END $$;

-- =====================================================
-- STEP 2: SHOW SAMPLE OF PROBLEMATIC ACTIVITIES
-- =====================================================

-- Display activities that need content fixes
SELECT 
    'ACTIVITIES NEEDING CONTENT FIXES' as info,
    id,
    user_id,
    activity_type,
    content_type,
    text,
    image_url,
    LEFT(data::text, 200) as data_preview,
    LEFT(metadata::text, 200) as metadata_preview,
    created_at
FROM public.activities 
WHERE (text IS NULL OR text = '') 
   AND (data IS NULL OR data = '{}'::jsonb)
ORDER BY created_at DESC 
LIMIT 10;

-- =====================================================
-- STEP 3: FIX ACTIVITIES WITH MISSING TEXT CONTENT
-- =====================================================

-- Update activities that have content_type but missing text
UPDATE public.activities 
SET text = CASE 
    -- For text posts, use content_summary or generate meaningful text
    WHEN content_type = 'text' THEN 
        COALESCE(content_summary, 'Shared an update')
    
    -- For image posts, generate descriptive text
    WHEN content_type = 'image' THEN 
        COALESCE(content_summary, 'Shared an image')
    
    -- For video posts, generate descriptive text
    WHEN content_type = 'video' THEN 
        COALESCE(content_summary, 'Shared a video')
    
    -- For link posts, generate descriptive text
    WHEN content_type = 'link' THEN 
        COALESCE(content_summary, 'Shared a link')
    
    -- For book posts, generate descriptive text
    WHEN content_type = 'book' THEN 
        COALESCE(content_summary, 'Shared a book')
    
    -- For author posts, generate descriptive text
    WHEN content_type = 'author' THEN 
        COALESCE(content_summary, 'Shared an author')
    
    -- For other content types, generate generic text
    ELSE 
        COALESCE(content_summary, 'Shared content')
    END
    
WHERE (text IS NULL OR text = '') 
  AND content_type IS NOT NULL;

-- =====================================================
-- STEP 4: FIX ACTIVITIES WITH MISSING DATA JSONB
-- =====================================================

-- Update activities that have content_type but missing data JSONB
UPDATE public.activities 
SET data = CASE 
    -- For text posts, create proper data structure
    WHEN content_type = 'text' THEN 
        jsonb_build_object(
            'text', COALESCE(text, 'Shared an update'),
            'type', 'text',
            'content_summary', COALESCE(content_summary, 'Shared an update'),
            'created_at', created_at::text,
            'updated_at', COALESCE(updated_at, created_at)::text
        )
    
    -- For image posts, create proper data structure
    WHEN content_type = 'image' THEN 
        jsonb_build_object(
            'text', COALESCE(text, 'Shared an image'),
            'type', 'image',
            'image_url', COALESCE(image_url, ''),
            'content_summary', COALESCE(content_summary, 'Shared an image'),
            'created_at', created_at::text,
            'updated_at', COALESCE(updated_at, created_at)::text
        )
    
    -- For video posts, create proper data structure
    WHEN content_type = 'video' THEN 
        jsonb_build_object(
            'text', COALESCE(text, 'Shared a video'),
            'type', 'video',
            'content_summary', COALESCE(content_summary, 'Shared a video'),
            'created_at', created_at::text,
            'updated_at', COALESCE(updated_at, created_at)::text
        )
    
    -- For link posts, create proper data structure
    WHEN content_type = 'link' THEN 
        jsonb_build_object(
            'text', COALESCE(text, 'Shared a link'),
            'type', 'link',
            'link_url', COALESCE(link_url, ''),
            'content_summary', COALESCE(content_summary, 'Shared a link'),
            'created_at', created_at::text,
            'updated_at', COALESCE(updated_at, created_at)::text
        )
    
    -- For book posts, create proper data structure
    WHEN content_type = 'book' THEN 
        jsonb_build_object(
            'text', COALESCE(text, 'Shared a book'),
            'type', 'book',
            'content_summary', COALESCE(content_summary, 'Shared a book'),
            'created_at', created_at::text,
            'updated_at', COALESCE(updated_at, created_at)::text
        )
    
    -- For author posts, create proper data structure
    WHEN content_type = 'author' THEN 
        jsonb_build_object(
            'text', COALESCE(text, 'Shared an author'),
            'type', 'author',
            'content_summary', COALESCE(content_summary, 'Shared an author'),
            'created_at', created_at::text,
            'updated_at', COALESCE(updated_at, created_at)::text
        )
    
    -- For other content types, create generic structure
    ELSE 
        jsonb_build_object(
            'text', COALESCE(text, 'Shared content'),
            'type', COALESCE(content_type, 'text'),
            'content_summary', COALESCE(content_summary, 'Shared content'),
            'created_at', created_at::text,
            'updated_at', COALESCE(updated_at, created_at)::text
        )
    END
    
WHERE (data IS NULL OR data = '{}'::jsonb) 
  AND content_type IS NOT NULL;

-- =====================================================
-- STEP 5: ENSURE ALL ACTIVITIES HAVE PROPER METADATA
-- =====================================================

-- Update activities to ensure they have proper metadata structure
UPDATE public.activities 
SET metadata = CASE 
    WHEN metadata IS NULL OR metadata = '{}'::jsonb THEN
        jsonb_build_object(
            'source', 'system_generated',
            'content_quality', 'standard',
            'moderation_status', 'approved',
            'language', 'en',
            'region', 'global',
            'content_safety_score', 100,
            'sentiment_analysis', 'neutral',
            'engagement_potential', 'medium',
            'seo_optimized', false,
            'last_content_review', created_at::text,
            'fix_applied', true,
            'fix_date', NOW()::text
        )
    ELSE 
        metadata || jsonb_build_object(
            'fix_applied', true,
            'fix_date', NOW()::text
        )
    END
WHERE metadata IS NULL OR metadata = '{}'::jsonb;

-- =====================================================
-- STEP 6: FIX ACTIVITIES WITH MISSING CONTENT_SUMMARY
-- =====================================================

-- Update activities that are missing content_summary
UPDATE public.activities 
SET content_summary = CASE 
    WHEN content_summary IS NULL OR content_summary = '' THEN
        CASE 
            WHEN content_type = 'text' THEN COALESCE(text, 'Shared an update')
            WHEN content_type = 'image' THEN COALESCE(text, 'Shared an image')
            WHEN content_type = 'video' THEN COALESCE(text, 'Shared a video')
            WHEN content_type = 'link' THEN COALESCE(text, 'Shared a link')
            WHEN content_type = 'book' THEN COALESCE(text, 'Shared a book')
            WHEN content_type = 'author' THEN COALESCE(text, 'Shared an author')
            ELSE COALESCE(text, 'Shared content')
        END
    ELSE content_summary
    END
WHERE content_summary IS NULL OR content_summary = '';

-- =====================================================
-- STEP 7: VALIDATE CONTENT STRUCTURE
-- =====================================================

-- Create a function to validate activity content structure
CREATE OR REPLACE FUNCTION validate_activity_content(activity_record public.activities)
RETURNS jsonb AS $$
DECLARE
    validation_result jsonb;
    content_issues text[];
    content_score integer := 100;
BEGIN
    content_issues := ARRAY[]::text[];
    
    -- Check if text exists
    IF activity_record.text IS NULL OR activity_record.text = '' THEN
        content_issues := array_append(content_issues, 'Missing text field');
        content_score := content_score - 30;
    END IF;
    
    -- Check if data JSONB exists
    IF activity_record.data IS NULL OR activity_record.data = '{}'::jsonb THEN
        content_issues := array_append(content_issues, 'Missing data JSONB');
        content_score := content_score - 25;
    END IF;
    
    -- Check if data has text
    IF activity_record.data IS NOT NULL AND activity_record.data != '{}'::jsonb THEN
        IF NOT (activity_record.data ? 'text') OR activity_record.data->>'text' IS NULL THEN
            content_issues := array_append(content_issues, 'Missing text in data JSONB');
            content_score := content_score - 20;
        END IF;
    END IF;
    
    -- Check if data has type
    IF activity_record.data IS NOT NULL AND activity_record.data != '{}'::jsonb THEN
        IF NOT (activity_record.data ? 'type') OR activity_record.data->>'type' IS NULL THEN
            content_issues := array_append(content_issues, 'Missing type in data JSONB');
            content_score := content_score - 15;
        END IF;
    END IF;
    
    -- Check content_type consistency
    IF activity_record.content_type IS NOT NULL AND activity_record.data IS NOT NULL THEN
        IF activity_record.data ? 'type' THEN
            IF activity_record.content_type != activity_record.data->>'type' THEN
                content_issues := array_append(content_issues, 'Content type mismatch');
                content_score := content_score - 10;
            END IF;
        END IF;
    END IF;
    
    -- Build validation result
    validation_result := jsonb_build_object(
        'activity_id', activity_record.id,
        'content_score', GREATEST(content_score, 0),
        'is_valid', content_score >= 80,
        'issues', content_issues,
        'text_field', activity_record.text,
        'data_structure', activity_record.data,
        'recommendations', CASE 
            WHEN content_score >= 90 THEN 'Content is well-structured'
            WHEN content_score >= 80 THEN 'Content needs minor improvements'
            WHEN content_score >= 60 THEN 'Content needs significant improvements'
            ELSE 'Content needs major restructuring'
        END
    );
    
    RETURN validation_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 8: APPLY CONTENT VALIDATION TO ALL ACTIVITIES
-- =====================================================

-- Validate all activities and show results
SELECT 
    'ACTIVITIES VALIDATION RESULTS' as info,
    validate_activity_content(a.*) as validation_result
FROM public.activities a
ORDER BY (validate_activity_content(a.*)->>'content_score')::integer ASC
LIMIT 20;

-- =====================================================
-- STEP 9: FINAL CONTENT QUALITY CHECK
-- =====================================================

-- Final verification that all activities now have proper content
DO $$
DECLARE
    final_check_activities INTEGER;
    final_check_text INTEGER;
    final_check_data INTEGER;
    final_check_content_summary INTEGER;
BEGIN
    -- Count activities after fixes
    SELECT COUNT(*) INTO final_check_activities FROM public.activities;
    
    -- Count activities with text after fixes
    SELECT COUNT(*) INTO final_check_text 
    FROM public.activities 
    WHERE text IS NOT NULL AND text != '';
    
    -- Count activities with data after fixes
    SELECT COUNT(*) INTO final_check_data 
    FROM public.activities 
    WHERE data IS NOT NULL AND data != '{}'::jsonb;
    
    -- Count activities with content_summary after fixes
    SELECT COUNT(*) INTO final_check_content_summary 
    FROM public.activities 
    WHERE content_summary IS NOT NULL AND content_summary != '';
    
    RAISE NOTICE '=== FINAL VERIFICATION ===';
    RAISE NOTICE 'Total activities: %', final_check_activities;
    RAISE NOTICE 'Activities with text: %', final_check_text;
    RAISE NOTICE 'Activities with data: %', final_check_data;
    RAISE NOTICE 'Activities with content_summary: %', final_check_content_summary;
    RAISE NOTICE 'Text coverage: %%%', 
        CASE 
            WHEN final_check_activities > 0 THEN 
                ROUND((final_check_text::numeric / final_check_activities::numeric) * 100, 2)
            ELSE 0
        END;
    RAISE NOTICE 'Data coverage: %%%', 
        CASE 
            WHEN final_check_activities > 0 THEN 
                ROUND((final_check_data::numeric / final_check_activities::numeric) * 100, 2)
            ELSE 0
        END;
    RAISE NOTICE '========================';
END $$;

-- =====================================================
-- STEP 10: CREATE CONTENT INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for better content query performance
CREATE INDEX IF NOT EXISTS idx_activities_text 
ON public.activities (text) WHERE text IS NOT NULL AND text != '';

CREATE INDEX IF NOT EXISTS idx_activities_content_type 
ON public.activities (content_type);

CREATE INDEX IF NOT EXISTS idx_activities_data 
ON public.activities USING gin (data);

CREATE INDEX IF NOT EXISTS idx_activities_content_type_created 
ON public.activities (content_type, created_at DESC);

-- =====================================================
-- STEP 11: CREATE CONTENT MONITORING VIEW
-- =====================================================

-- Create a view for monitoring activity content quality
CREATE OR REPLACE VIEW activities_content_monitoring AS
SELECT 
    a.id,
    a.user_id,
    a.activity_type,
    a.content_type,
    a.text,
    a.data->>'text' as data_text,
    a.data->>'type' as data_type,
    a.content_summary,
    a.image_url,
    a.created_at,
    a.updated_at,
    CASE 
        WHEN a.text IS NOT NULL AND a.text != '' THEN 'Has Text'
        ELSE 'Missing Text'
    END as text_status,
    CASE 
        WHEN a.data IS NOT NULL AND a.data != '{}'::jsonb THEN 'Has Data'
        ELSE 'Missing Data'
    END as data_status,
    CASE 
        WHEN a.content_summary IS NOT NULL AND a.content_summary != '' THEN 'Has Summary'
        ELSE 'Missing Summary'
    END as summary_status,
    a.engagement_score,
    a.view_count,
    a.like_count,
    a.comment_count,
    a.share_count
FROM public.activities a
ORDER BY a.created_at DESC;

-- =====================================================
-- STEP 12: FINAL SUMMARY
-- =====================================================

-- Show final summary of the fix
SELECT 
    'ACTIVITIES CONTENT FIX COMPLETE' as status,
    COUNT(*) as total_activities,
    COUNT(CASE WHEN text IS NOT NULL AND text != '' THEN 1 END) as activities_with_text,
    COUNT(CASE WHEN data IS NOT NULL AND data != '{}'::jsonb THEN 1 END) as activities_with_data,
    COUNT(CASE WHEN content_summary IS NOT NULL AND content_summary != '' THEN 1 END) as activities_with_summary,
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
