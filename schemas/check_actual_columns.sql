-- Check Actual Columns in Profiles and Users Tables
-- Let's see what columns actually exist instead of assuming

-- 1. Check what columns exist in profiles table
SELECT 'Profiles table columns:' as info, 
       column_name, 
       data_type, 
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check what columns exist in users table
SELECT 'Users table columns:' as info, 
       column_name, 
       data_type, 
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check what columns exist in activities table
SELECT 'Activities table columns:' as info, 
       column_name, 
       data_type, 
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'activities' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if there are any user identification fields
SELECT 'User identification fields in profiles:' as info,
       column_name,
       data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
  AND (column_name LIKE '%name%' OR column_name LIKE '%user%' OR column_name LIKE '%display%')
ORDER BY column_name;
