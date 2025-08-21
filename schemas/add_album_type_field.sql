-- Add missing album_type field to photo_albums table
-- This enables proper entity image album management

-- Add album_type column with proper constraints
ALTER TABLE "public"."photo_albums" 
ADD COLUMN IF NOT EXISTS "album_type" character varying(50);

-- Add constraint to ensure album_type is valid
ALTER TABLE "public"."photo_albums" 
ADD CONSTRAINT IF NOT EXISTS "valid_album_type" 
CHECK (
  "album_type" IS NULL OR 
  "album_type" IN (
    'cover', 'avatar', 'entity_header', 'gallery', 'posts', 
    'book_cover', 'book_avatar', 'book_header', 'book_gallery',
    'author_avatar', 'author_header', 'author_gallery',
    'publisher_avatar', 'publisher_header', 'publisher_gallery',
    'user_avatar', 'user_header', 'user_gallery'
  )
);

-- Add index for better performance on album_type queries
CREATE INDEX IF NOT EXISTS "idx_photo_albums_album_type" 
ON "public"."photo_albums" ("album_type");

-- Add index for combined entity and album type lookups
CREATE INDEX IF NOT EXISTS "idx_photo_albums_entity_album_type" 
ON "public"."photo_albums" ("entity_id", "entity_type", "album_type");

-- Update existing albums to have proper album_type based on their names
UPDATE "public"."photo_albums" 
SET "album_type" = CASE 
  WHEN "name" LIKE '%Header Cover%' THEN 'entity_header'
  WHEN "name" LIKE '%Avatar%' THEN 'avatar'
  WHEN "name" LIKE '%Cover%' THEN 'cover'
  WHEN "name" LIKE '%Gallery%' THEN 'gallery'
  WHEN "name" LIKE '%Post%' THEN 'posts'
  ELSE 'gallery'
END
WHERE "album_type" IS NULL;

-- Add comment to document the new field
COMMENT ON COLUMN "public"."photo_albums"."album_type" IS 'Type of album (cover, avatar, entity_header, gallery, posts) for entity image management';
