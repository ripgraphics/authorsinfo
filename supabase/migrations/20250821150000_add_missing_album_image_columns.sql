-- Add missing alt_text and description columns to album_images table
-- This migration adds the columns that the photo viewer needs to function properly

-- Step 1: Add the missing columns to album_images table
ALTER TABLE "public"."album_images" 
ADD COLUMN IF NOT EXISTS "alt_text" text,
ADD COLUMN IF NOT EXISTS "description" text;

-- Step 2: Add proper comments to clarify the purpose
COMMENT ON COLUMN "public"."album_images"."alt_text" IS 'Album-specific alt text for accessibility';
COMMENT ON COLUMN "public"."album_images"."description" IS 'Album-specific description of the image';

-- Step 3: Create proper indexes for performance
CREATE INDEX IF NOT EXISTS "idx_album_images_alt_text" ON "public"."album_images" ("alt_text");
CREATE INDEX IF NOT EXISTS "idx_album_images_description" ON "public"."album_images" ("description");

-- Step 4: Add constraint to ensure data integrity (if it doesn't exist)
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

-- Step 5: Verify the columns were added
DO $$
BEGIN
  -- Check if columns were added successfully
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'album_images' 
    AND column_name = 'alt_text'
  ) THEN
    RAISE EXCEPTION 'alt_text column was not added to album_images table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'album_images' 
    AND column_name = 'description'
  ) THEN
    RAISE EXCEPTION 'description column was not added to album_images table';
  END IF;
  
  RAISE NOTICE 'Successfully added alt_text and description columns to album_images table';
END $$;
