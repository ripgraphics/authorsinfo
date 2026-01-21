-- Normalize Image Metadata Format Migration
-- Converts all book image metadata from camelCase to snake_case format
-- Created: 2026-01-20

-- Step 1: Normalize bookGallery to book_gallery
UPDATE images
SET metadata = jsonb_set(
    metadata,
    '{image_type}',
    '"book_gallery"',
    true
)
WHERE metadata->>'entity_type' = 'book'
  AND metadata->>'image_type' = 'bookGallery'
  AND deleted_at IS NULL;

-- Step 2: Normalize bookCoverFront to book_cover_front
UPDATE images
SET metadata = jsonb_set(
    metadata,
    '{image_type}',
    '"book_cover_front"',
    true
)
WHERE metadata->>'entity_type' = 'book'
  AND metadata->>'image_type' = 'bookCoverFront'
  AND deleted_at IS NULL;

-- Step 3: Normalize bookCoverBack to book_cover_back
UPDATE images
SET metadata = jsonb_set(
    metadata,
    '{image_type}',
    '"book_cover_back"',
    true
)
WHERE metadata->>'entity_type' = 'book'
  AND metadata->>'image_type' = 'bookCoverBack'
  AND deleted_at IS NULL;

-- Step 4: Log migration results
DO $$
DECLARE
    v_gallery_count INTEGER;
    v_front_count INTEGER;
    v_back_count INTEGER;
    v_total_count INTEGER;
BEGIN
    -- Count normalized images
    SELECT COUNT(*) INTO v_gallery_count
    FROM images
    WHERE metadata->>'entity_type' = 'book'
      AND metadata->>'image_type' = 'book_gallery'
      AND deleted_at IS NULL;
    
    SELECT COUNT(*) INTO v_front_count
    FROM images
    WHERE metadata->>'entity_type' = 'book'
      AND metadata->>'image_type' = 'book_cover_front'
      AND deleted_at IS NULL;
    
    SELECT COUNT(*) INTO v_back_count
    FROM images
    WHERE metadata->>'entity_type' = 'book'
      AND metadata->>'image_type' = 'book_cover_back'
      AND deleted_at IS NULL;
    
    v_total_count := v_gallery_count + v_front_count + v_back_count;
    
    -- Log results
    RAISE NOTICE 'Image metadata normalization completed:';
    RAISE NOTICE '  - book_gallery: % images', v_gallery_count;
    RAISE NOTICE '  - book_cover_front: % images', v_front_count;
    RAISE NOTICE '  - book_cover_back: % images', v_back_count;
    RAISE NOTICE '  - Total book images: %', v_total_count;
    
    -- Verify no camelCase formats remain
    IF EXISTS (
        SELECT 1
        FROM images
        WHERE metadata->>'entity_type' = 'book'
          AND metadata->>'image_type' IN ('bookGallery', 'bookCoverFront', 'bookCoverBack')
          AND deleted_at IS NULL
    ) THEN
        RAISE WARNING 'WARNING: Some images still have camelCase format!';
    ELSE
        RAISE NOTICE '✓ All book images now use snake_case format';
    END IF;
END $$;

-- Step 5: Create index for performance (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_images_book_metadata_type
ON images((metadata->>'entity_type'), (metadata->>'image_type'), deleted_at)
WHERE metadata->>'entity_type' = 'book'
  AND deleted_at IS NULL;

COMMENT ON INDEX idx_images_book_metadata_type IS 'Performance index for querying book images by metadata type';
