-- Check All Table Columns - Comprehensive Schema Analysis
-- Let's see exactly what columns exist in each table

-- 1. Check ALL columns in profiles table
SELECT 'Profiles table - ALL columns:' as info, 
       column_name, 
       data_type, 
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check ALL columns in users table  
SELECT 'Users table - ALL columns:' as info, 
       column_name, 
       data_type, 
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check ALL columns in activities table
SELECT 'Activities table - ALL columns:' as info, 
       column_name, 
       data_type, 
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'activities' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if there are any other user-related tables
SELECT 'All tables with user-related names:' as info, table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND (table_name LIKE '%user%' OR table_name LIKE '%profile%' OR table_name LIKE '%auth%')
ORDER BY table_name;
