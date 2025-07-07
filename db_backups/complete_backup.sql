

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






CREATE OR REPLACE FUNCTION "public"."check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- User can always access their own data
    IF target_user_id = requesting_user_id THEN
        RETURN true;
    END IF;

    -- Check if the target user has public reading profile
    IF EXISTS (
        SELECT 1 FROM "public"."user_privacy_settings" 
        WHERE user_id = target_user_id 
        AND allow_public_reading_profile = true
    ) THEN
        RETURN true;
    END IF;

    -- Check if requesting user is a friend and target allows friends
    IF EXISTS (
        SELECT 1 FROM "public"."user_privacy_settings" 
        WHERE user_id = target_user_id 
        AND allow_friends_to_see_reading = true
    ) AND EXISTS (
        SELECT 1 FROM "public"."user_friends" 
        WHERE (user_id = requesting_user_id AND friend_id = target_user_id) 
        OR (friend_id = requesting_user_id AND user_id = target_user_id)
    ) THEN
        RETURN true;
    END IF;

    -- Check if requesting user is a follower and target allows followers
    IF EXISTS (
        SELECT 1 FROM "public"."user_privacy_settings" 
        WHERE user_id = target_user_id 
        AND allow_followers_to_see_reading = true
    ) AND EXISTS (
        SELECT 1 FROM "public"."follows" 
        WHERE follower_id = requesting_user_id AND following_id = target_user_id
    ) THEN
        RETURN true;
    END IF;

    -- Check for custom permissions
    IF EXISTS (
        SELECT 1 FROM "public"."custom_permissions" 
        WHERE user_id = requesting_user_id 
        AND target_user_id = target_user_id 
        AND permission_type = 'view_reading_progress'
        AND (expires_at IS NULL OR expires_at > now())
    ) THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;


ALTER FUNCTION "public"."check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid") IS 'Check if a user can access another user''s reading progress';



CREATE OR REPLACE FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_privacy_audit_summary"("days_back" integer DEFAULT 30) RETURNS TABLE("action" "text", "count" bigint, "last_occurrence" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pal.action,
        COUNT(*) as count,
        MAX(pal.created_at) as last_occurrence
    FROM "public"."privacy_audit_log" pal
    WHERE pal.user_id = auth.uid()
    AND pal.created_at >= now() - (days_back || ' days')::interval
    GROUP BY pal.action
    ORDER BY count DESC;
END;
$$;


ALTER FUNCTION "public"."get_privacy_audit_summary"("days_back" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_privacy_audit_summary"("days_back" integer) IS 'Get summary of privacy audit actions for the current user';



CREATE OR REPLACE FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "user_id" "uuid", "activity_type" "text", "entity_type" "text", "entity_id" "text", "is_public" boolean, "metadata" "jsonb", "created_at" timestamp with time zone, "user_name" "text", "user_avatar_url" "text", "like_count" bigint, "comment_count" bigint, "is_liked" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Function implementation here
    RETURN QUERY SELECT * FROM public.activities WHERE user_id = p_user_id LIMIT p_limit OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_privacy_settings"("user_id_param" "uuid" DEFAULT "auth"."uid"()) RETURNS TABLE("default_privacy_level" "text", "allow_friends_to_see_reading" boolean, "allow_followers_to_see_reading" boolean, "allow_public_reading_profile" boolean, "show_reading_stats_publicly" boolean, "show_currently_reading_publicly" boolean, "show_reading_history_publicly" boolean, "show_reading_goals_publicly" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ups.default_privacy_level,
        ups.allow_friends_to_see_reading,
        ups.allow_followers_to_see_reading,
        ups.allow_public_reading_profile,
        ups.show_reading_stats_publicly,
        ups.show_currently_reading_publicly,
        ups.show_reading_history_publicly,
        ups.show_reading_goals_publicly
    FROM "public"."user_privacy_settings" ups
    WHERE ups.user_id = user_id_param;
END;
$$;


ALTER FUNCTION "public"."get_user_privacy_settings"("user_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."grant_reading_permission"("target_user_id" "uuid", "permission_type" "text" DEFAULT 'view_reading_progress'::"text", "expires_at" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Insert or update permission
    INSERT INTO "public"."custom_permissions" (user_id, target_user_id, permission_type, expires_at)
    VALUES (auth.uid(), target_user_id, permission_type, expires_at)
    ON CONFLICT (user_id, target_user_id, permission_type) 
    DO UPDATE SET 
        expires_at = EXCLUDED.expires_at,
        updated_at = now();

    -- Log the action
    INSERT INTO "public"."privacy_audit_log" (user_id, action, target_user_id, permission_type, new_value)
    VALUES (auth.uid(), 'grant_permission', target_user_id, permission_type, 
            jsonb_build_object('permission_type', permission_type, 'expires_at', expires_at));

    RETURN true;
END;
$$;


ALTER FUNCTION "public"."grant_reading_permission"("target_user_id" "uuid", "permission_type" "text", "expires_at" timestamp with time zone) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."grant_reading_permission"("target_user_id" "uuid", "permission_type" "text", "expires_at" timestamp with time zone) IS 'Grant custom permission to view reading progress';



CREATE OR REPLACE FUNCTION "public"."handle_album_privacy_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."handle_album_privacy_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_privacy_level_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update boolean flags based on privacy_level
    NEW.allow_friends := (NEW.privacy_level = 'friends');
    NEW.allow_followers := (NEW.privacy_level = 'followers');
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_privacy_level_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_public_album_creation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."handle_public_album_creation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_user_privacy_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Create default privacy settings for new users
    INSERT INTO "public"."user_privacy_settings" (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."initialize_user_privacy_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."populate_dewey_decimal_classifications"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."process_related_books"("book_uuid" "uuid", "related_json" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text" DEFAULT 'view_reading_progress'::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Delete permission
    DELETE FROM "public"."custom_permissions" 
    WHERE user_id = auth.uid() 
    AND target_user_id = target_user_id 
    AND permission_type = permission_type;

    -- Log the action
    INSERT INTO "public"."privacy_audit_log" (user_id, action, target_user_id, permission_type)
    VALUES (auth.uid(), 'revoke_permission', target_user_id, permission_type);

    RETURN true;
END;
$$;


ALTER FUNCTION "public"."revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text") IS 'Revoke custom permission to view reading progress';



CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_privacy_settings"("default_privacy_level" "text" DEFAULT NULL::"text", "allow_friends_to_see_reading" boolean DEFAULT NULL::boolean, "allow_followers_to_see_reading" boolean DEFAULT NULL::boolean, "allow_public_reading_profile" boolean DEFAULT NULL::boolean, "show_reading_stats_publicly" boolean DEFAULT NULL::boolean, "show_currently_reading_publicly" boolean DEFAULT NULL::boolean, "show_reading_history_publicly" boolean DEFAULT NULL::boolean, "show_reading_goals_publicly" boolean DEFAULT NULL::boolean) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    old_settings jsonb;
    new_settings jsonb;
BEGIN
    -- Get current settings
    SELECT to_jsonb(ups.*) INTO old_settings
    FROM "public"."user_privacy_settings" ups
    WHERE ups.user_id = auth.uid();

    -- Insert or update settings
    INSERT INTO "public"."user_privacy_settings" (
        user_id, default_privacy_level, allow_friends_to_see_reading, 
        allow_followers_to_see_reading, allow_public_reading_profile,
        show_reading_stats_publicly, show_currently_reading_publicly,
        show_reading_history_publicly, show_reading_goals_publicly
    )
    VALUES (
        auth.uid(),
        COALESCE(default_privacy_level, 'private'),
        COALESCE(allow_friends_to_see_reading, false),
        COALESCE(allow_followers_to_see_reading, false),
        COALESCE(allow_public_reading_profile, false),
        COALESCE(show_reading_stats_publicly, false),
        COALESCE(show_currently_reading_publicly, false),
        COALESCE(show_reading_history_publicly, false),
        COALESCE(show_reading_goals_publicly, false)
    )
    ON CONFLICT (user_id) DO UPDATE SET
        default_privacy_level = EXCLUDED.default_privacy_level,
        allow_friends_to_see_reading = EXCLUDED.allow_friends_to_see_reading,
        allow_followers_to_see_reading = EXCLUDED.allow_followers_to_see_reading,
        allow_public_reading_profile = EXCLUDED.allow_public_reading_profile,
        show_reading_stats_publicly = EXCLUDED.show_reading_stats_publicly,
        show_currently_reading_publicly = EXCLUDED.show_currently_reading_publicly,
        show_reading_history_publicly = EXCLUDED.show_reading_history_publicly,
        show_reading_goals_publicly = EXCLUDED.show_reading_goals_publicly,
        updated_at = now();

    -- Get new settings
    SELECT to_jsonb(ups.*) INTO new_settings
    FROM "public"."user_privacy_settings" ups
    WHERE ups.user_id = auth.uid();

    -- Log the action
    INSERT INTO "public"."privacy_audit_log" (user_id, action, old_value, new_value)
    VALUES (auth.uid(), 'update_privacy_settings', old_settings, new_settings);

    RETURN true;
END;
$$;


ALTER FUNCTION "public"."update_user_privacy_settings"("default_privacy_level" "text", "allow_friends_to_see_reading" boolean, "allow_followers_to_see_reading" boolean, "allow_public_reading_profile" boolean, "show_reading_stats_publicly" boolean, "show_currently_reading_publicly" boolean, "show_reading_history_publicly" boolean, "show_reading_goals_publicly" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_user_privacy_settings"("default_privacy_level" "text", "allow_friends_to_see_reading" boolean, "allow_followers_to_see_reading" boolean, "allow_public_reading_profile" boolean, "show_reading_stats_publicly" boolean, "show_currently_reading_publicly" boolean, "show_reading_history_publicly" boolean, "show_reading_goals_publicly" boolean) IS 'Update user privacy settings with audit logging';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "review_id" "uuid",
    "list_id" "uuid",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_profile_id" "uuid",
    "group_id" "uuid",
    "event_id" "uuid",
    "book_id" "uuid",
    "author_id" "uuid",
    "entity_type" "text",
    "entity_id" "uuid"
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


COMMENT ON TABLE "public"."activities" IS 'User activities for tracking engagement';



COMMENT ON COLUMN "public"."activities"."entity_type" IS 'Type of entity this activity relates to (book, author, event, etc.)';



COMMENT ON COLUMN "public"."activities"."entity_id" IS 'ID of the entity this activity relates to';



CREATE TABLE IF NOT EXISTS "public"."activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "target_type" "text",
    "target_id" "uuid",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."album_analytics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "views" integer DEFAULT 0,
    "unique_views" integer DEFAULT 0,
    "shares" integer DEFAULT 0,
    "likes" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."album_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."album_images" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "image_id" "uuid" NOT NULL,
    "display_order" integer NOT NULL,
    "is_cover" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."album_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."album_shares" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "shared_by" "uuid" NOT NULL,
    "shared_with" "uuid",
    "share_type" character varying(50) NOT NULL,
    "access_token" "uuid",
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."album_shares" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."authors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "bio" "text",
    "featured" boolean DEFAULT false,
    "birth_date" "date",
    "nationality" "text",
    "website" "text",
    "author_image_id" "uuid",
    "author_gallery_id" integer,
    "twitter_handle" "text",
    "facebook_handle" "text",
    "instagram_handle" "text",
    "goodreads_url" "text",
    "cover_image_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."authors" OWNER TO "postgres";


COMMENT ON TABLE "public"."authors" IS 'Book authors information';



CREATE TABLE IF NOT EXISTS "public"."binding_types" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying,
    "description" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."binding_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "blocked_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_authors" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid",
    "author_id" "uuid",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."book_authors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_club_books" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_club_id" "uuid",
    "book_id" "uuid",
    "status" character varying,
    "start_date" "date",
    "end_date" "date",
    "created_at" timestamp with time zone,
    "created_by" "uuid"
);


ALTER TABLE "public"."book_club_books" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_club_discussion_comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "discussion_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."book_club_discussion_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_club_discussions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_club_id" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "content" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_pinned" boolean DEFAULT false,
    "book_id" "uuid"
);


ALTER TABLE "public"."book_club_discussions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_club_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_club_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "role" character varying(50) DEFAULT 'member'::character varying
);


