-- Create "Book Post" entity_type
-- This is a new entity type for book posts
-- Created: 2026-01-20

-- Step 1: Check if "Book Post" already exists
DO $$
DECLARE
    v_exists BOOLEAN;
    v_new_id UUID;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.entity_types 
        WHERE name = 'Book Post'
    ) INTO v_exists;
    
    IF v_exists THEN
        RAISE NOTICE '⚠ "Book Post" entity_type already exists';
    ELSE
        -- Generate new UUID for Book Post
        v_new_id := gen_random_uuid();
        
        -- Insert new entity_type
        INSERT INTO public.entity_types (
            id,
            name,
            description,
            entity_category,
            created_at,
            updated_at
        )
        VALUES (
            v_new_id,
            'Book Post',
            'Book post entity type for book-related posts',
            'book',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Created "Book Post" entity_type with ID: %', v_new_id;
    END IF;
END $$;

-- Step 2: Verify creation and show the ID
DO $$
DECLARE
    v_book_post_id UUID;
    v_book_post_name TEXT;
BEGIN
    SELECT id, name
    INTO v_book_post_id, v_book_post_name
    FROM public.entity_types
    WHERE name = 'Book Post'
    LIMIT 1;
    
    IF v_book_post_id IS NOT NULL THEN
        RAISE NOTICE '========================================';
        RAISE NOTICE '✅ "Book Post" entity_type created successfully';
        RAISE NOTICE '   Name: %', v_book_post_name;
        RAISE NOTICE '   ID: %', v_book_post_id;
        RAISE NOTICE '   Use this UUID when creating comments on book posts';
        RAISE NOTICE '========================================';
    ELSE
        RAISE WARNING '⚠ "Book Post" entity_type was not created';
    END IF;
END $$;
