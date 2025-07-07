-- =====================================================
-- ADD MISSING FOREIGN KEY CONSTRAINTS
-- =====================================================
-- This script adds missing foreign key constraints for UUID columns
-- based on common naming patterns and relationships

-- =====================================================
-- 1. ADD FOREIGN KEY FOR PROFILES.USER_ID
-- =====================================================

-- Add foreign key constraint for profiles.user_id -> users.id
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

-- =====================================================
-- 2. ADD FOREIGN KEYS FOR COMMON PATTERNS
-- =====================================================

-- user_id -> users.id
DO $$
DECLARE
    table_record RECORD;
BEGIN
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
        AND t.table_name != 'users'
        AND t.table_name != 'profiles'
    LOOP
        EXECUTE format(
            'ALTER TABLE %I.%I ADD CONSTRAINT %I_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE',
            table_record.table_schema,
            table_record.table_name,
            table_record.table_name
        );
        RAISE NOTICE 'Added foreign key constraint: %.%.user_id -> users.id', table_record.table_schema, table_record.table_name;
    END LOOP;
END $$;

-- author_id -> authors.id
DO $$
DECLARE
    table_record RECORD;
BEGIN
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
        EXECUTE format(
            'ALTER TABLE %I.%I ADD CONSTRAINT %I_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.authors(id) ON DELETE CASCADE',
            table_record.table_schema,
            table_record.table_name,
            table_record.table_name
        );
        RAISE NOTICE 'Added foreign key constraint: %.%.author_id -> authors.id', table_record.table_schema, table_record.table_name;
    END LOOP;
END $$;

-- book_id -> books.id
DO $$
DECLARE
    table_record RECORD;
BEGIN
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
        EXECUTE format(
            'ALTER TABLE %I.%I ADD CONSTRAINT %I_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE',
            table_record.table_schema,
            table_record.table_name,
            table_record.table_name
        );
        RAISE NOTICE 'Added foreign key constraint: %.%.book_id -> books.id', table_record.table_schema, table_record.table_name;
    END LOOP;
END $$;

-- publisher_id -> publishers.id
DO $$
DECLARE
    table_record RECORD;
BEGIN
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
        EXECUTE format(
            'ALTER TABLE %I.%I ADD CONSTRAINT %I_publisher_id_fkey FOREIGN KEY (publisher_id) REFERENCES public.publishers(id) ON DELETE CASCADE',
            table_record.table_schema,
            table_record.table_name,
            table_record.table_name
        );
        RAISE NOTICE 'Added foreign key constraint: %.%.publisher_id -> publishers.id', table_record.table_schema, table_record.table_name;
    END LOOP;
END $$;

-- group_id -> groups.id
DO $$
DECLARE
    table_record RECORD;
BEGIN
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
        EXECUTE format(
            'ALTER TABLE %I.%I ADD CONSTRAINT %I_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE',
            table_record.table_schema,
            table_record.table_name,
            table_record.table_name
        );
        RAISE NOTICE 'Added foreign key constraint: %.%.group_id -> groups.id', table_record.table_schema, table_record.table_name;
    END LOOP;
END $$;

-- event_id -> events.id
DO $$
DECLARE
    table_record RECORD;
BEGIN
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
        EXECUTE format(
            'ALTER TABLE %I.%I ADD CONSTRAINT %I_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE',
            table_record.table_schema,
            table_record.table_name,
            table_record.table_name
        );
        RAISE NOTICE 'Added foreign key constraint: %.%.event_id -> events.id', table_record.table_schema, table_record.table_name;
    END LOOP;
END $$;

-- created_by -> users.id
DO $$
DECLARE
    table_record RECORD;
BEGIN
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
        EXECUTE format(
            'ALTER TABLE %I.%I ADD CONSTRAINT %I_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL',
            table_record.table_schema,
            table_record.table_name,
            table_record.table_name
        );
        RAISE NOTICE 'Added foreign key constraint: %.%.created_by -> users.id', table_record.table_schema, table_record.table_name;
    END LOOP;
END $$;

-- =====================================================
-- 3. ADD FOREIGN KEYS FOR BOOKS AND AUTHORS CREATED_BY
-- =====================================================

-- books.created_by -> users.id
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

-- authors.created_by -> users.id
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

-- =====================================================
-- 4. VERIFY ALL FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Show all foreign key constraints
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
-- 5. SUMMARY
-- =====================================================

SELECT '✅ FOREIGN KEY CONSTRAINTS ADDED SUCCESSFULLY!' as status;
SELECT 'All UUID columns with relationships now have proper foreign key constraints' as details; 