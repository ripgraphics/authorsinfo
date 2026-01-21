-- Add entity_id and image_type columns to images table
-- Created: 2026-01-20

-- Step 1: Add entity_id column
ALTER TABLE images
ADD COLUMN IF NOT EXISTS entity_id UUID;

-- Step 2: Add image_type column
ALTER TABLE images
ADD COLUMN IF NOT EXISTS image_type VARCHAR(50);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_images_entity_id_type
ON images(entity_id, image_type)
WHERE entity_id IS NOT NULL AND image_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_images_entity_id
ON images(entity_id)
WHERE entity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_images_image_type
ON images(image_type)
WHERE image_type IS NOT NULL;

-- Step 4: Migrate data from album_images and metadata
-- Update entity_id from album_images where it exists
UPDATE images i
SET entity_id = ai.entity_id
FROM album_images ai
WHERE i.id = ai.image_id
  AND ai.entity_id IS NOT NULL
  AND i.entity_id IS NULL;

-- Update image_type from album_images where it exists
UPDATE images i
SET image_type = ai.image_type::TEXT
FROM album_images ai
WHERE i.id = ai.image_id
  AND ai.image_type IS NOT NULL
  AND i.image_type IS NULL;

-- Update entity_id from metadata where it exists (fallback)
UPDATE images i
SET entity_id = (metadata->>'entity_id')::UUID
WHERE entity_id IS NULL
  AND metadata->>'entity_id' IS NOT NULL
  AND (metadata->>'entity_id')::UUID IS NOT NULL;

-- Update image_type from metadata where it exists (fallback)
UPDATE images i
SET image_type = metadata->>'image_type'
WHERE image_type IS NULL
  AND metadata->>'image_type' IS NOT NULL;

-- Step 5: Update books.cover_image_id images to have entity_id and image_type
UPDATE images i
SET entity_id = b.id,
    image_type = 'book_cover_front'
FROM books b
WHERE b.cover_image_id = i.id
  AND i.entity_id IS NULL;

-- Step 6: Add comments for documentation
COMMENT ON COLUMN images.entity_id IS 'Entity ID that this image belongs to (book, author, publisher, etc.)';
COMMENT ON COLUMN images.image_type IS 'Type of image: book_cover_front, book_cover_back, book_gallery, etc.';

-- Step 7: Log migration results
DO $$
DECLARE
    v_total_images INTEGER;
    v_with_entity_id INTEGER;
    v_with_image_type INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_images FROM images WHERE deleted_at IS NULL;
    SELECT COUNT(*) INTO v_with_entity_id FROM images WHERE entity_id IS NOT NULL AND deleted_at IS NULL;
    SELECT COUNT(*) INTO v_with_image_type FROM images WHERE image_type IS NOT NULL AND deleted_at IS NULL;

    RAISE NOTICE 'Migration completed:';
    RAISE NOTICE '  - Total images: %', v_total_images;
    RAISE NOTICE '  - Images with entity_id: %', v_with_entity_id;
    RAISE NOTICE '  - Images with image_type: %', v_with_image_type;
END $$;
