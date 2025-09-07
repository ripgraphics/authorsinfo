-- CLEANUP: Remove problematic activities that have no meaningful content
-- This addresses the issue where posts show undefined or empty content
-- Date: 2025-08-23

-- First, let's see what problematic records we have
DO $$
DECLARE
    total_activities INTEGER;
    problematic_activities INTEGER;
    empty_text_activities INTEGER;
    empty_data_activities INTEGER;
BEGIN
    -- Count total activities
    SELECT COUNT(*) INTO total_activities FROM public.activities;
    
    -- Count activities with problematic content (null/empty text AND null/empty data)
    SELECT COUNT(*) INTO problematic_activities 
    FROM public.activities 
    WHERE (text IS NULL OR text = '' OR text = 'Shared an update' OR text = 'Post content')
      AND (data IS NULL OR data = '{}' OR data::text = 'null');
    
    -- Count activities with empty text
    SELECT COUNT(*) INTO empty_text_activities 
    FROM public.activities 
    WHERE text IS NULL OR text = '' OR text = 'Shared an update' OR text = 'Post content';
    
    -- Count activities with empty data
    SELECT COUNT(*) INTO empty_data_activities 
    FROM public.activities 
    WHERE data IS NULL OR data = '{}' OR data::text = 'null';
    
    RAISE NOTICE 'Total activities: %, Problematic activities: %, Empty text: %, Empty data: %', 
        total_activities, problematic_activities, empty_text_activities, empty_data_activities;
END $$;

-- Step 1: Remove activities that have no meaningful content at all
DELETE FROM public.activities 
WHERE 
    -- No meaningful text content
    (text IS NULL OR text = '' OR text = 'Shared an update' OR text = 'Post content')
    AND 
    -- No meaningful data content
    (data IS NULL OR data = '{}' OR data::text = 'null')
    AND
    -- No other meaningful content
    (content_summary IS NULL OR content_summary = '')
    AND
    (image_url IS NULL OR image_url = '')
    AND
    (link_url IS NULL OR link_url = '');

-- Step 2: Remove duplicate activities that might be causing issues
DELETE FROM public.activities a
WHERE a.id IN (
    SELECT id 
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY user_id, activity_type, created_at::date 
                   ORDER BY created_at DESC
               ) as rn
        FROM public.activities
        WHERE text = 'Shared an update' OR text = 'Post content'
    ) t
    WHERE t.rn > 1
);

-- Step 3: Update remaining activities with generic fallback text to have proper content
UPDATE public.activities 
SET 
    text = CASE 
        WHEN data->>'text' IS NOT NULL AND data->>'text' != '' THEN data->>'text'
        WHEN data->>'content' IS NOT NULL AND data->>'content' != '' THEN data->>'content'
        WHEN data->>'message' IS NOT NULL AND data->>'message' != '' THEN data->>'message'
        WHEN data->>'body' IS NOT NULL AND data->>'body' != '' THEN data->>'body'
        WHEN data->>'description' IS NOT NULL AND data->>'description' != '' THEN data->>'description'
        WHEN content_summary IS NOT NULL AND content_summary != '' THEN content_summary
        WHEN image_url IS NOT NULL AND image_url != '' THEN 'Shared an image'
        WHEN link_url IS NOT NULL AND link_url != '' THEN 'Shared a link'
        WHEN activity_type = 'book_added' THEN 'Added a book to their library'
        WHEN activity_type = 'book_review' THEN 'Posted a book review'
        WHEN activity_type = 'author_follow' THEN 'Started following an author'
        WHEN activity_type = 'reading_progress' THEN 'Updated reading progress'
        WHEN activity_type = 'book_share' THEN 'Shared a book'
        WHEN activity_type = 'book_recommendation' THEN 'Recommended a book'
        WHEN activity_type = 'profile_created' THEN 'Joined the platform'
        WHEN activity_type = 'member_joined' THEN 'Joined as a member'
        ELSE CONCAT('Performed a ', REPLACE(activity_type, '_', ' '), ' action')
    END,
    updated_at = NOW()
WHERE 
    (text = 'Shared an update' OR text = 'Post content' OR text IS NULL OR text = '')
    AND id IS NOT NULL;

-- Step 4: Verify the cleanup results
DO $$
DECLARE
    final_count INTEGER;
    remaining_problematic INTEGER;
    activities_with_content INTEGER;
BEGIN
    -- Count remaining activities
    SELECT COUNT(*) INTO final_count FROM public.activities;
    
    -- Count remaining problematic activities
    SELECT COUNT(*) INTO remaining_problematic 
    FROM public.activities 
    WHERE (text IS NULL OR text = '' OR text = 'Shared an update' OR text = 'Post content')
      AND (data IS NULL OR data = '{}' OR data::text = 'null');
    
    -- Count activities with meaningful content
    SELECT COUNT(*) INTO activities_with_content 
    FROM public.activities 
    WHERE text IS NOT NULL 
      AND text != '' 
      AND text != 'Shared an update' 
      AND text != 'Post content';
    
    RAISE NOTICE 'Cleanup complete! Remaining activities: %, Problematic: %, With content: %', 
        final_count, remaining_problematic, activities_with_content;
END $$;

-- Step 5: Show sample of remaining activities
SELECT 
    id,
    user_id,
    activity_type,
    content_type,
    text,
    CASE 
        WHEN data IS NOT NULL AND data != '{}' THEN LEFT(data::text, 50) 
        ELSE 'No data' 
    END as data_preview,
    created_at
FROM public.activities 
WHERE text IS NOT NULL 
    AND text != '' 
    AND text != 'Shared an update' 
    AND text != 'Post content'
ORDER BY created_at DESC
LIMIT 10;
