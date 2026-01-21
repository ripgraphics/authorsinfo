-- Fix: add_entity_comment should ONLY accept entity_types.id (UUID)
-- entity_type column has FK constraint to entity_types.id
-- Function should accept UUID only, not name lookup
-- Created: 2026-01-20

-- Step 1: Drop and recreate function to accept UUID only
DROP FUNCTION IF EXISTS public.add_entity_comment(UUID, TEXT, UUID, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.add_entity_comment(
    p_user_id UUID,
    p_entity_type UUID,  -- MUST be entity_types.id (UUID), not name
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
    v_entity_type_exists BOOLEAN;
BEGIN
    -- Validate that p_entity_type exists in entity_types table
    SELECT EXISTS (
        SELECT 1 
        FROM public.entity_types 
        WHERE id = p_entity_type
    ) INTO v_entity_type_exists;
    
    IF NOT v_entity_type_exists THEN
        RAISE EXCEPTION 'Entity type ID % does not exist in entity_types table', p_entity_type;
    END IF;
    
    -- Create the comment using entity_type UUID directly
    -- Foreign key constraint ensures it references entity_types.id
    INSERT INTO public.comments (
        user_id,
        entity_type,  -- UUID referencing entity_types.id
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
        p_entity_type,  -- Store UUID directly
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

COMMENT ON FUNCTION public.add_entity_comment(UUID, UUID, UUID, TEXT, UUID) IS 
'Creates a comment on an entity. p_entity_type MUST be entity_types.id (UUID). For "post" entity type, use UUID: 449c07f5-62dc-49df-973a-cfed202bb771. Function validates UUID exists in entity_types table before creating comment.';

-- Step 2: Verify foreign key constraint exists
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
    
    IF NOT constraint_exists THEN
        RAISE WARNING 'Foreign key constraint fk_comments_entity_type does not exist - should be added';
    ELSE
        RAISE NOTICE '✅ Foreign key constraint fk_comments_entity_type exists';
    END IF;
END $$;

-- Step 3: Verify function signature
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Fixed add_entity_comment function';
    RAISE NOTICE '   - Function now accepts UUID only (entity_types.id)';
    RAISE NOTICE '   - Validates UUID exists in entity_types';
    RAISE NOTICE '   - Stores UUID directly (FK constraint ensures referential integrity)';
    RAISE NOTICE '   - For "post", use UUID: 449c07f5-62dc-49df-973a-cfed202bb771';
    RAISE NOTICE '========================================';
END $$;
