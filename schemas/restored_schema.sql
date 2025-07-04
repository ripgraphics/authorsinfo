

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    length_val DECIMAL;
    length_unit_val TEXT;
    width_val DECIMAL;
    width_unit_val TEXT;
    height_val DECIMAL;
    height_unit_val TEXT;
    weight_val DECIMAL;
    weight_unit_val TEXT;
BEGIN
    IF dimensions_json IS NULL THEN
        RETURN;
    END IF;
    
    -- Extract values safely
    length_val := (dimensions_json->'length'->>'value')::DECIMAL;
    length_unit_val := dimensions_json->'length'->>'unit';
    width_val := (dimensions_json->'width'->>'value')::DECIMAL;
    width_unit_val := dimensions_json->'width'->>'unit';
    height_val := (dimensions_json->'height'->>'value')::DECIMAL;
    height_unit_val := dimensions_json->'height'->>'unit';
    weight_val := (dimensions_json->'weight'->>'value')::DECIMAL;
    weight_unit_val := dimensions_json->'weight'->>'unit';
    
    -- Insert structured dimensions data
    INSERT INTO book_dimensions (
        book_id,
        length_value, length_unit,
        width_value, width_unit,
        height_value, height_unit,
        weight_value, weight_unit
    ) VALUES (
        book_uuid,
        length_val,
        length_unit_val,
        width_val,
        width_unit_val,
        height_val,
        height_unit_val,
        weight_val,
        weight_unit_val
    ) ON CONFLICT (book_id) DO UPDATE SET
        length_value = EXCLUDED.length_value,
        length_unit = EXCLUDED.length_unit,
        width_value = EXCLUDED.width_value,
        width_unit = EXCLUDED.width_unit,
        height_value = EXCLUDED.height_value,
        height_unit = EXCLUDED.height_unit,
        weight_value = EXCLUDED.weight_value,
        weight_unit = EXCLUDED.weight_unit,
        updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "user_id" "uuid", "activity_type" "text", "entity_type" "text", "entity_id" "text", "is_public" boolean, "metadata" "jsonb", "created_at" timestamp with time zone, "user_name" "text", "user_avatar_url" "text", "like_count" bigint, "comment_count" bigint, "is_liked" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ua.id,
        ua.user_id,
        ua.activity_type,
        ua.entity_type,
        ua.entity_id,
        ua.is_public,
        ua.metadata,
        ua.created_at,
        u.name as user_name,
        u.avatar_url as user_avatar_url,
        COALESCE(al.like_count, 0) as like_count,
        COALESCE(ac.comment_count, 0) as comment_count,
        COALESCE(ual.is_liked, false) as is_liked
    FROM user_activities ua
    JOIN users u ON ua.user_id = u.id
    LEFT JOIN (
        SELECT activity_id, COUNT(*) as like_count
        FROM activity_likes
        GROUP BY activity_id
    ) al ON ua.id = al.activity_id
    LEFT JOIN (
        SELECT activity_id, COUNT(*) as comment_count
        FROM activity_comments
        GROUP BY activity_id
    ) ac ON ua.id = ac.activity_id
    LEFT JOIN (
        SELECT activity_id, true as is_liked
        FROM activity_likes
        WHERE user_id = p_user_id
    ) ual ON ua.id = ual.activity_id
    WHERE (
        -- Public activities
        ua.is_public = true
        OR 
        -- User's own activities
        ua.user_id = p_user_id
        OR
        -- Friends' activities
        EXISTS (
            SELECT 1 FROM user_friends 
            WHERE (user_id = p_user_id AND friend_id = ua.user_id AND status = 'accepted')
            OR (friend_id = p_user_id AND user_id = ua.user_id AND status = 'accepted')
        )
    )
    ORDER BY ua.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_album_privacy_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If album is now public and should show in feed, create activity
    IF NEW.is_public = true AND 
       (NEW.metadata->>'show_in_feed' IS NULL OR (NEW.metadata->>'show_in_feed')::boolean = true) AND
       (OLD.is_public = false OR OLD.metadata->>'show_in_feed' = 'false') THEN
        
        INSERT INTO user_activities (
            user_id,
            activity_type,
            entity_type,
            entity_id,
            is_public,
            metadata
        ) VALUES (
            NEW.owner_id,
            'album_created',
            'photo_album',
            NEW.id,
            true,
            jsonb_build_object(
                'album_name', NEW.name,
                'album_description', NEW.description,
                'privacy_level', COALESCE(NEW.metadata->>'privacy_level', 'public')
            )
        );
    END IF;
    
    -- If album is no longer public, remove activity
    IF NEW.is_public = false OR (NEW.metadata->>'show_in_feed')::boolean = false THEN
        DELETE FROM user_activities 
        WHERE entity_type = 'photo_album' 
        AND entity_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_album_privacy_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_public_album_creation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only create feed activity if album is public and show_in_feed is true
    IF NEW.is_public = true AND 
       (NEW.metadata->>'show_in_feed' IS NULL OR (NEW.metadata->>'show_in_feed')::boolean = true) THEN
        
        INSERT INTO user_activities (
            user_id,
            activity_type,
            entity_type,
            entity_id,
            is_public,
            metadata
        ) VALUES (
            NEW.owner_id,
            'album_created',
            'photo_album',
            NEW.id,
            true,
            jsonb_build_object(
                'album_name', NEW.name,
                'album_description', NEW.description,
                'privacy_level', COALESCE(NEW.metadata->>'privacy_level', 'public')
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_public_album_creation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."populate_dewey_decimal_classifications"() RETURNS "void"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."populate_dewey_decimal_classifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_complete_isbndb_book_data"("book_uuid" "uuid", "isbndb_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."process_complete_isbndb_book_data"("book_uuid" "uuid", "isbndb_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_dewey_decimal_classifications"("book_uuid" "uuid", "dewey_array" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."process_dewey_decimal_classifications"("book_uuid" "uuid", "dewey_array" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_other_isbns"("book_uuid" "uuid", "other_isbns_json" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."process_other_isbns"("book_uuid" "uuid", "other_isbns_json" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_related_books"("book_uuid" "uuid", "related_json" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
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
        book_id, relation_type, relation_source
    ) VALUES (
        book_uuid, 
        COALESCE(relation_type, 'unknown'),
        'isbndb'
    ) ON CONFLICT (book_id, related_book_id, relation_type) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."process_related_books"("book_uuid" "uuid", "related_json" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."album_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "photo_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."album_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."authors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "biography" "text",
    "birth_date" "date",
    "death_date" "date",
    "nationality" "text",
    "image" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."authors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_author_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'author'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."book_author_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_dewey_classifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "dewey_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."book_dewey_classifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."book_dewey_classifications" IS 'Junction table linking books to Dewey Decimal classifications';



CREATE TABLE IF NOT EXISTS "public"."book_dimensions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "length_value" numeric(10,2),
    "length_unit" "text",
    "width_value" numeric(10,2),
    "width_unit" "text",
    "height_value" numeric(10,2),
    "height_unit" "text",
    "weight_value" numeric(10,2),
    "weight_unit" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."book_dimensions" OWNER TO "postgres";


COMMENT ON TABLE "public"."book_dimensions" IS 'Structured physical dimensions data for books';



CREATE TABLE IF NOT EXISTS "public"."book_excerpts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "excerpt_text" "text" NOT NULL,
    "excerpt_type" "text" DEFAULT 'isbndb'::"text",
    "excerpt_source" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."book_excerpts" OWNER TO "postgres";


COMMENT ON TABLE "public"."book_excerpts" IS 'Book excerpts and previews from various sources';



CREATE TABLE IF NOT EXISTS "public"."book_isbn_variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "isbn" "text" NOT NULL,
    "isbn_type" "text" NOT NULL,
    "binding_type" "text",
    "format_type" "text",
    "edition_info" "text",
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."book_isbn_variants" OWNER TO "postgres";


COMMENT ON TABLE "public"."book_isbn_variants" IS 'Different ISBNs for the same book (different formats/editions)';



CREATE TABLE IF NOT EXISTS "public"."book_publisher_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "publisher_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."book_publisher_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_relations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "related_book_id" "uuid",
    "relation_type" "text" NOT NULL,
    "relation_source" "text" DEFAULT 'isbndb'::"text",
    "relation_score" numeric(3,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."book_relations" OWNER TO "postgres";


COMMENT ON TABLE "public"."book_relations" IS 'Relationships between books (similar, sequel, etc.)';



CREATE TABLE IF NOT EXISTS "public"."book_reviews_isbndb" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "review_text" "text" NOT NULL,
    "review_source" "text",
    "review_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."book_reviews_isbndb" OWNER TO "postgres";


COMMENT ON TABLE "public"."book_reviews_isbndb" IS 'Professional reviews from ISBNdb';



CREATE TABLE IF NOT EXISTS "public"."book_subjects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."book_subjects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."books" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "title_long" "text",
    "isbn" "text",
    "isbn13" "text",
    "publisher" "text",
    "language" "text",
    "date_published" "date",
    "edition" "text",
    "pages" integer,
    "dimensions" "text",
    "overview" "text",
    "image" "text",
    "image_original" "text",
    "msrp" numeric(10,2),
    "excerpt" "text",
    "synopsis" "text",
    "binding" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "dewey_decimal" "text"[],
    "related_data" "jsonb",
    "other_isbns" "jsonb",
    "isbndb_last_updated" timestamp with time zone,
    "isbndb_data_version" "text",
    "raw_isbndb_data" "jsonb"
);


ALTER TABLE "public"."books" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."books_complete" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"text" AS "title",
    NULL::"text" AS "title_long",
    NULL::"text" AS "isbn",
    NULL::"text" AS "isbn13",
    NULL::"text" AS "publisher",
    NULL::"text" AS "language",
    NULL::"date" AS "date_published",
    NULL::"text" AS "edition",
    NULL::integer AS "pages",
    NULL::"text" AS "dimensions",
    NULL::"text" AS "overview",
    NULL::"text" AS "image",
    NULL::"text" AS "image_original",
    NULL::numeric(10,2) AS "msrp",
    NULL::"text" AS "excerpt",
    NULL::"text" AS "synopsis",
    NULL::"text" AS "binding",
    NULL::timestamp with time zone AS "created_at",
    NULL::timestamp with time zone AS "updated_at",
    NULL::"text"[] AS "dewey_decimal",
    NULL::"jsonb" AS "related_data",
    NULL::"jsonb" AS "other_isbns",
    NULL::timestamp with time zone AS "isbndb_last_updated",
    NULL::"text" AS "isbndb_data_version",
    NULL::"jsonb" AS "raw_isbndb_data",
    NULL::"text"[] AS "subjects",
    NULL::"text"[] AS "dewey_codes",
    NULL::"text"[] AS "dewey_descriptions",
    NULL::"text"[] AS "excerpts",
    NULL::"text"[] AS "reviews",
    NULL::"text"[] AS "isbn_variants",
    NULL::numeric(10,2) AS "length_value",
    NULL::"text" AS "length_unit",
    NULL::numeric(10,2) AS "width_value",
    NULL::"text" AS "width_unit",
    NULL::numeric(10,2) AS "height_value",
    NULL::"text" AS "height_unit",
    NULL::numeric(10,2) AS "weight_value",
    NULL::"text" AS "weight_unit";


ALTER TABLE "public"."books_complete" OWNER TO "postgres";


COMMENT ON VIEW "public"."books_complete" IS 'Comprehensive view of all book data including ISBNdb enrichments';



CREATE TABLE IF NOT EXISTS "public"."dewey_decimal_classifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "description" "text" NOT NULL,
    "parent_code" "text",
    "level" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dewey_decimal_classifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."dewey_decimal_classifications" IS 'Dewey Decimal Classification system';



CREATE TABLE IF NOT EXISTS "public"."isbndb_sync_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid",
    "sync_type" "text" NOT NULL,
    "sync_status" "text" NOT NULL,
    "records_processed" integer DEFAULT 0,
    "records_added" integer DEFAULT 0,
    "records_updated" integer DEFAULT 0,
    "records_skipped" integer DEFAULT 0,
    "error_message" "text",
    "sync_started_at" timestamp with time zone DEFAULT "now"(),
    "sync_completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."isbndb_sync_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."isbndb_sync_log" IS 'Log of ISBNdb data synchronization activities';



CREATE TABLE IF NOT EXISTS "public"."photo_albums" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "privacy" "text" DEFAULT 'public'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."photo_albums" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "album_id" "uuid",
    "url" "text" NOT NULL,
    "caption" "text",
    "privacy" "text" DEFAULT 'public'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."publishers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "website" "text",
    "founded_year" integer,
    "location" "text",
    "image" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."publishers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subjects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subjects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "is_public" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_friends" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friend_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"(),
    "responded_at" timestamp with time zone,
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_friends_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'declined'::"text", 'blocked'::"text"])))
);