ALTER TABLE "public"."book_club_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_clubs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "cover_image_url" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_private" boolean DEFAULT false,
    "member_count" integer DEFAULT 0,
    "current_book_id" "uuid"
);


ALTER TABLE "public"."book_clubs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_genre_mappings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid",
    "genre_id" "uuid"
);


ALTER TABLE "public"."book_genre_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_genres" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."book_genres" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_id_mapping" (
    "old_id" integer NOT NULL,
    "new_id" "uuid" NOT NULL,
    "match_method" "text" NOT NULL
);


ALTER TABLE "public"."book_id_mapping" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_publishers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "publisher_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."book_publishers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_recommendations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "source_type" "text" NOT NULL,
    "score" double precision NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid",
    "source_book_id" "uuid"
);


ALTER TABLE "public"."book_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "review_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "contains_spoilers" boolean DEFAULT false,
    "group_id" "uuid",
    "visibility" "text" DEFAULT 'public'::"text" NOT NULL,
    "book_id" "uuid"
);


ALTER TABLE "public"."book_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_similarity_scores" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid",
    "similar_book_id" "uuid",
    "similarity_score" double precision,
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."book_similarity_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_subjects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid",
    "subject_id" "uuid",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."book_subjects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_tag_mappings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid",
    "tag_id" "uuid",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."book_tag_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."book_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_views" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "book_id" "uuid",
    "viewed_at" timestamp with time zone
);


ALTER TABLE "public"."book_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."books" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "isbn10" character varying,
    "isbn13" character varying,
    "title" character varying NOT NULL,
    "title_long" "text",
    "publisher_id" "uuid",
    "publication_date" "date",
    "binding" character varying,
    "pages" integer,
    "list_price" numeric,
    "language" character varying,
    "edition" character varying,
    "synopsis" "text",
    "overview" "text",
    "dimensions" character varying,
    "weight" numeric,
    "cover_image_id" "uuid",
    "original_image_url" "text",
    "author" character varying,
    "featured" boolean DEFAULT false NOT NULL,
    "book_gallery_img" "text"[],
    "average_rating" numeric DEFAULT 0,
    "review_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "author_id" "uuid",
    "binding_type_id" "uuid",
    "format_type_id" "uuid",
    "status_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."books" OWNER TO "postgres";


COMMENT ON TABLE "public"."books" IS 'Book catalog with metadata';



COMMENT ON COLUMN "public"."books"."isbn10" IS 'ISBN-10 identifier';



COMMENT ON COLUMN "public"."books"."isbn13" IS 'ISBN-13 identifier';



COMMENT ON COLUMN "public"."books"."title" IS 'Book title';



COMMENT ON COLUMN "public"."books"."publication_date" IS 'Book publication date';



CREATE TABLE IF NOT EXISTS "public"."carousel_images" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "carousel_name" character varying,
    "image_url" "text",
    "alt_text" character varying,
    "position" integer,
    "active" boolean
);


ALTER TABLE "public"."carousel_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feed_entry_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_hidden" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


COMMENT ON TABLE "public"."comments" IS 'Comments on feed entries';



COMMENT ON COLUMN "public"."comments"."user_id" IS 'User who made the comment';



COMMENT ON COLUMN "public"."comments"."feed_entry_id" IS 'Feed entry being commented on';



CREATE TABLE IF NOT EXISTS "public"."contact_info" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "website" "text",
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "country" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contact_info" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."countries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "phone_code" "text",
    "continent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."countries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "target_user_id" "uuid" NOT NULL,
    "permission_type" "text" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "custom_permissions_permission_type_check" CHECK (("permission_type" = ANY (ARRAY['view_reading_progress'::"text", 'view_reading_stats'::"text", 'view_reading_history'::"text"])))
);


ALTER TABLE "public"."custom_permissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."custom_permissions" IS 'Granular permissions for specific users to view reading progress';



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



CREATE TABLE IF NOT EXISTS "public"."discussion_comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "discussion_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."discussion_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discussions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "is_pinned" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "group_id" "uuid",
    "category_id" integer,
    "book_id" "uuid"
);


ALTER TABLE "public"."discussions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "views" integer DEFAULT 0,
    "unique_visitors" integer DEFAULT 0,
    "registrations" integer DEFAULT 0,
    "cancellations" integer DEFAULT 0,
    "shares" integer DEFAULT 0,
    "likes" integer DEFAULT 0,
    "comments" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "submitted_by" "uuid" NOT NULL,
    "approval_status" "text",
    "reviewer_id" "uuid",
    "review_notes" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_approvals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_books" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "feature_type" "text",
    "display_order" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid"
);


ALTER TABLE "public"."event_books" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_calendar_exports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "calendar_type" "text",
    "calendar_event_id" "text",
    "synced_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_calendar_exports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "parent_id" "uuid",
    "icon" "text",
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chat_room_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "is_hidden" boolean DEFAULT false,
    "hidden_by" "uuid",
    "hidden_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_chat_rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "is_moderated" boolean DEFAULT true,
    "moderator_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "requires_ticket" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_chat_rooms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "content" "text" NOT NULL,
    "is_pinned" boolean DEFAULT false,
    "is_hidden" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_creator_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "permission_level" "text",
    "can_create_paid_events" boolean DEFAULT false,
    "attendee_limit" integer DEFAULT 100,
    "requires_approval" boolean DEFAULT true,
    "approved_categories" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_creator_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_financials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "total_revenue" numeric DEFAULT 0,
    "total_fees" numeric DEFAULT 0,
    "total_taxes" numeric DEFAULT 0,
    "total_refunds" numeric DEFAULT 0,
    "net_revenue" numeric DEFAULT 0,
    "currency" "text" DEFAULT 'USD'::"text",
    "ticket_sales_breakdown" "jsonb",
    "payout_status" "text",
    "payout_date" timestamp with time zone,
    "payout_method" "text",
    "payout_reference" "text",
    "organizer_fees" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_financials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_interests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "interest_level" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_interests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_livestreams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "provider" "text",
    "stream_key" "text",
    "stream_url" "text" NOT NULL,
    "embed_code" "text",
    "is_active" boolean DEFAULT false,
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "recording_url" "text",
    "viewer_count" integer DEFAULT 0,
    "max_concurrent_viewers" integer DEFAULT 0,
    "requires_ticket" boolean DEFAULT true,
    "ticket_types" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_livestreams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "country" "text",
    "latitude" numeric,
    "longitude" numeric,
    "google_place_id" "text",
    "is_primary" boolean DEFAULT true,
    "venue_notes" "text",
    "accessibility_info" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_media" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "media_type" "text",
    "url" "text" NOT NULL,
    "thumbnail_url" "text",
    "title" "text",
    "description" "text",
    "file_size" integer,
    "file_type" "text",
    "duration" integer,
    "width" integer,
    "height" integer,
    "display_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_permission_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "request_reason" "text",
    "requested_level" "text",
    "status" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "admin_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_permission_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "question_type" "text",
    "is_required" boolean DEFAULT false,
    "options" "jsonb",
    "display_order" integer,
    "help_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "registration_status" "text",
    "registration_time" timestamp with time zone DEFAULT "now"(),
    "check_in_time" timestamp with time zone,
    "ticket_id" "text",
    "registration_source" "text",
    "additional_guests" integer DEFAULT 0,
    "guest_names" "jsonb",
    "answers" "jsonb",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "session_ids" "uuid"[] DEFAULT '{}'::"uuid"[]
);


ALTER TABLE "public"."event_registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_reminders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reminder_time" timestamp with time zone NOT NULL,
    "notification_sent" boolean DEFAULT false,
    "notification_time" timestamp with time zone,
    "reminder_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_reminders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "speaker_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "location_id" "uuid",
    "virtual_meeting_url" "text",
    "max_attendees" integer,
    "requires_separate_registration" boolean DEFAULT false,
    "session_materials" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "share_platform" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_shares" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_speakers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "bio" "text",
    "headshot_url" "text",
    "website" "text",
    "social_links" "jsonb",
    "presentation_title" "text",
    "presentation_description" "text",
    "speaker_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "session_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "author_id" "uuid"
);


ALTER TABLE "public"."event_speakers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_sponsors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "website_url" "text",
    "logo_url" "text",
    "sponsor_level" "text",
    "display_order" integer,
    "contribution_amount" numeric,
    "currency" "text" DEFAULT 'USD'::"text",
    "is_featured" boolean DEFAULT false,
    "benefits_description" "text",
    "contact_name" "text",
    "contact_email" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_sponsors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_staff" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text",
    "permissions" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_staff" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_surveys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "is_anonymous" boolean DEFAULT false,
    "requires_ticket" boolean DEFAULT true,
    "available_from" timestamp with time zone,
    "available_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_surveys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_tags" (
    "event_id" "uuid" NOT NULL,
    "tag_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "ip_address" "text",
    "viewed_at" timestamp with time zone DEFAULT "now"(),
    "user_agent" "text",
    "referrer" "text"
);


ALTER TABLE "public"."event_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_waitlists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "ticket_type_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "status" "text",
    "notification_sent_at" timestamp with time zone,
    "expiration_time" timestamp with time zone,
    "converted_to_registration_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_waitlists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text",
    "description" "text",
    "summary" "text",
    "event_category_id" "uuid",
    "type_id" "uuid",
    "format" "text",
    "status" "text",
    "visibility" "text",
    "featured" boolean DEFAULT false,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "timezone" "text",
    "all_day" boolean DEFAULT false,
    "max_attendees" integer,
    "cover_image_id" "uuid",
    "event_image_id" "uuid",
    "is_recurring" boolean DEFAULT false,
    "recurrence_pattern" "jsonb",
    "parent_event_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "published_at" timestamp with time zone,
    "requires_registration" boolean DEFAULT false,
    "registration_opens_at" timestamp with time zone,
    "registration_closes_at" timestamp with time zone,
    "is_free" boolean DEFAULT true,
    "price" numeric,
    "currency" "text",
    "group_id" "uuid",
    "virtual_meeting_url" "text",
    "virtual_meeting_id" "text",
    "virtual_meeting_password" "text",
    "virtual_platform" "text",
    "slug" "text",
    "seo_title" "text",
    "seo_description" "text",
    "canonical_url" "text",
    "content_blocks" "jsonb",
    "author_id" "uuid",
    "book_id" "uuid",
    "publisher_id" "uuid"
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feed_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "group_id" "uuid",
    "type" "text" NOT NULL,
    "content" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visibility" "text" DEFAULT 'public'::"text" NOT NULL,
    "allowed_user_ids" "uuid"[],
    "is_hidden" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid"
);


