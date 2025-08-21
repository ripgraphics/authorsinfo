-- Comprehensive Photo Album System Verification
-- Run this against your current database to see the exact state

-- 1. Check if photo_albums table exists and its structure
SELECT 
  'PHOTO_ALBUMS_TABLE_CHECK' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'photo_albums' AND table_schema = 'public') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status,
  'photo_albums table' as description;

-- 2. Get complete photo_albums table structure
SELECT 
  'PHOTO_ALBUMS_COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name IN ('id', 'name', 'owner_id', 'entity_id', 'entity_type') THEN 'CRITICAL'
    WHEN column_name IN ('is_public', 'created_at', 'updated_at') THEN 'IMPORTANT'
    WHEN column_name = 'album_type' THEN 'MISSING_CRITICAL'
    ELSE 'NORMAL'
  END as importance
FROM information_schema.columns 
WHERE table_name = 'photo_albums' 
  AND table_schema = 'public'
ORDER BY 
  CASE 
    WHEN column_name IN ('id', 'name', 'owner_id', 'entity_id', 'entity_type') THEN 1
    WHEN column_name IN ('is_public', 'created_at', 'updated_at') THEN 2
    WHEN column_name = 'album_type' THEN 0
    ELSE 3
  END,
  ordinal_position;

-- 3. Check if album_type column exists (this is the critical missing piece)
SELECT 
  'ALBUM_TYPE_COLUMN_CHECK' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'photo_albums' 
        AND column_name = 'album_type' 
        AND table_schema = 'public'
    ) THEN 'EXISTS' 
    ELSE 'MISSING - THIS IS THE ROOT CAUSE OF THE ERROR' 
  END as status,
  'album_type column in photo_albums table' as description;

-- 4. Check album_images table structure
SELECT 
  'ALBUM_IMAGES_TABLE_CHECK' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'album_images' AND table_schema = 'public') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status,
  'album_images table' as description;

-- 5. Get album_images table columns
SELECT 
  'ALBUM_IMAGES_COLUMNS' as check_type,
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

-- 6. Check images table structure
SELECT 
  'IMAGES_TABLE_CHECK' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'images' AND table_schema = 'public') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status,
  'images table' as description;

-- 7. Get images table columns
SELECT 
  'IMAGES_COLUMNS' as check_type,
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

-- 8. Check current data in photo_albums
SELECT 
  'PHOTO_ALBUMS_DATA_ANALYSIS' as check_type,
  COUNT(*) as total_albums,
  COUNT(CASE WHEN entity_id IS NOT NULL THEN 1 END) as albums_with_entity,
  COUNT(CASE WHEN entity_type IS NOT NULL THEN 1 END) as albums_with_entity_type,
  COUNT(CASE WHEN owner_id IS NOT NULL THEN 1 END) as albums_with_owner,
  COUNT(CASE WHEN is_public = true THEN 1 END) as public_albums,
  COUNT(CASE WHEN is_public = false THEN 1 END) as private_albums,
  COUNT(CASE WHEN metadata IS NOT NULL THEN 1 END) as albums_with_metadata
FROM photo_albums;

-- 9. Check entity types currently in use
SELECT 
  'ENTITY_TYPES_IN_USE' as check_type,
  entity_type,
  COUNT(*) as album_count
FROM photo_albums 
WHERE entity_type IS NOT NULL 
GROUP BY entity_type 
ORDER BY album_count DESC;

-- 10. Check metadata patterns for album categorization
SELECT 
  'METADATA_ANALYSIS' as check_type,
  CASE 
    WHEN metadata IS NULL THEN 'NULL'
    WHEN metadata = '{}' THEN 'EMPTY_OBJECT'
    WHEN metadata ? 'album_type' THEN 'HAS_ALBUM_TYPE'
    WHEN metadata ? 'created_from' THEN 'HAS_CREATED_FROM'
    WHEN metadata ? 'privacy_level' THEN 'HAS_PRIVACY_LEVEL'
    ELSE 'OTHER'
  END as metadata_pattern,
  COUNT(*) as count
