-- Normalize Book Cover to Book Cover Front Migration
-- Converts all book_cover images to book_cover_front format
-- Created: 2026-01-20

-- Step 1: Normalize book_cover to book_cover_front
UPDATE images
SET metadata = jsonb_set(
    metadata,
    '{image_type}',
    '"book_cover_front"',
    true
)
WHERE metadata->>'entity_type' = 'book'
  AND metadata->>'image_type' = 'book_cover'
  AND deleted_at IS NULL;

-- Step 2: Log migration results
DO $$
DECLARE
    v_front_count INTEGER;
    v_back_count INTEGER;
    v_gallery_count INTEGER;
    v_total_count INTEGER;
    v_normalized_count INTEGER;
BEGIN
    -- Count normalized images (book_cover -> book_cover_front)
    SELECT COUNT(*) INTO v_normalized_count
    FROM images
    WHERE metadata->>'entity_type' = 'book'
      AND metadata->>'image_type' = 'book_cover'
      AND deleted_at IS NULL;
    
    -- Count all book image types after normalization
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
    
    SELECT COUNT(*) INTO v_gallery_count
    FROM images
    WHERE metadata->>'entity_type' = 'book'
      AND metadata->>'image_type' = 'book_gallery'
      AND deleted_at IS NULL;
    
    v_total_count := v_front_count + v_back_count + v_gallery_count;
    
    -- Log results
    RAISE NOTICE 'Image metadata normalization completed:';
    RAISE NOTICE '  - book_cover_front: % images (including normalized book_cover)', v_front_count;
    RAISE NOTICE '  - book_cover_back: % images', v_back_count;
    RAISE NOTICE '  - book_gallery: % images', v_gallery_count;
    RAISE NOTICE '  - Total book images: %', v_total_count;
    
    -- Verify no book_cover formats remain
    IF EXISTS (
        SELECT 1
        FROM images
        WHERE metadata->>'entity_type' = 'book'
          AND metadata->>'image_type' = 'book_cover'
          AND deleted_at IS NULL
    ) THEN
        RAISE WARNING 'WARNING: Some images still have book_cover format!';
    ELSE
        RAISE NOTICE '✓ All book_cover images normalized to book_cover_front format';
    END IF;
END $$;

COMMENT ON SCHEMA public IS 'All book cover images now use book_cover_front, book_cover_back, or book_gallery format';
