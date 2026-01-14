-- Enterprise Book Cover Carousel System Migration
-- Extends existing photo_albums and album_images system to support book cover types
-- Created: 2026-01-12

-- Step 1: Create enum type for book image types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'book_image_type') THEN
        CREATE TYPE book_image_type AS ENUM ('book_cover_front', 'book_cover_back', 'book_gallery');
    END IF;
END $$;

-- Step 2: Add image_type column to album_images table
-- This column distinguishes between front cover, back cover, and gallery images for books
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'album_images' 
        AND column_name = 'image_type'
    ) THEN
        ALTER TABLE album_images 
        ADD COLUMN image_type book_image_type DEFAULT 'book_gallery';
        
        -- Add comment for documentation
        COMMENT ON COLUMN album_images.image_type IS 'Type of book image: front cover, back cover, or gallery image. Only applies to book entity types.';
    END IF;
END $$;

-- Step 3: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_album_images_book_type 
    ON album_images(album_id, image_type, display_order)
    WHERE image_type IS NOT NULL;

-- Index for querying book images by entity
CREATE INDEX IF NOT EXISTS idx_album_images_book_entity 
    ON album_images(entity_id, entity_type_id, image_type, display_order)
    WHERE entity_id IS NOT NULL AND entity_type_id IS NOT NULL;