FROM photo_albums 
GROUP BY metadata_pattern
ORDER BY count DESC;

-- 11. Check for any existing album_type references in metadata
SELECT 
  'METADATA_ALBUM_TYPE_CHECK' as check_type,
  metadata->>'album_type' as album_type_from_metadata,
  COUNT(*) as count
FROM photo_albums 
WHERE metadata ? 'album_type'
GROUP BY metadata->>'album_type'
ORDER BY count DESC;

-- 12. Check constraints on photo_albums table
SELECT 
  'PHOTO_ALBUMS_CONSTRAINTS' as check_type,
  constraint_name,
  constraint_type,
  CASE 
    WHEN constraint_name = 'entity_consistency' THEN 'IMPORTANT'
    WHEN constraint_name = 'valid_entity_type' THEN 'IMPORTANT'
    ELSE 'NORMAL'
  END as importance
FROM information_schema.table_constraints 
WHERE table_name = 'photo_albums' 
  AND table_schema = 'public'
ORDER BY 
  CASE 
    WHEN constraint_name IN ('entity_consistency', 'valid_entity_type') THEN 1
    ELSE 2
  END,
  constraint_name;

-- 13. Check indexes on photo_albums table
SELECT 
  'PHOTO_ALBUMS_INDEXES' as check_type,
  indexname,
  indexdef,
  CASE 
    WHEN indexname LIKE '%entity%' THEN 'IMPORTANT'
    WHEN indexname LIKE '%owner%' THEN 'IMPORTANT'
    ELSE 'NORMAL'
  END as importance
FROM pg_indexes 
WHERE tablename = 'photo_albums' 
  AND schemaname = 'public'
ORDER BY 
  CASE 
    WHEN indexname LIKE '%entity%' OR indexname LIKE '%owner%' THEN 1
    ELSE 2
  END,
  indexname;

-- 14. Check foreign key relationships
SELECT 
  'FOREIGN_KEY_CHECK' as check_type,
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
  AND tc.table_name IN ('photo_albums', 'album_images', 'images')
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 15. Sample data from photo_albums to understand current structure
SELECT 
  'SAMPLE_DATA' as check_type,
  id,
  name,
  entity_type,
  entity_id,
  owner_id,
  is_public,
  created_at,
  metadata
FROM photo_albums 
LIMIT 5;

-- 16. Check if there are any albums that might be missing critical fields
SELECT 
  'MISSING_FIELDS_CHECK' as check_type,
  COUNT(*) as albums_missing_owner_id,
  COUNT(CASE WHEN entity_id IS NOT NULL AND entity_type IS NULL THEN 1 END) as albums_missing_entity_type,
  COUNT(CASE WHEN entity_id IS NULL AND entity_type IS NOT NULL THEN 1 END) as albums_missing_entity_id
FROM photo_albums 
WHERE owner_id IS NULL 
   OR (entity_id IS NOT NULL AND entity_type IS NULL)
   OR (entity_id IS NULL AND entity_type IS NOT NULL);

-- 17. Summary of all critical issues
SELECT 
  'CRITICAL_ISSUES_SUMMARY' as check_type,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'photo_albums' AND column_name = 'album_type' AND table_schema = 'public') 
    THEN 'MISSING_ALBUM_TYPE_COLUMN - CRITICAL ERROR'
    ELSE 'ALBUM_TYPE_COLUMN_EXISTS'
  END as album_type_status,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'photo_albums' AND table_schema = 'public') 
    THEN 'MISSING_PHOTO_ALBUMS_TABLE - CRITICAL ERROR'
    ELSE 'PHOTO_ALBUMS_TABLE_EXISTS'
  END as photo_albums_status,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'album_images' AND table_schema = 'public') 
    THEN 'MISSING_ALBUM_IMAGES_TABLE - CRITICAL ERROR'
    ELSE 'ALBUM_IMAGES_TABLE_EXISTS'
  END as album_images_status,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'images' AND table_schema = 'public') 
    THEN 'MISSING_IMAGES_TABLE - CRITICAL ERROR'
    ELSE 'IMAGES_TABLE_EXISTS'
  END as images_status;
