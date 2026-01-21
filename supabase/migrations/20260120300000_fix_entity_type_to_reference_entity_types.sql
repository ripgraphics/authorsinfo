-- Fix: entity_type should reference entity_types.id (UUID)
-- entity_type should be UUID referencing entity_types.id, not TEXT
-- For "post" entity type, use: 449c07f5-62dc-49df-973a-cfed202bb771
-- Created: 2026-01-20

-- Step 1: Check current entity_type column data type
DO $$
DECLARE
    v_data_type TEXT;
    v_udt_name TEXT;
BEGIN
    SELECT data_type, udt_name
    INTO v_data_type, v_udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'comments'
      AND column_name = 'entity_type';
    
    RAISE NOTICE 'Current entity_type column: data_type=%, udt_name=%', v_data_type, v_udt_name;
END $$;

-- Step 2: Check if foreign key constraint already exists on entity_type
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public'
          AND table_name = 'comments'
          AND constraint_name = 'fk_comments_entity_type'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE NOTICE '⚠ fk_comments_entity_type constraint already exists';
    ELSE
        RAISE NOTICE 'ℹ fk_comments_entity_type constraint does not exist - will add if column is UUID';
    END IF;
END $$;

-- Step 3: Drop and recreate add_entity_comment function
-- Function should look up entity_types.id based on name, or accept UUID directly
DROP FUNCTION IF EXISTS public.add_entity_comment(UUID, TEXT, UUID, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.add_entity_comment(
    p_user_id UUID,
    p_entity_type TEXT,  -- Can be name like 'post' or UUID like '449c07f5-62dc-49df-973a-cfed202bb771'
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
    v_entity_type_id UUID;
    v_entity_type_name TEXT;
BEGIN
    -- Determine if p_entity_type is a UUID or a name
    -- Try to parse as UUID first
    BEGIN
        v_entity_type_id := p_entity_type::UUID;
        -- If successful, it's already a UUID
        RAISE NOTICE 'Using entity_type as UUID: %', v_entity_type_id;
    EXCEPTION WHEN OTHERS THEN
        -- Not a UUID, treat as name and look up
        RAISE NOTICE 'Looking up entity_type by name: %', p_entity_type;
        
        SELECT id, name
        INTO v_entity_type_id, v_entity_type_name
        FROM public.entity_types
        WHERE LOWER(name) = LOWER(p_entity_type)
        LIMIT 1;
        
        IF v_entity_type_id IS NULL THEN
            RAISE EXCEPTION 'Entity type "%" not found in entity_types table', p_entity_type;
        END IF;
        
        RAISE NOTICE 'Found entity_type: % (id: %)', v_entity_type_name, v_entity_type_id;
    END;
    
    -- Verify entity_type_id exists in entity_types
    IF NOT EXISTS (SELECT 1 FROM public.entity_types WHERE id = v_entity_type_id) THEN
        RAISE EXCEPTION 'Entity type ID % does not exist in entity_types table', v_entity_type_id;
    END IF;
    
    -- Create the comment using entity_type_id (UUID)
    INSERT INTO public.comments (
        user_id,
        entity_type,  -- This should be UUID referencing entity_types.id
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
        v_entity_type_id::TEXT,  -- Store as TEXT (or UUID if column is UUID type)
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

COMMENT ON FUNCTION public.add_entity_comment(UUID, TEXT, UUID, TEXT, UUID) IS 
'Creates a comment on an entity. p_entity_type can be either a name (e.g., "post") or UUID (e.g., "449c07f5-62dc-49df-973a-cfed202bb771"). Function looks up entity_types.id and stores it in comments.entity_type. For "post" entity type, use UUID: 449c07f5-62dc-49df-973a-cfed202bb771';

-- Step 4: Add foreign key constraint if entity_type column is UUID type
-- Note: This will only work if the column is actually UUID type
-- If it's TEXT, we need to alter the column first (but that requires data migration)
DO $$
DECLARE
    v_udt_name TEXT;
    constraint_exists BOOLEAN;
BEGIN
    SELECT udt_name
    INTO v_udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'comments'
      AND column_name = 'entity_type';
    
    -- Check if constraint already exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public'
          AND table_name = 'comments'
          AND constraint_name = 'fk_comments_entity_type'
    ) INTO constraint_exists;
    
    IF v_udt_name = 'uuid' AND NOT constraint_exists THEN
        -- Column is UUID type, add foreign key constraint
        ALTER TABLE public.comments
        ADD CONSTRAINT fk_comments_entity_type 
        FOREIGN KEY (entity_type) 
        REFERENCES public.entity_types(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Added foreign key constraint fk_comments_entity_type';
    ELSIF v_udt_name = 'uuid' AND constraint_exists THEN
        RAISE NOTICE '✅ Foreign key constraint fk_comments_entity_type already exists';
    ELSE
        RAISE NOTICE '⚠ entity_type column is % type, not UUID. Cannot add foreign key constraint without column migration.', v_udt_name;
        RAISE NOTICE '   Function will still work by looking up entity_types.id and storing it';
    END IF;
END $$;

-- Step 5: Verify
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Fixed add_entity_comment function';
    RAISE NOTICE '   - Function now looks up entity_types.id';
    RAISE NOTICE '   - Accepts entity_type as name or UUID';
    RAISE NOTICE '   - For "post", use UUID: 449c07f5-62dc-49df-973a-cfed202bb771';
    RAISE NOTICE '========================================';
END $$;
