-- Comprehensive Current Database Schema Analysis
-- This script captures the complete current state of the database for analysis

-- 1. Get all tables in the public schema
SELECT 
  'ALL_TABLES' as analysis_type,
  schemaname,
  tablename,
  tableowner,
  tablespace,
  hasindexes,
  hasrules,
  hastriggers,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Get all columns for each table with detailed information
SELECT 
  'TABLE_COLUMNS' as analysis_type,
  t.table_name,
  c.column_name,
  c.data_type,
  c.character_maximum_length,
  c.numeric_precision,
  c.numeric_scale,
  c.is_nullable,
  c.column_default,
  c.ordinal_position,
  CASE 
    WHEN c.column_name IN ('id', 'created_at', 'updated_at', 'deleted_at') THEN 'SYSTEM'
    WHEN c.column_name LIKE '%_id' THEN 'FOREIGN_KEY'
    WHEN c.column_name LIKE '%_at' THEN 'TIMESTAMP'
    WHEN c.data_type = 'jsonb' THEN 'JSON_DATA'
    ELSE 'BUSINESS_DATA'
  END as column_category
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
  AND c.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- 3. Get all constraints for each table
SELECT 
  'TABLE_CONSTRAINTS' as analysis_type,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.is_deferrable,
  tc.is_deferred
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- 4. Get all indexes for each table
SELECT 
  'TABLE_INDEXES' as analysis_type,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. Get all sequences
SELECT 
  'SEQUENCES' as analysis_type,
  sequence_schema,
  sequence_name,
  data_type,
  start_value,
  minimum_value,
  maximum_value,
  increment
FROM information_schema.sequences 
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- 6. Get all views
SELECT 
  'VIEWS' as analysis_type,
  table_name,
  view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 7. Get all functions
SELECT 
  'FUNCTIONS' as analysis_type,
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  p.prosrc as source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- 8. Get all triggers
SELECT 
  'TRIGGERS' as analysis_type,
  trigger_schema,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 9. Get all foreign key relationships
SELECT 
  'FOREIGN_KEYS' as analysis_type,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 10. Get table sizes and row counts
SELECT 
  'TABLE_STATS' as analysis_type,
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
  (SELECT reltuples::bigint FROM pg_class WHERE relname = tablename) as estimated_rows
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 11. Get specific analysis for photo-related tables
SELECT 
  'PHOTO_SYSTEM_ANALYSIS' as analysis_type,
  'photo_albums' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name IN ('id', 'name', 'owner_id', 'entity_id', 'entity_type') THEN 'CRITICAL'
    WHEN column_name IN ('is_public', 'created_at', 'updated_at') THEN 'IMPORTANT'
    ELSE 'NORMAL'
  END as importance
FROM information_schema.columns 
WHERE table_name = 'photo_albums' 
  AND table_schema = 'public'
ORDER BY 
  CASE 
    WHEN column_name IN ('id', 'name', 'owner_id', 'entity_id', 'entity_type') THEN 1
    WHEN column_name IN ('is_public', 'created_at', 'updated_at') THEN 2
    ELSE 3
  END,
  ordinal_position;

-- 12. Get album_images table structure
SELECT 
  'ALBUM_IMAGES_ANALYSIS' as analysis_type,
  'album_images' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name IN ('id', 'album_id', 'image_id', 'display_order') THEN 'CRITICAL'
    WHEN column_name IN ('is_cover', 'is_featured', 'created_at') THEN 'IMPORTANT'
    ELSE 'NORMAL'
  END as importance
FROM information_schema.columns 
WHERE table_name = 'album_images' 
  AND table_schema = 'public'
ORDER BY 
  CASE 
    WHEN column_name IN ('id', 'album_id', 'image_id', 'display_order') THEN 1
    WHEN column_name IN ('is_cover', 'is_featured', 'created_at') THEN 2
    ELSE 3
  END,
  ordinal_position;

-- 13. Get images table structure
SELECT 
  'IMAGES_TABLE_ANALYSIS' as analysis_type,
  'images' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name IN ('id', 'url') THEN 'CRITICAL'
    WHEN column_name IN ('alt_text', 'caption', 'created_at') THEN 'IMPORTANT'
    ELSE 'NORMAL'
  END as importance
FROM information_schema.columns 
WHERE table_name = 'images' 
  AND table_schema = 'public'
ORDER BY 
  CASE 
    WHEN column_name IN ('id', 'url') THEN 1
    WHEN column_name IN ('alt_text', 'caption', 'created_at') THEN 2
    ELSE 3
  END,
  ordinal_position;

-- 14. Check for any missing critical columns in photo system
SELECT 
  'MISSING_COLUMNS_CHECK' as analysis_type,
  'photo_albums' as table_name,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'photo_albums' AND column_name = 'album_type' AND table_schema = 'public') THEN 'MISSING: album_type'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'photo_albums' AND column_name = 'owner_id' AND table_schema = 'public') THEN 'MISSING: owner_id'
    ELSE 'ALL_CRITICAL_COLUMNS_PRESENT'
  END as status
UNION ALL
SELECT 
  'MISSING_COLUMNS_CHECK' as analysis_type,
  'album_images' as table_name,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'album_images' AND column_name = 'album_id' AND table_schema = 'public') THEN 'MISSING: album_id'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'album_images' AND column_name = 'image_id' AND table_schema = 'public') THEN 'MISSING: image_id'
    ELSE 'ALL_CRITICAL_COLUMNS_PRESENT'
  END as status
UNION ALL
SELECT 
  'MISSING_COLUMNS_CHECK' as analysis_type,
  'images' as table_name,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'id' AND table_schema = 'public') THEN 'MISSING: id'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'images' AND column_name = 'url' AND table_schema = 'public') THEN 'MISSING: url'
    ELSE 'ALL_CRITICAL_COLUMNS_PRESENT'
  END as status;

-- 15. Sample data analysis for photo system tables
SELECT 
  'SAMPLE_DATA_ANALYSIS' as analysis_type,
  'photo_albums' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN entity_id IS NOT NULL THEN 1 END) as albums_with_entity,
  COUNT(CASE WHEN entity_type IS NOT NULL THEN 1 END) as albums_with_entity_type,
  COUNT(CASE WHEN owner_id IS NOT NULL THEN 1 END) as albums_with_owner,
  COUNT(CASE WHEN is_public = true THEN 1 END) as public_albums,
  COUNT(CASE WHEN is_public = false THEN 1 END) as private_albums
FROM photo_albums
UNION ALL
SELECT 
  'SAMPLE_DATA_ANALYSIS' as analysis_type,
  'album_images' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN album_id IS NOT NULL THEN 1 END) as records_with_album,
  COUNT(CASE WHEN image_id IS NOT NULL THEN 1 END) as records_with_image,
  COUNT(CASE WHEN is_cover = true THEN 1 END) as cover_images,
  COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_images,
  COUNT(CASE WHEN display_order > 0 THEN 1 END) as ordered_images
FROM album_images
UNION ALL
SELECT 
  'SAMPLE_DATA_ANALYSIS' as analysis_type,
  'images' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN url IS NOT NULL THEN 1 END) as images_with_url,
  COUNT(CASE WHEN alt_text IS NOT NULL THEN 1 END) as images_with_alt_text,
  COUNT(CASE WHEN caption IS NOT NULL THEN 1 END) as images_with_caption,
  COUNT(CASE WHEN metadata IS NOT NULL THEN 1 END) as images_with_metadata,
  COUNT(CASE WHEN created_at IS NOT NULL THEN 1 END) as images_with_timestamp
FROM images;
