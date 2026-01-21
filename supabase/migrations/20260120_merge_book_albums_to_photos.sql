-- Migration: Merge legacy book albums into unified "Book Photos" album
-- Date: 2026-01-20

DO $$
DECLARE
    v_book RECORD;
    v_legacy_album RECORD;
    v_photos_album_id UUID;
BEGIN
    -- For each book with a legacy album
    FOR v_book IN 
        SELECT DISTINCT b.id AS book_id
        FROM books b
        JOIN photo_albums pa ON pa.entity_id = b.id AND pa.entity_type = 'book'
        WHERE pa.name LIKE 'Book Images - %'
    LOOP
        -- Find or create the "Book Photos" album for this book
        SELECT id INTO v_photos_album_id
        FROM photo_albums
        WHERE entity_id = v_book.book_id
          AND entity_type = 'book'
          AND name = 'Book Photos'
        LIMIT 1;

        IF v_photos_album_id IS NULL THEN
            INSERT INTO photo_albums (
                name, description, owner_id, entity_id, entity_type, is_public, created_at, updated_at
            ) VALUES (
                'Book Photos',
                'Unified album for all book cover and gallery images',
                (SELECT id FROM users WHERE role_id IN (SELECT id FROM roles WHERE name IN ('admin', 'super_admin')) LIMIT 1),
                v_book.book_id,
                'book',
                true,
                NOW(),
                NOW()
            ) RETURNING id INTO v_photos_album_id;
        END IF;

        -- For each legacy album for this book
        FOR v_legacy_album IN 
            SELECT * FROM photo_albums 
            WHERE entity_id = v_book.book_id 
              AND entity_type = 'book' 
              AND name LIKE 'Book Images - %'
        LOOP
            -- Move all images to the "Book Photos" album (avoid duplicates)
            INSERT INTO album_images (
                album_id, image_id, image_type, display_order, is_cover, is_featured, entity_id, entity_type_id, alt_text, created_at, updated_at
            )
            SELECT 
                v_photos_album_id,
                ai.image_id,
                ai.image_type,
                ai.display_order,
                ai.is_cover,
                ai.is_featured,
                ai.entity_id,
                ai.entity_type_id,
                ai.alt_text,
                ai.created_at,
                ai.updated_at
            FROM album_images ai
            WHERE ai.album_id = v_legacy_album.id
              AND NOT EXISTS (
                  SELECT 1 FROM album_images ai2 
                  WHERE ai2.album_id = v_photos_album_id AND ai2.image_id = ai.image_id
              );

            -- Delete legacy album images
            DELETE FROM album_images WHERE album_id = v_legacy_album.id;
            -- Delete legacy album
            DELETE FROM photo_albums WHERE id = v_legacy_album.id;
        END LOOP;
    END LOOP;
END $$;

-- Update triggers and logic to only create "Book Photos" going forward
DROP FUNCTION IF EXISTS create_book_album_on_insert CASCADE;
CREATE OR REPLACE FUNCTION create_book_album_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_album_id UUID;
    v_owner_id UUID;
BEGIN
    -- Only create the "Book Photos" album if it doesn't exist
    SELECT id INTO v_album_id
    FROM photo_albums
    WHERE entity_id = NEW.id
      AND entity_type = 'book'
      AND name = 'Book Photos'
    LIMIT 1;

    IF v_album_id IS NULL THEN
        v_owner_id := COALESCE(
            (SELECT id FROM users WHERE role_id IN (SELECT id FROM roles WHERE name IN ('admin', 'super_admin')) LIMIT 1),
            NEW.id::TEXT
        );
        INSERT INTO photo_albums (
            name, description, owner_id, entity_id, entity_type, is_public, created_at, updated_at
        ) VALUES (
            'Book Photos',
            'Unified album for all book cover and gallery images',
            v_owner_id,
            NEW.id,
            'book',
            true,
            NOW(),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_create_book_album ON books;
CREATE TRIGGER trigger_create_book_album
    AFTER INSERT ON books
    FOR EACH ROW
    EXECUTE FUNCTION create_book_album_on_insert();