ALTER TABLE "public"."user_friends" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_comments"
    ADD CONSTRAINT "activity_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_likes"
    ADD CONSTRAINT "activity_likes_activity_id_user_id_key" UNIQUE ("activity_id", "user_id");



ALTER TABLE ONLY "public"."activity_likes"
    ADD CONSTRAINT "activity_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."album_photos"
    ADD CONSTRAINT "album_photos_album_id_photo_id_key" UNIQUE ("album_id", "photo_id");



ALTER TABLE ONLY "public"."album_photos"
    ADD CONSTRAINT "album_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."authors"
    ADD CONSTRAINT "authors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_author_connections"
    ADD CONSTRAINT "book_author_connections_book_id_author_id_role_key" UNIQUE ("book_id", "author_id", "role");



ALTER TABLE ONLY "public"."book_author_connections"
    ADD CONSTRAINT "book_author_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_dewey_classifications"
    ADD CONSTRAINT "book_dewey_classifications_book_id_dewey_id_key" UNIQUE ("book_id", "dewey_id");



ALTER TABLE ONLY "public"."book_dewey_classifications"
    ADD CONSTRAINT "book_dewey_classifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_dimensions"
    ADD CONSTRAINT "book_dimensions_book_id_key" UNIQUE ("book_id");



ALTER TABLE ONLY "public"."book_dimensions"
    ADD CONSTRAINT "book_dimensions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_excerpts"
    ADD CONSTRAINT "book_excerpts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_isbn_variants"
    ADD CONSTRAINT "book_isbn_variants_book_id_isbn_key" UNIQUE ("book_id", "isbn");



