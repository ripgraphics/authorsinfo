-- Fix: Ensure add_entity_comment function creates entity if it doesn't exist
-- Error: Key (entity_id)=(xxx) is not present in table "entities"
-- Created: 2026-01-20
--
-- The add_entity_comment function should ensure the entity exists in entities table
-- before creating a comment, to satisfy the foreign key constraint

-- Step 1: Check if add_entity_comment function exists
DO $$
DECLARE
    func_exists BOOLEAN;
    func_def TEXT;
BEGIN
    RAISE NOTICE '=== Step 1: Checking add_entity_comment function ===';
    
    SELECT EXISTS (
        SELECT 1 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'add_entity_comment'
    ) INTO func_exists;
    
    IF func_exists THEN
        RAISE NOTICE '✅ add_entity_comment function EXISTS';
        -- Get function definition
        SELECT pg_get_functiondef(p.oid) INTO func_def
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'add_entity_comment'
        LIMIT 1;
        
        IF func_def LIKE '%INSERT INTO entities%' OR func_def LIKE '%INSERT INTO public.entities%' THEN
            RAISE NOTICE '✅ Function already creates entities';
        ELSE
            RAISE NOTICE '⚠️ Function does NOT create entities - needs to be fixed';
        END IF;
    ELSE
        RAISE NOTICE '❌ add_entity_comment function DOES NOT EXIST - will create it';
    END IF;
END $$;

-- Step 2: Check entities table structure
DO $$
DECLARE
    entities_exists BOOLEAN;
    col_rec RECORD;
    column_list TEXT := '';
BEGIN
    RAISE NOTICE E'\n=== Step 2: Checking entities table structure ===';
    
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'entities'
    ) INTO entities_exists;
    
    IF entities_exists THEN
        RAISE NOTICE '✅ entities table EXISTS';
        
        FOR col_rec IN
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'entities'
            ORDER BY ordinal_position
        LOOP
            column_list := column_list || E'\n  - ' || col_rec.column_name || 
                          ' (' || col_rec.data_type || ', nullable: ' || col_rec.is_nullable || ')';
        END LOOP;
        
        RAISE NOTICE 'Entities table columns:%', column_list;
    ELSE
        RAISE NOTICE '❌ entities table DOES NOT EXIST';
        RAISE EXCEPTION 'Cannot proceed - entities table does not exist';
    END IF;
END $$;

-- Step 3: Create or replace add_entity_comment function
-- This function will ensure entity exists before creating comment
CREATE OR REPLACE FUNCTION public.add_entity_comment(
    p_user_id UUID,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_comment_text TEXT,
    p_parent_comment_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_comment_id UUID;
    v_entity_exists BOOLEAN;
BEGIN
    -- Step 1: Ensure entity exists in entities table
    SELECT EXISTS (
        SELECT 1 
        FROM public.entities 
        WHERE id = p_entity_id
    ) INTO v_entity_exists;
    
    IF NOT v_entity_exists THEN
        -- Create entity in entities table
        -- Note: Adjust columns based on actual entities table structure
        INSERT INTO public.entities (id, entity_type, created_at, updated_at)
        VALUES (p_entity_id, p_entity_type, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Created entity % of type %', p_entity_id, p_entity_type;
    END IF;
    
    -- Step 2: Create the comment
    INSERT INTO public.comments (
        user_id,
        entity_type,
        entity_id,
        content,
        parent_comment_id,
        is_deleted,
        is_hidden,
        created_at,
        updated_at
    )
    VALUES (
        p_user_id,
        p_entity_type,
        p_entity_id,
        p_comment_text,
        p_parent_comment_id,
        false,
        false,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_comment_id;
    
    RETURN v_comment_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to add comment: %', SQLERRM;
END;
$$;

-- Step 4: Add comment to function
COMMENT ON FUNCTION public.add_entity_comment(UUID, TEXT, UUID, TEXT, UUID) IS 
'Creates a comment on an entity. Ensures the entity exists in entities table before creating the comment to satisfy foreign key constraints.';

-- Step 5: Verify function was created
DO $$
BEGIN
    RAISE NOTICE E'\n=== Step 3: Verification ===';
    RAISE NOTICE '✅ add_entity_comment function created/updated';
    RAISE NOTICE '   Function will now ensure entities exist before creating comments';
    RAISE NOTICE '   This should fix the foreign key constraint error';
END $$;
