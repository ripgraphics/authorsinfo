-- COMPLETE MIGRATION: Convert old posts from data JSONB to proper text format
-- This script extracts meaningful content from old posts and stores it in the text column
-- Date: 2025-08-23
-- Purpose: Fix incomplete migration by extracting actual content from data field

-- Step 1: Update book_added activities with meaningful text
UPDATE public.activities 
SET 
    text = CASE 
        WHEN data->>'book_title' IS NOT NULL AND data->>'author_name' IS NOT NULL 
        THEN 'Added ''' || (data->>'book_title') || ''' by ' || (data->>'author_name') || ' to my library'
        WHEN data->>'book_title' IS NOT NULL 
        THEN 'Added ''' || (data->>'book_title') || ''' to my library'
        ELSE 'Added a book to my library'
    END,
    content_type = 'book',
    updated_at = NOW()
WHERE 
    activity_type = 'book_added' 
    AND (text = 'Added a book to their library' OR text = 'Post content' OR text IS NULL OR text = '');

-- Step 2: Update book_review activities
UPDATE public.activities 
SET 
    text = CASE 
        WHEN data->>'review' IS NOT NULL AND data->>'review' != '' 
        THEN data->>'review'
        WHEN data->>'book_title' IS NOT NULL AND data->>'author_name' IS NOT NULL 
        THEN 'Reviewed ''' || (data->>'book_title') || ''' by ' || (data->>'author_name') || ''''
        WHEN data->>'book_title' IS NOT NULL 
        THEN 'Reviewed ''' || (data->>'book_title') || ''''
        ELSE 'Posted a book review'
    END,
    content_type = 'book',
    updated_at = NOW()
WHERE 
    activity_type = 'book_review' 
    AND (text = 'Post content' OR text IS NULL OR text = '');

-- Step 3: Update author_follow activities
UPDATE public.activities 
SET 
    text = CASE 
        WHEN data->>'author_name' IS NOT NULL 
        THEN 'Started following ' || (data->>'author_name')
        ELSE 'Started following an author'
    END,
    content_type = 'author',
    updated_at = NOW()
WHERE 
    activity_type = 'author_follow' 
    AND (text = 'Post content' OR text IS NULL OR text = '');

-- Step 4: Update reading_progress activities
UPDATE public.activities 
SET 
    text = CASE 
        WHEN data->>'book_title' IS NOT NULL AND data->>'reading_status' IS NOT NULL 
        THEN 'Updated reading progress for ''' || (data->>'book_title') || ''' - ' || (data->>'reading_status')
        WHEN data->>'book_title' IS NOT NULL 
        THEN 'Updated reading progress for ''' || (data->>'book_title') || ''''
        ELSE 'Updated reading progress'
    END,
    content_type = 'book',
    updated_at = NOW()
WHERE 
    activity_type = 'reading_progress' 
    AND (text = 'Post content' OR text IS NULL OR text = '');

-- Step 5: Update book_share activities
UPDATE public.activities 
SET 
    text = CASE 
        WHEN data->>'book_title' IS NOT NULL AND data->>'author_name' IS NOT NULL 
        THEN 'Shared ''' || (data->>'book_title') || ''' by ' || (data->>'author_name') || ''''
        WHEN data->>'book_title' IS NOT NULL 
        THEN 'Shared ''' || (data->>'book_title') || ''''
        ELSE 'Shared a book'
    END,
    content_type = 'book',
    updated_at = NOW()
WHERE 
    activity_type = 'book_share' 
    AND (text = 'Post content' OR text IS NULL OR text = '');

-- Step 6: Update book_recommendation activities
UPDATE public.activities 
SET 
    text = CASE 
        WHEN data->>'book_title' IS NOT NULL AND data->>'author_name' IS NOT NULL 
        THEN 'Recommended ''' || (data->>'book_title') || ''' by ' || (data->>'author_name') || ''''
        WHEN data->>'book_title' IS NOT NULL 
        THEN 'Recommended ''' || (data->>'book_title') || ''''
        ELSE 'Recommended a book'
    END,
    content_type = 'book',
    updated_at = NOW()
WHERE 
    activity_type = 'book_recommendation' 
    AND (text = 'Post content' OR text IS NULL OR text = '');

-- Step 7: Update any remaining generic text posts
UPDATE public.activities 
SET 
    text = CASE 
        WHEN data->>'text' IS NOT NULL AND data->>'text' != '' THEN data->>'text'
        WHEN data->>'content' IS NOT NULL AND data->>'content' != '' THEN data->>'content'
        WHEN data->>'message' IS NOT NULL AND data->>'message' != '' THEN data->>'message'
        WHEN data->>'body' IS NOT NULL AND data->>'body' != '' THEN data->>'body'
        WHEN data->>'description' IS NOT NULL AND data->>'description' != '' THEN data->>'description'
        ELSE 'Shared an update'
    END,
    updated_at = NOW()
WHERE 
    (text = 'Post content' OR text = 'Added a book to their library' OR text IS NULL OR text = '')
    AND data IS NOT NULL
    AND data != '{}';

-- Step 8: Clean up data field to only contain essential metadata
UPDATE public.activities 
SET 
    data = CASE 
        WHEN activity_type = 'book_added' THEN 
            jsonb_build_object(
                'book_id', data->>'book_id',
                'rating', data->>'rating',
                'reading_status', data->>'reading_status'
            )
        WHEN activity_type = 'book_review' THEN 
            jsonb_build_object(
                'book_id', data->>'book_id',
                'rating', data->>'rating',
                'review_id', data->>'review_id'
            )
        WHEN activity_type = 'author_follow' THEN 
            jsonb_build_object(
                'author_id', data->>'author_id'
            )
        WHEN activity_type = 'reading_progress' THEN 
            jsonb_build_object(
                'book_id', data->>'book_id',
                'progress_percentage', data->>'progress_percentage',
                'current_page', data->>'current_page'
            )
        ELSE data
    END
WHERE 
    data IS NOT NULL 
    AND data != '{}'
    AND activity_type IN ('book_added', 'book_review', 'author_follow', 'reading_progress');

-- Step 9: Verify the migration results
SELECT 
    'Migration Results' as status,
    COUNT(*) as total_activities,
    COUNT(CASE WHEN text IS NOT NULL AND text != '' AND text != 'Post content' THEN 1 END) as activities_with_content,
    COUNT(CASE WHEN text = 'Post content' OR text IS NULL OR text = '' THEN 1 END) as activities_without_content,
    COUNT(CASE WHEN content_type IS NOT NULL THEN 1 END) as activities_with_content_type
FROM public.activities;

-- Step 10: Show sample of migrated content
SELECT 
    id,
    activity_type,
    content_type,
    text,
    LEFT(data::text, 100) as data_preview
FROM public.activities 
WHERE text IS NOT NULL 
    AND text != '' 
    AND text != 'Post content'
    AND text != 'Added a book to their library'
ORDER BY updated_at DESC
LIMIT 10;
