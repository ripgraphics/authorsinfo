-- =====================================================
-- ANALYZE ACTUAL DATABASE SCHEMA
-- Find first 25 tables in alphabetical order
-- Find ALL UUID columns that are not primary keys
-- Identify which UUID columns are missing foreign key constraints
-- =====================================================

-- 1. First 25 tables in alphabetical order
SELECT 
    table_name,
    'TABLE' as object_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name
LIMIT 25;

-- 2. ALL UUID columns that are not primary keys
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    CASE 
        WHEN c.column_name = 'id' THEN 'PRIMARY_KEY'
        WHEN c.column_name LIKE '%_id' THEN 'FOREIGN_KEY_CANDIDATE'
        WHEN c.column_name LIKE '%_by' THEN 'USER_REFERENCE'
        ELSE 'OTHER_UUID'
    END as column_type
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
  AND c.data_type = 'uuid'
  AND c.table_schema = 'public'
  AND c.column_name != 'id'  -- Exclude primary keys
ORDER BY t.table_name, c.column_name;

-- 3. Existing foreign key constraints
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 4. UUID columns that are MISSING foreign key constraints
WITH uuid_columns AS (
    SELECT 
        t.table_name,
        c.column_name,
        c.data_type
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public' 
      AND t.table_type = 'BASE TABLE'
      AND c.data_type = 'uuid'
      AND c.table_schema = 'public'
      AND c.column_name != 'id'  -- Exclude primary keys
),
existing_fks AS (
    SELECT 
        tc.table_name,
        kcu.column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
)
SELECT 
    uc.table_name,
    uc.column_name,
    'MISSING_FOREIGN_KEY' as status
FROM uuid_columns uc
LEFT JOIN existing_fks ef 
    ON uc.table_name = ef.table_name 
    AND uc.column_name = ef.column_name
WHERE ef.table_name IS NULL
ORDER BY uc.table_name, uc.column_name; 