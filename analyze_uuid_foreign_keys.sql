-- =====================================================
-- COMPREHENSIVE UUID FOREIGN KEY ANALYSIS
-- =====================================================
-- This script analyzes all UUID columns and identifies missing foreign key constraints

-- =====================================================
-- 1. FIND ALL UUID COLUMNS
-- =====================================================

WITH uuid_columns AS (
    SELECT 
        t.table_schema,
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
    WHERE t.table_schema IN ('public', 'auth')
    AND t.table_type = 'BASE TABLE'
    AND c.data_type = 'uuid'
    ORDER BY t.table_schema, t.table_name, c.column_name
),
existing_fks AS (
    SELECT 
        tc.table_schema,
        tc.table_name,
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule,
        rc.update_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema IN ('public', 'auth')
)
SELECT 
    uc.table_schema,
    uc.table_name,
    uc.column_name,
    uc.data_type,
    uc.is_nullable,
    CASE 
        WHEN fk.foreign_table_name IS NOT NULL THEN 
            fk.foreign_table_schema || '.' || fk.foreign_table_name || '.' || fk.foreign_column_name
        ELSE 'NO FOREIGN KEY'
    END AS foreign_key_reference,
    CASE 
        WHEN fk.foreign_table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END AS fk_status,
    fk.delete_rule,
    fk.update_rule
FROM uuid_columns uc
LEFT JOIN existing_fks fk ON 
    uc.table_schema = fk.table_schema 
    AND uc.table_name = fk.table_name 
    AND uc.column_name = fk.column_name
ORDER BY uc.table_schema, uc.table_name, uc.column_name;

-- =====================================================
-- 2. IDENTIFY POTENTIAL FOREIGN KEY RELATIONSHIPS
-- =====================================================

-- Look for columns that might reference other tables based on naming patterns
WITH potential_relationships AS (
    SELECT 
        t1.table_schema,
        t1.table_name,
        c1.column_name,
        c1.data_type,
        t2.table_name AS potential_reference_table,
        c2.column_name AS potential_reference_column
    FROM information_schema.tables t1
    JOIN information_schema.columns c1 ON t1.table_name = c1.table_name AND t1.table_schema = c1.table_schema
    JOIN information_schema.tables t2 ON t2.table_schema = t1.table_schema
    JOIN information_schema.columns c2 ON t2.table_name = c2.table_name AND t2.table_schema = c2.table_schema
    WHERE t1.table_schema IN ('public', 'auth')
    AND t1.table_type = 'BASE TABLE'
    AND t2.table_type = 'BASE TABLE'
    AND c1.data_type = 'uuid'
    AND c2.data_type = 'uuid'
    AND c1.column_name LIKE '%' || t2.table_name || '%'
    AND c1.column_name != c2.column_name
    AND t1.table_name != t2.table_name
)
SELECT 
    table_schema,
    table_name,
    column_name,
    potential_reference_table,
    potential_reference_column,
    'POTENTIAL FK: ' || table_name || '.' || column_name || ' -> ' || potential_reference_table || '.' || potential_reference_column AS suggestion
FROM potential_relationships
ORDER BY table_schema, table_name, column_name;

-- =====================================================
-- 3. COMMON PATTERNS ANALYSIS
-- =====================================================

-- Check for common foreign key patterns
SELECT 
    table_schema,
    table_name,
    column_name,
    CASE 
        WHEN column_name = 'user_id' THEN 'Should reference users.id'
        WHEN column_name = 'author_id' THEN 'Should reference authors.id'
        WHEN column_name = 'book_id' THEN 'Should reference books.id'
        WHEN column_name = 'publisher_id' THEN 'Should reference publishers.id'
        WHEN column_name = 'group_id' THEN 'Should reference groups.id'
        WHEN column_name = 'event_id' THEN 'Should reference events.id'
        WHEN column_name = 'created_by' THEN 'Should reference users.id'
        WHEN column_name = 'updated_by' THEN 'Should reference users.id'
        WHEN column_name = 'owner_id' THEN 'Should reference users.id'
        WHEN column_name = 'parent_id' THEN 'Should reference same table'
        WHEN column_name LIKE '%_id' THEN 'Potential foreign key - check naming pattern'
        ELSE 'Review for potential relationship'
    END AS suggested_reference
FROM (
    SELECT 
        t.table_schema,
        t.table_name,
        c.column_name,
        c.data_type
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
    WHERE t.table_schema IN ('public', 'auth')
    AND t.table_type = 'BASE TABLE'
    AND c.data_type = 'uuid'
    AND c.column_name LIKE '%_id'
) uuid_id_columns
ORDER BY table_schema, table_name, column_name;

-- =====================================================
-- 4. SUMMARY REPORT
-- =====================================================

-- Count missing foreign keys
SELECT 
    'UUID COLUMNS WITHOUT FOREIGN KEYS' as report_type,
    COUNT(*) as count
FROM (
    SELECT 
        t.table_schema,
        t.table_name,
        c.column_name
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
    LEFT JOIN information_schema.key_column_usage kcu ON 
        t.table_name = kcu.table_name 
        AND t.table_schema = kcu.table_schema 
        AND c.column_name = kcu.column_name
    LEFT JOIN information_schema.table_constraints tc ON 
        kcu.constraint_name = tc.constraint_name 
        AND tc.constraint_type = 'FOREIGN KEY'
    WHERE t.table_schema IN ('public', 'auth')
    AND t.table_type = 'BASE TABLE'
    AND c.data_type = 'uuid'
    AND tc.constraint_name IS NULL
) missing_fks

UNION ALL

-- Count existing foreign keys
SELECT 
    'UUID COLUMNS WITH FOREIGN KEYS' as report_type,
    COUNT(*) as count
FROM (
    SELECT DISTINCT
        tc.table_schema,
        tc.table_name,
        kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.columns c ON 
        tc.table_name = c.table_name 
        AND tc.table_schema = c.table_schema 
        AND kcu.column_name = c.column_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema IN ('public', 'auth')
    AND c.data_type = 'uuid'
) existing_fks; 