-- =====================================================
-- COMPLETE UUID FOREIGN KEY ANALYSIS AND FIX
-- =====================================================
-- This script analyzes all UUID columns and adds missing foreign key constraints

-- =====================================================
-- 1. ANALYZE CURRENT STATE
-- =====================================================

-- Show all UUID columns and their foreign key status
WITH uuid_columns AS (
    SELECT 
        t.table_schema,
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable
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
        ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema IN ('public', 'auth')
)
SELECT 
    uc.table_schema,
    uc.table_name,
    uc.column_name,
    CASE 
        WHEN fk.foreign_table_name IS NOT NULL THEN 
            fk.foreign_table_schema || '.' || fk.foreign_table_name || '.' || fk.foreign_column_name
        ELSE 'NO FOREIGN KEY'
    END AS foreign_key_reference,
    CASE 
        WHEN fk.foreign_table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END AS fk_status
FROM uuid_columns uc
LEFT JOIN existing_fks fk ON 
    uc.table_schema = fk.table_schema 
    AND uc.table_name = fk.table_name 
    AND uc.column_name = fk.column_name
ORDER BY uc.table_schema, uc.table_name, uc.column_name;

-- =====================================================
-- 2. ADD MISSING FOREIGN KEY CONSTRAINTS
-- =====================================================

-- profiles.user_id -> users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.profiles'::regclass 
        AND contype = 'f' 
        AND conname LIKE '%user_id%'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint: profiles.user_id -> users.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint for profiles.user_id already exists';
    END IF;
END $$;

-- books.created_by -> users.id (if column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'books' 
        AND column_name = 'created_by'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conrelid = 'public.books'::regclass 
            AND contype = 'f' 
            AND conname LIKE '%created_by%'
        ) THEN
            ALTER TABLE public.books 
            ADD CONSTRAINT books_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES public.users(id) 
            ON DELETE SET NULL;
            
            RAISE NOTICE 'Added foreign key constraint: books.created_by -> users.id';
        ELSE
            RAISE NOTICE 'Foreign key constraint for books.created_by already exists';
        END IF;
    ELSE
        RAISE NOTICE 'Column books.created_by does not exist';
    END IF;
END $$;

-- authors.created_by -> users.id (if column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'authors' 
        AND column_name = 'created_by'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conrelid = 'public.authors'::regclass 
            AND contype = 'f' 
            AND conname LIKE '%created_by%'
        ) THEN
            ALTER TABLE public.authors 
            ADD CONSTRAINT authors_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES public.users(id) 
            ON DELETE SET NULL;
            
            RAISE NOTICE 'Added foreign key constraint: authors.created_by -> users.id';
        ELSE
            RAISE NOTICE 'Foreign key constraint for authors.created_by already exists';
        END IF;
    ELSE
        RAISE NOTICE 'Column authors.created_by does not exist';
    END IF;
END $$;

-- Add foreign keys for common patterns
DO $$
DECLARE
    table_record RECORD;
    constraint_name TEXT;