ALTER TABLE "public"."feed_entries" OWNER TO "postgres";


COMMENT ON TABLE "public"."feed_entries" IS 'User activity feed entries';



COMMENT ON COLUMN "public"."feed_entries"."entity_type" IS 'Type of entity this feed entry relates to (book, author, event, etc.)';



COMMENT ON COLUMN "public"."feed_entries"."entity_id" IS 'ID of the entity this feed entry relates to';



CREATE TABLE IF NOT EXISTS "public"."feed_entry_tags" (
    "feed_entry_id" "uuid" NOT NULL,
    "tag_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feed_entry_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follow_target_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."follow_target_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follows" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "target_type_id_uuid_temp" "uuid",
    "target_type_id" "uuid"
);


ALTER TABLE "public"."follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."format_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL
);


ALTER TABLE "public"."format_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."friends" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friend_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "responded_at" timestamp with time zone,
    "requested_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."friends" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "criteria" "text",
    "points" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "icon_url" "text",
    "type" "text"
);


ALTER TABLE "public"."group_achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "metric_name" "text" NOT NULL,
    "metric_value" numeric,
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "content" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_pinned" boolean DEFAULT false
);


ALTER TABLE "public"."group_announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "action" "text",
    "performed_by" "uuid",
    "target_type" "text",
    "target_id" "uuid",
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_author_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "event_id" "uuid",
    "scheduled_at" timestamp with time zone,
    "author_id" "uuid"
);


ALTER TABLE "public"."group_author_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_book_list_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "list_id" "uuid",
    "added_by" "uuid",
    "added_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid"
);


ALTER TABLE "public"."group_book_list_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_book_lists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "description" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_book_lists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_book_reviews" (
    "id" "uuid" NOT NULL,
    "group_id" "uuid",
    "book_id" "uuid",
    "user_id" "uuid",
    "rating" integer,
    "review" "text",
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."group_book_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_book_swaps" (
    "id" "uuid" NOT NULL,
    "group_id" "uuid",
    "book_id" "uuid",
    "offered_by" "uuid",
    "status" "text",
    "accepted_by" "uuid",
    "created_at" timestamp with time zone,
    "accepted_at" timestamp with time zone
);


ALTER TABLE "public"."group_book_swaps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_book_wishlist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "wishlist_id" "uuid",
    "added_by" "uuid",
    "added_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid"
);


ALTER TABLE "public"."group_book_wishlist_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_book_wishlists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_book_wishlists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_bots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "name" "text",
    "description" "text",
    "config" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_bots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_chat_channels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "name" "text",
    "description" "text",
    "is_event_channel" boolean DEFAULT false,
    "event_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_chat_channels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_chat_message_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid",
    "url" "text",
    "file_type" "text",
    "file_size" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_chat_message_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_chat_message_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid",
    "user_id" "uuid",
    "reaction" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_chat_message_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "channel_id" "uuid",
    "user_id" "uuid",
    "message" "text",
    "is_hidden" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_content_moderation_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "content_type" "text",
    "content_id" "uuid",
    "action" "text",
    "reason" "text",
    "reviewed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_content_moderation_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_custom_fields" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "field_name" "text",
    "field_type" "text",
    "field_options" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_custom_fields" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_discussion_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_discussion_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_event_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid",
    "group_id" "uuid",
    "user_id" "uuid",
    "rating" integer,
    "feedback" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_event_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "event_id" "uuid",
    "is_recurring" boolean DEFAULT false,
    "recurrence_pattern" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "chat_channel_id" "uuid"
);


ALTER TABLE "public"."group_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "type" "text",
    "config" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "invited_user_id" "uuid",
    "email" "text",
    "invite_code" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "accepted_at" timestamp with time zone,
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."group_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_leaderboards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "leaderboard_type" "text",
    "data" "jsonb",
    "generated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_leaderboards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_member_achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "achievement_id" "uuid" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_member_achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_member_devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "user_id" "uuid",
    "device_token" "text",
    "device_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_member_devices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_member_streaks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "user_id" "uuid",
    "streak_type" "text",
    "current_streak" integer DEFAULT 0,
    "longest_streak" integer DEFAULT 0,
    "last_active_date" "date",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_member_streaks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role_id" integer,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "joined_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_membership_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "is_required" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_membership_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_moderation_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "action" "text",
    "target_type" "text",
    "target_id" "uuid",
    "performed_by" "uuid",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_moderation_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_onboarding_checklists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_onboarding_checklists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_onboarding_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "checklist_id" "uuid",
    "user_id" "uuid",
    "task_id" "uuid",
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."group_onboarding_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_onboarding_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "checklist_id" "uuid",
    "task" "text",
    "order_index" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_onboarding_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_poll_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "poll_id" "uuid",
    "user_id" "uuid",
    "option_index" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_poll_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_polls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "question" "text" NOT NULL,
    "options" "text"[],
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "is_anonymous" boolean DEFAULT false,
    "allow_multiple" boolean DEFAULT false
);


ALTER TABLE "public"."group_polls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_reading_challenge_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challenge_id" "uuid",
    "user_id" "uuid",
    "books_read" integer DEFAULT 0,
    "progress_details" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_reading_challenge_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_reading_challenges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "description" "text",
    "target_books" integer,
    "start_date" "date",
    "end_date" "date",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_reading_challenges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_reading_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "user_id" "uuid",
    "progress_percentage" integer,
    "started_at" timestamp with time zone,
    "finished_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid"
);


ALTER TABLE "public"."group_reading_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_reading_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "session_title" "text",
    "session_description" "text",
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid"
);


ALTER TABLE "public"."group_reading_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "reported_by" "uuid",
    "target_type" "text",
    "target_id" "uuid",
    "reason" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "permissions" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_default" boolean DEFAULT false
);


ALTER TABLE "public"."group_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "order_index" integer
);


ALTER TABLE "public"."group_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_shared_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "content" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."group_shared_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "display_name" "text" NOT NULL,
    "slug" "text" NOT NULL
);


ALTER TABLE "public"."group_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_webhook_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "webhook_id" "uuid",
    "event_type" "text",
    "payload" "jsonb",
    "status" "text",
    "response_code" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_webhook_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_webhooks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "url" "text",
    "event_types" "text"[],
    "secret" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_webhooks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_welcome_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "role_id" integer,
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_welcome_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "is_private" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "cover_image_url" "text",
    "member_count" integer DEFAULT 0
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."id_mappings" (
    "table_name" "text" NOT NULL,
    "old_id" integer NOT NULL,
    "new_id" "uuid" NOT NULL
);


ALTER TABLE "public"."id_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."image_tag_mappings" (
    "image_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."image_tag_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."image_tags" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "slug" character varying(100) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."image_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."image_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."image_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "url" "text" NOT NULL,
    "alt_text" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "thumbnail_url" "text",
    "medium_url" "text",
    "large_url" "text",
    "original_filename" character varying(255),
    "file_size" integer,
    "width" integer,
    "height" integer,
    "format" character varying(10),
    "mime_type" character varying(100),
    "caption" "text",
    "metadata" "jsonb",
    "storage_path" "text",
    "storage_provider" character varying(50) DEFAULT 'supabase'::character varying,
    "is_processed" boolean DEFAULT false,
    "processing_status" character varying(50),
    "deleted_at" timestamp with time zone,
    "img_type_id" "uuid"
);


ALTER TABLE "public"."images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "invoice_number" "text" NOT NULL,
    "amount" numeric NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "status" "text",
    "due_date" timestamp with time zone,
    "paid_date" timestamp with time zone,
    "billing_address" "jsonb",
    "line_items" "jsonb",
    "notes" "text",
    "invoice_pdf_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feed_entry_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."likes" OWNER TO "postgres";


COMMENT ON TABLE "public"."likes" IS 'User likes on feed entries';



COMMENT ON COLUMN "public"."likes"."user_id" IS 'User who liked the feed entry';



COMMENT ON COLUMN "public"."likes"."feed_entry_id" IS 'Feed entry being liked';



CREATE TABLE IF NOT EXISTS "public"."list_followers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "list_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."list_followers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feed_entry_id" "uuid",
    "url" "text" NOT NULL,
    "type" "text",
    "alt_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."media_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feed_entry_id" "uuid",
    "comment_id" "uuid",
    "mentioned_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mentions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "link" "text",
    "data" "jsonb",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'User notifications';



CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "payment_type" "text",
    "provider_payment_id" "text",
    "nickname" "text",
    "last_four" "text",
    "expiry_date" "text",
    "is_default" boolean DEFAULT false,
    "billing_address" "jsonb",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "payment_method_id" "uuid",
    "transaction_type" "text",
    "amount" numeric NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "fees" numeric DEFAULT 0,
    "taxes" numeric DEFAULT 0,
    "tax_details" "jsonb",
    "status" "text",
    "provider_transaction_id" "text",
    "payment_provider" "text",
    "error_message" "text",
    "metadata" "jsonb",
    "receipt_url" "text",
    "receipt_email_sent" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."personalized_recommendations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "book_id" bigint NOT NULL,
    "recommendation_type" "text" NOT NULL,
    "score" double precision NOT NULL,
    "explanation" "text",
    "is_dismissed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."personalized_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."photo_album" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "entity_id" integer NOT NULL,
    "entity_type" character varying(50) NOT NULL,
    "image_type_id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."photo_album" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."photo_albums" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "cover_image_id" "uuid",
    "owner_id" "uuid" NOT NULL,
    "is_public" boolean DEFAULT false,
    "view_count" integer DEFAULT 0,
    "like_count" integer DEFAULT 0,
    "share_count" integer DEFAULT 0,
    "album_type" character varying(50) NOT NULL,
    "entity_id" "uuid",
    "entity_type" character varying(50),
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."photo_albums" OWNER TO "postgres";


COMMENT ON TABLE "public"."photo_albums" IS 'Photo albums with privacy controls';



COMMENT ON COLUMN "public"."photo_albums"."owner_id" IS 'Album owner user ID';



COMMENT ON COLUMN "public"."photo_albums"."is_public" IS 'Whether album is public';



CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "image_url" "text",
    "link_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visibility" "text" DEFAULT 'public'::"text" NOT NULL,
    "allowed_user_ids" "uuid"[],
    "is_hidden" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "price" numeric(10,2),
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "condition" character varying(50),
    "merchant" character varying(255),
    "total" numeric(10,2),
    "link" "text"
);


