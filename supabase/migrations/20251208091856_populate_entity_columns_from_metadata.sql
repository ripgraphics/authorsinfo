-- Migration: Populate entity_id and entity_type_id columns from metadata and parent albums
-- This fixes the issue where entity info was stored in metadata JSONB instead of actual columns
-- Date: 2025-12-08

-- Step 1: Update album_images.entity_id from parent photo_albums.entity_id
-- For records where entity_id is NULL, get it from the parent album
UPDATE album_images ai
SET entity_id = pa.entity_id
FROM photo_albums pa
WHERE ai.album_id = pa.id
  AND ai.entity_id IS NULL
  AND pa.entity_id IS NOT NULL;

-- Step 2: Update album_images.entity_id from metadata.entity_id (fallback)
-- For records where entity_id is still NULL, try to get it from metadata
UPDATE album_images
SET entity_id = (metadata->>'entity_id')::uuid
WHERE entity_id IS NULL
  AND metadata->>'entity_id' IS NOT NULL
  AND (metadata->>'entity_id')::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 3: Clean metadata - Remove entity-related fields, keep only file metadata
-- Remove entity_id, entity_type, album_purpose from metadata
-- Keep: file_size, mime_type, original_filename, uploaded_at, upload_method, added_via
UPDATE album_images
SET metadata = jsonb_build_object(
  'file_size', COALESCE(metadata->>'file_size', NULL),
  'mime_type', COALESCE(metadata->>'mime_type', NULL),
  'original_filename', COALESCE(metadata->>'original_filename', NULL),
  'uploaded_at', COALESCE(metadata->>'uploaded_at', NULL),
  'upload_method', COALESCE(metadata->>'upload_method', NULL),
  'added_via', COALESCE(metadata->>'added_via', NULL),
  'aspect_ratio', COALESCE(metadata->>'aspect_ratio', NULL)
)
WHERE metadata IS NOT NULL
  AND (
    metadata ? 'entity_id' 
    OR metadata ? 'entity_type' 
    OR metadata ? 'album_purpose'
  );

-- Step 4: Also clean images table metadata (remove entity info, keep file info)
UPDATE images
SET metadata = jsonb_build_object(
  'file_size', COALESCE(metadata->>'file_size', NULL),
  'mime_type', COALESCE(metadata->>'mime_type', NULL),
  'original_filename', COALESCE(metadata->>'original_filename', NULL),
  'upload_timestamp', COALESCE(metadata->>'upload_timestamp', NULL),
  'upload_method', COALESCE(metadata->>'upload_method', NULL),
  'uploaded_via', COALESCE(metadata->>'uploaded_via', NULL),
  'content_type', COALESCE(metadata->>'content_type', NULL),
  'cloudinary_public_id', COALESCE(metadata->>'cloudinary_public_id', NULL)
)
WHERE metadata IS NOT NULL
  AND (
    metadata ? 'entity_id' 
    OR metadata ? 'entity_type' 
    OR metadata ? 'album_purpose'
  );

-- Step 5: Update photo_albums metadata to remove entity info (if any)
-- Keep only album-specific metadata like show_in_feed, privacy_level, etc.
UPDATE photo_albums
SET metadata = jsonb_build_object(
  'show_in_feed', COALESCE(metadata->>'show_in_feed', NULL),
  'privacy_level', COALESCE(metadata->>'privacy_level', NULL),
  'allowed_viewers', COALESCE(metadata->'allowed_viewers', '[]'::jsonb),
  'created_via', COALESCE(metadata->>'created_via', NULL),
  'total_images', COALESCE(metadata->>'total_images', NULL),
  'total_size', COALESCE(metadata->>'total_size', NULL),
  'last_modified', COALESCE(metadata->>'last_modified', NULL)
)
WHERE metadata IS NOT NULL
  AND metadata ? 'entity_id';

-- Note: entity_type_id column will remain NULL for now
-- This can be populated later if there's an entity_types lookup table
-- The entity_type string in photo_albums.entity_type is sufficient for queries

-- Verification query (commented out - run manually to verify)
-- SELECT 
--   COUNT(*) as total_records,
--   COUNT(entity_id) as records_with_entity_id,
--   COUNT(*) FILTER (WHERE entity_id IS NULL) as records_without_entity_id
-- FROM album_images;