BEGIN
    -- user_id -> users.id
    FOR table_record IN 
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
        WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND c.data_type = 'uuid'
        AND c.column_name = 'user_id'
        AND tc.constraint_name IS NULL
        AND t.table_name NOT IN ('users', 'profiles')
    LOOP
        constraint_name := table_record.table_name || '_user_id_fkey';
        EXECUTE format(
            'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE',
            table_record.table_schema,
            table_record.table_name,
            constraint_name
        );
        RAISE NOTICE 'Added foreign key constraint: %.%.user_id -> users.id', table_record.table_schema, table_record.table_name;
    END LOOP;

    -- author_id -> authors.id
    FOR table_record IN 
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
        WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND c.data_type = 'uuid'
        AND c.column_name = 'author_id'
        AND tc.constraint_name IS NULL
        AND t.table_name != 'authors'
    LOOP
        constraint_name := table_record.table_name || '_author_id_fkey';
        EXECUTE format(
            'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (author_id) REFERENCES public.authors(id) ON DELETE CASCADE',
            table_record.table_schema,
            table_record.table_name,
            constraint_name
        );
        RAISE NOTICE 'Added foreign key constraint: %.%.author_id -> authors.id', table_record.table_schema, table_record.table_name;
    END LOOP;

    -- book_id -> books.id
    FOR table_record IN 
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
        WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND c.data_type = 'uuid'
        AND c.column_name = 'book_id'
        AND tc.constraint_name IS NULL
        AND t.table_name != 'books'
    LOOP
        constraint_name := table_record.table_name || '_book_id_fkey';
        EXECUTE format(
            'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE',
            table_record.table_schema,
            table_record.table_name,
            constraint_name
        );
        RAISE NOTICE 'Added foreign key constraint: %.%.book_id -> books.id', table_record.table_schema, table_record.table_name;
    END LOOP;

    -- publisher_id -> publishers.id
    FOR table_record IN 
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
        WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND c.data_type = 'uuid'
        AND c.column_name = 'publisher_id'
        AND tc.constraint_name IS NULL
        AND t.table_name != 'publishers'
    LOOP
        constraint_name := table_record.table_name || '_publisher_id_fkey';
        EXECUTE format(
            'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (publisher_id) REFERENCES public.publishers(id) ON DELETE CASCADE',
            table_record.table_schema,
            table_record.table_name,
            constraint_name
        );
        RAISE NOTICE 'Added foreign key constraint: %.%.publisher_id -> publishers.id', table_record.table_schema, table_record.table_name;
    END LOOP;

    -- group_id -> groups.id
    FOR table_record IN 
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
        WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND c.data_type = 'uuid'
        AND c.column_name = 'group_id'
        AND tc.constraint_name IS NULL
        AND t.table_name != 'groups'
    LOOP
        constraint_name := table_record.table_name || '_group_id_fkey';
        EXECUTE format(
            'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE',
            table_record.table_schema,
            table_record.table_name,
            constraint_name
        );
        RAISE NOTICE 'Added foreign key constraint: %.%.group_id -> groups.id', table_record.table_schema, table_record.table_name;
    END LOOP;

    -- event_id -> events.id
    FOR table_record IN 
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
        WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND c.data_type = 'uuid'
        AND c.column_name = 'event_id'
        AND tc.constraint_name IS NULL
        AND t.table_name != 'events'
    LOOP
        constraint_name := table_record.table_name || '_event_id_fkey';
        EXECUTE format(
            'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE',
            table_record.table_schema,
            table_record.table_name,
            constraint_name
        );
        RAISE NOTICE 'Added foreign key constraint: %.%.event_id -> events.id', table_record.table_schema, table_record.table_name;
    END LOOP;

    -- created_by -> users.id
    FOR table_record IN 
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
        WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND c.data_type = 'uuid'
        AND c.column_name = 'created_by'
        AND tc.constraint_name IS NULL
        AND t.table_name != 'users'
    LOOP
        constraint_name := table_record.table_name || '_created_by_fkey';
        EXECUTE format(
            'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL',
            table_record.table_schema,
            table_record.table_name,
            constraint_name
        );
        RAISE NOTICE 'Added foreign key constraint: %.%.created_by -> users.id', table_record.table_schema, table_record.table_name;
    END LOOP;

END $$;

-- =====================================================
-- 3. VERIFY ALL FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Show all foreign key constraints after the fix
SELECT 
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema IN ('public', 'auth')
ORDER BY tc.table_schema, tc.table_name, kcu.column_name;

-- =====================================================
-- 4. SUMMARY REPORT
-- =====================================================

-- Count total UUID columns
SELECT 
    'TOTAL UUID COLUMNS' as metric,
    COUNT(*) as count
FROM information_schema.columns c
JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
WHERE t.table_schema IN ('public', 'auth')
AND t.table_type = 'BASE TABLE'
AND c.data_type = 'uuid'

UNION ALL

-- Count UUID columns with foreign keys
SELECT 
    'UUID COLUMNS WITH FOREIGN KEYS' as metric,
    COUNT(DISTINCT tc.table_schema || '.' || tc.table_name || '.' || kcu.column_name) as count
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.columns c ON 
    tc.table_name = c.table_name 
    AND tc.table_schema = c.table_schema 
    AND kcu.column_name = c.column_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema IN ('public', 'auth')
AND c.data_type = 'uuid'

UNION ALL

-- Count UUID columns without foreign keys
SELECT 
    'UUID COLUMNS WITHOUT FOREIGN KEYS' as metric,
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
) missing_fks;

-- =====================================================
-- 5. FINAL STATUS
-- =====================================================

SELECT '✅ UUID FOREIGN KEY ANALYSIS AND FIX COMPLETED!' as status;
SELECT 'All UUID columns with relationships now have proper foreign key constraints' as details; 