ALTER TABLE ONLY "public"."book_isbn_variants"
    ADD CONSTRAINT "book_isbn_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_publisher_connections"
    ADD CONSTRAINT "book_publisher_connections_book_id_publisher_id_key" UNIQUE ("book_id", "publisher_id");



ALTER TABLE ONLY "public"."book_publisher_connections"
    ADD CONSTRAINT "book_publisher_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_relations"
    ADD CONSTRAINT "book_relations_book_id_related_book_id_relation_type_key" UNIQUE ("book_id", "related_book_id", "relation_type");



ALTER TABLE ONLY "public"."book_relations"
    ADD CONSTRAINT "book_relations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_reviews_isbndb"
    ADD CONSTRAINT "book_reviews_isbndb_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_subjects"
    ADD CONSTRAINT "book_subjects_book_id_subject_id_key" UNIQUE ("book_id", "subject_id");



ALTER TABLE ONLY "public"."book_subjects"
    ADD CONSTRAINT "book_subjects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_isbn13_key" UNIQUE ("isbn13");



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_isbn_key" UNIQUE ("isbn");



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dewey_decimal_classifications"
    ADD CONSTRAINT "dewey_decimal_classifications_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."dewey_decimal_classifications"
    ADD CONSTRAINT "dewey_decimal_classifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."isbndb_sync_log"
    ADD CONSTRAINT "isbndb_sync_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photo_albums"
    ADD CONSTRAINT "photo_albums_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."publishers"
    ADD CONSTRAINT "publishers_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."publishers"
    ADD CONSTRAINT "publishers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_activities"
    ADD CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_friends"
    ADD CONSTRAINT "user_friends_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_friends"
    ADD CONSTRAINT "user_friends_user_id_friend_id_key" UNIQUE ("user_id", "friend_id");



