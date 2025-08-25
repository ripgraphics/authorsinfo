-- Simple Engagement Diagnosis
-- Run this to find the timeout issue

-- 1. Check if tables exist and have data
SELECT 'engagement_likes' as table_name, COUNT(*) as row_count FROM engagement_likes
UNION ALL
SELECT 'engagement_comments' as table_name, COUNT(*) as row_count FROM engagement_comments;

-- 2. Test the exact queries the API uses
SELECT 'Testing likes query...' as info;
SELECT 
  al.user_id,
  al.created_at
FROM engagement_likes al
WHERE al.entity_type = 'activity'
  AND al.entity_id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb'
ORDER BY al.created_at DESC
LIMIT 10;

SELECT 'Testing comments query...' as info;
SELECT 
  ac.id,
  ac.user_id,
  ac.comment_text,
  ac.created_at
FROM engagement_comments ac
WHERE ac.entity_type = 'activity'
  AND ac.entity_id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb'
  AND ac.is_deleted = false
  AND ac.is_hidden = false
ORDER BY ac.created_at DESC
LIMIT 10;

-- 3. Check if the activity exists
SELECT 'Checking if activity exists...' as info;
SELECT 
  id,
  activity_type,
  content_type,
  created_at
FROM activities 
WHERE id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb';

-- 4. Check RLS status
SELECT 'Checking RLS status...' as info;
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('engagement_likes', 'engagement_comments');
