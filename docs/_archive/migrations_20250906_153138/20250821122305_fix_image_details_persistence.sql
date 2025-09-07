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
        description = NEW.description
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

-- Step 4: Create a function to sync album_image details back to images
CREATE OR REPLACE FUNCTION sync_album_image_details_to_images()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the corresponding image record
    UPDATE "public"."images"
    SET 
        alt_text = NEW.alt_text,
        description = NEW.description
    WHERE id = NEW.image_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to automatically sync when album_images table is updated
DROP TRIGGER IF EXISTS trigger_sync_album_image_details ON "public"."album_images";
CREATE TRIGGER trigger_sync_album_image_details
    AFTER UPDATE OF alt_text, description ON "public"."album_images"
    FOR EACH ROW
    EXECUTE FUNCTION sync_album_image_details_to_images();

-- Step 6: Add performance indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_album_images_alt_text ON "public"."album_images" (alt_text);
CREATE INDEX IF NOT EXISTS idx_album_images_description ON "public"."album_images" (description);

-- Step 7: Add a comment explaining the purpose
COMMENT ON COLUMN "public"."album_images"."alt_text" IS 'Synchronized alt_text from images table for consistent data access';
COMMENT ON COLUMN "public"."album_images"."description" IS 'Synchronized description from images table for consistent data access';