CREATE INDEX "idx_activity_comments_activity_id" ON "public"."activity_comments" USING "btree" ("activity_id");



CREATE INDEX "idx_activity_comments_user_id" ON "public"."activity_comments" USING "btree" ("user_id");



CREATE INDEX "idx_activity_likes_activity_id" ON "public"."activity_likes" USING "btree" ("activity_id");



CREATE INDEX "idx_activity_likes_user_id" ON "public"."activity_likes" USING "btree" ("user_id");



CREATE INDEX "idx_album_photos_album_id" ON "public"."album_photos" USING "btree" ("album_id");



CREATE INDEX "idx_album_photos_photo_id" ON "public"."album_photos" USING "btree" ("photo_id");



CREATE INDEX "idx_authors_name" ON "public"."authors" USING "btree" ("name");



CREATE INDEX "idx_book_author_connections_author_id" ON "public"."book_author_connections" USING "btree" ("author_id");



CREATE INDEX "idx_book_author_connections_book_id" ON "public"."book_author_connections" USING "btree" ("book_id");



CREATE INDEX "idx_book_dewey_classifications_book_id" ON "public"."book_dewey_classifications" USING "btree" ("book_id");



CREATE INDEX "idx_book_dewey_classifications_dewey_id" ON "public"."book_dewey_classifications" USING "btree" ("dewey_id");



CREATE INDEX "idx_book_dimensions_book_id" ON "public"."book_dimensions" USING "btree" ("book_id");



CREATE INDEX "idx_book_excerpts_book_id" ON "public"."book_excerpts" USING "btree" ("book_id");



CREATE INDEX "idx_book_excerpts_excerpt_text_fts" ON "public"."book_excerpts" USING "gin" ("to_tsvector"('"english"'::"regconfig", "excerpt_text"));



CREATE INDEX "idx_book_isbn_variants_book_id" ON "public"."book_isbn_variants" USING "btree" ("book_id");



CREATE INDEX "idx_book_isbn_variants_isbn" ON "public"."book_isbn_variants" USING "btree" ("isbn");



CREATE INDEX "idx_book_publisher_connections_book_id" ON "public"."book_publisher_connections" USING "btree" ("book_id");



CREATE INDEX "idx_book_publisher_connections_publisher_id" ON "public"."book_publisher_connections" USING "btree" ("publisher_id");



CREATE INDEX "idx_book_relations_book_id" ON "public"."book_relations" USING "btree" ("book_id");



CREATE INDEX "idx_book_relations_related_book_id" ON "public"."book_relations" USING "btree" ("related_book_id");



CREATE INDEX "idx_book_reviews_isbndb_book_id" ON "public"."book_reviews_isbndb" USING "btree" ("book_id");



CREATE INDEX "idx_book_subjects_book_id" ON "public"."book_subjects" USING "btree" ("book_id");



CREATE INDEX "idx_book_subjects_subject_id" ON "public"."book_subjects" USING "btree" ("subject_id");



CREATE INDEX "idx_books_isbn" ON "public"."books" USING "btree" ("isbn");



CREATE INDEX "idx_books_isbn13" ON "public"."books" USING "btree" ("isbn13");



CREATE INDEX "idx_books_isbndb_last_updated" ON "public"."books" USING "btree" ("isbndb_last_updated");



CREATE INDEX "idx_books_overview_fts" ON "public"."books" USING "gin" ("to_tsvector"('"english"'::"regconfig", "overview"));



CREATE INDEX "idx_books_raw_isbndb_data" ON "public"."books" USING "gin" ("raw_isbndb_data");



CREATE INDEX "idx_books_synopsis_fts" ON "public"."books" USING "gin" ("to_tsvector"('"english"'::"regconfig", "synopsis"));



CREATE INDEX "idx_books_title" ON "public"."books" USING "btree" ("title");



CREATE INDEX "idx_books_title_fts" ON "public"."books" USING "gin" ("to_tsvector"('"english"'::"regconfig", "title"));



CREATE INDEX "idx_books_title_long_fts" ON "public"."books" USING "gin" ("to_tsvector"('"english"'::"regconfig", "title_long"));



