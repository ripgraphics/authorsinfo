-- ============================================================================
-- DIAGNOSTIC SCRIPT: Check live database for like_count trigger error
-- Run this in Supabase SQL Editor to see what's actually causing the error
-- ============================================================================

-- STEP 1: Check what columns actually exist in activities table
SELECT 
    '=== COLUMNS IN ACTIVITIES TABLE ===' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'activities'
ORDER BY ordinal_position;

-- STEP 2: Check ALL triggers on activities table
SELECT 
    '=== TRIGGERS ON ACTIVITIES TABLE ===' as section,
    tgname as trigger_name,
    CASE 
        WHEN tgtype & 2 = 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END as timing,
    CASE 
        WHEN tgtype & 4 = 4 THEN 'INSERT'
        WHEN tgtype & 8 = 8 THEN 'DELETE'
        WHEN tgtype & 16 = 16 THEN 'UPDATE'
        ELSE 'UNKNOWN'
    END as event,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as full_definition
FROM pg_trigger
WHERE tgrelid = 'public.activities'::regclass
  AND tgisinternal = false  -- Only user-defined triggers
ORDER BY tgname;

-- STEP 3: Check functions that might reference like_count
SELECT 
    '=== FUNCTIONS THAT REFERENCE like_count ===' as section,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%NEW.like_count%' THEN '⚠️ REFERENCES NEW.like_count'
        WHEN pg_get_functiondef(p.oid) LIKE '%like_count%' THEN '⚠️ REFERENCES like_count'
        ELSE 'OK'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) LIKE '%like_count%'
ORDER BY p.proname;

-- STEP 4: Get full definition of problematic functions
SELECT 
    '=== FULL DEFINITION: update_engagement_score ===' as section,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'update_engagement_score'
LIMIT 1;

SELECT 
    '=== FULL DEFINITION: validate_activity_data ===' as section,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'validate_activity_data'
LIMIT 1;

-- STEP 5: Check if calculate_engagement_score exists with count parameters
SELECT 
    '=== calculate_engagement_score FUNCTIONS ===' as section,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'calculate_engagement_score'
ORDER BY p.proname;

-- STEP 6: Check which triggers call which functions
SELECT 
    '=== TRIGGER TO FUNCTION MAPPING ===' as section,
    t.tgname as trigger_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.activities'::regclass
  AND t.tgisinternal = false
ORDER BY t.tgname;