-- Step 4: Create helper function to get book images by type
CREATE OR REPLACE FUNCTION get_book_images(
    p_book_id UUID,
    p_image_type book_image_type DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    album_id UUID,
    image_id UUID,
    image_url TEXT,
    thumbnail_url TEXT,
    large_url TEXT,
    medium_url TEXT,
    alt_text TEXT,
    caption TEXT,
    image_type book_image_type,
    display_order INTEGER,
    is_cover BOOLEAN,
    is_featured BOOLEAN,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ai.id,
        ai.album_id,
        ai.image_id,
        i.url AS image_url,
        i.thumbnail_url,
        i.large_url,
        i.medium_url,
        COALESCE(ai.alt_text, i.alt_text) AS alt_text,
        COALESCE(ai.caption, i.caption) AS caption,
        ai.image_type,
        ai.display_order,
        ai.is_cover,
        ai.is_featured,
        ai.created_at
    FROM album_images ai
    INNER JOIN photo_albums pa ON ai.album_id = pa.id
    INNER JOIN images i ON ai.image_id = i.id
    WHERE pa.entity_id = p_book_id
        AND pa.entity_type = 'book'
        AND pa.name LIKE 'Book Images - %'  -- Only include the dedicated Book Images album, exclude "Header Cover Images" and "Avatar Images"
        AND (p_image_type IS NULL OR ai.image_type = p_image_type)
        AND i.deleted_at IS NULL
    ORDER BY 
        CASE ai.image_type
            WHEN 'book_cover_front' THEN 1
            WHEN 'book_cover_back' THEN 2
            WHEN 'book_gallery' THEN 3
        END,
        ai.display_order,
        ai.created_at;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION get_book_images IS 'Retrieves book images from album system, optionally filtered by image type (front cover, back cover, or gallery)';

-- Step 5: Create function to set book cover image (front or back)
CREATE OR REPLACE FUNCTION set_book_cover_image(
    p_book_id UUID,
    p_image_id UUID,
    p_cover_type book_image_type,
    p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_album_id UUID;
    v_entity_type_id UUID;
    v_existing_record_id UUID;
BEGIN
    -- Validate cover type (must be front or back, not gallery)
    IF p_cover_type NOT IN ('book_cover_front', 'book_cover_back') THEN
        RAISE EXCEPTION 'cover_type must be book_cover_front or book_cover_back';
    END IF;
    
    -- Get or create the dedicated "Book Images" album (not Header Cover Images or Avatar Images)
    SELECT id INTO v_album_id
    FROM photo_albums
    WHERE entity_id = p_book_id
        AND entity_type = 'book'
        AND name LIKE 'Book Images - %'
    LIMIT 1;
    
    -- If album doesn't exist, create it
    IF v_album_id IS NULL THEN
        -- Get book title for album name
        DECLARE
            v_book_title TEXT;
        BEGIN
            SELECT title INTO v_book_title FROM books WHERE id = p_book_id;
            
            INSERT INTO photo_albums (
                name,
                description,
                owner_id,
                entity_id,
                entity_type,
                is_public,
                created_at,
                updated_at
            ) VALUES (
                'Book Images - ' || COALESCE(v_book_title, 'Untitled Book'),
                'Album containing book cover and gallery images',
                p_user_id,
                p_book_id,
                'book',
                true,
                NOW(),
                NOW()
            )
            RETURNING id INTO v_album_id;
        END;
    END IF;
    
    -- Get entity_type_id for book (if entity_types table exists)
    BEGIN
        SELECT id INTO v_entity_type_id
        FROM entity_types
        WHERE name = 'book'
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        v_entity_type_id := NULL;
    END;
    
    -- Check if image already exists in album with this type
    SELECT ai.id INTO v_existing_record_id
    FROM album_images ai
    WHERE ai.album_id = v_album_id
        AND ai.image_type = p_cover_type
        AND ai.image_id = p_image_id
    LIMIT 1;
    
    -- If exists, update it to be the cover
    IF v_existing_record_id IS NOT NULL THEN
        UPDATE album_images
        SET 
            is_cover = true,
            display_order = CASE WHEN p_cover_type = 'book_cover_front' THEN 0 ELSE 1 END,
            updated_at = NOW()
        WHERE id = v_existing_record_id;
        
        -- Unset other covers of the same type
        UPDATE album_images
        SET is_cover = false
        WHERE album_id = v_album_id
            AND image_type = p_cover_type
            AND id != v_existing_record_id;
        
        RETURN v_existing_record_id;
    ELSE
        -- Insert new album_image record
        INSERT INTO album_images (
            album_id,
            image_id,
            image_type,
            display_order,
            is_cover,
            is_featured,
            entity_id,
            entity_type_id,
            alt_text,
            created_at,
            updated_at
        ) VALUES (
            v_album_id,
            p_image_id,
            p_cover_type,
            CASE WHEN p_cover_type = 'book_cover_front' THEN 0 ELSE 1 END,
            true,
            false,
            p_book_id,
            v_entity_type_id,
            NULL, -- Will be set from image or via update
            NOW(),
            NOW()
        )
        RETURNING id INTO v_existing_record_id;
        
        -- Unset other covers of the same type
        UPDATE album_images
        SET is_cover = false
        WHERE album_id = v_album_id
            AND image_type = p_cover_type
            AND id != v_existing_record_id;
        
        RETURN v_existing_record_id;
    END IF;
END;
$$;

COMMENT ON FUNCTION set_book_cover_image IS 'Sets a book cover image (front or back) in the album system. Automatically creates album if needed.';

-- Step 6: Create function to add gallery image
CREATE OR REPLACE FUNCTION add_book_gallery_image(
    p_book_id UUID,
    p_image_id UUID,
    p_user_id UUID,
    p_display_order INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_album_id UUID;
    v_entity_type_id UUID;
    v_next_order INTEGER;
    v_record_id UUID;
BEGIN
    -- Get or create the dedicated "Book Images" album (not Header Cover Images or Avatar Images)
    SELECT id INTO v_album_id
    FROM photo_albums
    WHERE entity_id = p_book_id
        AND entity_type = 'book'
        AND name LIKE 'Book Images - %'
    LIMIT 1;
    
    -- If album doesn't exist, create it
    IF v_album_id IS NULL THEN
        DECLARE
            v_book_title TEXT;
        BEGIN
            SELECT title INTO v_book_title FROM books WHERE id = p_book_id;
            
            INSERT INTO photo_albums (
                name,
                description,
                owner_id,
                entity_id,
                entity_type,
                is_public,
                created_at,
                updated_at
            ) VALUES (
                'Book Images - ' || COALESCE(v_book_title, 'Untitled Book'),
                'Album containing book cover and gallery images',
                p_user_id,
                p_book_id,
                'book',
                true,
                NOW(),
                NOW()
            )
            RETURNING id INTO v_album_id;
        END;
    END IF;
    
    -- Get entity_type_id for book (if exists)
    BEGIN
        SELECT id INTO v_entity_type_id
        FROM entity_types
        WHERE name = 'book'
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        v_entity_type_id := NULL;
    END;
    
    -- Determine display order
    IF p_display_order IS NULL THEN
        SELECT COALESCE(MAX(display_order), 0) + 1 INTO v_next_order
        FROM album_images
        WHERE album_id = v_album_id
            AND image_type = 'book_gallery';
    ELSE
        v_next_order := p_display_order;
    END IF;
    
    -- Insert gallery image
    INSERT INTO album_images (
        album_id,
        image_id,
        image_type,
        display_order,
        is_cover,
        is_featured,
        entity_id,
        entity_type_id,
        created_at,
        updated_at
    ) VALUES (
        v_album_id,
        p_image_id,
        'book_gallery',
        v_next_order,
        false,
        false,
        p_book_id,
        v_entity_type_id,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_record_id;
    
    RETURN v_record_id;
END;
$$;

COMMENT ON FUNCTION add_book_gallery_image IS 'Adds a gallery image to a book album. Automatically creates album if needed and assigns display order.';

-- Step 7: Create trigger to auto-create book album when book is created
-- Note: This assumes books are created via application, but we add trigger as safety net
CREATE OR REPLACE FUNCTION create_book_album_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_album_id UUID;
    v_owner_id UUID;
BEGIN
    -- Only create the dedicated "Book Images" album if it doesn't exist
    -- Don't create if Header Cover Images or Avatar Images albums exist
    SELECT id INTO v_album_id
    FROM photo_albums
    WHERE entity_id = NEW.id
        AND entity_type = 'book'
        AND name LIKE 'Book Images - %'
    LIMIT 1;
    
    IF v_album_id IS NULL THEN
        -- Try to get owner from author or publisher
        -- Default to system user if not available
        v_owner_id := COALESCE(
            (SELECT id FROM users WHERE role_id IN (SELECT id FROM roles WHERE name IN ('admin', 'super_admin')) LIMIT 1),
            NEW.id::TEXT -- Fallback to book ID as string
        );
        
        INSERT INTO photo_albums (
            name,
            description,
            owner_id,
            entity_id,
            entity_type,
            is_public,
            created_at,
            updated_at
        ) VALUES (
            'Book Images - ' || COALESCE(NEW.title, 'Untitled Book'),
            'Album containing book cover and gallery images',
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

-- Create trigger (only if it doesn't exist)
DROP TRIGGER IF EXISTS trigger_create_book_album ON books;
CREATE TRIGGER trigger_create_book_album
    AFTER INSERT ON books
    FOR EACH ROW
    EXECUTE FUNCTION create_book_album_on_insert();

-- Step 8: Migrate existing books.cover_image_id to album system
-- This migration script will link existing cover images to the album system
DO $$
DECLARE
    v_book RECORD;
    v_album_id UUID;
    v_entity_type_id UUID;
    v_admin_id UUID;
BEGIN
    -- Get admin user ID for album ownership
    SELECT id INTO v_admin_id
    FROM users
    WHERE role_id IN (SELECT id FROM roles WHERE name IN ('admin', 'super_admin'))
    LIMIT 1;
    
    -- If no admin, use first user or skip
    IF v_admin_id IS NULL THEN
        SELECT id INTO v_admin_id FROM users LIMIT 1;
    END IF;
    
    -- Get entity_type_id for book (if exists)
    BEGIN
        SELECT id INTO v_entity_type_id
        FROM entity_types
        WHERE name = 'book'
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        v_entity_type_id := NULL;
    END;
    
    -- Migrate each book with a cover_image_id
    FOR v_book IN 
        SELECT id, title, cover_image_id
        FROM books
        WHERE cover_image_id IS NOT NULL
    LOOP
        -- Get or create the dedicated "Book Images" album (not Header Cover Images or Avatar Images)
        SELECT id INTO v_album_id
        FROM photo_albums
        WHERE entity_id = v_book.id
            AND entity_type = 'book'
            AND name LIKE 'Book Images - %'
        LIMIT 1;
        
        IF v_album_id IS NULL THEN
            INSERT INTO photo_albums (
                name,
                description,
                owner_id,
                entity_id,
                entity_type,
                is_public,
                created_at,
                updated_at
            ) VALUES (
                'Book Images - ' || COALESCE(v_book.title, 'Untitled Book'),
                'Album containing book cover and gallery images',
                v_admin_id,
                v_book.id,
                'book',
                true,
                NOW(),
                NOW()
            )
            RETURNING id INTO v_album_id;
        END IF;
        
        -- Check if image already linked in album
        IF NOT EXISTS (
            SELECT 1 FROM album_images
            WHERE album_id = v_album_id
                AND image_id = v_book.cover_image_id
        ) THEN
            -- Link existing cover image as front cover
            INSERT INTO album_images (
                album_id,
                image_id,
                image_type,
                display_order,
                is_cover,
                is_featured,
                entity_id,
                entity_type_id,
                created_at,
                updated_at
            ) VALUES (
                v_album_id,
                v_book.cover_image_id,
                'book_cover_front',
                0,
                true,
                false,
                v_book.id,
                v_entity_type_id,
                NOW(),
                NOW()
            )
            ON CONFLICT DO NOTHING;
        ELSE
            -- Update existing record to be front cover
            UPDATE album_images
            SET 
                image_type = 'book_cover_front',
                display_order = 0,
                is_cover = true
            WHERE album_id = v_album_id
                AND image_id = v_book.cover_image_id;
        END IF;
    END LOOP;
END;
$$;

-- Step 9: Add RLS policies for book image access
-- Ensure users can read book images (public access for published books)
-- Only authors, publishers, and admins can modify

-- Note: RLS policies should already exist for photo_albums and album_images
-- We add specific policies for book images if needed

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_book_images(UUID, book_image_type) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION set_book_cover_image(UUID, UUID, book_image_type, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_book_gallery_image(UUID, UUID, UUID, INTEGER) TO authenticated;

-- Step 10: Add helpful comments
COMMENT ON TYPE book_image_type IS 'Enum type for book image categories: front cover, back cover, or gallery image';
COMMENT ON COLUMN album_images.image_type IS 'Type of book image (front cover, back cover, or gallery). Only applies when album is for a book entity.';
