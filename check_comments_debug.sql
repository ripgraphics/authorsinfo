-- Debug script to check comment display issue
-- Check what comments exist in the engagement_comments table

-- 1. Check if there are any comments for the specific author
SELECT 
    ec.id,
    ec.user_id,
    ec.entity_type,
    ec.entity_id,
    ec.comment_text,
    ec.created_at,
    ec.is_hidden,
    ec.is_deleted,
    u.name as user_name,
    u.email as user_email
FROM engagement_comments ec
LEFT JOIN users u ON ec.user_id = u.id
WHERE ec.entity_id = 'e31e061d-a4a8-4cc8-af18-754786ad5ee3'
ORDER BY ec.created_at DESC;

-- 2. Check if there are any comments in the activities table
SELECT 
    id,
    user_id,
    content,
    comment_count,
    like_count,
    created_at,
    metadata
FROM activities 
WHERE id = 'e31e061d-a4a8-4cc8-af18-754786ad5ee3'
   OR entity_id = 'e31e061d-a4a8-4cc8-af18-754786ad5ee3';

-- 3. Check the structure of engagement_comments table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'engagement_comments'
ORDER BY ordinal_position;

-- 4. Check RLS policies on engagement_comments
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'engagement_comments';

-- 5. Check if there are any comments at all in the system
SELECT 
    COUNT(*) as total_comments,
    COUNT(CASE WHEN is_hidden = false AND is_deleted = false THEN 1 END) as visible_comments,
    COUNT(CASE WHEN is_hidden = true THEN 1 END) as hidden_comments,
    COUNT(CASE WHEN is_deleted = true THEN 1 END) as deleted_comments
FROM engagement_comments;

-- 6. Check recent comments to see the data structure
SELECT 
    ec.id,
    ec.user_id,
    ec.entity_type,
    ec.entity_id,
    ec.comment_text,
    ec.created_at,
    u.name as user_name
FROM engagement_comments ec
LEFT JOIN users u ON ec.user_id = u.id
WHERE ec.is_hidden = false AND ec.is_deleted = false
ORDER BY ec.created_at DESC
LIMIT 10;
