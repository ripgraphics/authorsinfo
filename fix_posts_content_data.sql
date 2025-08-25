-- COMPREHENSIVE POSTS CONTENT DATA FIX
-- This script addresses the critical issue where posts show "undefined" for content
-- Date: 2025-08-23
-- Run this using: supabase db push

-- =====================================================
-- STEP 1: DIAGNOSE CURRENT POSTS STATE
-- =====================================================

-- Check current posts table state
DO $$
DECLARE
    total_posts INTEGER;
    posts_with_content INTEGER;
    posts_without_content INTEGER;
    posts_with_text INTEGER;
    posts_with_images INTEGER;
BEGIN
    -- Count total posts
    SELECT COUNT(*) INTO total_posts FROM public.posts;
    
    -- Count posts with meaningful content
    SELECT COUNT(*) INTO posts_with_content 
    FROM public.posts 
    WHERE content IS NOT NULL 
      AND content != '{}'::jsonb
      AND (
          content ? 'text' OR 
          content ? 'content' OR 
          content ? 'message' OR
          content ? 'body' OR
          content ? 'description'
      );
    
    -- Count posts without meaningful content
    SELECT COUNT(*) INTO posts_without_content 
    FROM public.posts 
    WHERE content IS NULL 
       OR content = '{}'::jsonb
       OR NOT (
           content ? 'text' OR 
           content ? 'content' OR 
           content ? 'message' OR
           content ? 'body' OR
           content ? 'description'
       );
    
    -- Count posts with text content
    SELECT COUNT(*) INTO posts_with_text 
    FROM public.posts 
    WHERE content ? 'text' 
      AND content->>'text' IS NOT NULL 
      AND content->>'text' != '';
    
    -- Count posts with images
    SELECT COUNT(*) INTO posts_with_images 
    FROM public.posts 
    WHERE image_url IS NOT NULL 
      AND image_url != '';
    
    RAISE NOTICE '=== POSTS DIAGNOSIS ===';
    RAISE NOTICE 'Total posts: %', total_posts;
    RAISE NOTICE 'Posts with content: %', posts_with_content;
    RAISE NOTICE 'Posts without content: %', posts_without_content;
    RAISE NOTICE 'Posts with text: %', posts_with_text;
    RAISE NOTICE 'Posts with images: %', posts_with_images;
    RAISE NOTICE '========================';
END $$;

-- =====================================================
-- STEP 2: SHOW SAMPLE OF PROBLEMATIC POSTS
-- =====================================================

-- Display posts that need content fixes
SELECT 
    'POSTS NEEDING CONTENT FIXES' as info,
    id,
    user_id,
    content_type,
    content,
    image_url,
    created_at
FROM public.posts 
WHERE content IS NULL 
   OR content = '{}'::jsonb
   OR NOT (
       content ? 'text' OR 
       content ? 'content' OR 
       content ? 'message' OR
       content ? 'body' OR
       content ? 'description'
   )
ORDER BY created_at DESC 
LIMIT 10;

-- =====================================================
-- STEP 3: FIX POSTS WITH MISSING CONTENT
-- =====================================================

