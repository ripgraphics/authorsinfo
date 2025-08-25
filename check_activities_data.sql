-- Check the current state of activities table
-- This will show us what data is actually in the database

-- Check the structure and content of activities
SELECT 
    'ACTIVITIES TABLE STRUCTURE' as info,
    COUNT(*) as total_activities,
    COUNT(CASE WHEN text IS NOT NULL AND text != '' THEN 1 END) as activities_with_text,
    COUNT(CASE WHEN text IS NULL OR text = '' THEN 1 END) as activities_without_text,
    COUNT(CASE WHEN data IS NOT NULL AND data != '{}' THEN 1 END) as activities_with_data,
    COUNT(CASE WHEN data IS NULL OR data = '{}' THEN 1 END) as activities_without_data,
    COUNT(CASE WHEN content_type IS NOT NULL THEN 1 END) as activities_with_content_type,
    COUNT(CASE WHEN activity_type IS NOT NULL THEN 1 END) as activities_with_activity_type
FROM public.activities;

-- Show sample of activities with their current state
SELECT 
    'SAMPLE ACTIVITIES' as info,
    id,
    activity_type,
    content_type,
    text,
    LEFT(data::text, 200) as data_preview,
    created_at,
    updated_at
FROM public.activities 
ORDER BY created_at DESC 
LIMIT 10;

-- Check for any activities that might have content in data field
SELECT 
    'ACTIVITIES WITH DATA CONTENT' as info,
    id,
    activity_type,
    content_type,
    text,
    data->>'book_title' as book_title,
    data->>'author_name' as author_name,
    data->>'text' as data_text,
    data->>'content' as data_content,
    data->>'message' as data_message,
    data->>'body' as data_body,
    LEFT(data::text, 200) as full_data
FROM public.activities 
WHERE data IS NOT NULL 
    AND data != '{}'
    AND (
        data->>'book_title' IS NOT NULL OR
        data->>'author_name' IS NOT NULL OR
        data->>'text' IS NOT NULL OR
        data->>'content' IS NOT NULL OR
        data->>'message' IS NOT NULL OR
        data->>'body' IS NOT NULL
    )
ORDER BY created_at DESC 
LIMIT 10;

-- Check for activities that need migration (have generic text)
SELECT 
    'ACTIVITIES NEEDING MIGRATION' as info,
    id,
    activity_type,
    content_type,
    text,
    LEFT(data::text, 200) as data_preview
FROM public.activities 
WHERE text IN ('Post content', 'Added a book to their library', 'Shared an update')
    OR text IS NULL 
    OR text = ''
ORDER BY created_at DESC 
LIMIT 10;
