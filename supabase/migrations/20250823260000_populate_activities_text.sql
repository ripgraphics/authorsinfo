-- POPULATE: Populate activities text column with meaningful content
-- This addresses the issue where posts show "Shared an update" instead of actual content
-- Date: 2025-08-23

-- First, let's see what we're working with
DO $$
DECLARE
    total_activities INTEGER;
    activities_with_text INTEGER;
    activities_without_text INTEGER;
BEGIN
    -- Count total activities
    SELECT COUNT(*) INTO total_activities FROM public.activities;
    
    -- Count activities with text
    SELECT COUNT(*) INTO activities_with_text 
    FROM public.activities 
    WHERE text IS NOT NULL AND text != '' AND text != 'Shared an update';
    
    -- Count activities without meaningful text
    SELECT COUNT(*) INTO activities_without_text 
    FROM public.activities 
    WHERE text IS NULL OR text = '' OR text = 'Shared an update';
    
    RAISE NOTICE 'Total activities: %, Activities with text: %, Activities without text: %', 
        total_activities, activities_with_text, activities_without_text;
END $$;

-- Step 1: Update activities that have data in the JSONB field
UPDATE public.activities 
SET 
    text = CASE 
        -- Extract text from data->>'text' if it exists
        WHEN data->>'text' IS NOT NULL AND data->>'text' != '' THEN data->>'text'
        -- Extract text from data->>'content' if it exists
        WHEN data->>'content' IS NOT NULL AND data->>'content' != '' THEN data->>'content'
        -- Extract text from data->>'message' if it exists
        WHEN data->>'message' IS NOT NULL AND data->>'message' != '' THEN data->>'message'
        -- Extract text from data->>'body' if it exists
        WHEN data->>'body' IS NOT NULL AND data->>'body' != '' THEN data->>'body'
        -- Extract text from data->>'description' if it exists
        WHEN data->>'description' IS NOT NULL AND data->>'description' != '' THEN data->>'description'
        -- Extract text from data->>'summary' if it exists
        WHEN data->>'summary' IS NOT NULL AND data->>'summary' != '' THEN data->>'summary'
        -- For book-related activities, create meaningful text
        WHEN activity_type = 'book_added' AND data->>'book_title' IS NOT NULL THEN
            'Added ''' || (data->>'book_title') || ''' to my library'
        WHEN activity_type = 'book_review' AND data->>'book_title' IS NOT NULL THEN
            'Reviewed ''' || (data->>'book_title') || ''''
        WHEN activity_type = 'book_share' AND data->>'book_title' IS NOT NULL THEN
            'Shared ''' || (data->>'book_title') || ''''
        WHEN activity_type = 'reading_progress' AND data->>'book_title' IS NOT NULL THEN
            'Updated reading progress for ''' || (data->>'book_title') || ''''
        -- For author-related activities
        WHEN activity_type = 'author_follow' AND data->>'author_name' IS NOT NULL THEN
            'Started following ' || (data->>'author_name')
        WHEN activity_type = 'book_recommendation' AND data->>'book_title' IS NOT NULL THEN
            'Recommended ''' || (data->>'book_title') || ''''
        -- Default fallback based on activity type
        WHEN activity_type = 'post' THEN 'Shared a post'
        WHEN activity_type = 'book_review' THEN 'Shared a book review'
        WHEN activity_type = 'book_share' THEN 'Shared a book'
        WHEN activity_type = 'reading_progress' THEN 'Updated reading progress'
        WHEN activity_type = 'book_added' THEN 'Added a book to my library'
        WHEN activity_type = 'author_follow' THEN 'Started following an author'
        WHEN activity_type = 'book_recommendation' THEN 'Recommended a book'
        ELSE 'Shared an update'
    END,
    updated_at = NOW()
WHERE 
    (text IS NULL OR text = '' OR text = 'Shared an update')
    AND data IS NOT NULL 
    AND data != '{}';

-- Step 2: Update any remaining activities that still have no text
UPDATE public.activities 
SET 
    text = CASE 
        WHEN content_type = 'text' THEN 'Shared a text post'
        WHEN content_type = 'image' THEN 'Shared an image'
        WHEN content_type = 'video' THEN 'Shared a video'
        WHEN content_type = 'link' THEN 'Shared a link'
        WHEN content_type = 'book' THEN 'Shared a book'
        WHEN content_type = 'author' THEN 'Shared an author'
        WHEN content_type = 'poll' THEN 'Created a poll'
        WHEN content_type = 'event' THEN 'Created an event'
        ELSE 'Shared an update'
    END,
    updated_at = NOW()
WHERE 
    (text IS NULL OR text = '' OR text = 'Shared an update');

-- Step 3: Verify the migration results
DO $$
DECLARE
    final_text_count INTEGER;
    final_no_text_count INTEGER;
BEGIN
    -- Count activities that now have meaningful text
    SELECT COUNT(*) INTO final_text_count 
    FROM public.activities 
    WHERE text IS NOT NULL AND text != '' AND text != 'Shared an update';
    
    -- Count any remaining activities without text
    SELECT COUNT(*) INTO final_no_text_count 
    FROM public.activities 
    WHERE text IS NULL OR text = '' OR text = 'Shared an update';
    
    RAISE NOTICE 'Migration complete! Activities with text: %, Activities without text: %', 
        final_text_count, final_no_text_count;
END $$;

-- Step 4: Show sample of updated content
SELECT 
    id,
    activity_type,
    content_type,
    text,
    LEFT(data::text, 100) as data_preview
FROM public.activities 
WHERE text IS NOT NULL 
    AND text != '' 
    AND text != 'Shared an update'
ORDER BY updated_at DESC
LIMIT 10;
