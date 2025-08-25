-- Simple Database Connectivity Test
-- Run this first to check basic database access

-- 1. Test basic table access
SELECT 'Testing basic table access...' as status;

-- 2. Check if we can read from activities table
SELECT 
  'activities' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'EMPTY' END as status
FROM activities;

-- 3. Check if we can read from activity_likes table
SELECT 
  'activity_likes' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'EMPTY' END as status
FROM activity_likes;

-- 4. Check if we can read from activity_comments table
SELECT 
  'activity_comments' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'EMPTY' END as status
FROM activity_comments;

-- 5. Test a simple join query (this is what the API is trying to do)
SELECT 
  'Testing join query...' as status;

-- 6. Test the exact query the API uses for likes
SELECT 
  al.user_id,
  al.created_at,
  u.name as user_name,
  u.email as user_email,
  p.avatar_url as user_avatar_url
FROM activity_likes al
LEFT JOIN users u ON al.user_id = u.id
LEFT JOIN profiles p ON al.user_id = p.user_id
WHERE al.activity_id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb'
ORDER BY al.created_at DESC
LIMIT 10;

-- 7. Test the exact query the API uses for comments
SELECT 
  ac.id,
  ac.user_id,
  ac.comment_text,
  ac.created_at,
  u.name as user_name,
  u.email as user_email,
  p.avatar_url as user_avatar_url
FROM activity_comments ac
LEFT JOIN users u ON ac.user_id = u.id
LEFT JOIN profiles p ON ac.user_id = p.user_id
WHERE ac.activity_id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb'
ORDER BY ac.created_at DESC
LIMIT 10;

-- 8. Check if the specific activity exists
SELECT 
  'Checking specific activity...' as status;

SELECT 
  id,
  user_id,
  activity_type,
  content_type,
  like_count,
  comment_count,
  created_at
FROM activities 
WHERE id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb';

-- 9. Test performance with EXPLAIN
SELECT 'Testing query performance...' as status;

EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM activity_likes 
WHERE activity_id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb';

-- 10. Check for any obvious issues
SELECT 
  'Checking for issues...' as status;

-- Check if tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity = true THEN 'RLS ENABLED - This could cause issues if no policies exist'
    ELSE 'RLS DISABLED - This is good'
  END as status
FROM pg_tables 
WHERE tablename IN ('activity_likes', 'activity_comments')
ORDER BY tablename;

-- Check if there are any RLS policies
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
WHERE tablename IN ('activity_likes', 'activity_comments')
ORDER BY tablename, policyname;