ALTER TABLE "public"."prices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."privacy_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "target_user_id" "uuid",
    "permission_type" "text",
    "old_value" "jsonb",
    "new_value" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "privacy_audit_log_action_check" CHECK (("action" = ANY (ARRAY['grant_permission'::"text", 'revoke_permission'::"text", 'update_privacy_settings'::"text", 'view_reading_progress'::"text"])))
);


ALTER TABLE "public"."privacy_audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."privacy_audit_log" IS 'Audit trail for all privacy-related actions and changes';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "bio" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role" character varying(50) DEFAULT 'user'::character varying NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'Extended user profile information';



COMMENT ON COLUMN "public"."profiles"."user_id" IS 'Reference to user account';



COMMENT ON COLUMN "public"."profiles"."bio" IS 'User biography text';



COMMENT ON COLUMN "public"."profiles"."role" IS 'User role (user, admin, moderator)';



CREATE TABLE IF NOT EXISTS "public"."promo_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "discount_type" "text",
    "discount_value" numeric NOT NULL,
    "applies_to_ticket_types" "uuid"[] DEFAULT '{}'::"uuid"[],
    "max_uses" integer,
    "current_uses" integer DEFAULT 0,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."promo_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."publishers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "featured" boolean DEFAULT false NOT NULL,
    "website" character varying,
    "email" character varying,
    "phone" character varying,
    "address_line1" character varying,
    "address_line2" character varying,
    "city" character varying,
    "state" character varying,
    "postal_code" character varying,
    "country" character varying,
    "about" "text",
    "cover_image_id" "uuid",
    "publisher_image_id" "uuid",
    "publisher_gallery_id" "uuid",
    "founded_year" integer,
    "country_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."publishers" OWNER TO "postgres";


COMMENT ON TABLE "public"."publishers" IS 'Book publishers information';



CREATE TABLE IF NOT EXISTS "public"."reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feed_entry_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_challenges" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "year" integer NOT NULL,
    "target_books" integer NOT NULL,
    "books_read" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reading_challenges" OWNER TO "postgres";


COMMENT ON TABLE "public"."reading_challenges" IS 'Reading challenge participation';



CREATE TABLE IF NOT EXISTS "public"."reading_goals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "goal_type" "text" NOT NULL,
    "target_value" integer NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "current_value" integer DEFAULT 0 NOT NULL,
    "is_completed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reading_goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_list_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "list_id" "uuid" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text",
    "book_id" "uuid"
);


ALTER TABLE "public"."reading_list_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_lists" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "is_public" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reading_lists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_progress" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "progress_percentage" integer DEFAULT 0 NOT NULL,
    "start_date" timestamp with time zone,
    "finish_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid",
    "privacy_level" "text" DEFAULT 'private'::"text" NOT NULL,
    "allow_friends" boolean DEFAULT false NOT NULL,
    "allow_followers" boolean DEFAULT false NOT NULL,
    "custom_permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "privacy_audit_log" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "reading_progress_privacy_level_check" CHECK (("privacy_level" = ANY (ARRAY['private'::"text", 'friends'::"text", 'followers'::"text", 'public'::"text"])))
);


ALTER TABLE "public"."reading_progress" OWNER TO "postgres";


COMMENT ON TABLE "public"."reading_progress" IS 'User reading progress tracking';



CREATE TABLE IF NOT EXISTS "public"."reading_series" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "publisher_id" integer,
    "organizer_id" "uuid" NOT NULL,
    "cover_image_id" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "author_id" "uuid"
);


ALTER TABLE "public"."reading_series" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_sessions" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid",
    "book_id" "uuid",
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "pages_read" integer,
    "minutes_spent" integer,
    "notes" "text",
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."reading_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_stats_daily" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "total_pages" integer DEFAULT 0 NOT NULL,
    "total_minutes" integer DEFAULT 0 NOT NULL,
    "books_read" integer DEFAULT 0 NOT NULL,
    "books_started" integer DEFAULT 0 NOT NULL,
    "books_finished" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reading_stats_daily" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_streaks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "days" integer NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reading_streaks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."review_likes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "review_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."review_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "book_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "review_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."series_events" (
    "series_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "event_number" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."series_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session_registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "registration_status" "text",
    "registration_time" timestamp with time zone DEFAULT "now"(),
    "check_in_time" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."session_registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."similar_books" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "similar_book_id" "uuid" NOT NULL,
    "similarity_score" numeric,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."similar_books" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."statuses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."statuses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subjects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subjects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."survey_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "survey_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "question_type" "text",
    "options" "jsonb",
    "is_required" boolean DEFAULT false,
    "display_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."survey_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."survey_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "survey_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "registration_id" "uuid",
    "response_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."survey_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sync_state" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" "text" NOT NULL,
    "last_synced_date" timestamp with time zone NOT NULL,
    "current_page" integer DEFAULT 1 NOT NULL,
    "total_books" integer DEFAULT 0 NOT NULL,
    "processed_books" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'idle'::"text" NOT NULL,
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sync_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_benefits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_type_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "display_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ticket_benefits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "quantity_total" integer,
    "quantity_sold" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "sale_start_date" timestamp with time zone,
    "sale_end_date" timestamp with time zone,
    "min_per_order" integer DEFAULT 1,
    "max_per_order" integer DEFAULT 10,
    "has_waitlist" boolean DEFAULT false,
    "includes_features" "jsonb",
    "visibility" "text",
    "access_code" "text",
    "display_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ticket_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "ticket_type_id" "uuid" NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "ticket_number" "text" NOT NULL,
    "status" "text",
    "purchase_price" numeric NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "attendee_name" "text",
    "attendee_email" "text",
    "checked_in_at" timestamp with time zone,
    "checked_in_by" "uuid",
    "qr_code" "text",
    "barcode" "text",
    "ticket_pdf_url" "text",
    "access_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_book_interactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "interaction_type" "text" NOT NULL,
    "interaction_value" double precision,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "book_id" "uuid"
);


ALTER TABLE "public"."user_book_interactions" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."user_privacy_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "default_privacy_level" "text" DEFAULT 'private'::"text" NOT NULL,
    "allow_friends_to_see_reading" boolean DEFAULT false NOT NULL,
    "allow_followers_to_see_reading" boolean DEFAULT false NOT NULL,
    "allow_public_reading_profile" boolean DEFAULT false NOT NULL,
    "show_reading_stats_publicly" boolean DEFAULT false NOT NULL,
    "show_currently_reading_publicly" boolean DEFAULT false NOT NULL,
    "show_reading_history_publicly" boolean DEFAULT false NOT NULL,
    "show_reading_goals_publicly" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_privacy_settings_default_privacy_level_check" CHECK (("default_privacy_level" = ANY (ARRAY['private'::"text", 'friends'::"text", 'followers'::"text", 'public'::"text"])))
);


ALTER TABLE "public"."user_privacy_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_privacy_settings" IS 'User privacy preferences and settings for reading progress visibility';



CREATE OR REPLACE VIEW "public"."user_privacy_overview" AS
 SELECT "u"."id" AS "user_id",
    "u"."email",
    "ups"."default_privacy_level",
    "ups"."allow_public_reading_profile",
    "count"("cp"."id") AS "active_custom_permissions",
    "count"("pal"."id") AS "privacy_actions_last_30_days"
   FROM ((("auth"."users" "u"
     LEFT JOIN "public"."user_privacy_settings" "ups" ON (("u"."id" = "ups"."user_id")))
     LEFT JOIN "public"."custom_permissions" "cp" ON ((("u"."id" = "cp"."user_id") AND (("cp"."expires_at" IS NULL) OR ("cp"."expires_at" > "now"())))))
     LEFT JOIN "public"."privacy_audit_log" "pal" ON ((("u"."id" = "pal"."user_id") AND ("pal"."created_at" >= ("now"() - '30 days'::interval)))))
  GROUP BY "u"."id", "u"."email", "ups"."default_privacy_level", "ups"."allow_public_reading_profile";


ALTER TABLE "public"."user_privacy_overview" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_reading_preferences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "favorite_genres" "text"[] DEFAULT '{}'::"text"[],
    "favorite_authors" "text"[] DEFAULT '{}'::"text"[],
    "disliked_genres" "text"[] DEFAULT '{}'::"text"[],
    "preferred_length" "text" DEFAULT 'medium'::"text",
    "preferred_complexity" "text" DEFAULT 'medium'::"text",
    "preferred_publication_era" "text" DEFAULT 'any'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_reading_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" character varying(255),
    "name" character varying(255),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "role_id" "uuid"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'User accounts and basic information';



COMMENT ON COLUMN "public"."users"."email" IS 'User email address for authentication';



COMMENT ON COLUMN "public"."users"."name" IS 'User display name';



COMMENT ON COLUMN "public"."users"."role_id" IS 'Reference to user role for permissions';



ALTER TABLE ONLY "public"."custom_permissions"
    ADD CONSTRAINT "custom_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_permissions"
    ADD CONSTRAINT "custom_permissions_user_target_unique" UNIQUE ("user_id", "target_user_id", "permission_type");



ALTER TABLE ONLY "public"."dewey_decimal_classifications"
    ADD CONSTRAINT "dewey_decimal_classifications_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."dewey_decimal_classifications"
    ADD CONSTRAINT "dewey_decimal_classifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."privacy_audit_log"
    ADD CONSTRAINT "privacy_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_friends"
    ADD CONSTRAINT "user_friends_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_friends"
    ADD CONSTRAINT "user_friends_user_id_friend_id_key" UNIQUE ("user_id", "friend_id");



ALTER TABLE ONLY "public"."user_privacy_settings"
    ADD CONSTRAINT "user_privacy_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_privacy_settings"
    ADD CONSTRAINT "user_privacy_settings_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_activities_created_at" ON "public"."activities" USING "btree" ("created_at");



CREATE INDEX "idx_activities_user_id" ON "public"."activities" USING "btree" ("user_id");



CREATE INDEX "idx_authors_featured" ON "public"."authors" USING "btree" ("featured");



CREATE INDEX "idx_authors_name" ON "public"."authors" USING "btree" ("name");



CREATE INDEX "idx_books_author_id" ON "public"."books" USING "btree" ("author_id");



CREATE INDEX "idx_books_isbn10" ON "public"."books" USING "btree" ("isbn10");



CREATE INDEX "idx_books_isbn13" ON "public"."books" USING "btree" ("isbn13");



CREATE INDEX "idx_books_publication_date" ON "public"."books" USING "btree" ("publication_date");



CREATE INDEX "idx_books_publisher_id" ON "public"."books" USING "btree" ("publisher_id");



CREATE INDEX "idx_books_title" ON "public"."books" USING "btree" ("title");



CREATE INDEX "idx_comments_feed_entry_id" ON "public"."comments" USING "btree" ("feed_entry_id");



CREATE INDEX "idx_comments_user_id" ON "public"."comments" USING "btree" ("user_id");



CREATE INDEX "idx_custom_permissions_user_target" ON "public"."custom_permissions" USING "btree" ("user_id", "target_user_id");



CREATE INDEX "idx_dewey_decimal_classifications_code" ON "public"."dewey_decimal_classifications" USING "btree" ("code");



