-- =====================================================
-- VERIFY MIGRATION: CHECK CREATED_BY FIELDS
-- =====================================================
-- Run this after executing the migration to verify everything worked

-- 1. CHECK IF CREATED_BY COLUMNS EXIST
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('books', 'authors') 
  AND column_name = 'created_by'
ORDER BY table_name;

-- 2. CHECK DATA POPULATION
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

-- 3. VERIFY FOREIGN KEY CONSTRAINTS
SELECT 
  constraint_name,
  table_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.key_column_usage kcu
JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND kcu.table_name IN ('books', 'authors')
  AND kcu.column_name = 'created_by';

-- 4. VERIFY INDEXES
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE indexname IN ('idx_books_created_by', 'idx_authors_created_by');

-- 5. TEST SAMPLE QUERIES
-- Show a few books with their creators
SELECT 
  id,
  title,
  created_by,
  created_at
FROM public.books 
WHERE created_by IS NOT NULL
LIMIT 5;

-- Show a few authors with their creators
SELECT 
  id,
  name,
  created_by,
  created_at
FROM public.authors 
WHERE created_by IS NOT NULL
LIMIT 5;

-- 6. VERIFY COMMENTS
SELECT 
  table_name,
  column_name,
  col_description(
    (table_name || '.' || column_name)::regclass, 
    ordinal_position
  ) as comment
FROM information_schema.columns 
WHERE table_name IN ('books', 'authors') 
  AND column_name = 'created_by'; 