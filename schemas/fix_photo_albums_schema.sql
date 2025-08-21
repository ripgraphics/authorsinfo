-- Fix photo_albums table schema to support entity image management
-- This migration adds the missing album_type column and ensures proper constraints

-- Add album_type column to photo_albums table
ALTER TABLE "public"."photo_albums" 
ADD COLUMN IF NOT EXISTS "album_type" character varying(100);

-- Add comment for the new column
COMMENT ON COLUMN "public"."photo_albums"."album_type" IS 'Type of album (cover, avatar, header, gallery, etc.) for entity organization';

-- Create an index on album_type for better query performance
CREATE INDEX IF NOT EXISTS "idx_photo_albums_album_type" ON "public"."photo_albums" ("album_type");

-- Create a composite index for efficient entity album lookups
CREATE INDEX IF NOT EXISTS "idx_photo_albums_entity_lookup" ON "public"."photo_albums" ("entity_id", "entity_type", "album_type");

-- Update the entity_consistency constraint to include album_type
-- First drop the existing constraint
ALTER TABLE "public"."photo_albums" DROP CONSTRAINT IF EXISTS "entity_consistency";

-- Add the updated constraint that includes album_type
ALTER TABLE "public"."photo_albums" ADD CONSTRAINT "entity_consistency" 
CHECK (
  (("entity_type" IS NULL) AND ("entity_id" IS NULL) AND ("album_type" IS NULL)) 
  OR 
  (("entity_type" IS NOT NULL) AND ("entity_id" IS NOT NULL) AND ("album_type" IS NOT NULL))
);

-- Add a check constraint to ensure album_type values are valid
ALTER TABLE "public"."photo_albums" ADD CONSTRAINT "valid_album_type" 
CHECK (
  "album_type" IS NULL 
  OR 
  "album_type" IN (
    'book_cover_album',
    'book_avatar_album', 
    'book_entity_header_album',
    'book_gallery_album',
    'author_avatar_album',
    'author_entity_header_album',
    'author_gallery_album',
    'publisher_avatar_album',
    'publisher_entity_header_album',
    'publisher_gallery_album',
    'user_avatar_album',
    'user_gallery_album',
    'event_entity_header_album',
    'event_gallery_album'
  )
);

-- Update existing albums to have a default album_type if they don't have one
-- This ensures backward compatibility
UPDATE "public"."photo_albums" 
SET "album_type" = 'gallery_album' 
WHERE "album_type" IS NULL AND "entity_type" IS NOT NULL;

-- For albums without entity_type, set album_type to 'user_gallery_album'
UPDATE "public"."photo_albums" 
SET "album_type" = 'user_gallery_album' 
WHERE "album_type" IS NULL AND "entity_type" IS NULL;

-- Make album_type NOT NULL after setting default values
ALTER TABLE "public"."photo_albums" ALTER COLUMN "album_type" SET NOT NULL;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'photo_albums' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
