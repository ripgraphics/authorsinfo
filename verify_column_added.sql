-- Verify that user_has_reacted column was added successfully
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'activities' 
AND column_name = 'user_has_reacted';

-- Also check a few sample activities to see the current data
SELECT 
    id,
    content_type,
    text,
    like_count,
    comment_count,
    user_has_reacted
FROM activities 
LIMIT 5;
