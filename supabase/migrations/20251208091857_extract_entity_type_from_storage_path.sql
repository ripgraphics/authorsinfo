-- Migration: Extract entity_type from storage_path when missing
-- This uses the storage_path column in images table to determine entity_type
-- Date: 2025-12-08

-- Step 1: Update photo_albums.entity_type from storage_path for albums that need it
-- Extract entity_type from images.storage_path via album_images join
UPDATE photo_albums pa
SET entity_type = CASE
  -- Check storage_path patterns to determine entity type
  WHEN EXISTS (
    SELECT 1 FROM album_images ai
    JOIN images i ON ai.image_id = i.id
    WHERE ai.album_id = pa.id
    AND i.storage_path LIKE '%book_%'
  ) THEN 'book'
  WHEN EXISTS (
    SELECT 1 FROM album_images ai
    JOIN images i ON ai.image_id = i.id
    WHERE ai.album_id = pa.id
    AND i.storage_path LIKE '%author_%'
  ) THEN 'author'
  WHEN EXISTS (
    SELECT 1 FROM album_images ai
    JOIN images i ON ai.image_id = i.id
    WHERE ai.album_id = pa.id
    AND i.storage_path LIKE '%publisher_%'
  ) THEN 'publisher'
  WHEN EXISTS (
    SELECT 1 FROM album_images ai
    JOIN images i ON ai.image_id = i.id
    WHERE ai.album_id = pa.id
    AND i.storage_path LIKE '%event_%'
  ) THEN 'event'
  WHEN EXISTS (
    SELECT 1 FROM album_images ai
    JOIN images i ON ai.image_id = i.id
    WHERE ai.album_id = pa.id
    AND (i.storage_path LIKE '%user_%' OR i.storage_path LIKE '%user_photos%' OR i.storage_path LIKE '%user_album%')
  ) THEN 'user'
  ELSE pa.entity_type
END
WHERE pa.entity_type IS NULL
  AND EXISTS (
    SELECT 1 FROM album_images ai
    JOIN images i ON ai.image_id = i.id
    WHERE ai.album_id = pa.id
    AND i.storage_path IS NOT NULL
  );

-- Step 2: Update album_images.entity_id from photo_albums if still NULL
-- This ensures entity_id is populated even if previous migration missed it
UPDATE album_images ai
SET entity_id = pa.entity_id
FROM photo_albums pa
WHERE ai.album_id = pa.id
  AND ai.entity_id IS NULL
  AND pa.entity_id IS NOT NULL;

-- Verification query (commented out - run manually to verify)
-- SELECT 
--   COUNT(*) as total_records,
--   COUNT(entity_id) as records_with_entity_id,
--   COUNT(entity_type_id) as records_with_entity_type_id,
--   COUNT(*) FILTER (WHERE entity_id IS NULL) as records_without_entity_id,
--   COUNT(*) FILTER (WHERE entity_type_id IS NULL) as records_without_entity_type_id
-- FROM album_images;

