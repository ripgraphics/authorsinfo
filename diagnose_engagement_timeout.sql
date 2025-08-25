-- Diagnose Engagement Timeout Issue
-- The tables exist and have data, so let's find the real problem

-- 1. Check RLS policies on engagement tables
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
WHERE tablename IN ('engagement_likes', 'engagement_comments')
ORDER BY tablename, policyname;

-- 2. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('engagement_likes', 'engagement_comments');

-- 3. Test the exact query the API uses with EXPLAIN ANALYZE
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
  al.user_id,
  al.created_at
FROM engagement_likes al
WHERE al.entity_type = 'activity'
  AND al.entity_id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb'
ORDER BY al.created_at DESC
LIMIT 10;

-- 4. Test the comments query
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
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

-- 5. Check for locks or long-running queries
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  backend_start,
  state,
  query_start,
  state_change,
  wait_event_type,
  wait_event,
  query
FROM pg_stat_activity 
WHERE state = 'active' 
  AND query NOT LIKE '%pg_stat_activity%'
  AND query NOT LIKE '%pg_stat_statements%';

-- 6. Check table statistics
SELECT 
  schemaname,
  tablename,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables 
WHERE tablename IN ('engagement_likes', 'engagement_comments');

-- 7. Check if the specific activity exists
SELECT 
  id,
  activity_type,
  content_type,
  created_at
FROM activities 
WHERE id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb';

-- 8. Test basic table access
SELECT 'Testing basic access...' as info;
SELECT COUNT(*) as engagement_likes_count FROM engagement_likes;
SELECT COUNT(*) as engagement_comments_count FROM engagement_comments;

-- 9. Check for any triggers that might be slow
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('engagement_likes', 'engagement_comments');
