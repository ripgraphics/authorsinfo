-- =====================================================
-- EXECUTE MIGRATION: ADD CREATED_BY FIELDS TO BOOKS AND AUTHORS
-- =====================================================
-- Copy and paste this entire script into your Supabase SQL editor and execute it

-- 1. ADD CREATED_BY COLUMN TO BOOKS TABLE
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS created_by uuid;

-- 2. ADD CREATED_BY COLUMN TO AUTHORS TABLE  
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS created_by uuid;

-- 3. SET CREATED_BY TO SPECIFIED USER ID
UPDATE public.books 
SET created_by = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3'::uuid
WHERE created_by IS NULL;

UPDATE public.authors 
SET created_by = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3'::uuid
WHERE created_by IS NULL;

-- 4. ADD FOREIGN KEY CONSTRAINTS
ALTER TABLE public.books 
ADD CONSTRAINT IF NOT EXISTS books_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.authors 
ADD CONSTRAINT IF NOT EXISTS authors_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- 5. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_books_created_by ON public.books(created_by);
CREATE INDEX IF NOT EXISTS idx_authors_created_by ON public.authors(created_by);

-- 6. ADD COMMENTS FOR DOCUMENTATION
COMMENT ON COLUMN public.books.created_by IS 'User who created this book record';
COMMENT ON COLUMN public.authors.created_by IS 'User who created this author record';

-- 7. VERIFICATION QUERIES
SELECT 
  'Books' as table_name,
  COUNT(*) as total_records,
  COUNT(created_by) as records_with_creator,
  COUNT(CASE WHEN created_by = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3'::uuid THEN 1 END) as records_with_specified_user
FROM public.books
UNION ALL
SELECT 
  'Authors' as table_name,
  COUNT(*) as total_records,
  COUNT(created_by) as records_with_creator,
  COUNT(CASE WHEN created_by = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3'::uuid THEN 1 END) as records_with_specified_user
FROM public.authors;

-- 8. VERIFY FOREIGN KEY CONSTRAINTS
SELECT 
  constraint_name,
  table_name,
  column_name
FROM information_schema.key_column_usage
WHERE constraint_name IN ('books_created_by_fkey', 'authors_created_by_fkey');

-- 9. VERIFY INDEXES
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE indexname IN ('idx_books_created_by', 'idx_authors_created_by');

-- =====================================================
-- MIGRATION COMPLETE
-- ===================================================== 