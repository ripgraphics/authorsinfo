-- Remove the problematic sync triggers and functions
-- This fixes the data duplication issue between images and album_images tables

-- Step 1: Drop the sync triggers
DROP TRIGGER IF EXISTS "trigger_sync_image_details" ON "public"."images";
DROP TRIGGER IF EXISTS "trigger_sync_album_image_details" ON "public"."album_images";

-- Step 2: Drop the sync functions
DROP FUNCTION IF EXISTS "public"."sync_image_details_to_album_images"();
DROP FUNCTION IF EXISTS "public"."sync_album_image_details_to_images"();

-- Step 3: Ensure album_images table has the proper fields
-- (These should already exist from our previous migration)
-- ALTER TABLE "public"."album_images" ADD COLUMN IF NOT EXISTS "alt_text" text;
-- ALTER TABLE "public"."album_images" ADD COLUMN IF NOT EXISTS "description" text;

-- Step 4: Add proper comments to clarify the purpose
COMMENT ON COLUMN "public"."album_images"."alt_text" IS 'Album-specific alt text for accessibility';
COMMENT ON COLUMN "public"."album_images"."description" IS 'Album-specific description of the image';

-- Step 5: Create proper indexes for performance
CREATE INDEX IF NOT EXISTS "idx_album_images_alt_text" ON "public"."album_images" ("alt_text");
CREATE INDEX IF NOT EXISTS "idx_album_images_description" ON "public"."album_images" ("description");

-- Step 6: Add constraint to ensure data integrity (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_album_image_data' 
    AND conrelid = 'public.album_images'::regclass
  ) THEN
    ALTER TABLE "public"."album_images" 
    ADD CONSTRAINT "check_album_image_data" 
    CHECK (
      (alt_text IS NOT NULL AND length(trim(alt_text)) > 0) OR 
      (description IS NOT NULL AND length(trim(description)) > 0) OR
      (alt_text IS NULL AND description IS NULL)
    );
  END IF;
END $$;
