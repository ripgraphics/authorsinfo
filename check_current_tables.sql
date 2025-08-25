-- CHECK CURRENT DATABASE TABLES
-- This script diagnoses what tables actually exist in your database
-- Date: 2025-08-23
-- Run this using: supabase db push

-- =====================================================
-- STEP 1: CHECK WHAT TABLES EXIST
-- =====================================================

-- List all tables in public schema
SELECT 
    'EXISTING_TABLES' as info,
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- STEP 2: CHECK IF POSTS TABLE EXISTS
-- =====================================================

-- Check if posts table exists
SELECT 
    'POSTS_TABLE_CHECK' as info,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'posts'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as posts_table_status;

-- =====================================================
-- STEP 3: CHECK IF SOCIAL TABLES EXIST
-- =====================================================

-- Check if social tables exist
SELECT 
    'SOCIAL_TABLES_CHECK' as info,
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = t.table_name
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as table_status
FROM (VALUES 
    ('friendships'),
    ('follows'),
    ('likes'),
    ('comments'),
    ('bookmarks'),
    ('shares')
) AS t(table_name);

-- =====================================================
-- STEP 4: CHECK AUTH USERS TABLE
-- =====================================================

-- Check if auth.users table exists (needed for foreign keys)
SELECT 
    'AUTH_USERS_CHECK' as info,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'auth' 
            AND table_name = 'users'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as auth_users_status;

-- =====================================================
-- STEP 5: SUMMARY OF MISSING TABLES
-- =====================================================

-- Show what needs to be created
SELECT 
    'MISSING_TABLES_SUMMARY' as info,
    'posts' as table_name,
    'Main posts table for social content' as description,
    'CRITICAL' as priority
WHERE NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'posts'
)

UNION ALL

SELECT 
    'MISSING_TABLES_SUMMARY' as info,
    'friendships' as table_name,
    'User friendship relationships' as description,
    'HIGH' as priority
WHERE NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'friendships'
)

UNION ALL

SELECT 
    'MISSING_TABLES_SUMMARY' as info,
    'follows' as table_name,
    'User follow relationships' as description,
    'HIGH' as priority
WHERE NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'follows'
);
