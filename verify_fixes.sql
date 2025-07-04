-- VERIFICATION SCRIPT - Run this AFTER applying fixes
-- This verifies that all fixes were applied correctly

-- Check indexes
SELECT 'Indexes' as category, COUNT(*) as count
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
UNION ALL
SELECT 'RLS Policies' as category, COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public'
UNION ALL
SELECT 'Foreign Keys' as category, COUNT(*) as count
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
    AND table_schema = 'public'
UNION ALL
SELECT 'Check Constraints' as category, COUNT(*) as count
FROM information_schema.table_constraints 
WHERE constraint_type = 'CHECK' 
    AND table_schema = 'public'
UNION ALL
SELECT 'Triggers' as category, COUNT(*) as count
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Check specific key fixes
SELECT 'Key Fixes Applied' as check_type, 
       CASE 
           WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_user_id') THEN 'SUCCESS'
           ELSE 'MISSING'
       END as profiles_index,
       CASE 
           WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles') THEN 'SUCCESS'
           ELSE 'MISSING'
       END as profiles_rls,
       CASE 
           WHEN EXISTS (SELECT 1 FROM information_schema.table_constraints 
                       WHERE table_name = 'profiles' AND constraint_type = 'FOREIGN KEY') THEN 'SUCCESS'
           ELSE 'MISSING'
       END as profiles_fk;

-- Show tables with RLS enabled
SELECT 'Tables with RLS' as info, COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        SELECT tablename FROM pg_policies WHERE schemaname = 'public'
    );

-- List all new indexes created
SELECT 'New Indexes' as info, indexname, tablename
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- List all RLS policies
SELECT 'RLS Policies' as info, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
