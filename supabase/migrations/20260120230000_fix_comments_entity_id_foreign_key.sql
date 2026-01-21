-- Fix: Remove invalid foreign key constraint on comments.entity_id
-- Error: Key (entity_id)=(xxx) is not present in table "entities"
-- Created: 2026-01-20
--
-- The comments table uses polymorphic references (entity_type + entity_id)
-- to reference different tables (activities, books, authors, etc.)
-- A foreign key constraint to a single "entities" table is incorrect.
--
-- This migration checks the live database first, then removes the constraint if it exists.

-- Step 1: Check what foreign key constraints actually exist on comments table
DO $$
DECLARE
    constraint_rec RECORD;
    constraint_list TEXT := '';
BEGIN
    RAISE NOTICE '=== Checking existing foreign key constraints on comments table ===';
    
    FOR constraint_rec IN
        SELECT 
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
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
        constraint_list := constraint_list || E'\n  - ' || constraint_rec.constraint_name || 
                          ' (' || constraint_rec.column_name || ' -> ' || 
                          constraint_rec.foreign_table_name || '.' || constraint_rec.foreign_column_name || ')';
        RAISE NOTICE 'Found constraint: % (%) -> %.%', 
            constraint_rec.constraint_name, 
            constraint_rec.column_name,
            constraint_rec.foreign_table_name,
            constraint_rec.foreign_column_name;
    END LOOP;
    
    IF constraint_list = '' THEN
        RAISE NOTICE 'No foreign key constraints found on comments table';
    ELSE
        RAISE NOTICE 'Foreign key constraints found:%', constraint_list;
    END IF;
END $$;

-- Step 2: Check if entities table exists
DO $$
DECLARE
    entities_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'entities'
    ) INTO entities_exists;
    
    IF entities_exists THEN
        RAISE NOTICE '✓ entities table EXISTS in database';
    ELSE
        RAISE NOTICE '⚠ entities table DOES NOT EXIST in database';
    END IF;
END $$;

-- Step 3: Drop the invalid foreign key constraint (only if it exists)
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public'
          AND table_name = 'comments'
          AND constraint_name = 'fk_comments_entity_id'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        ALTER TABLE public.comments DROP CONSTRAINT fk_comments_entity_id;
        RAISE NOTICE '✓ Dropped fk_comments_entity_id constraint';
    ELSE
        RAISE NOTICE '⚠ fk_comments_entity_id constraint does not exist (may have been removed already)';
    END IF;
END $$;

-- Step 2: Verify the constraint is removed
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public'
          AND table_name = 'comments'
          AND constraint_name = 'fk_comments_entity_id'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE WARNING 'Foreign key constraint fk_comments_entity_id still exists';
    ELSE
        RAISE NOTICE '✓ Successfully removed fk_comments_entity_id foreign key constraint';
    END IF;
END $$;

-- Step 3: Add comment explaining why there's no foreign key
COMMENT ON COLUMN public.comments.entity_id IS 'Polymorphic reference: ID of the entity being commented on. The actual table is determined by entity_type (activities, books, authors, etc.). No foreign key constraint due to polymorphic nature.';

-- Step 4: Log migration results
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration complete: Fixed comments entity_id foreign key';
    RAISE NOTICE '  - Removed invalid fk_comments_entity_id constraint';
    RAISE NOTICE '  - Comments now support polymorphic entity references';
    RAISE NOTICE '  - entity_type + entity_id can reference any table';
    RAISE NOTICE '✓ Comments table is now flexible for all entity types';
    RAISE NOTICE '========================================';
END $$;
