-- Diagnostic script to examine posts data in activities table
-- This will help us understand why posts are missing text and image content

-- Check the structure of the activities table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'activities' 
ORDER BY ordinal_position;

-- Check sample posts to see what data is actually stored
SELECT 
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
FROM activities 
WHERE activity_type LIKE '%post%' 
   OR content_type IS NOT NULL
ORDER BY created_at DESC 
LIMIT 10;

-- Check if there are any posts with actual text content
SELECT 
    COUNT(*) as total_posts,
    COUNT(CASE WHEN text IS NOT NULL AND text != '' THEN 1 END) as posts_with_text,
    COUNT(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 END) as posts_with_images,
    COUNT(CASE WHEN data IS NOT NULL AND data != '{}' THEN 1 END) as posts_with_data
FROM activities 
WHERE activity_type LIKE '%post%' 
   OR content_type IS NOT NULL;

-- Check the most recent posts to see if new ones have data
SELECT 
    id,
    user_id,
    activity_type,
    content_type,
    text,
    image_url,
    data,
    created_at
FROM activities 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if there are any posts with content in the data JSONB field
SELECT 
    id,
    user_id,
    activity_type,
    content_type,
    text,
    image_url,
    data,
    created_at
FROM activities 
WHERE data IS NOT NULL 
  AND data != '{}'
  AND (data->>'content' IS NOT NULL OR data->>'text' IS NOT NULL)
ORDER BY created_at DESC 
LIMIT 5;
