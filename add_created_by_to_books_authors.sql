-- =====================================================
-- ADD CREATED_BY FIELDS TO BOOKS AND AUTHORS TABLES
-- =====================================================
-- This script adds created_by UUID fields to books and authors tables
-- and sets them to the specified user ID with proper foreign key constraints

-- =====================================================
-- 1. ADD CREATED_BY COLUMN TO BOOKS TABLE
-- =====================================================

-- Check if created_by column already exists in books table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' 
        AND column_name = 'created_by'
        AND table_schema = 'public'
    ) THEN
        -- Add created_by column to books table
        ALTER TABLE public.books 
        ADD COLUMN created_by uuid;
        
        RAISE NOTICE 'Added created_by column to books table';
    ELSE
        RAISE NOTICE 'created_by column already exists in books table';
    END IF;
END$$;

-- =====================================================
-- 2. ADD CREATED_BY COLUMN TO AUTHORS TABLE
-- =====================================================

-- Check if created_by column already exists in authors table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'authors' 
        AND column_name = 'created_by'
        AND table_schema = 'public'
    ) THEN
        -- Add created_by column to authors table
        ALTER TABLE public.authors 
        ADD COLUMN created_by uuid;
        
        RAISE NOTICE 'Added created_by column to authors table';
    ELSE
        RAISE NOTICE 'created_by column already exists in authors table';
    END IF;
END$$;

-- =====================================================
-- 3. SET CREATED_BY TO SPECIFIED USER ID
-- =====================================================

-- Set created_by for all existing books to the specified user ID
UPDATE public.books 
SET created_by = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3'::uuid
WHERE created_by IS NULL;

-- Set created_by for all existing authors to the specified user ID
UPDATE public.authors 
SET created_by = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3'::uuid
WHERE created_by IS NULL;

-- =====================================================
-- 4. ADD FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign key constraint for books.created_by -> public.users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'books_created_by_fkey'
          AND table_name = 'books'
    ) THEN
        ALTER TABLE public.books
            ADD CONSTRAINT books_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added foreign key constraint: books.created_by -> public.users.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint books_created_by_fkey already exists';
    END IF;
END$$;

-- Add foreign key constraint for authors.created_by -> public.users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'authors_created_by_fkey'
          AND table_name = 'authors'
    ) THEN
        ALTER TABLE public.authors
            ADD CONSTRAINT authors_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added foreign key constraint: authors.created_by -> public.users.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint authors_created_by_fkey already exists';
    END IF;
END$$;

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create index on books.created_by
CREATE INDEX IF NOT EXISTS idx_books_created_by ON public.books(created_by);

-- Create index on authors.created_by
CREATE INDEX IF NOT EXISTS idx_authors_created_by ON public.authors(created_by);

-- =====================================================
-- 6. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

-- Add comment to books.created_by column
COMMENT ON COLUMN public.books.created_by IS 'User who created this book record';

-- Add comment to authors.created_by column
COMMENT ON COLUMN public.authors.created_by IS 'User who created this author record';

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Verify the changes
DO $$
DECLARE
    books_count INTEGER;
    authors_count INTEGER;
    books_with_created_by INTEGER;
    authors_with_created_by INTEGER;
BEGIN
    -- Count total books and authors
    SELECT COUNT(*) INTO books_count FROM public.books;
    SELECT COUNT(*) INTO authors_count FROM public.authors;
    
    -- Count books and authors with created_by set
    SELECT COUNT(*) INTO books_with_created_by 
    FROM public.books 
    WHERE created_by = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3'::uuid;
    
    SELECT COUNT(*) INTO authors_with_created_by 
    FROM public.authors 
    WHERE created_by = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3'::uuid;
    
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE 'Total books: %', books_count;
    RAISE NOTICE 'Books with created_by set: %', books_with_created_by;
    RAISE NOTICE 'Total authors: %', authors_count;
    RAISE NOTICE 'Authors with created_by set: %', authors_with_created_by;
    
    -- Verify foreign key constraints exist
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'books_created_by_fkey'
          AND table_name = 'books'
    ) THEN
        RAISE NOTICE '✓ Foreign key constraint books_created_by_fkey exists';
    ELSE
        RAISE NOTICE '✗ Foreign key constraint books_created_by_fkey missing';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'authors_created_by_fkey'
          AND table_name = 'authors'
    ) THEN
        RAISE NOTICE '✓ Foreign key constraint authors_created_by_fkey exists';
    ELSE
        RAISE NOTICE '✗ Foreign key constraint authors_created_by_fkey missing';
    END IF;
    
    -- Verify indexes exist
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_books_created_by'
    ) THEN
        RAISE NOTICE '✓ Index idx_books_created_by exists';
    ELSE
        RAISE NOTICE '✗ Index idx_books_created_by missing';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_authors_created_by'
    ) THEN
        RAISE NOTICE '✓ Index idx_authors_created_by exists';
    ELSE
        RAISE NOTICE '✗ Index idx_authors_created_by missing';
    END IF;
END$$;

-- =====================================================
-- 8. UPDATE RLS POLICIES (if needed)
-- =====================================================

-- Note: If you have Row Level Security (RLS) enabled on these tables,
-- you may need to update the policies to include created_by checks.
-- This is optional and depends on your security requirements.

-- Example RLS policy for books (uncomment if needed):
/*
CREATE POLICY "Users can view books created by themselves or admins" ON public.books
    FOR SELECT USING (
        created_by = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'super-admin')
        )
    );
*/

-- Example RLS policy for authors (uncomment if needed):
/*
CREATE POLICY "Users can view authors created by themselves or admins" ON public.authors
    FOR SELECT USING (
        created_by = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'super-admin')
        )
    );
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

RAISE NOTICE 'Migration completed successfully!';
RAISE NOTICE 'All books and authors now have created_by set to user ID: e06cdf85-b449-4dcb-b943-068aaad8cfa3';
RAISE NOTICE 'Foreign key constraints and indexes have been created'; 