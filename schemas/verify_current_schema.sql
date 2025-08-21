-- Verify current database schema for entity image management
-- This script checks the actual state of tables and identifies any issues

-- Check photo_albums table structure
SELECT 
  'photo_albums' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  CASE 
    WHEN column_name IN ('id', 'name', 'owner_id', 'entity_id', 'entity_type', 'album_type') 
    THEN 'CRITICAL' 
    ELSE 'NORMAL' 
  END as importance
FROM information_schema.columns 
WHERE table_name = 'photo_albums' 
  AND table_schema = 'public'
ORDER BY 
  CASE 
    WHEN column_name IN ('id', 'name', 'owner_id', 'entity_id', 'entity_type', 'album_type') 
    THEN 1 
    ELSE 2 
  END,
  ordinal_position;

-- Check album_images table structure
SELECT 
  'album_images' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  CASE 
    WHEN column_name IN ('id', 'album_id', 'image_id', 'display_order') 
    THEN 'CRITICAL' 
    ELSE 'NORMAL' 
  END as importance
FROM information_schema.columns 
WHERE table_name = 'album_images' 
  AND table_schema = 'public'
ORDER BY 
  CASE 
    WHEN column_name IN ('id', 'album_id', 'image_id', 'display_order') 
    THEN 1 
    ELSE 2 
  END,
  ordinal_position;

-- Check images table structure
SELECT 
  'images' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  CASE 
    WHEN column_name IN ('id', 'url') 
    THEN 'CRITICAL' 
    ELSE 'NORMAL' 
  END as importance
FROM information_schema.columns 
WHERE table_name = 'images' 
  AND table_schema = 'public'
ORDER BY 
  CASE 
    WHEN column_name IN ('id', 'url') 
    THEN 1 
    ELSE 2 
  END,
  ordinal_position;

-- Check constraints on photo_albums table
SELECT 
  'photo_albums' as table_name,
  constraint_name,
  constraint_type,
  is_deferrable,
  is_deferred
FROM information_schema.table_constraints 
WHERE table_name = 'photo_albums' 
  AND table_schema = 'public'
ORDER BY constraint_name;

-- Check indexes on photo_albums table
SELECT 
  'photo_albums' as table_name,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'photo_albums' 
  AND schemaname = 'public'
ORDER BY indexname;

-- Check if album_type column exists and has data
SELECT 
  'photo_albums_album_type_check' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'photo_albums' 
        AND column_name = 'album_type' 
        AND table_schema = 'public'
    ) THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'photo_albums' 
        AND column_name = 'album_type' 
        AND table_schema = 'public'
    ) THEN 'Column exists' 
    ELSE 'Column missing - needs migration' 
  END as description;

-- Check sample data in photo_albums to understand current structure
SELECT 
  'photo_albums_sample_data' as check_name,
  COUNT(*) as total_albums,
  COUNT(CASE WHEN entity_id IS NOT NULL THEN 1 END) as albums_with_entity,
  COUNT(CASE WHEN entity_type IS NOT NULL THEN 1 END) as albums_with_entity_type,
  COUNT(CASE WHEN album_type IS NOT NULL THEN 1 END) as albums_with_album_type,
  COUNT(CASE WHEN owner_id IS NOT NULL THEN 1 END) as albums_with_owner
FROM photo_albums;

-- Check if there are any albums without required fields
SELECT 
  'photo_albums_missing_fields' as check_name,
  COUNT(*) as albums_missing_owner_id,
  COUNT(CASE WHEN entity_id IS NOT NULL AND entity_type IS NOT NULL AND album_type IS NULL THEN 1 END) as albums_missing_album_type
FROM photo_albums 
WHERE owner_id IS NULL 
   OR (entity_id IS NOT NULL AND entity_type IS NOT NULL AND album_type IS NULL);

-- Check foreign key relationships
SELECT 
  'foreign_key_check' as check_name,
  tc.table_name,
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
  AND tc.table_name IN ('photo_albums', 'album_images', 'images')
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
