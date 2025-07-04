-- Fix Function Search Path Mutable Warnings
-- This script adds SET search_path = public to functions that have role mutable search_path
-- Based on the info.txt file analysis

-- 1. populate_dewey_decimal_classifications function
CREATE OR REPLACE FUNCTION public.populate_dewey_decimal_classifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert major Dewey Decimal categories (simplified version)
    INSERT INTO dewey_decimal_classifications (code, description, level) VALUES
    ('000', 'Computer science, information & general works', 1),
    ('100', 'Philosophy & psychology', 1),
    ('200', 'Religion', 1),
    ('300', 'Social sciences', 1),
    ('400', 'Language', 1),
    ('500', 'Pure Science', 1),
    ('600', 'Technology', 1),
    ('700', 'Arts & recreation', 1),
    ('800', 'Literature', 1),
    ('900', 'History & geography', 1)
    ON CONFLICT (code) DO NOTHING;
END;
$$;

-- 2. extract_book_dimensions function
CREATE OR REPLACE FUNCTION public.extract_book_dimensions(book_uuid uuid, dimensions_json jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    width_val NUMERIC;
    height_val NUMERIC;
    depth_val NUMERIC;
    weight_val NUMERIC;
    unit_val TEXT;
BEGIN
    -- Extract dimensions from JSON
    width_val := (dimensions_json->>'width')::NUMERIC;
    height_val := (dimensions_json->>'height')::NUMERIC;
    depth_val := (dimensions_json->>'depth')::NUMERIC;
    weight_val := (dimensions_json->>'weight')::NUMERIC;
    unit_val := dimensions_json->>'unit';
    
    -- Insert or update book dimensions
    INSERT INTO book_dimensions (
        book_id, width, height, depth, weight, unit, source
    ) VALUES (
        book_uuid, width_val, height_val, depth_val, weight_val, unit_val, 'isbndb'
    ) ON CONFLICT (book_id) DO UPDATE SET
        width = EXCLUDED.width,
        height = EXCLUDED.height,
        depth = EXCLUDED.depth,
        weight = EXCLUDED.weight,
        unit = EXCLUDED.unit,
        updated_at = NOW();
END;
$$;

-- 3. process_dewey_decimal_classifications function
CREATE OR REPLACE FUNCTION public.process_dewey_decimal_classifications(book_uuid uuid, dewey_array text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    dewey_code TEXT;
    dewey_id UUID;
BEGIN
    IF dewey_array IS NULL OR array_length(dewey_array, 1) IS NULL THEN
        RETURN;
    END IF;
    
    -- Clear existing classifications for this book
    DELETE FROM book_dewey_classifications WHERE book_id = book_uuid;
    
    -- Process each Dewey Decimal code
    FOREACH dewey_code IN ARRAY dewey_array
    LOOP
        -- Try to find existing classification
        SELECT id INTO dewey_id FROM dewey_decimal_classifications WHERE code = dewey_code;
        
        -- If not found, create a basic entry
        IF dewey_id IS NULL THEN
            INSERT INTO dewey_decimal_classifications (code, description, level)
            VALUES (dewey_code, 'Dewey Decimal Classification: ' || dewey_code, 1)
            RETURNING id INTO dewey_id;
        END IF;
        
        -- Link book to classification
        INSERT INTO book_dewey_classifications (book_id, dewey_id)
        VALUES (book_uuid, dewey_id);
    END LOOP;
END;
$$;

-- 4. process_other_isbns function
CREATE OR REPLACE FUNCTION public.process_other_isbns(book_uuid uuid, other_isbns_json jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    isbn_record JSONB;
    isbn_text TEXT;
    binding_type TEXT;
BEGIN
    IF other_isbns_json IS NULL OR jsonb_array_length(other_isbns_json) = 0 THEN
        RETURN;
    END IF;
    
    -- Clear existing ISBN variants for this book
    DELETE FROM book_isbn_variants WHERE book_id = book_uuid;
    
    -- Process each ISBN record
    FOR isbn_record IN SELECT * FROM jsonb_array_elements(other_isbns_json)
    LOOP
        isbn_text := isbn_record->>'isbn';
        binding_type := isbn_record->>'binding';
        
        -- Determine ISBN type
        INSERT INTO book_isbn_variants (
            book_id, isbn, isbn_type, binding_type, format_type
        ) VALUES (
            book_uuid,
            isbn_text,
            CASE 
                WHEN length(isbn_text) = 10 THEN 'isbn10'
                WHEN length(isbn_text) = 13 THEN 'isbn13'
                ELSE 'unknown'
            END,
            binding_type,
            'variant'
        );
    END LOOP;
END;
$$;

-- 5. process_related_books function
CREATE OR REPLACE FUNCTION public.process_related_books(book_uuid uuid, related_json jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    relation_type TEXT;
BEGIN
    IF related_json IS NULL THEN
        RETURN;
    END IF;
    
    relation_type := related_json->>'type';
    
    -- Store related book information
    INSERT INTO book_relations (
        book_id, relation_type, relation_source, relation_data
    ) VALUES (
        book_uuid, relation_type, 'isbndb', related_json
    ) ON CONFLICT (book_id, relation_type) DO UPDATE SET
        relation_data = EXCLUDED.relation_data,
        updated_at = NOW();
END;
$$;

-- 6. process_complete_isbndb_book_data function
CREATE OR REPLACE FUNCTION public.process_complete_isbndb_book_data(book_uuid uuid, isbndb_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    excerpt_text TEXT;
    reviews_array JSONB;
    review_record JSONB;
    dewey_array TEXT[];
    dimensions_json JSONB;
    other_isbns_json JSONB;
    related_json JSONB;
BEGIN
    -- Extract data from ISBNdb response
    excerpt_text := isbndb_data->>'excerpt';
    reviews_array := isbndb_data->'reviews';
    dewey_array := ARRAY(SELECT jsonb_array_elements_text(isbndb_data->'dewey_decimal'));
    dimensions_json := isbndb_data->'dimensions_structured';
    other_isbns_json := isbndb_data->'other_isbns';
    related_json := isbndb_data->'related';
    
    -- Process excerpt
    IF excerpt_text IS NOT NULL AND length(trim(excerpt_text)) > 0 THEN
        INSERT INTO book_excerpts (book_id, excerpt_text, excerpt_type, excerpt_source)
        VALUES (book_uuid, excerpt_text, 'isbndb', 'isbndb')
        ON CONFLICT (book_id, excerpt_type) DO UPDATE SET
            excerpt_text = EXCLUDED.excerpt_text,
            updated_at = NOW();
    END IF;
    
    -- Process reviews
    IF reviews_array IS NOT NULL AND jsonb_array_length(reviews_array) > 0 THEN
        -- Clear existing reviews
        DELETE FROM book_reviews_isbndb WHERE book_id = book_uuid;
        
        -- Insert new reviews
        FOR review_record IN SELECT * FROM jsonb_array_elements(reviews_array)
        LOOP
            INSERT INTO book_reviews_isbndb (book_id, review_text, review_source)
            VALUES (book_uuid, review_record::TEXT, 'isbndb');
        END LOOP;
    END IF;
    
    -- Process Dewey Decimal classifications
    PERFORM process_dewey_decimal_classifications(book_uuid, dewey_array);
    
    -- Process structured dimensions
    PERFORM extract_book_dimensions(book_uuid, dimensions_json);
    
    -- Process other ISBNs
    PERFORM process_other_isbns(book_uuid, other_isbns_json);
    
    -- Process related books
    PERFORM process_related_books(book_uuid, related_json);
    
    -- Update book record with metadata
    UPDATE books SET
        isbndb_last_updated = NOW(),
        isbndb_data_version = '2.6.0',
        raw_isbndb_data = isbndb_data
    WHERE id = book_uuid;
END;
$$;

-- 7. handle_public_album_creation function
CREATE OR REPLACE FUNCTION public.handle_public_album_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- When a public album is created, create a feed entry
    IF NEW.is_public = true AND OLD.is_public = false THEN
        INSERT INTO feed_entries (
            user_id, 
            activity_type, 
            entity_type, 
            entity_id, 
            visibility,
            metadata
        ) VALUES (
            NEW.owner_id,
            'album_created',
            'photo_album',
            NEW.id::text,
            'public',
            jsonb_build_object('album_name', NEW.name, 'album_id', NEW.id)
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- 8. handle_album_privacy_update function
CREATE OR REPLACE FUNCTION public.handle_album_privacy_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- When album privacy changes, update related feed entries
    IF OLD.is_public != NEW.is_public THEN
        IF NEW.is_public = true THEN
            -- Album became public, create feed entry
            INSERT INTO feed_entries (
                user_id, 
                activity_type, 
                entity_type, 
                entity_id, 
                visibility,
                metadata
            ) VALUES (
                NEW.owner_id,
                'album_made_public',
                'photo_album',
                NEW.id::text,
                'public',
                jsonb_build_object('album_name', NEW.name, 'album_id', NEW.id)
            );
        ELSE
            -- Album became private, remove public feed entries
            DELETE FROM feed_entries 
            WHERE entity_type = 'photo_album' 
            AND entity_id = NEW.id::text 
            AND visibility = 'public';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Verification
SELECT 'Function search path fixes applied successfully' as status; 