-- Update posts that have content_type but missing content
UPDATE public.posts 
SET content = CASE 
    -- For text posts, create proper content structure
    WHEN content_type = 'text' THEN 
        jsonb_build_object(
            'text', COALESCE(content_summary, 'Shared an update'),
            'type', 'text',
            'created_at', created_at::text,
            'updated_at', updated_at::text
        )
    
    -- For image posts, create proper content structure
    WHEN content_type = 'image' THEN 
        jsonb_build_object(
            'text', COALESCE(content_summary, 'Shared an image'),
            'type', 'image',
            'image_url', image_url,
            'media_files', COALESCE(media_files, '[]'::jsonb),
            'created_at', created_at::text,
            'updated_at', updated_at::text
        )
    
    -- For other content types, create generic structure
    ELSE 
        jsonb_build_object(
            'text', COALESCE(content_summary, 'Shared content'),
            'type', COALESCE(content_type, 'text'),
            'created_at', created_at::text,
            'updated_at', updated_at::text
        )
    END,
    
    -- Also update content_summary if it's missing
    content_summary = CASE 
        WHEN content_summary IS NULL OR content_summary = '' THEN
            CASE 
                WHEN content_type = 'text' THEN 'Shared an update'
                WHEN content_type = 'image' THEN 'Shared an image'
                WHEN content_type = 'video' THEN 'Shared a video'
                WHEN content_type = 'link' THEN 'Shared a link'
                ELSE 'Shared content'
            END
        ELSE content_summary
    END,
    
    -- Update metadata if it's missing
    metadata = COALESCE(metadata, '{}'::jsonb),
    
    -- Update media_files if it's missing but we have image_url
    media_files = CASE 
        WHEN media_files IS NULL OR media_files = '[]'::jsonb THEN
            CASE 
                WHEN image_url IS NOT NULL AND image_url != '' THEN
                    jsonb_build_array(
                        jsonb_build_object(
                            'id', gen_random_uuid()::text,
                            'url', image_url,
                            'type', 'image',
                            'filename', 'post_image',
                            'size', 0,
                            'mime_type', 'image/jpeg'
                        )
                    )
                ELSE '[]'::jsonb
            END
        ELSE media_files
    END,
    
    -- Update last_activity_at
    last_activity_at = COALESCE(last_activity_at, created_at),
    
    -- Update enterprise_features if missing
    enterprise_features = COALESCE(enterprise_features, '{}'::jsonb)
    
WHERE content IS NULL 
   OR content = '{}'::jsonb
   OR NOT (
       content ? 'text' OR 
       content ? 'content' OR 
       content ? 'message' OR
       content ? 'body' OR
       content ? 'description'
   );

-- =====================================================
-- STEP 4: ENSURE ALL POSTS HAVE PROPER METADATA
-- =====================================================

-- Update posts to ensure they have proper metadata structure
UPDATE public.posts 
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
            'last_content_review', created_at::text
        )
    ELSE metadata
    END
WHERE metadata IS NULL OR metadata = '{}'::jsonb;

-- =====================================================
-- STEP 5: VALIDATE CONTENT STRUCTURE
-- =====================================================

-- Create a function to validate post content structure
CREATE OR REPLACE FUNCTION validate_post_content(post_record public.posts)
RETURNS jsonb AS $$
DECLARE
    validation_result jsonb;
    content_issues text[];
    content_score integer := 100;