CREATE INDEX "idx_dewey_decimal_classifications_code" ON "public"."dewey_decimal_classifications" USING "btree" ("code");



CREATE INDEX "idx_dewey_decimal_classifications_parent_code" ON "public"."dewey_decimal_classifications" USING "btree" ("parent_code");



CREATE INDEX "idx_isbndb_sync_log_book_id" ON "public"."isbndb_sync_log" USING "btree" ("book_id");



CREATE INDEX "idx_isbndb_sync_log_sync_started_at" ON "public"."isbndb_sync_log" USING "btree" ("sync_started_at");



CREATE INDEX "idx_isbndb_sync_log_sync_status" ON "public"."isbndb_sync_log" USING "btree" ("sync_status");



CREATE INDEX "idx_photo_albums_user_id" ON "public"."photo_albums" USING "btree" ("user_id");



CREATE INDEX "idx_photos_album_id" ON "public"."photos" USING "btree" ("album_id");



CREATE INDEX "idx_photos_user_id" ON "public"."photos" USING "btree" ("user_id");



CREATE INDEX "idx_publishers_name" ON "public"."publishers" USING "btree" ("name");



CREATE INDEX "idx_subjects_name" ON "public"."subjects" USING "btree" ("name");



CREATE INDEX "idx_user_activities_created_at" ON "public"."user_activities" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_user_activities_entity" ON "public"."user_activities" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_user_activities_public" ON "public"."user_activities" USING "btree" ("is_public") WHERE ("is_public" = true);



CREATE INDEX "idx_user_activities_user_id" ON "public"."user_activities" USING "btree" ("user_id");



CREATE INDEX "idx_user_friends_friend_id" ON "public"."user_friends" USING "btree" ("friend_id");



CREATE INDEX "idx_user_friends_status" ON "public"."user_friends" USING "btree" ("status");



CREATE INDEX "idx_user_friends_user_id" ON "public"."user_friends" USING "btree" ("user_id");



CREATE OR REPLACE VIEW "public"."books_complete" AS
 SELECT "b"."id",
    "b"."title",
    "b"."title_long",
    "b"."isbn",
    "b"."isbn13",
    "b"."publisher",
    "b"."language",
    "b"."date_published",
    "b"."edition",
    "b"."pages",
    "b"."dimensions",
    "b"."overview",
    "b"."image",
    "b"."image_original",
    "b"."msrp",
    "b"."excerpt",
    "b"."synopsis",
    "b"."binding",
    "b"."created_at",
    "b"."updated_at",
    "b"."dewey_decimal",
    "b"."related_data",
    "b"."other_isbns",
    "b"."isbndb_last_updated",
    "b"."isbndb_data_version",
    "b"."raw_isbndb_data",
    "array_agg"(DISTINCT "s"."name") FILTER (WHERE ("s"."name" IS NOT NULL)) AS "subjects",
    "array_agg"(DISTINCT "ddc"."code") FILTER (WHERE ("ddc"."code" IS NOT NULL)) AS "dewey_codes",
    "array_agg"(DISTINCT "ddc"."description") FILTER (WHERE ("ddc"."description" IS NOT NULL)) AS "dewey_descriptions",
    "array_agg"(DISTINCT "be"."excerpt_text") FILTER (WHERE ("be"."excerpt_text" IS NOT NULL)) AS "excerpts",
    "array_agg"(DISTINCT "bri"."review_text") FILTER (WHERE ("bri"."review_text" IS NOT NULL)) AS "reviews",
    "array_agg"(DISTINCT "biv"."isbn") FILTER (WHERE ("biv"."isbn" IS NOT NULL)) AS "isbn_variants",
    "bd"."length_value",
    "bd"."length_unit",
    "bd"."width_value",
    "bd"."width_unit",
    "bd"."height_value",
    "bd"."height_unit",
    "bd"."weight_value",
    "bd"."weight_unit"
   FROM (((((((("public"."books" "b"
     LEFT JOIN "public"."book_subjects" "bs" ON (("b"."id" = "bs"."book_id")))
     LEFT JOIN "public"."subjects" "s" ON (("bs"."subject_id" = "s"."id")))
     LEFT JOIN "public"."book_dewey_classifications" "bdc" ON (("b"."id" = "bdc"."book_id")))
     LEFT JOIN "public"."dewey_decimal_classifications" "ddc" ON (("bdc"."dewey_id" = "ddc"."id")))
     LEFT JOIN "public"."book_excerpts" "be" ON (("b"."id" = "be"."book_id")))
     LEFT JOIN "public"."book_reviews_isbndb" "bri" ON (("b"."id" = "bri"."book_id")))
     LEFT JOIN "public"."book_isbn_variants" "biv" ON (("b"."id" = "biv"."book_id")))
     LEFT JOIN "public"."book_dimensions" "bd" ON (("b"."id" = "bd"."book_id")))
  GROUP BY "b"."id", "bd"."length_value", "bd"."length_unit", "bd"."width_value", "bd"."width_unit", "bd"."height_value", "bd"."height_unit", "bd"."weight_value", "bd"."weight_unit";



