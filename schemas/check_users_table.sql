-- Check Users Table Content
-- Let's see what's actually in the users table

-- 1. Check ALL columns in users table
SELECT 'Users table - ALL columns:' as info, 
       column_name, 
       data_type, 
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if users table has any data
SELECT 'Users table - sample data:' as info, 
       COUNT(*) as row_count
FROM public.users;

-- 3. Check if users table has user identification fields
SELECT 'Users table - user identification fields:' as info,
       column_name,
       data_type
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND (column_name LIKE '%name%' OR column_name LIKE '%user%' OR column_name LIKE '%email%' OR column_name LIKE '%avatar%')
ORDER BY column_name;

-- 4. Check if there's an auth.users table (Supabase default)
SELECT 'Auth.users table exists:' as info,
       CASE 
         WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'auth') 
         THEN 'Yes' 
         ELSE 'No' 
       END as auth_users_exists;
