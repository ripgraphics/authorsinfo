-- Comprehensive Database Analysis for Engagement Tables
-- This script will help identify why the engagement API is timing out

-- 1. Check if tables exist and their basic structure
SELECT 
  schemaname,
  tablename,
  tableowner,
  tablespace,
  hasindexes,
  hasrules,
  hastriggers,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('activities', 'activity_likes', 'activity_comments', 'users', 'profiles')
ORDER BY tablename;

-- 2. Check table sizes and row counts
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE tablename IN ('activities', 'activity_likes', 'activity_comments', 'users', 'profiles')
ORDER BY tablename;

-- 3. Check if RLS is enabled on engagement tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('activity_likes', 'activity_comments')
ORDER BY tablename;

-- 4. Check RLS policies on engagement tables
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

-- 5. Check if there are any data in the tables
SELECT 
  'activities' as table_name,
  COUNT(*) as row_count
FROM activities
UNION ALL
SELECT 
  'activity_likes' as table_name,
  COUNT(*) as row_count
FROM activity_likes
UNION ALL
SELECT 
  'activity_comments' as table_name,
  COUNT(*) as row_count
FROM activity_comments;

-- 6. Check for any locks on the tables
SELECT 
  l.pid,
  l.mode,
  l.granted,
  t.schemaname,
  t.tablename,
  a.usename,
  a.application_name,
  a.client_addr,
  a.state,
  a.query_start,
  a.query
FROM pg_locks l
JOIN pg_tables t ON l.relation = t.table_name::regclass
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE t.tablename IN ('activities', 'activity_likes', 'activity_comments')
  AND l.mode != 'AccessShareLock';

-- 7. Check for long-running queries
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  now() - query_start as duration,
  query
FROM pg_stat_activity 
WHERE state = 'active'
  AND query NOT LIKE '%pg_stat_activity%'
  AND query_start < now() - interval '5 seconds'
ORDER BY query_start;

-- 8. Check table statistics
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation,
  most_common_vals,
  most_common_freqs
FROM pg_stats 
WHERE tablename IN ('activities', 'activity_likes', 'activity_comments')
  AND attname IN ('activity_id', 'user_id')
ORDER BY tablename, attname;

-- 9. Check for any triggers that might be causing delays
SELECT 
  t.trigger_name,
  t.event_manipulation,
  t.action_timing,
  t.action_statement,
  t.action_orientation
FROM information_schema.triggers t
WHERE t.trigger_schema = 'public'
  AND t.event_object_table IN ('activity_likes', 'activity_comments')
ORDER BY t.trigger_name;

-- 10. Check for any constraints that might be causing issues
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('activity_likes', 'activity_comments')
ORDER BY tc.table_name, tc.constraint_name;

-- 11. Test a simple query to see if it's slow
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM activity_likes 
WHERE activity_id = '17977b98-ef9b-4d60-8b4a-35f4ecceb3cb';

-- 12. Check if the specific activity exists
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

-- 13. Check for any deadlocks or blocked processes
SELECT 
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
  ON (blocking_locks.locktype = blocked_locks.locktype
      AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
      AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
      AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
      AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
      AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
      AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
      AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
      AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
      AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
      AND blocking_locks.virtualtransaction IS NOT DISTINCT FROM blocked_locks.virtualtransaction
      AND blocking_locks.pid != blocked_locks.pid)
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