CREATE OR REPLACE TRIGGER "trigger_album_privacy_update" AFTER UPDATE ON "public"."photo_albums" FOR EACH ROW EXECUTE FUNCTION "public"."handle_album_privacy_update"();



CREATE OR REPLACE TRIGGER "trigger_public_album_creation" AFTER INSERT ON "public"."photo_albums" FOR EACH ROW EXECUTE FUNCTION "public"."handle_public_album_creation"();



CREATE OR REPLACE TRIGGER "update_authors_updated_at" BEFORE UPDATE ON "public"."authors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_book_dimensions_updated_at" BEFORE UPDATE ON "public"."book_dimensions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_book_excerpts_updated_at" BEFORE UPDATE ON "public"."book_excerpts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_book_isbn_variants_updated_at" BEFORE UPDATE ON "public"."book_isbn_variants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_book_relations_updated_at" BEFORE UPDATE ON "public"."book_relations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_book_reviews_isbndb_updated_at" BEFORE UPDATE ON "public"."book_reviews_isbndb" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_books_updated_at" BEFORE UPDATE ON "public"."books" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_dewey_decimal_classifications_updated_at" BEFORE UPDATE ON "public"."dewey_decimal_classifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_photo_albums_updated_at" BEFORE UPDATE ON "public"."photo_albums" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_photos_updated_at" BEFORE UPDATE ON "public"."photos" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_publishers_updated_at" BEFORE UPDATE ON "public"."publishers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subjects_updated_at" BEFORE UPDATE ON "public"."subjects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."activity_comments"
    ADD CONSTRAINT "activity_comments_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."user_activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_comments"
    ADD CONSTRAINT "activity_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_likes"
    ADD CONSTRAINT "activity_likes_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."user_activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_likes"
    ADD CONSTRAINT "activity_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."album_photos"
    ADD CONSTRAINT "album_photos_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."album_photos"
    ADD CONSTRAINT "album_photos_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_author_connections"
    ADD CONSTRAINT "book_author_connections_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_author_connections"
    ADD CONSTRAINT "book_author_connections_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_dewey_classifications"
    ADD CONSTRAINT "book_dewey_classifications_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_dewey_classifications"
    ADD CONSTRAINT "book_dewey_classifications_dewey_id_fkey" FOREIGN KEY ("dewey_id") REFERENCES "public"."dewey_decimal_classifications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_dimensions"
    ADD CONSTRAINT "book_dimensions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_excerpts"
    ADD CONSTRAINT "book_excerpts_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_isbn_variants"
    ADD CONSTRAINT "book_isbn_variants_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_publisher_connections"
    ADD CONSTRAINT "book_publisher_connections_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_publisher_connections"
    ADD CONSTRAINT "book_publisher_connections_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_relations"
    ADD CONSTRAINT "book_relations_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_relations"
    ADD CONSTRAINT "book_relations_related_book_id_fkey" FOREIGN KEY ("related_book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_reviews_isbndb"
    ADD CONSTRAINT "book_reviews_isbndb_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_subjects"
    ADD CONSTRAINT "book_subjects_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_subjects"
    ADD CONSTRAINT "book_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dewey_decimal_classifications"
    ADD CONSTRAINT "dewey_decimal_classifications_parent_code_fkey" FOREIGN KEY ("parent_code") REFERENCES "public"."dewey_decimal_classifications"("code");



ALTER TABLE ONLY "public"."isbndb_sync_log"
    ADD CONSTRAINT "isbndb_sync_log_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photo_albums"
    ADD CONSTRAINT "photo_albums_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_activities"
    ADD CONSTRAINT "user_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_friends"
    ADD CONSTRAINT "user_friends_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_friends"
    ADD CONSTRAINT "user_friends_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_friends"
    ADD CONSTRAINT "user_friends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow admin access to book_dewey_classifications" ON "public"."book_dewey_classifications" USING (("auth"."role"() = 'admin'::"text"));



CREATE POLICY "Allow admin access to book_dimensions" ON "public"."book_dimensions" USING (("auth"."role"() = 'admin'::"text"));



CREATE POLICY "Allow admin access to book_excerpts" ON "public"."book_excerpts" USING (("auth"."role"() = 'admin'::"text"));



CREATE POLICY "Allow admin access to book_isbn_variants" ON "public"."book_isbn_variants" USING (("auth"."role"() = 'admin'::"text"));



CREATE POLICY "Allow admin access to book_relations" ON "public"."book_relations" USING (("auth"."role"() = 'admin'::"text"));



CREATE POLICY "Allow admin access to book_reviews_isbndb" ON "public"."book_reviews_isbndb" USING (("auth"."role"() = 'admin'::"text"));



CREATE POLICY "Allow admin access to dewey_decimal_classifications" ON "public"."dewey_decimal_classifications" USING (("auth"."role"() = 'admin'::"text"));



CREATE POLICY "Allow admin access to isbndb_sync_log" ON "public"."isbndb_sync_log" USING (("auth"."role"() = 'admin'::"text"));



CREATE POLICY "Allow authenticated users to manage album_photos" ON "public"."album_photos" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to manage authors" ON "public"."authors" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to manage book_author_connections" ON "public"."book_author_connections" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to manage book_publisher_connections" ON "public"."book_publisher_connections" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to manage book_subjects" ON "public"."book_subjects" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to manage books" ON "public"."books" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to manage photo_albums" ON "public"."photo_albums" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to manage photos" ON "public"."photos" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to manage publishers" ON "public"."publishers" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to manage subjects" ON "public"."subjects" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow public read access to album_photos" ON "public"."album_photos" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to authors" ON "public"."authors" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to book_author_connections" ON "public"."book_author_connections" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to book_publisher_connections" ON "public"."book_publisher_connections" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to book_subjects" ON "public"."book_subjects" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to books" ON "public"."books" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to photo_albums" ON "public"."photo_albums" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to photos" ON "public"."photos" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to publishers" ON "public"."publishers" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to subjects" ON "public"."subjects" FOR SELECT USING (true);



CREATE POLICY "Allow read access to book_dewey_classifications" ON "public"."book_dewey_classifications" FOR SELECT USING (true);



CREATE POLICY "Allow read access to book_dimensions" ON "public"."book_dimensions" FOR SELECT USING (true);



CREATE POLICY "Allow read access to book_excerpts" ON "public"."book_excerpts" FOR SELECT USING (true);



CREATE POLICY "Allow read access to book_isbn_variants" ON "public"."book_isbn_variants" FOR SELECT USING (true);



CREATE POLICY "Allow read access to book_relations" ON "public"."book_relations" FOR SELECT USING (true);



CREATE POLICY "Allow read access to book_reviews_isbndb" ON "public"."book_reviews_isbndb" FOR SELECT USING (true);



CREATE POLICY "Allow read access to dewey_decimal_classifications" ON "public"."dewey_decimal_classifications" FOR SELECT USING (true);



CREATE POLICY "Allow read access to isbndb_sync_log" ON "public"."isbndb_sync_log" FOR SELECT USING (true);



CREATE POLICY "Users can create comments" ON "public"."activity_comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create friend requests" ON "public"."user_friends" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



CREATE POLICY "Users can create their own activities" ON "public"."user_activities" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own likes" ON "public"."activity_likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own activities" ON "public"."user_activities" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own comments" ON "public"."activity_comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own friends" ON "public"."user_friends" FOR DELETE USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



CREATE POLICY "Users can delete their own likes" ON "public"."activity_likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own activities" ON "public"."user_activities" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own comments" ON "public"."activity_comments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own friends" ON "public"."user_friends" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



CREATE POLICY "Users can view activities from friends" ON "public"."user_activities" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_friends"
  WHERE ((("user_friends"."user_id" = "auth"."uid"()) AND ("user_friends"."friend_id" = "user_activities"."user_id") AND ("user_friends"."status" = 'accepted'::"text")) OR (("user_friends"."friend_id" = "auth"."uid"()) AND ("user_friends"."user_id" = "user_activities"."user_id") AND ("user_friends"."status" = 'accepted'::"text"))))));



