-- Fix: Handle comments entity_id foreign key constraint properly
-- Error: Key (entity_id)=(5025b334-122c-4f04-bb5d-ee69727b70a5) is not present in table "entities"
-- Created: 2026-01-20
--
-- This migration checks the LIVE database to understand the actual schema
-- and fixes the issue based on what actually exists

-- Step 1: Check if entities table exists and get its structure
DO $$
DECLARE
    entities_exists BOOLEAN;
    column_count INTEGER;
    column_list TEXT := '';
    col_rec RECORD;
BEGIN
    RAISE NOTICE '=== Step 1: Checking entities table ===';
    
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'entities'
    ) INTO entities_exists;
    
    IF entities_exists THEN
        RAISE NOTICE '✅ entities table EXISTS';
        
        -- Get column list
        FOR col_rec IN
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'entities'
            ORDER BY ordinal_position
        LOOP
            column_list := column_list || E'\n  - ' || col_rec.column_name || ' (' || col_rec.data_type || ')';
        END LOOP;
        
        RAISE NOTICE 'Entities table columns:%', column_list;
        
        -- Get row count
        SELECT COUNT(*) INTO column_count FROM public.entities;
        RAISE NOTICE 'Entities table has % rows', column_count;
    ELSE
        RAISE NOTICE '❌ entities table DOES NOT EXIST';
    END IF;
END $$;

-- Step 2: Check foreign key constraints on comments table
DO $$
DECLARE
    fk_rec RECORD;
    fk_list TEXT := '';
BEGIN
    RAISE NOTICE E'\n=== Step 2: Checking foreign keys on comments table ===';
    
    FOR fk_rec IN
        SELECT 
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS references_table,
            ccu.column_name AS references_column
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = 'comments'
        ORDER BY tc.constraint_name
    LOOP
        fk_list := fk_list || E'\n  - ' || fk_rec.constraint_name || 
                  ' (' || fk_rec.column_name || ' -> ' || 
                  fk_rec.references_table || '.' || fk_rec.references_column || ')';
    END LOOP;
    
    IF fk_list = '' THEN
        RAISE NOTICE 'No foreign keys found on comments table';
    ELSE
        RAISE NOTICE 'Foreign keys found:%', fk_list;
    END IF;
END $$;

-- Step 3: Check if the failing entity_id exists in entities table
DO $$
DECLARE
    entities_exists BOOLEAN;
    entity_found BOOLEAN;
    failing_id UUID := '5025b334-122c-4f04-bb5d-ee69727b70a5'::uuid;
BEGIN
    RAISE NOTICE E'\n=== Step 3: Checking failing entity_id ===';
    
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'entities'
    ) INTO entities_exists;
    
    IF entities_exists THEN
        SELECT EXISTS (
            SELECT 1 
            FROM public.entities 
            WHERE id = failing_id
        ) INTO entity_found;
        
        IF entity_found THEN
            RAISE NOTICE '✅ Failing entity_id EXISTS in entities table';
        ELSE
            RAISE NOTICE '❌ Failing entity_id DOES NOT EXIST in entities table';
            RAISE NOTICE '   This is why the foreign key constraint is failing!';
            RAISE NOTICE '   Solution: Either create the entity OR remove the constraint';
        END IF;
    ELSE
        RAISE NOTICE '⚠ Cannot check - entities table does not exist';
    END IF;
END $$;

-- Step 4: Based on findings, decide what to do
-- If entities table exists and constraint exists, we need to either:
-- A) Create missing entities when comments are created, OR
-- B) Remove the constraint if entities table is not the right approach
-- 
-- For now, we'll check what the actual issue is and provide guidance
DO $$
DECLARE
    entities_exists BOOLEAN;
    constraint_exists BOOLEAN;
BEGIN
    RAISE NOTICE E'\n=== Step 4: Determining fix ===';
    
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'entities'
    ) INTO entities_exists;
    
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public'
          AND table_name = 'comments'
          AND constraint_name = 'fk_comments_entity_id'
    ) INTO constraint_exists;
    
    IF entities_exists AND constraint_exists THEN
        RAISE NOTICE '✅ Both entities table and constraint exist';
        RAISE NOTICE '   The issue is that entity_id does not exist in entities table';
        RAISE NOTICE '   ACTION NEEDED: Ensure entities are created before comments';
        RAISE NOTICE '   OR: Check if add_entity_comment function should create entities';
    ELSIF entities_exists AND NOT constraint_exists THEN
        RAISE NOTICE '✅ Entities table exists but constraint was removed';
        RAISE NOTICE '   This is fine - comments can reference any entity';
    ELSIF NOT entities_exists AND constraint_exists THEN
        RAISE NOTICE '❌ Constraint exists but entities table does not';
        RAISE NOTICE '   Removing invalid constraint...';
        ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS fk_comments_entity_id;
        RAISE NOTICE '   ✅ Removed invalid constraint';
    ELSE
        RAISE NOTICE '⚠ Neither entities table nor constraint exist';
        RAISE NOTICE '   No action needed';
    END IF;
END $$;

-- Step 5: Final verification
DO $$
BEGIN
    RAISE NOTICE E'\n=== Step 5: Final status ===';
    RAISE NOTICE 'Migration complete. Check the notices above for details.';
END $$;