CREATE INDEX "idx_dewey_decimal_classifications_parent_code" ON "public"."dewey_decimal_classifications" USING "btree" ("parent_code");



CREATE INDEX "idx_feed_entries_created_at" ON "public"."feed_entries" USING "btree" ("created_at");



CREATE INDEX "idx_feed_entries_user_id" ON "public"."feed_entries" USING "btree" ("user_id");



CREATE INDEX "idx_feed_entries_visibility" ON "public"."feed_entries" USING "btree" ("visibility");



CREATE INDEX "idx_follows_follower_following" ON "public"."follows" USING "btree" ("follower_id", "following_id");



CREATE INDEX "idx_likes_feed_entry_id" ON "public"."likes" USING "btree" ("feed_entry_id");



CREATE INDEX "idx_likes_user_id" ON "public"."likes" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_is_read" ON "public"."notifications" USING "btree" ("is_read");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_photo_albums_created_at" ON "public"."photo_albums" USING "btree" ("created_at");



CREATE INDEX "idx_photo_albums_is_public" ON "public"."photo_albums" USING "btree" ("is_public");



CREATE INDEX "idx_photo_albums_owner_id" ON "public"."photo_albums" USING "btree" ("owner_id");



CREATE INDEX "idx_privacy_audit_log_user_action" ON "public"."privacy_audit_log" USING "btree" ("user_id", "action", "created_at");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_profiles_user_id" ON "public"."profiles" USING "btree" ("user_id");



CREATE INDEX "idx_publishers_featured" ON "public"."publishers" USING "btree" ("featured");



CREATE INDEX "idx_publishers_name" ON "public"."publishers" USING "btree" ("name");



CREATE INDEX "idx_reading_challenges_user_id" ON "public"."reading_challenges" USING "btree" ("user_id");



CREATE INDEX "idx_reading_progress_book_id" ON "public"."reading_progress" USING "btree" ("book_id");



CREATE INDEX "idx_reading_progress_user_id" ON "public"."reading_progress" USING "btree" ("user_id");



CREATE INDEX "idx_reading_progress_user_privacy" ON "public"."reading_progress" USING "btree" ("user_id", "privacy_level");



CREATE INDEX "idx_user_friends_friend_id" ON "public"."user_friends" USING "btree" ("friend_id");



CREATE INDEX "idx_user_friends_status" ON "public"."user_friends" USING "btree" ("status");



CREATE INDEX "idx_user_friends_user_id" ON "public"."user_friends" USING "btree" ("user_id");



CREATE INDEX "idx_user_privacy_settings_user_id" ON "public"."user_privacy_settings" USING "btree" ("user_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_role_id" ON "public"."users" USING "btree" ("role_id");



CREATE OR REPLACE TRIGGER "trigger_handle_privacy_level_update" BEFORE INSERT OR UPDATE ON "public"."reading_progress" FOR EACH ROW EXECUTE FUNCTION "public"."handle_privacy_level_update"();



CREATE OR REPLACE TRIGGER "update_dewey_decimal_classifications_updated_at" BEFORE UPDATE ON "public"."dewey_decimal_classifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."dewey_decimal_classifications"
    ADD CONSTRAINT "dewey_decimal_classifications_parent_code_fkey" FOREIGN KEY ("parent_code") REFERENCES "public"."dewey_decimal_classifications"("code");



ALTER TABLE ONLY "public"."user_friends"
    ADD CONSTRAINT "user_friends_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_friends"
    ADD CONSTRAINT "user_friends_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_friends"
    ADD CONSTRAINT "user_friends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow admin access to dewey_decimal_classifications" ON "public"."dewey_decimal_classifications" USING (("auth"."role"() = 'admin'::"text"));



CREATE POLICY "Allow public read" ON "public"."activity_log" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."album_analytics" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."album_shares" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_authors" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_club_books" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_club_discussion_comments" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_club_discussions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_club_members" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_clubs" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_genre_mappings" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_publishers" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_recommendations" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_similarity_scores" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_subjects" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_tag_mappings" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_tags" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."book_views" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."carousel_images" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."contact_info" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."discussion_comments" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."discussions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_analytics" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_approvals" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_books" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_calendar_exports" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_categories" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_chat_messages" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_chat_rooms" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_comments" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_creator_permissions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_financials" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_interests" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_likes" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_livestreams" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_locations" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_media" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_permission_requests" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_questions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_registrations" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_reminders" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_sessions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_shares" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_speakers" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_sponsors" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_staff" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_surveys" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_tags" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_types" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_views" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."event_waitlists" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."feed_entry_tags" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."follow_target_types" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_achievements" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_analytics" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_announcements" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_audit_log" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_author_events" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_book_list_items" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_book_lists" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_book_reviews" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_book_swaps" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_book_wishlist_items" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_book_wishlists" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_bots" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_chat_channels" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_chat_message_attachments" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_chat_message_reactions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_chat_messages" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_content_moderation_logs" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_custom_fields" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_discussion_categories" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_event_feedback" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_events" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_integrations" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_invites" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_leaderboards" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_member_achievements" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_member_devices" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_member_streaks" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_membership_questions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_moderation_logs" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_onboarding_checklists" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_onboarding_progress" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_onboarding_tasks" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_poll_votes" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_polls" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_reading_challenge_progress" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_reading_challenges" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_reading_progress" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_reading_sessions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_reports" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_roles" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_rules" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_shared_documents" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_tags" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_types" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_webhook_logs" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_webhooks" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."group_welcome_messages" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."id_mappings" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."image_tag_mappings" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."image_tags" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."image_types" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."images" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."invoices" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."list_followers" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."media_attachments" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."mentions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."payment_methods" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."payment_transactions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."personalized_recommendations" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."photo_album" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."prices" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."promo_codes" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."reactions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."reading_challenges" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."reading_goals" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."reading_list_items" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."reading_series" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."reading_sessions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."reading_stats_daily" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."reading_streaks" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."review_likes" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."reviews" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."roles" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."series_events" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."session_registrations" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."similar_books" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."statuses" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."subjects" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."survey_questions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."survey_responses" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."sync_state" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."ticket_benefits" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."ticket_types" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."tickets" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."user_book_interactions" FOR SELECT USING (true);



CREATE POLICY "Allow read access to dewey_decimal_classifications" ON "public"."dewey_decimal_classifications" FOR SELECT USING (true);



CREATE POLICY "Public read access for authors" ON "public"."authors" FOR SELECT USING (true);



CREATE POLICY "Public read access for book_id_mapping" ON "public"."book_id_mapping" FOR SELECT USING (true);



CREATE POLICY "Public read access for books" ON "public"."books" FOR SELECT USING (true);



CREATE POLICY "Public read access for public events" ON "public"."events" FOR SELECT USING ((("visibility" = 'public'::"text") OR ("auth"."uid"() = "created_by")));



CREATE POLICY "Public read access for public groups" ON "public"."groups" FOR SELECT USING (((NOT "is_private") OR ("auth"."uid"() IN ( SELECT "group_members"."user_id"
   FROM "public"."group_members"
  WHERE ("group_members"."group_id" = "groups"."id")))));



CREATE POLICY "Public read access for publishers" ON "public"."publishers" FOR SELECT USING (true);



CREATE POLICY "Users can create friend requests" ON "public"."user_friends" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



CREATE POLICY "Users can delete their own friends" ON "public"."user_friends" FOR DELETE USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



CREATE POLICY "Users can manage own comments" ON "public"."comments" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own likes" ON "public"."likes" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own photo albums" ON "public"."photo_albums" USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own friends" ON "public"."user_friends" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own friends" ON "public"."user_friends" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activities_delete_policy" ON "public"."activities" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "activities_insert_policy" ON "public"."activities" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "activities_select_policy" ON "public"."activities" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "activities_update_policy" ON "public"."activities" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."activity_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."album_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."album_images" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "album_images_delete_policy" ON "public"."album_images" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."photo_albums"
  WHERE (("photo_albums"."id" = "album_images"."album_id") AND ("photo_albums"."owner_id" = "auth"."uid"())))));



CREATE POLICY "album_images_insert_policy" ON "public"."album_images" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."photo_albums"
  WHERE (("photo_albums"."id" = "album_images"."album_id") AND ("photo_albums"."owner_id" = "auth"."uid"())))));



CREATE POLICY "album_images_select_policy" ON "public"."album_images" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."photo_albums"
  WHERE (("photo_albums"."id" = "album_images"."album_id") AND (("photo_albums"."is_public" = true) OR ("photo_albums"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "album_images_update_policy" ON "public"."album_images" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."photo_albums"
  WHERE (("photo_albums"."id" = "album_images"."album_id") AND ("photo_albums"."owner_id" = "auth"."uid"())))));



ALTER TABLE "public"."album_shares" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."authors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authors_select_policy" ON "public"."authors" FOR SELECT USING (true);



ALTER TABLE "public"."binding_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "binding_types_select_policy" ON "public"."binding_types" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."blocks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "blocks_delete_policy" ON "public"."blocks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "blocks_insert_policy" ON "public"."blocks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "blocks_select_policy" ON "public"."blocks" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "blocked_user_id")));



ALTER TABLE "public"."book_authors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_club_books" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_club_discussion_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_club_discussions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_club_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_clubs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_genre_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_genres" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "book_genres_select_policy" ON "public"."book_genres" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."book_id_mapping" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_publishers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "book_reviews_delete_policy" ON "public"."book_reviews" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "book_reviews_insert_policy" ON "public"."book_reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "book_reviews_select_policy" ON "public"."book_reviews" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "book_reviews_update_policy" ON "public"."book_reviews" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."book_similarity_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_subjects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_tag_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."books" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "books_select_policy" ON "public"."books" FOR SELECT USING (true);



ALTER TABLE "public"."carousel_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_info" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."countries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "countries_select_policy" ON "public"."countries" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."custom_permissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "custom_permissions_owner_policy" ON "public"."custom_permissions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "custom_permissions_target_policy" ON "public"."custom_permissions" FOR SELECT USING (("auth"."uid"() = "target_user_id"));



ALTER TABLE "public"."dewey_decimal_classifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."discussion_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."discussions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_approvals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_books" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_calendar_exports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_chat_rooms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_creator_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_financials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_interests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_livestreams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_media" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_permission_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_reminders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_shares" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_speakers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_sponsors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_staff" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_surveys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_waitlists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feed_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "feed_entries_delete_policy" ON "public"."feed_entries" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "feed_entries_insert_policy" ON "public"."feed_entries" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "feed_entries_select_policy" ON "public"."feed_entries" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "feed_entries_update_policy" ON "public"."feed_entries" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."feed_entry_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."follow_target_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "follows_delete_policy" ON "public"."follows" FOR DELETE USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "follows_insert_policy" ON "public"."follows" FOR INSERT WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "follows_select_policy" ON "public"."follows" FOR SELECT USING ((("auth"."uid"() = "follower_id") OR ("auth"."uid"() = "following_id")));



CREATE POLICY "follows_update_policy" ON "public"."follows" FOR UPDATE USING (("auth"."uid"() = "follower_id"));



