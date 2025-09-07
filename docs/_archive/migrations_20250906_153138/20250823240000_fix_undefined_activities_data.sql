-- FIX: Fix activities with undefined text and data fields
-- This addresses the issue where posts show "undefined" for both text and data
-- Date: 2025-08-23

-- First, let's see what we're working with
DO $$
DECLARE
    activity_count INTEGER;
    undefined_count INTEGER;
BEGIN
    -- Count total activities
    SELECT COUNT(*) INTO activity_count FROM public.activities;
    
    -- Count activities with undefined/null text and data
    SELECT COUNT(*) INTO undefined_count 
    FROM public.activities 
    WHERE (text IS NULL OR text = '') 
        AND (data IS NULL OR data = '{}');
    
    RAISE NOTICE 'Total activities: %, Activities with undefined content: %', activity_count, undefined_count;
END $$;

-- Fix activities that have no text content by setting a default meaningful text
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
WHERE (text IS NULL OR text = '') 
    AND (data IS NULL OR data = '{}')
    AND content_type IS NOT NULL;

-- For activities that still have no content, set a generic text
UPDATE public.activities 
SET 
    text = 'Shared an update',
    updated_at = NOW()
WHERE (text IS NULL OR text = '') 
    AND (data IS NULL OR data = '{}');

-- Verify the fix
DO $$
DECLARE
    fixed_count INTEGER;
    remaining_undefined INTEGER;
BEGIN
    -- Count activities that now have text
    SELECT COUNT(*) INTO fixed_count 
    FROM public.activities 
    WHERE text IS NOT NULL AND text != '';
    
    -- Count any remaining undefined
    SELECT COUNT(*) INTO remaining_undefined 
    FROM public.activities 
    WHERE (text IS NULL OR text = '') 
        AND (data IS NULL OR data = '{}');
    
    RAISE NOTICE 'Activities with text after fix: %, Remaining undefined: %', fixed_count, remaining_undefined;
END $$;
