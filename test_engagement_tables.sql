-- Test Engagement Tables
-- This script tests if the engagement tables exist and are accessible

-- 1. Check if tables exist
SELECT 
  'engagement_likes' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'engagement_likes')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
UNION ALL
SELECT 
  'engagement_comments' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'engagement_comments')
    THEN 'EXISTS'
    ELSE 'MISSING'
  END as status;

-- 2. If tables exist, show their structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'engagement_likes'
ORDER BY ordinal_position;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'engagement_comments'
ORDER BY ordinal_position;

-- 3. Test basic queries
SELECT 'Testing engagement_likes query...' as info;
SELECT COUNT(*) as likes_count FROM engagement_likes LIMIT 1;

SELECT 'Testing engagement_comments query...' as info;
SELECT COUNT(*) as comments_count FROM engagement_comments LIMIT 1;

-- 4. Test with a sample activity ID
SELECT 'Testing with sample activity...' as info;
SELECT 
  'Likes for sample activity' as test_type,
  COUNT(*) as count
FROM engagement_likes 
WHERE entity_type = 'activity' 
  AND entity_id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb'
UNION ALL
SELECT 
  'Comments for sample activity' as test_type,
  COUNT(*) as count
FROM engagement_comments 
WHERE entity_type = 'activity' 
  AND entity_id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb';
