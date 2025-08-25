-- Check if user_has_reacted column exists in activities table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'activities' 
AND column_name = 'user_has_reacted';

-- Also check the current structure of the activities table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'activities' 
ORDER BY ordinal_position;
