-- Migration: Populate missing entity_id and entity_type_id from metadata and storage_path
-- This backfills any NULL values using existing metadata and storage_path data
-- Date: 2025-12-08

-- Step 1: Populate album_images.entity_id from metadata if still NULL
UPDATE album_images
SET entity_id = (metadata->>'entity_id')::uuid
WHERE entity_id IS NULL
  AND metadata->>'entity_id' IS NOT NULL
  AND (metadata->>'entity_id')::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 2: Populate album_images.entity_id from parent photo_albums if still NULL
UPDATE album_images ai
SET entity_id = pa.entity_id
FROM photo_albums pa
WHERE ai.album_id = pa.id
  AND ai.entity_id IS NULL
  AND pa.entity_id IS NOT NULL;

-- Step 3: Populate album_images.entity_type_id from metadata.entity_type
-- Map entity_type string to entity_type_id using entity_types table
UPDATE album_images ai
SET entity_type_id = et.id
FROM entity_types et
WHERE ai.entity_type_id IS NULL
  AND ai.metadata->>'entity_type' IS NOT NULL
  AND LOWER(TRIM(et.name)) = LOWER(TRIM(ai.metadata->>'entity_type'));

-- Step 4: Populate album_images.entity_type_id from storage_path
-- Extract entity_type from images.storage_path and map to entity_type_id
UPDATE album_images ai
SET entity_type_id = CASE
  -- Map storage_path patterns to entity_type_id
  WHEN EXISTS (
    SELECT 1 FROM images i 
    WHERE i.id = ai.image_id 
    AND i.storage_path LIKE '%book_%'
  ) THEN (SELECT id FROM entity_types WHERE LOWER(name) = 'book' LIMIT 1)
  WHEN EXISTS (
    SELECT 1 FROM images i 
    WHERE i.id = ai.image_id 
    AND i.storage_path LIKE '%author_%'
  ) THEN (SELECT id FROM entity_types WHERE LOWER(name) = 'author' LIMIT 1)
  WHEN EXISTS (
    SELECT 1 FROM images i 
    WHERE i.id = ai.image_id 
    AND i.storage_path LIKE '%publisher_%'
  ) THEN (SELECT id FROM entity_types WHERE LOWER(name) = 'publisher' LIMIT 1)
  WHEN EXISTS (
    SELECT 1 FROM images i 
    WHERE i.id = ai.image_id 
    AND i.storage_path LIKE '%event_%'
  ) THEN (SELECT id FROM entity_types WHERE LOWER(name) = 'event' LIMIT 1)
  WHEN EXISTS (
    SELECT 1 FROM images i 
    WHERE i.id = ai.image_id 
    AND (i.storage_path LIKE '%user_%' OR i.storage_path LIKE '%user_photos%' OR i.storage_path LIKE '%user_album%')
  ) THEN (SELECT id FROM entity_types WHERE LOWER(name) = 'user' LIMIT 1)
  ELSE NULL
END
WHERE ai.entity_type_id IS NULL
  AND EXISTS (
    SELECT 1 FROM images i 
    WHERE i.id = ai.image_id 
    AND i.storage_path IS NOT NULL
  );

-- Step 5: Populate album_images.entity_type_id from parent photo_albums.entity_type
-- If album has entity_type, use it to populate entity_type_id
UPDATE album_images ai
SET entity_type_id = et.id
FROM photo_albums pa
JOIN entity_types et ON LOWER(TRIM(et.name)) = LOWER(TRIM(pa.entity_type))
WHERE ai.album_id = pa.id
  AND ai.entity_type_id IS NULL
  AND pa.entity_type IS NOT NULL;

-- Verification query (commented out - run manually to verify)
-- SELECT 
--   COUNT(*) as total_records,
--   COUNT(entity_id) as records_with_entity_id,
--   COUNT(entity_type_id) as records_with_entity_type_id,
--   COUNT(*) FILTER (WHERE entity_id IS NULL) as records_without_entity_id,
--   COUNT(*) FILTER (WHERE entity_type_id IS NULL) as records_without_entity_type_id
-- FROM album_images;