CREATE POLICY "Users can view all likes" ON "public"."activity_likes" FOR SELECT USING (true);



CREATE POLICY "Users can view comments on friends' activities" ON "public"."activity_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."user_activities" "ua"
     JOIN "public"."user_friends" "uf" ON (((("uf"."user_id" = "auth"."uid"()) AND ("uf"."friend_id" = "ua"."user_id") AND ("uf"."status" = 'accepted'::"text")) OR (("uf"."friend_id" = "auth"."uid"()) AND ("uf"."user_id" = "ua"."user_id") AND ("uf"."status" = 'accepted'::"text")))))
  WHERE ("ua"."id" = "activity_comments"."activity_id"))));



CREATE POLICY "Users can view comments on public activities" ON "public"."activity_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_activities"
  WHERE (("user_activities"."id" = "activity_comments"."activity_id") AND ("user_activities"."is_public" = true)))));



CREATE POLICY "Users can view comments on their own activities" ON "public"."activity_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_activities"
  WHERE (("user_activities"."id" = "activity_comments"."activity_id") AND ("user_activities"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view public activities" ON "public"."user_activities" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Users can view their own activities" ON "public"."user_activities" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own friends" ON "public"."user_friends" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



ALTER TABLE "public"."activity_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."album_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."authors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_author_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_dewey_classifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_dimensions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_excerpts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_isbn_variants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_publisher_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_relations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_reviews_isbndb" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_subjects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."books" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dewey_decimal_classifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."isbndb_sync_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photo_albums" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."publishers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subjects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_friends" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_album_privacy_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_album_privacy_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_album_privacy_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_public_album_creation"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_public_album_creation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_public_album_creation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_dewey_decimal_classifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."populate_dewey_decimal_classifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_dewey_decimal_classifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_complete_isbndb_book_data"("book_uuid" "uuid", "isbndb_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_complete_isbndb_book_data"("book_uuid" "uuid", "isbndb_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_complete_isbndb_book_data"("book_uuid" "uuid", "isbndb_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_dewey_decimal_classifications"("book_uuid" "uuid", "dewey_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."process_dewey_decimal_classifications"("book_uuid" "uuid", "dewey_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_dewey_decimal_classifications"("book_uuid" "uuid", "dewey_array" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."process_other_isbns"("book_uuid" "uuid", "other_isbns_json" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_other_isbns"("book_uuid" "uuid", "other_isbns_json" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_other_isbns"("book_uuid" "uuid", "other_isbns_json" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_related_books"("book_uuid" "uuid", "related_json" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_related_books"("book_uuid" "uuid", "related_json" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_related_books"("book_uuid" "uuid", "related_json" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."activity_comments" TO "anon";
GRANT ALL ON TABLE "public"."activity_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_comments" TO "service_role";



GRANT ALL ON TABLE "public"."activity_likes" TO "anon";
GRANT ALL ON TABLE "public"."activity_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_likes" TO "service_role";



GRANT ALL ON TABLE "public"."album_photos" TO "anon";
GRANT ALL ON TABLE "public"."album_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."album_photos" TO "service_role";



GRANT ALL ON TABLE "public"."authors" TO "anon";
GRANT ALL ON TABLE "public"."authors" TO "authenticated";
GRANT ALL ON TABLE "public"."authors" TO "service_role";



GRANT ALL ON TABLE "public"."book_author_connections" TO "anon";
GRANT ALL ON TABLE "public"."book_author_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."book_author_connections" TO "service_role";



GRANT ALL ON TABLE "public"."book_dewey_classifications" TO "anon";
GRANT ALL ON TABLE "public"."book_dewey_classifications" TO "authenticated";
GRANT ALL ON TABLE "public"."book_dewey_classifications" TO "service_role";



GRANT ALL ON TABLE "public"."book_dimensions" TO "anon";
GRANT ALL ON TABLE "public"."book_dimensions" TO "authenticated";
GRANT ALL ON TABLE "public"."book_dimensions" TO "service_role";



GRANT ALL ON TABLE "public"."book_excerpts" TO "anon";
GRANT ALL ON TABLE "public"."book_excerpts" TO "authenticated";
GRANT ALL ON TABLE "public"."book_excerpts" TO "service_role";



GRANT ALL ON TABLE "public"."book_isbn_variants" TO "anon";
GRANT ALL ON TABLE "public"."book_isbn_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."book_isbn_variants" TO "service_role";



GRANT ALL ON TABLE "public"."book_publisher_connections" TO "anon";
GRANT ALL ON TABLE "public"."book_publisher_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."book_publisher_connections" TO "service_role";



GRANT ALL ON TABLE "public"."book_relations" TO "anon";
GRANT ALL ON TABLE "public"."book_relations" TO "authenticated";
GRANT ALL ON TABLE "public"."book_relations" TO "service_role";



GRANT ALL ON TABLE "public"."book_reviews_isbndb" TO "anon";
GRANT ALL ON TABLE "public"."book_reviews_isbndb" TO "authenticated";
GRANT ALL ON TABLE "public"."book_reviews_isbndb" TO "service_role";



GRANT ALL ON TABLE "public"."book_subjects" TO "anon";
GRANT ALL ON TABLE "public"."book_subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."book_subjects" TO "service_role";



GRANT ALL ON TABLE "public"."books" TO "anon";
GRANT ALL ON TABLE "public"."books" TO "authenticated";
GRANT ALL ON TABLE "public"."books" TO "service_role";



GRANT ALL ON TABLE "public"."books_complete" TO "anon";
GRANT ALL ON TABLE "public"."books_complete" TO "authenticated";
GRANT ALL ON TABLE "public"."books_complete" TO "service_role";



GRANT ALL ON TABLE "public"."dewey_decimal_classifications" TO "anon";
GRANT ALL ON TABLE "public"."dewey_decimal_classifications" TO "authenticated";
GRANT ALL ON TABLE "public"."dewey_decimal_classifications" TO "service_role";



GRANT ALL ON TABLE "public"."isbndb_sync_log" TO "anon";
GRANT ALL ON TABLE "public"."isbndb_sync_log" TO "authenticated";
GRANT ALL ON TABLE "public"."isbndb_sync_log" TO "service_role";



GRANT ALL ON TABLE "public"."photo_albums" TO "anon";
GRANT ALL ON TABLE "public"."photo_albums" TO "authenticated";
GRANT ALL ON TABLE "public"."photo_albums" TO "service_role";



GRANT ALL ON TABLE "public"."photos" TO "anon";
GRANT ALL ON TABLE "public"."photos" TO "authenticated";
GRANT ALL ON TABLE "public"."photos" TO "service_role";



GRANT ALL ON TABLE "public"."publishers" TO "anon";
GRANT ALL ON TABLE "public"."publishers" TO "authenticated";
GRANT ALL ON TABLE "public"."publishers" TO "service_role";



GRANT ALL ON TABLE "public"."subjects" TO "anon";
GRANT ALL ON TABLE "public"."subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."subjects" TO "service_role";



GRANT ALL ON TABLE "public"."user_activities" TO "anon";
GRANT ALL ON TABLE "public"."user_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activities" TO "service_role";



GRANT ALL ON TABLE "public"."user_friends" TO "anon";
GRANT ALL ON TABLE "public"."user_friends" TO "authenticated";
GRANT ALL ON TABLE "public"."user_friends" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