ALTER TABLE "public"."format_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "format_types_select_policy" ON "public"."format_types" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."friends" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "friends_delete_policy" ON "public"."friends" FOR DELETE USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



CREATE POLICY "friends_insert_policy" ON "public"."friends" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "friends_select_policy" ON "public"."friends" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



ALTER TABLE "public"."group_achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_author_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_book_list_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_book_lists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_book_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_book_swaps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_book_wishlist_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_book_wishlists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_bots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_chat_channels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_chat_message_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_chat_message_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_content_moderation_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_custom_fields" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_discussion_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_event_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_leaderboards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_member_achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_member_devices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_member_streaks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "group_members_select_policy" ON "public"."group_members" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."groups"
  WHERE (("groups"."id" = "group_members"."group_id") AND ("groups"."is_private" = false))))));



ALTER TABLE "public"."group_membership_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_moderation_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_onboarding_checklists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_onboarding_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_onboarding_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_poll_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_polls" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_reading_challenge_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_reading_challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_reading_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_reading_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_shared_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_webhook_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_webhooks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_welcome_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."id_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."image_tag_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."image_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."image_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."list_followers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."media_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_delete_policy" ON "public"."notifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "notifications_insert_policy" ON "public"."notifications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "notifications_select_policy" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "notifications_update_policy" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personalized_recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photo_album" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photo_albums" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "photo_albums_delete_policy" ON "public"."photo_albums" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "photo_albums_insert_policy" ON "public"."photo_albums" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "photo_albums_select_policy" ON "public"."photo_albums" FOR SELECT USING ((("is_public" = true) OR ("auth"."uid"() = "owner_id")));



CREATE POLICY "photo_albums_update_policy" ON "public"."photo_albums" FOR UPDATE USING (("auth"."uid"() = "owner_id"));



ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "posts_delete_policy" ON "public"."posts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "posts_insert_policy" ON "public"."posts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "posts_select_policy" ON "public"."posts" FOR SELECT USING ((("visibility" = 'public'::"text") OR ("auth"."uid"() = "user_id")));



CREATE POLICY "posts_update_policy" ON "public"."posts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."prices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."privacy_audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "privacy_audit_log_owner_policy" ON "public"."privacy_audit_log" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promo_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."publishers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_list_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_lists" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reading_lists_delete_policy" ON "public"."reading_lists" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "reading_lists_insert_policy" ON "public"."reading_lists" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "reading_lists_select_policy" ON "public"."reading_lists" FOR SELECT USING ((("is_public" = true) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "reading_lists_update_policy" ON "public"."reading_lists" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."reading_progress" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reading_progress_owner_policy" ON "public"."reading_progress" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "reading_progress_public_policy" ON "public"."reading_progress" FOR SELECT USING ((("privacy_level" = 'public'::"text") OR (("privacy_level" = 'friends'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."user_friends"
  WHERE ((("user_friends"."user_id" = "auth"."uid"()) AND ("user_friends"."friend_id" = "reading_progress"."user_id")) OR (("user_friends"."friend_id" = "auth"."uid"()) AND ("user_friends"."user_id" = "reading_progress"."user_id")))))) OR (("privacy_level" = 'followers'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."follows"
  WHERE (("follows"."follower_id" = "auth"."uid"()) AND ("follows"."following_id" = "reading_progress"."user_id")))))));



