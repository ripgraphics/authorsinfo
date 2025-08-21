-- Fix Image Details Persistence Issue
-- This migration addresses the problem where alt_text and description are not persisting
-- when editing image details in the photo viewer

-- Step 1: Add missing fields to album_images table
ALTER TABLE "public"."album_images" 
ADD COLUMN IF NOT EXISTS "alt_text" text,
ADD COLUMN IF NOT EXISTS "description" text;

-- Step 2: Create a function to sync image details to album_images
CREATE OR REPLACE FUNCTION sync_image_details_to_album_images()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all album_images records that reference this image
    UPDATE "public"."album_images"
    SET 
        alt_text = NEW.alt_text,
        description = NEW.description,
        updated_at = NOW()
    WHERE image_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger to automatically sync when images table is updated
DROP TRIGGER IF EXISTS trigger_sync_image_details ON "public"."images";
CREATE TRIGGER trigger_sync_image_details
    AFTER UPDATE OF alt_text, description ON "public"."images"
    FOR EACH ROW
    EXECUTE FUNCTION sync_image_details_to_album_images();

-- Step 4: Create a function to sync album_images details back to images (for backward compatibility)
CREATE OR REPLACE FUNCTION sync_album_image_details_to_images()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the images table when album_images is updated
    UPDATE "public"."images"
    SET 
        alt_text = COALESCE(NEW.alt_text, images.alt_text),
        description = COALESCE(NEW.description, images.description),
        updated_at = NOW()
    WHERE id = NEW.image_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to sync when album_images table is updated
DROP TRIGGER IF EXISTS trigger_sync_album_image_details ON "public"."album_images";
CREATE TRIGGER trigger_sync_album_image_details
    AFTER UPDATE OF alt_text, description ON "public"."album_images"
    FOR EACH ROW
    EXECUTE FUNCTION sync_album_image_details_to_images();

-- Step 6: Populate existing album_images records with data from images table
UPDATE "public"."album_images" 
SET 
    alt_text = images.alt_text,
    description = images.description
FROM "public"."images"
WHERE "public"."album_images".image_id = "public"."images".id
AND ("public"."album_images".alt_text IS NULL OR "public"."album_images".description IS NULL);

-- Step 7: Add indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_album_images_alt_text" ON "public"."album_images" USING "btree" ("alt_text");
CREATE INDEX IF NOT EXISTS "idx_album_images_description" ON "public"."album_images" USING "btree" ("description");

-- Step 8: Update RLS policies to allow access to new fields
-- (The existing policies should already cover these fields)

-- Step 9: Add comments for documentation
COMMENT ON COLUMN "public"."album_images"."alt_text" IS 'Alt text for accessibility, synced from images table';
COMMENT ON COLUMN "public"."album_images"."description" IS 'Description of the image, synced from images table';

-- Step 10: Verify the changes
DO $$
BEGIN
    -- Check if columns were added
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
    
    -- Check if triggers were created
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_sync_image_details'
    ) THEN
        RAISE EXCEPTION 'trigger_sync_image_details was not created';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_sync_album_image_details'
    ) THEN
        RAISE EXCEPTION 'trigger_sync_album_image_details was not created';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully! Image details persistence issue has been fixed.';
END $$;
