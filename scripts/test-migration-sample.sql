-- Test Migration with Sample Data
-- This script tests the migration functions and validates the database structure

-- 1. Test the migration status function
SELECT 'Testing get_migration_status function...' as test_step;
SELECT * FROM get_migration_status();

-- 2. Test the validation function
SELECT 'Testing validate_posts_migration function...' as test_step;
SELECT * FROM validate_posts_migration();

-- 3. Test the timeline posts function
SELECT 'Testing get_user_timeline_posts function...' as test_step;
-- Get a sample user ID from the posts table
DO $$
DECLARE
    sample_user_id UUID;
BEGIN
    -- Get a sample user ID
    SELECT user_id INTO sample_user_id FROM posts LIMIT 1;
    
    IF sample_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with user ID: %', sample_user_id;
        -- Test the function
        PERFORM * FROM get_user_timeline_posts(sample_user_id, 5, 0);
        RAISE NOTICE 'get_user_timeline_posts function test completed';
    ELSE
        RAISE NOTICE 'No posts found to test with';
    END IF;
END $$;

-- 4. Test the entity posts function
SELECT 'Testing get_entity_posts function...' as test_step;
DO $$
DECLARE
    sample_entity_type TEXT;
    sample_entity_id UUID;
BEGIN
    -- Get a sample entity from the posts table
    SELECT entity_type, entity_id INTO sample_entity_type, sample_entity_id 
    FROM posts 
    WHERE entity_type IS NOT NULL AND entity_id IS NOT NULL 
    LIMIT 1;
    
    IF sample_entity_type IS NOT NULL AND sample_entity_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with entity: % - %', sample_entity_type, sample_entity_id;
        -- Test the function
        PERFORM * FROM get_entity_posts(sample_entity_type, sample_entity_id, 5, 0);
        RAISE NOTICE 'get_entity_posts function test completed';
    ELSE
        RAISE NOTICE 'No entities found to test with';
    END IF;
END $$;

-- 5. Test the backward compatibility view
SELECT 'Testing activities_posts_view...' as test_step;
SELECT COUNT(*) as view_count FROM activities_posts_view;

-- 6. Test RLS policies
SELECT 'Testing RLS policies...' as test_step;
SELECT 
    policyname,
    permissive,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'SELECT policy configured'
        WHEN with_check IS NOT NULL THEN 'INSERT/UPDATE policy configured'
        ELSE 'Policy details'
    END as policy_status
FROM pg_policies 
WHERE tablename = 'posts'
ORDER BY policyname;

-- 7. Test indexes
SELECT 'Testing indexes...' as test_step;
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'posts'
ORDER BY indexname;

-- 8. Test data integrity
SELECT 'Testing data integrity...' as test_step;
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

-- 9. Test JSONB content structure
SELECT 'Testing JSONB content structure...' as test_step;
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

-- 10. Test performance with EXPLAIN
SELECT 'Testing query performance...' as test_step;
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM posts 
WHERE user_id = (SELECT user_id FROM posts LIMIT 1)
  AND publish_status = 'published'
  AND is_deleted = false
ORDER BY created_at DESC
LIMIT 10;

-- 11. Test rollback function (dry run - don't actually execute)
SELECT 'Testing rollback function (dry run)...' as test_step;
SELECT 
    'Rollback would delete' as action,
    COUNT(*) as posts_to_delete
FROM posts 
WHERE content->>'migration_source' = 'migrated_from_activities';

-- 12. Summary report
SELECT 'Migration Test Summary' as summary;
SELECT 
    'Total posts in posts table' as metric,
    COUNT(*) as value
FROM posts

UNION ALL

SELECT 
    'Migrated posts' as metric,
    COUNT(*) as value
FROM posts 
WHERE content->>'migration_source' = 'migrated_from_activities'

UNION ALL

SELECT 
    'New posts (not migrated)' as metric,
    COUNT(*) as value
FROM posts 
WHERE content->>'migration_source' IS NULL

UNION ALL

SELECT 
    'Posts with images' as metric,
    COUNT(*) as value
FROM posts 
WHERE image_url IS NOT NULL

UNION ALL

SELECT 
    'Posts with tags' as metric,
    COUNT(*) as value
FROM posts 
WHERE array_length(tags, 1) > 0;

-- 13. Test error handling
SELECT 'Testing error handling...' as test_step;
DO $$
BEGIN
    -- Test with invalid user ID
    BEGIN
        PERFORM * FROM get_user_timeline_posts('00000000-0000-0000-0000-000000000000', 5, 0);
        RAISE NOTICE 'Function handles invalid user ID gracefully';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Function throws error with invalid user ID: %', SQLERRM;
    END;
    
    -- Test with invalid entity
    BEGIN
        PERFORM * FROM get_entity_posts('invalid_type', '00000000-0000-0000-0000-000000000000', 5, 0);
        RAISE NOTICE 'Function handles invalid entity gracefully';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Function throws error with invalid entity: %', SQLERRM;
    END;
END $$;

-- Test completed
SELECT 'Migration testing completed successfully!' as status;
