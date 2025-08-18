-- Posts Schema Validation Script
-- Run this script to validate the posts table structure and identify any issues

-- 1. Check if posts table exists and has correct structure
DO $$
DECLARE
    table_exists BOOLEAN;
    column_count INTEGER;
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    required_columns TEXT[] := ARRAY[
        'id', 'user_id', 'content', 'image_url', 'link_url', 'created_at', 'updated_at',
        'visibility', 'content_type', 'content_summary', 'tags', 'metadata', 'entity_type',
        'entity_id', 'like_count', 'comment_count', 'share_count', 'view_count',
        'engagement_score', 'is_deleted', 'is_hidden', 'publish_status', 'last_activity_at',
        'enterprise_features'
    ];
    col TEXT;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'posts'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ Posts table exists';
        
        -- Check column count
        SELECT COUNT(*) INTO column_count 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'posts';
        
        RAISE NOTICE '📊 Posts table has % columns', column_count;
        
        -- Check for missing required columns
        FOREACH col IN ARRAY required_columns
        LOOP
            IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                  AND table_name = 'posts' 
                  AND column_name = col
            ) THEN
                missing_columns := array_append(missing_columns, col);
            END IF;
        END LOOP;
        
        IF array_length(missing_columns, 1) > 0 THEN
            RAISE WARNING '❌ Missing required columns: %', array_to_string(missing_columns, ', ');
        ELSE
            RAISE NOTICE '✅ All required columns exist';
        END IF;
        
    ELSE
        RAISE ERROR '❌ Posts table does not exist';
    END IF;
END $$;

-- 2. Check data types and constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN character_maximum_length IS NOT NULL 
        THEN data_type || '(' || character_maximum_length || ')'
        ELSE data_type
    END as full_data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'posts'
ORDER BY ordinal_position;

-- 3. Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'posts'
ORDER BY indexname;

-- 4. Check RLS policies
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
WHERE tablename = 'posts'
ORDER BY policyname;

-- 5. Check foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'posts';

-- 6. Check table size and row count
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename = 'posts'
ORDER BY attname;

-- 7. Check for any data in posts table
SELECT 
    COUNT(*) as total_posts,
    COUNT(CASE WHEN content->>'migration_source' = 'migrated_from_activities' THEN 1 END) as migrated_posts,
    COUNT(CASE WHEN content->>'migration_source' IS NULL THEN 1 END) as new_posts,
    COUNT(CASE WHEN is_deleted = true THEN 1 END) as deleted_posts,
    COUNT(CASE WHEN is_hidden = true THEN 1 END) as hidden_posts
FROM posts;

-- 8. Check content structure (sample)
SELECT 
    id,
    content_type,
    content->>'text' as text_preview,
    content->>'type' as content_type_from_json,
    content->>'migration_source' as migration_source,
    array_length(tags, 1) as tag_count,
    visibility,
    publish_status,
    created_at
FROM posts 
LIMIT 5;

-- 9. Validate JSONB content structure
SELECT 
    'content.text exists' as check_name,
    COUNT(*) as posts_with_text
FROM posts 
WHERE content ? 'text' AND content->>'text' IS NOT NULL

UNION ALL

SELECT 
    'content.type exists' as check_name,
    COUNT(*) as posts_with_type
FROM posts 
WHERE content ? 'type' AND content->>'type' IS NOT NULL

UNION ALL

SELECT 
    'content.migration_source exists' as check_name,
    COUNT(*) as posts_with_migration_source
FROM posts 
WHERE content ? 'migration_source';

-- 10. Check for potential data integrity issues
SELECT 
    'posts_without_user_id' as issue_type,
    COUNT(*) as count
FROM posts 
WHERE user_id IS NULL

UNION ALL

SELECT 
    'posts_without_content' as issue_type,
    COUNT(*) as count
FROM posts 
WHERE content IS NULL OR content = '{}'::jsonb

UNION ALL

SELECT 
    'posts_with_invalid_visibility' as issue_type,
    COUNT(*) as count
FROM posts 
WHERE visibility NOT IN ('public', 'friends', 'private', 'group', 'custom')

UNION ALL

SELECT 
    'posts_with_invalid_publish_status' as issue_type,
    COUNT(*) as count
FROM posts 
WHERE publish_status NOT IN ('draft', 'scheduled', 'published', 'archived', 'deleted');

-- 11. Performance check - analyze table
ANALYZE posts;

-- 12. Check table statistics
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs
FROM pg_stats 
WHERE tablename = 'posts' 
  AND n_distinct > 0
ORDER BY n_distinct DESC;