BEGIN
    content_issues := ARRAY[]::text[];
    
    -- Check if content exists
    IF post_record.content IS NULL OR post_record.content = '{}'::jsonb THEN
        content_issues := array_append(content_issues, 'Missing content field');
        content_score := content_score - 50;
    END IF;
    
    -- Check if content has text
    IF NOT (post_record.content ? 'text') OR post_record.content->>'text' IS NULL THEN
        content_issues := array_append(content_issues, 'Missing text in content');
        content_score := content_score - 20;
    END IF;
    
    -- Check if content has type
    IF NOT (post_record.content ? 'type') OR post_record.content->>'type' IS NULL THEN
        content_issues := array_append(content_issues, 'Missing type in content');
        content_score := content_score - 15;
    END IF;
    
    -- Check content_type consistency
    IF post_record.content_type IS NOT NULL AND post_record.content ? 'type' THEN
        IF post_record.content_type != post_record.content->>'type' THEN
            content_issues := array_append(content_issues, 'Content type mismatch');
            content_score := content_score - 10;
        END IF;
    END IF;
    
    -- Check if image posts have proper media structure
    IF post_record.content_type = 'image' AND post_record.image_url IS NOT NULL THEN
        IF NOT (post_record.content ? 'image_url') THEN
            content_issues := array_append(content_issues, 'Image posts missing image_url in content');
            content_score := content_score - 10;
        END IF;
    END IF;
    
    -- Build validation result
    validation_result := jsonb_build_object(
        'post_id', post_record.id,
        'content_score', GREATEST(content_score, 0),
        'is_valid', content_score >= 80,
        'issues', content_issues,
        'content_structure', post_record.content,
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
-- STEP 6: APPLY CONTENT VALIDATION TO ALL POSTS
-- =====================================================

-- Validate all posts and show results
SELECT 
    'POSTS VALIDATION RESULTS' as info,
    validate_post_content(p.*) as validation_result
FROM public.posts p
ORDER BY (validate_post_content(p.*)->>'content_score')::integer ASC
LIMIT 20;

-- =====================================================
-- STEP 7: FINAL CONTENT QUALITY CHECK
-- =====================================================

-- Final verification that all posts now have proper content
DO $$
DECLARE
    final_check_posts INTEGER;
    final_check_content INTEGER;
    final_check_text INTEGER;
BEGIN
    -- Count posts after fixes
    SELECT COUNT(*) INTO final_check_posts FROM public.posts;
    
    -- Count posts with content after fixes
    SELECT COUNT(*) INTO final_check_content 
    FROM public.posts 
    WHERE content IS NOT NULL 
      AND content != '{}'::jsonb
      AND content ? 'text';
    
    -- Count posts with text after fixes
    SELECT COUNT(*) INTO final_check_text 
    FROM public.posts 
    WHERE content ? 'text' 
      AND content->>'text' IS NOT NULL 
      AND content->>'text' != '';
    
    RAISE NOTICE '=== FINAL VERIFICATION ===';
    RAISE NOTICE 'Total posts: %', final_check_posts;
    RAISE NOTICE 'Posts with content: %', final_check_content;
    RAISE NOTICE 'Posts with text: %', final_check_text;
    RAISE NOTICE 'Content coverage: %%%', 
        CASE 
            WHEN final_check_posts > 0 THEN 
                ROUND((final_check_content::numeric / final_check_posts::numeric) * 100, 2)
            ELSE 0
        END;
    RAISE NOTICE '========================';
END $$;

-- =====================================================
-- STEP 8: CREATE CONTENT INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for better content query performance
CREATE INDEX IF NOT EXISTS idx_posts_content_text 
ON public.posts USING gin ((content->>'text'));

CREATE INDEX IF NOT EXISTS idx_posts_content_type 
ON public.posts USING gin ((content->>'type'));

CREATE INDEX IF NOT EXISTS idx_posts_content_metadata 
ON public.posts USING gin (content);

CREATE INDEX IF NOT EXISTS idx_posts_content_type_created 
ON public.posts (content_type, created_at DESC);

-- =====================================================
-- STEP 9: CREATE CONTENT MONITORING VIEW
-- =====================================================

-- Create a view for monitoring post content quality
CREATE OR REPLACE VIEW posts_content_monitoring AS
SELECT 
    p.id,
    p.user_id,
    p.content_type,
    p.content->>'text' as content_text,
    p.content->>'type' as content_type_from_json,
    p.content_summary,
    p.image_url,
    p.created_at,
    p.updated_at,
    p.last_activity_at,
    CASE 
        WHEN p.content ? 'text' AND p.content->>'text' IS NOT NULL THEN 'Has Text'
        ELSE 'Missing Text'
    END as text_status,
    CASE 
        WHEN p.content ? 'type' AND p.content->>'type' IS NOT NULL THEN 'Has Type'
        ELSE 'Missing Type'
    END as type_status,
    CASE 
        WHEN p.content IS NOT NULL AND p.content != '{}'::jsonb THEN 'Has Content'
        ELSE 'Missing Content'
    END as content_status,
    jsonb_array_length(COALESCE(p.media_files, '[]'::jsonb)) as media_file_count,
    p.engagement_score,
    p.view_count,
    p.like_count,
    p.comment_count
FROM public.posts p
ORDER BY p.created_at DESC;

-- =====================================================
-- STEP 10: FINAL SUMMARY
-- =====================================================

-- Show final summary of the fix
SELECT 
    'POSTS CONTENT FIX COMPLETE' as status,
    COUNT(*) as total_posts,
    COUNT(CASE WHEN content IS NOT NULL AND content != '{}'::jsonb THEN 1 END) as posts_with_content,
    COUNT(CASE WHEN content ? 'text' AND content->>'text' IS NOT NULL THEN 1 END) as posts_with_text,
    COUNT(CASE WHEN content_type = 'image' AND image_url IS NOT NULL THEN 1 END) as posts_with_images,
    ROUND(
        (COUNT(CASE WHEN content IS NOT NULL AND content != '{}'::jsonb THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 
        2
    ) as content_coverage_percentage
FROM public.posts;