ALTER TABLE "public"."reading_series" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_stats_daily" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_streaks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."series_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."similar_books" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."statuses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subjects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."survey_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."survey_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sync_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tags_select_policy" ON "public"."tags" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."ticket_benefits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_book_interactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_book_interactions_delete_policy" ON "public"."user_book_interactions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_book_interactions_insert_policy" ON "public"."user_book_interactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "user_book_interactions_select_policy" ON "public"."user_book_interactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_book_interactions_update_policy" ON "public"."user_book_interactions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_friends" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_privacy_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_privacy_settings_owner_policy" ON "public"."user_privacy_settings" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_reading_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_reading_preferences_select_policy" ON "public"."user_reading_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_reading_privacy_access"("target_user_id" "uuid", "requesting_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."extract_book_dimensions"("book_uuid" "uuid", "dimensions_json" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_privacy_audit_summary"("days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_privacy_audit_summary"("days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_privacy_audit_summary"("days_back" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_feed_activities"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_privacy_settings"("user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_privacy_settings"("user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_privacy_settings"("user_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."grant_reading_permission"("target_user_id" "uuid", "permission_type" "text", "expires_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."grant_reading_permission"("target_user_id" "uuid", "permission_type" "text", "expires_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."grant_reading_permission"("target_user_id" "uuid", "permission_type" "text", "expires_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_album_privacy_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_album_privacy_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_album_privacy_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_privacy_level_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_privacy_level_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_privacy_level_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_public_album_creation"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_public_album_creation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_public_album_creation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_user_privacy_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_user_privacy_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_user_privacy_settings"() TO "service_role";



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



GRANT ALL ON FUNCTION "public"."revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revoke_reading_permission"("target_user_id" "uuid", "permission_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_privacy_settings"("default_privacy_level" "text", "allow_friends_to_see_reading" boolean, "allow_followers_to_see_reading" boolean, "allow_public_reading_profile" boolean, "show_reading_stats_publicly" boolean, "show_currently_reading_publicly" boolean, "show_reading_history_publicly" boolean, "show_reading_goals_publicly" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_privacy_settings"("default_privacy_level" "text", "allow_friends_to_see_reading" boolean, "allow_followers_to_see_reading" boolean, "allow_public_reading_profile" boolean, "show_reading_stats_publicly" boolean, "show_currently_reading_publicly" boolean, "show_reading_history_publicly" boolean, "show_reading_goals_publicly" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_privacy_settings"("default_privacy_level" "text", "allow_friends_to_see_reading" boolean, "allow_followers_to_see_reading" boolean, "allow_public_reading_profile" boolean, "show_reading_stats_publicly" boolean, "show_currently_reading_publicly" boolean, "show_reading_history_publicly" boolean, "show_reading_goals_publicly" boolean) TO "service_role";


















GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."activity_log" TO "anon";
GRANT ALL ON TABLE "public"."activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."album_analytics" TO "anon";
GRANT ALL ON TABLE "public"."album_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."album_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."album_images" TO "anon";
GRANT ALL ON TABLE "public"."album_images" TO "authenticated";
GRANT ALL ON TABLE "public"."album_images" TO "service_role";



GRANT ALL ON TABLE "public"."album_shares" TO "anon";
GRANT ALL ON TABLE "public"."album_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."album_shares" TO "service_role";



GRANT ALL ON TABLE "public"."authors" TO "anon";
GRANT ALL ON TABLE "public"."authors" TO "authenticated";
GRANT ALL ON TABLE "public"."authors" TO "service_role";



GRANT ALL ON TABLE "public"."binding_types" TO "anon";
GRANT ALL ON TABLE "public"."binding_types" TO "authenticated";
GRANT ALL ON TABLE "public"."binding_types" TO "service_role";



GRANT ALL ON TABLE "public"."blocks" TO "anon";
GRANT ALL ON TABLE "public"."blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."blocks" TO "service_role";



GRANT ALL ON TABLE "public"."book_authors" TO "anon";
GRANT ALL ON TABLE "public"."book_authors" TO "authenticated";
GRANT ALL ON TABLE "public"."book_authors" TO "service_role";



GRANT ALL ON TABLE "public"."book_club_books" TO "anon";
GRANT ALL ON TABLE "public"."book_club_books" TO "authenticated";
GRANT ALL ON TABLE "public"."book_club_books" TO "service_role";



GRANT ALL ON TABLE "public"."book_club_discussion_comments" TO "anon";
GRANT ALL ON TABLE "public"."book_club_discussion_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."book_club_discussion_comments" TO "service_role";



GRANT ALL ON TABLE "public"."book_club_discussions" TO "anon";
GRANT ALL ON TABLE "public"."book_club_discussions" TO "authenticated";
GRANT ALL ON TABLE "public"."book_club_discussions" TO "service_role";



GRANT ALL ON TABLE "public"."book_club_members" TO "anon";
GRANT ALL ON TABLE "public"."book_club_members" TO "authenticated";
GRANT ALL ON TABLE "public"."book_club_members" TO "service_role";



GRANT ALL ON TABLE "public"."book_clubs" TO "anon";
GRANT ALL ON TABLE "public"."book_clubs" TO "authenticated";
GRANT ALL ON TABLE "public"."book_clubs" TO "service_role";



GRANT ALL ON TABLE "public"."book_genre_mappings" TO "anon";
GRANT ALL ON TABLE "public"."book_genre_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."book_genre_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."book_genres" TO "anon";
GRANT ALL ON TABLE "public"."book_genres" TO "authenticated";
GRANT ALL ON TABLE "public"."book_genres" TO "service_role";



GRANT ALL ON TABLE "public"."book_id_mapping" TO "anon";
GRANT ALL ON TABLE "public"."book_id_mapping" TO "authenticated";
GRANT ALL ON TABLE "public"."book_id_mapping" TO "service_role";



GRANT ALL ON TABLE "public"."book_publishers" TO "anon";
GRANT ALL ON TABLE "public"."book_publishers" TO "authenticated";
GRANT ALL ON TABLE "public"."book_publishers" TO "service_role";



GRANT ALL ON TABLE "public"."book_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."book_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."book_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."book_reviews" TO "anon";
GRANT ALL ON TABLE "public"."book_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."book_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."book_similarity_scores" TO "anon";
GRANT ALL ON TABLE "public"."book_similarity_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."book_similarity_scores" TO "service_role";



GRANT ALL ON TABLE "public"."book_subjects" TO "anon";
GRANT ALL ON TABLE "public"."book_subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."book_subjects" TO "service_role";



GRANT ALL ON TABLE "public"."book_tag_mappings" TO "anon";
GRANT ALL ON TABLE "public"."book_tag_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."book_tag_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."book_tags" TO "anon";
GRANT ALL ON TABLE "public"."book_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."book_tags" TO "service_role";



GRANT ALL ON TABLE "public"."book_views" TO "anon";
GRANT ALL ON TABLE "public"."book_views" TO "authenticated";
GRANT ALL ON TABLE "public"."book_views" TO "service_role";



GRANT ALL ON TABLE "public"."books" TO "anon";
GRANT ALL ON TABLE "public"."books" TO "authenticated";
GRANT ALL ON TABLE "public"."books" TO "service_role";



GRANT ALL ON TABLE "public"."carousel_images" TO "anon";
GRANT ALL ON TABLE "public"."carousel_images" TO "authenticated";
GRANT ALL ON TABLE "public"."carousel_images" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."contact_info" TO "anon";
GRANT ALL ON TABLE "public"."contact_info" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_info" TO "service_role";



GRANT ALL ON TABLE "public"."countries" TO "anon";
GRANT ALL ON TABLE "public"."countries" TO "authenticated";
GRANT ALL ON TABLE "public"."countries" TO "service_role";



GRANT ALL ON TABLE "public"."custom_permissions" TO "anon";
GRANT ALL ON TABLE "public"."custom_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."dewey_decimal_classifications" TO "anon";
GRANT ALL ON TABLE "public"."dewey_decimal_classifications" TO "authenticated";
GRANT ALL ON TABLE "public"."dewey_decimal_classifications" TO "service_role";



GRANT ALL ON TABLE "public"."discussion_comments" TO "anon";
GRANT ALL ON TABLE "public"."discussion_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."discussion_comments" TO "service_role";



GRANT ALL ON TABLE "public"."discussions" TO "anon";
GRANT ALL ON TABLE "public"."discussions" TO "authenticated";
GRANT ALL ON TABLE "public"."discussions" TO "service_role";



GRANT ALL ON TABLE "public"."event_analytics" TO "anon";
GRANT ALL ON TABLE "public"."event_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."event_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."event_approvals" TO "anon";
GRANT ALL ON TABLE "public"."event_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."event_approvals" TO "service_role";



GRANT ALL ON TABLE "public"."event_books" TO "anon";
GRANT ALL ON TABLE "public"."event_books" TO "authenticated";
GRANT ALL ON TABLE "public"."event_books" TO "service_role";



GRANT ALL ON TABLE "public"."event_calendar_exports" TO "anon";
GRANT ALL ON TABLE "public"."event_calendar_exports" TO "authenticated";
GRANT ALL ON TABLE "public"."event_calendar_exports" TO "service_role";



GRANT ALL ON TABLE "public"."event_categories" TO "anon";
GRANT ALL ON TABLE "public"."event_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."event_categories" TO "service_role";



GRANT ALL ON TABLE "public"."event_chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."event_chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."event_chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."event_chat_rooms" TO "anon";
GRANT ALL ON TABLE "public"."event_chat_rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."event_chat_rooms" TO "service_role";



GRANT ALL ON TABLE "public"."event_comments" TO "anon";
GRANT ALL ON TABLE "public"."event_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."event_comments" TO "service_role";



GRANT ALL ON TABLE "public"."event_creator_permissions" TO "anon";
GRANT ALL ON TABLE "public"."event_creator_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."event_creator_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."event_financials" TO "anon";
GRANT ALL ON TABLE "public"."event_financials" TO "authenticated";
GRANT ALL ON TABLE "public"."event_financials" TO "service_role";



GRANT ALL ON TABLE "public"."event_interests" TO "anon";
GRANT ALL ON TABLE "public"."event_interests" TO "authenticated";
GRANT ALL ON TABLE "public"."event_interests" TO "service_role";



GRANT ALL ON TABLE "public"."event_likes" TO "anon";
GRANT ALL ON TABLE "public"."event_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."event_likes" TO "service_role";



GRANT ALL ON TABLE "public"."event_livestreams" TO "anon";
GRANT ALL ON TABLE "public"."event_livestreams" TO "authenticated";
GRANT ALL ON TABLE "public"."event_livestreams" TO "service_role";



GRANT ALL ON TABLE "public"."event_locations" TO "anon";
GRANT ALL ON TABLE "public"."event_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."event_locations" TO "service_role";



GRANT ALL ON TABLE "public"."event_media" TO "anon";
GRANT ALL ON TABLE "public"."event_media" TO "authenticated";
GRANT ALL ON TABLE "public"."event_media" TO "service_role";



GRANT ALL ON TABLE "public"."event_permission_requests" TO "anon";
GRANT ALL ON TABLE "public"."event_permission_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."event_permission_requests" TO "service_role";



GRANT ALL ON TABLE "public"."event_questions" TO "anon";
GRANT ALL ON TABLE "public"."event_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."event_questions" TO "service_role";



GRANT ALL ON TABLE "public"."event_registrations" TO "anon";
GRANT ALL ON TABLE "public"."event_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."event_registrations" TO "service_role";



GRANT ALL ON TABLE "public"."event_reminders" TO "anon";
GRANT ALL ON TABLE "public"."event_reminders" TO "authenticated";
GRANT ALL ON TABLE "public"."event_reminders" TO "service_role";



GRANT ALL ON TABLE "public"."event_sessions" TO "anon";
GRANT ALL ON TABLE "public"."event_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."event_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."event_shares" TO "anon";
GRANT ALL ON TABLE "public"."event_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."event_shares" TO "service_role";



GRANT ALL ON TABLE "public"."event_speakers" TO "anon";
GRANT ALL ON TABLE "public"."event_speakers" TO "authenticated";
GRANT ALL ON TABLE "public"."event_speakers" TO "service_role";



GRANT ALL ON TABLE "public"."event_sponsors" TO "anon";
GRANT ALL ON TABLE "public"."event_sponsors" TO "authenticated";
GRANT ALL ON TABLE "public"."event_sponsors" TO "service_role";



GRANT ALL ON TABLE "public"."event_staff" TO "anon";
GRANT ALL ON TABLE "public"."event_staff" TO "authenticated";
GRANT ALL ON TABLE "public"."event_staff" TO "service_role";



GRANT ALL ON TABLE "public"."event_surveys" TO "anon";
GRANT ALL ON TABLE "public"."event_surveys" TO "authenticated";
GRANT ALL ON TABLE "public"."event_surveys" TO "service_role";



GRANT ALL ON TABLE "public"."event_tags" TO "anon";
GRANT ALL ON TABLE "public"."event_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."event_tags" TO "service_role";



GRANT ALL ON TABLE "public"."event_types" TO "anon";
GRANT ALL ON TABLE "public"."event_types" TO "authenticated";
GRANT ALL ON TABLE "public"."event_types" TO "service_role";



GRANT ALL ON TABLE "public"."event_views" TO "anon";
GRANT ALL ON TABLE "public"."event_views" TO "authenticated";
GRANT ALL ON TABLE "public"."event_views" TO "service_role";



GRANT ALL ON TABLE "public"."event_waitlists" TO "anon";
GRANT ALL ON TABLE "public"."event_waitlists" TO "authenticated";
GRANT ALL ON TABLE "public"."event_waitlists" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."feed_entries" TO "anon";
GRANT ALL ON TABLE "public"."feed_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_entries" TO "service_role";



GRANT ALL ON TABLE "public"."feed_entry_tags" TO "anon";
GRANT ALL ON TABLE "public"."feed_entry_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_entry_tags" TO "service_role";



GRANT ALL ON TABLE "public"."follow_target_types" TO "anon";
GRANT ALL ON TABLE "public"."follow_target_types" TO "authenticated";
GRANT ALL ON TABLE "public"."follow_target_types" TO "service_role";



GRANT ALL ON TABLE "public"."follows" TO "anon";
GRANT ALL ON TABLE "public"."follows" TO "authenticated";
GRANT ALL ON TABLE "public"."follows" TO "service_role";



GRANT ALL ON TABLE "public"."format_types" TO "anon";
GRANT ALL ON TABLE "public"."format_types" TO "authenticated";
GRANT ALL ON TABLE "public"."format_types" TO "service_role";



GRANT ALL ON TABLE "public"."friends" TO "anon";
GRANT ALL ON TABLE "public"."friends" TO "authenticated";
GRANT ALL ON TABLE "public"."friends" TO "service_role";



GRANT ALL ON TABLE "public"."group_achievements" TO "anon";
GRANT ALL ON TABLE "public"."group_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."group_achievements" TO "service_role";



GRANT ALL ON TABLE "public"."group_analytics" TO "anon";
GRANT ALL ON TABLE "public"."group_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."group_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."group_announcements" TO "anon";
GRANT ALL ON TABLE "public"."group_announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."group_announcements" TO "service_role";



GRANT ALL ON TABLE "public"."group_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."group_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."group_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."group_author_events" TO "anon";
GRANT ALL ON TABLE "public"."group_author_events" TO "authenticated";
GRANT ALL ON TABLE "public"."group_author_events" TO "service_role";



GRANT ALL ON TABLE "public"."group_book_list_items" TO "anon";
GRANT ALL ON TABLE "public"."group_book_list_items" TO "authenticated";
GRANT ALL ON TABLE "public"."group_book_list_items" TO "service_role";



GRANT ALL ON TABLE "public"."group_book_lists" TO "anon";
GRANT ALL ON TABLE "public"."group_book_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."group_book_lists" TO "service_role";



GRANT ALL ON TABLE "public"."group_book_reviews" TO "anon";
GRANT ALL ON TABLE "public"."group_book_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."group_book_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."group_book_swaps" TO "anon";
GRANT ALL ON TABLE "public"."group_book_swaps" TO "authenticated";
GRANT ALL ON TABLE "public"."group_book_swaps" TO "service_role";



GRANT ALL ON TABLE "public"."group_book_wishlist_items" TO "anon";
GRANT ALL ON TABLE "public"."group_book_wishlist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."group_book_wishlist_items" TO "service_role";



GRANT ALL ON TABLE "public"."group_book_wishlists" TO "anon";
GRANT ALL ON TABLE "public"."group_book_wishlists" TO "authenticated";
GRANT ALL ON TABLE "public"."group_book_wishlists" TO "service_role";



GRANT ALL ON TABLE "public"."group_bots" TO "anon";
GRANT ALL ON TABLE "public"."group_bots" TO "authenticated";
GRANT ALL ON TABLE "public"."group_bots" TO "service_role";



GRANT ALL ON TABLE "public"."group_chat_channels" TO "anon";
GRANT ALL ON TABLE "public"."group_chat_channels" TO "authenticated";
GRANT ALL ON TABLE "public"."group_chat_channels" TO "service_role";



GRANT ALL ON TABLE "public"."group_chat_message_attachments" TO "anon";
GRANT ALL ON TABLE "public"."group_chat_message_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."group_chat_message_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."group_chat_message_reactions" TO "anon";
GRANT ALL ON TABLE "public"."group_chat_message_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."group_chat_message_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."group_chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."group_chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."group_chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."group_content_moderation_logs" TO "anon";
GRANT ALL ON TABLE "public"."group_content_moderation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."group_content_moderation_logs" TO "service_role";



GRANT ALL ON TABLE "public"."group_custom_fields" TO "anon";
GRANT ALL ON TABLE "public"."group_custom_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."group_custom_fields" TO "service_role";



GRANT ALL ON TABLE "public"."group_discussion_categories" TO "anon";
GRANT ALL ON TABLE "public"."group_discussion_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."group_discussion_categories" TO "service_role";



GRANT ALL ON TABLE "public"."group_event_feedback" TO "anon";
GRANT ALL ON TABLE "public"."group_event_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."group_event_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."group_events" TO "anon";
GRANT ALL ON TABLE "public"."group_events" TO "authenticated";
GRANT ALL ON TABLE "public"."group_events" TO "service_role";



GRANT ALL ON TABLE "public"."group_integrations" TO "anon";
GRANT ALL ON TABLE "public"."group_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."group_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."group_invites" TO "anon";
GRANT ALL ON TABLE "public"."group_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."group_invites" TO "service_role";



GRANT ALL ON TABLE "public"."group_leaderboards" TO "anon";
GRANT ALL ON TABLE "public"."group_leaderboards" TO "authenticated";
GRANT ALL ON TABLE "public"."group_leaderboards" TO "service_role";



GRANT ALL ON TABLE "public"."group_member_achievements" TO "anon";
GRANT ALL ON TABLE "public"."group_member_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."group_member_achievements" TO "service_role";



GRANT ALL ON TABLE "public"."group_member_devices" TO "anon";
GRANT ALL ON TABLE "public"."group_member_devices" TO "authenticated";
GRANT ALL ON TABLE "public"."group_member_devices" TO "service_role";



GRANT ALL ON TABLE "public"."group_member_streaks" TO "anon";
GRANT ALL ON TABLE "public"."group_member_streaks" TO "authenticated";
GRANT ALL ON TABLE "public"."group_member_streaks" TO "service_role";



GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";



GRANT ALL ON TABLE "public"."group_membership_questions" TO "anon";
GRANT ALL ON TABLE "public"."group_membership_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."group_membership_questions" TO "service_role";



GRANT ALL ON TABLE "public"."group_moderation_logs" TO "anon";
GRANT ALL ON TABLE "public"."group_moderation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."group_moderation_logs" TO "service_role";



GRANT ALL ON TABLE "public"."group_onboarding_checklists" TO "anon";
GRANT ALL ON TABLE "public"."group_onboarding_checklists" TO "authenticated";
GRANT ALL ON TABLE "public"."group_onboarding_checklists" TO "service_role";



GRANT ALL ON TABLE "public"."group_onboarding_progress" TO "anon";
GRANT ALL ON TABLE "public"."group_onboarding_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."group_onboarding_progress" TO "service_role";



GRANT ALL ON TABLE "public"."group_onboarding_tasks" TO "anon";
GRANT ALL ON TABLE "public"."group_onboarding_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."group_onboarding_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."group_poll_votes" TO "anon";
GRANT ALL ON TABLE "public"."group_poll_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."group_poll_votes" TO "service_role";



GRANT ALL ON TABLE "public"."group_polls" TO "anon";
GRANT ALL ON TABLE "public"."group_polls" TO "authenticated";
GRANT ALL ON TABLE "public"."group_polls" TO "service_role";



GRANT ALL ON TABLE "public"."group_reading_challenge_progress" TO "anon";
GRANT ALL ON TABLE "public"."group_reading_challenge_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."group_reading_challenge_progress" TO "service_role";



GRANT ALL ON TABLE "public"."group_reading_challenges" TO "anon";
GRANT ALL ON TABLE "public"."group_reading_challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."group_reading_challenges" TO "service_role";



GRANT ALL ON TABLE "public"."group_reading_progress" TO "anon";
GRANT ALL ON TABLE "public"."group_reading_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."group_reading_progress" TO "service_role";



GRANT ALL ON TABLE "public"."group_reading_sessions" TO "anon";
GRANT ALL ON TABLE "public"."group_reading_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."group_reading_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."group_reports" TO "anon";
GRANT ALL ON TABLE "public"."group_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."group_reports" TO "service_role";



GRANT ALL ON TABLE "public"."group_roles" TO "anon";
GRANT ALL ON TABLE "public"."group_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."group_roles" TO "service_role";



GRANT ALL ON TABLE "public"."group_rules" TO "anon";
GRANT ALL ON TABLE "public"."group_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."group_rules" TO "service_role";



GRANT ALL ON TABLE "public"."group_shared_documents" TO "anon";
GRANT ALL ON TABLE "public"."group_shared_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."group_shared_documents" TO "service_role";



GRANT ALL ON TABLE "public"."group_tags" TO "anon";
GRANT ALL ON TABLE "public"."group_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."group_tags" TO "service_role";



GRANT ALL ON TABLE "public"."group_types" TO "anon";
GRANT ALL ON TABLE "public"."group_types" TO "authenticated";
GRANT ALL ON TABLE "public"."group_types" TO "service_role";



GRANT ALL ON TABLE "public"."group_webhook_logs" TO "anon";
GRANT ALL ON TABLE "public"."group_webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."group_webhook_logs" TO "service_role";



GRANT ALL ON TABLE "public"."group_webhooks" TO "anon";
GRANT ALL ON TABLE "public"."group_webhooks" TO "authenticated";
GRANT ALL ON TABLE "public"."group_webhooks" TO "service_role";



GRANT ALL ON TABLE "public"."group_welcome_messages" TO "anon";
GRANT ALL ON TABLE "public"."group_welcome_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."group_welcome_messages" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON TABLE "public"."id_mappings" TO "anon";
GRANT ALL ON TABLE "public"."id_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."id_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."image_tag_mappings" TO "anon";
GRANT ALL ON TABLE "public"."image_tag_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."image_tag_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."image_tags" TO "anon";
GRANT ALL ON TABLE "public"."image_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."image_tags" TO "service_role";



GRANT ALL ON TABLE "public"."image_types" TO "anon";
GRANT ALL ON TABLE "public"."image_types" TO "authenticated";
GRANT ALL ON TABLE "public"."image_types" TO "service_role";



GRANT ALL ON TABLE "public"."images" TO "anon";
GRANT ALL ON TABLE "public"."images" TO "authenticated";
GRANT ALL ON TABLE "public"."images" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."likes" TO "anon";
GRANT ALL ON TABLE "public"."likes" TO "authenticated";
GRANT ALL ON TABLE "public"."likes" TO "service_role";



GRANT ALL ON TABLE "public"."list_followers" TO "anon";
GRANT ALL ON TABLE "public"."list_followers" TO "authenticated";
GRANT ALL ON TABLE "public"."list_followers" TO "service_role";



GRANT ALL ON TABLE "public"."media_attachments" TO "anon";
GRANT ALL ON TABLE "public"."media_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."media_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."mentions" TO "anon";
GRANT ALL ON TABLE "public"."mentions" TO "authenticated";
GRANT ALL ON TABLE "public"."mentions" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";



GRANT ALL ON TABLE "public"."payment_transactions" TO "anon";
GRANT ALL ON TABLE "public"."payment_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."personalized_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."personalized_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."personalized_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."photo_album" TO "anon";
GRANT ALL ON TABLE "public"."photo_album" TO "authenticated";
GRANT ALL ON TABLE "public"."photo_album" TO "service_role";



GRANT ALL ON TABLE "public"."photo_albums" TO "anon";
GRANT ALL ON TABLE "public"."photo_albums" TO "authenticated";
GRANT ALL ON TABLE "public"."photo_albums" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."prices" TO "anon";
GRANT ALL ON TABLE "public"."prices" TO "authenticated";
GRANT ALL ON TABLE "public"."prices" TO "service_role";



GRANT ALL ON TABLE "public"."privacy_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."privacy_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."privacy_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."promo_codes" TO "anon";
GRANT ALL ON TABLE "public"."promo_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."promo_codes" TO "service_role";



GRANT ALL ON TABLE "public"."publishers" TO "anon";
GRANT ALL ON TABLE "public"."publishers" TO "authenticated";
GRANT ALL ON TABLE "public"."publishers" TO "service_role";



GRANT ALL ON TABLE "public"."reactions" TO "anon";
GRANT ALL ON TABLE "public"."reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."reactions" TO "service_role";



GRANT ALL ON TABLE "public"."reading_challenges" TO "anon";
GRANT ALL ON TABLE "public"."reading_challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_challenges" TO "service_role";



GRANT ALL ON TABLE "public"."reading_goals" TO "anon";
GRANT ALL ON TABLE "public"."reading_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_goals" TO "service_role";



GRANT ALL ON TABLE "public"."reading_list_items" TO "anon";
GRANT ALL ON TABLE "public"."reading_list_items" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_list_items" TO "service_role";



GRANT ALL ON TABLE "public"."reading_lists" TO "anon";
GRANT ALL ON TABLE "public"."reading_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_lists" TO "service_role";



GRANT ALL ON TABLE "public"."reading_progress" TO "anon";
GRANT ALL ON TABLE "public"."reading_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_progress" TO "service_role";



GRANT ALL ON TABLE "public"."reading_series" TO "anon";
GRANT ALL ON TABLE "public"."reading_series" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_series" TO "service_role";



GRANT ALL ON TABLE "public"."reading_sessions" TO "anon";
GRANT ALL ON TABLE "public"."reading_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."reading_stats_daily" TO "anon";
GRANT ALL ON TABLE "public"."reading_stats_daily" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_stats_daily" TO "service_role";



GRANT ALL ON TABLE "public"."reading_streaks" TO "anon";
GRANT ALL ON TABLE "public"."reading_streaks" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_streaks" TO "service_role";



GRANT ALL ON TABLE "public"."review_likes" TO "anon";
GRANT ALL ON TABLE "public"."review_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."review_likes" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."series_events" TO "anon";
GRANT ALL ON TABLE "public"."series_events" TO "authenticated";
GRANT ALL ON TABLE "public"."series_events" TO "service_role";



GRANT ALL ON TABLE "public"."session_registrations" TO "anon";
GRANT ALL ON TABLE "public"."session_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."session_registrations" TO "service_role";



GRANT ALL ON TABLE "public"."similar_books" TO "anon";
GRANT ALL ON TABLE "public"."similar_books" TO "authenticated";
GRANT ALL ON TABLE "public"."similar_books" TO "service_role";



GRANT ALL ON TABLE "public"."statuses" TO "anon";
GRANT ALL ON TABLE "public"."statuses" TO "authenticated";
GRANT ALL ON TABLE "public"."statuses" TO "service_role";



GRANT ALL ON TABLE "public"."subjects" TO "anon";
GRANT ALL ON TABLE "public"."subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."subjects" TO "service_role";



GRANT ALL ON TABLE "public"."survey_questions" TO "anon";
GRANT ALL ON TABLE "public"."survey_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_questions" TO "service_role";



GRANT ALL ON TABLE "public"."survey_responses" TO "anon";
GRANT ALL ON TABLE "public"."survey_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."survey_responses" TO "service_role";



GRANT ALL ON TABLE "public"."sync_state" TO "anon";
GRANT ALL ON TABLE "public"."sync_state" TO "authenticated";
GRANT ALL ON TABLE "public"."sync_state" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_benefits" TO "anon";
GRANT ALL ON TABLE "public"."ticket_benefits" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_benefits" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_types" TO "anon";
GRANT ALL ON TABLE "public"."ticket_types" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_types" TO "service_role";



GRANT ALL ON TABLE "public"."tickets" TO "anon";
GRANT ALL ON TABLE "public"."tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets" TO "service_role";



GRANT ALL ON TABLE "public"."user_book_interactions" TO "anon";
GRANT ALL ON TABLE "public"."user_book_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_book_interactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_friends" TO "anon";
GRANT ALL ON TABLE "public"."user_friends" TO "authenticated";
GRANT ALL ON TABLE "public"."user_friends" TO "service_role";



GRANT ALL ON TABLE "public"."user_privacy_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_privacy_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_privacy_settings" TO "service_role";



GRANT ALL ON TABLE "public"."user_privacy_overview" TO "anon";
GRANT ALL ON TABLE "public"."user_privacy_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."user_privacy_overview" TO "service_role";



GRANT ALL ON TABLE "public"."user_reading_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_reading_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_reading_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



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
