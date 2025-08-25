-- TEST ENGAGEMENT SYSTEM FIX
-- This script verifies that the timeout issue has been resolved

-- 1. Test basic table access
SELECT 'Testing basic table access...' as info;

SELECT COUNT(*) as likes_count FROM engagement_likes;
SELECT COUNT(*) as comments_count FROM engagement_comments;

-- 2. Test the exact queries the API uses
SELECT 'Testing API queries...' as info;

-- Test likes query
SELECT 
  'Likes query test' as test_type,
  COUNT(*) as result_count
FROM engagement_likes 
WHERE entity_type = 'activity' 
  AND entity_id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb';

-- Test comments query  
SELECT 
  'Comments query test' as test_type,
  COUNT(*) as result_count
FROM engagement_comments 
WHERE entity_type = 'activity' 
  AND entity_id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb'
  AND is_deleted = false 
  AND is_hidden = false;

-- 3. Test with a different activity ID (if available)
SELECT 'Testing with different activity...' as info;

SELECT 
  'Alternative activity test' as test_type,
  entity_id,
  COUNT(*) as engagement_count
FROM (
  SELECT entity_id, 'like' as type FROM engagement_likes WHERE entity_type = 'activity'
  UNION ALL
  SELECT entity_id, 'comment' as type FROM engagement_comments WHERE entity_type = 'activity' AND is_deleted = false
) combined
GROUP BY entity_id
ORDER BY engagement_count DESC
LIMIT 5;

-- 4. Check RLS policies are working
SELECT 'Checking RLS policies...' as info;

SELECT 
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename IN ('engagement_likes', 'engagement_comments')
ORDER BY tablename, policyname;

-- 5. Performance test
SELECT 'Performance test...' as info;

-- This should execute quickly now
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
  user_id,
  created_at
FROM engagement_likes 
WHERE entity_type = 'activity' 
  AND entity_id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb'
ORDER BY created_at DESC
LIMIT 10;

SELECT 'Engagement system test complete! If all queries executed quickly, the fix is working.' as result;
