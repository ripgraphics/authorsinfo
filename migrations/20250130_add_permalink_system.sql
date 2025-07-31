-- Migration: Add Permalink System
-- Date: 2025-01-30
-- Description: Add permalink fields to all entity tables for custom URLs

-- Add permalink field to users table
ALTER TABLE "public"."users" 
ADD COLUMN IF NOT EXISTS "permalink" character varying(100) UNIQUE;

-- Add permalink field to groups table
ALTER TABLE "public"."groups" 
ADD COLUMN IF NOT EXISTS "permalink" character varying(100) UNIQUE;

-- Add permalink field to events table
ALTER TABLE "public"."events" 
ADD COLUMN IF NOT EXISTS "permalink" character varying(100) UNIQUE;

-- Add permalink field to books table
ALTER TABLE "public"."books" 
ADD COLUMN IF NOT EXISTS "permalink" character varying(100) UNIQUE;

-- Add permalink field to authors table
ALTER TABLE "public"."authors" 
ADD COLUMN IF NOT EXISTS "permalink" character varying(100) UNIQUE;

-- Add permalink field to publishers table
ALTER TABLE "public"."publishers" 
ADD COLUMN IF NOT EXISTS "permalink" character varying(100) UNIQUE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_users_permalink" ON "public"."users" ("permalink");
CREATE INDEX IF NOT EXISTS "idx_groups_permalink" ON "public"."groups" ("permalink");
CREATE INDEX IF NOT EXISTS "idx_events_permalink" ON "public"."events" ("permalink");
CREATE INDEX IF NOT EXISTS "idx_books_permalink" ON "public"."books" ("permalink");
CREATE INDEX IF NOT EXISTS "idx_authors_permalink" ON "public"."authors" ("permalink");
CREATE INDEX IF NOT EXISTS "idx_publishers_permalink" ON "public"."publishers" ("permalink");

-- Create a function to generate permalinks
CREATE OR REPLACE FUNCTION generate_permalink(input_text text, entity_type text DEFAULT 'user')
RETURNS text AS $$
DECLARE
    base_permalink text;
    final_permalink text;
    counter integer := 1;
BEGIN
    -- Convert to lowercase and replace spaces/special chars with hyphens
    base_permalink := lower(regexp_replace(input_text, '[^a-zA-Z0-9\s]', '', 'g'));
    base_permalink := regexp_replace(base_permalink, '\s+', '-', 'g');
    base_permalink := regexp_replace(base_permalink, '-+', '-', 'g');
    base_permalink := trim(both '-' from base_permalink);
    
    -- Ensure minimum length
    IF length(base_permalink) < 3 THEN
        base_permalink := base_permalink || '-' || substr(md5(random()::text), 1, 6);
    END IF;
    
    final_permalink := base_permalink;
    
    -- Check for uniqueness based on entity type
    LOOP
        CASE entity_type
            WHEN 'user' THEN
                IF NOT EXISTS (SELECT 1 FROM users WHERE permalink = final_permalink) THEN
                    RETURN final_permalink;
                END IF;
            WHEN 'group' THEN
                IF NOT EXISTS (SELECT 1 FROM groups WHERE permalink = final_permalink) THEN
                    RETURN final_permalink;
                END IF;
            WHEN 'event' THEN
                IF NOT EXISTS (SELECT 1 FROM events WHERE permalink = final_permalink) THEN
                    RETURN final_permalink;
                END IF;
            WHEN 'book' THEN
                IF NOT EXISTS (SELECT 1 FROM books WHERE permalink = final_permalink) THEN
                    RETURN final_permalink;
                END IF;
            WHEN 'author' THEN
                IF NOT EXISTS (SELECT 1 FROM authors WHERE permalink = final_permalink) THEN
                    RETURN final_permalink;
                END IF;
            WHEN 'publisher' THEN
                IF NOT EXISTS (SELECT 1 FROM publishers WHERE permalink = final_permalink) THEN
                    RETURN final_permalink;
                END IF;
            ELSE
                RETURN final_permalink;
        END CASE;
        
        -- Add counter if permalink exists
        final_permalink := base_permalink || '-' || counter;
        counter := counter + 1;
        
        -- Prevent infinite loop
        IF counter > 100 THEN
            final_permalink := base_permalink || '-' || substr(md5(random()::text), 1, 8);
            RETURN final_permalink;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a function to validate permalinks
CREATE OR REPLACE FUNCTION validate_permalink(permalink text)
RETURNS boolean AS $$
BEGIN
    -- Check if permalink is valid (alphanumeric and hyphens only, 3-100 chars)
    IF permalink ~ '^[a-z0-9-]{3,100}$' AND permalink NOT LIKE '%-' AND permalink NOT LIKE '-%' THEN
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check permalink availability
CREATE OR REPLACE FUNCTION check_permalink_availability(permalink text, entity_type text, exclude_id uuid DEFAULT NULL)
RETURNS boolean AS $$
BEGIN
    CASE entity_type
        WHEN 'user' THEN
            IF exclude_id IS NOT NULL THEN
                RETURN NOT EXISTS (SELECT 1 FROM users WHERE permalink = permalink AND id != exclude_id);
            ELSE
                RETURN NOT EXISTS (SELECT 1 FROM users WHERE permalink = permalink);
            END IF;
        WHEN 'group' THEN
            IF exclude_id IS NOT NULL THEN
                RETURN NOT EXISTS (SELECT 1 FROM groups WHERE permalink = permalink AND id != exclude_id);
            ELSE
                RETURN NOT EXISTS (SELECT 1 FROM groups WHERE permalink = permalink);
            END IF;
        WHEN 'event' THEN
            IF exclude_id IS NOT NULL THEN
                RETURN NOT EXISTS (SELECT 1 FROM events WHERE permalink = permalink AND id != exclude_id);
            ELSE
                RETURN NOT EXISTS (SELECT 1 FROM events WHERE permalink = permalink);
            END IF;
        WHEN 'book' THEN
            IF exclude_id IS NOT NULL THEN
                RETURN NOT EXISTS (SELECT 1 FROM books WHERE permalink = permalink AND id != exclude_id);
            ELSE
                RETURN NOT EXISTS (SELECT 1 FROM books WHERE permalink = permalink);
            END IF;
        WHEN 'author' THEN
            IF exclude_id IS NOT NULL THEN
                RETURN NOT EXISTS (SELECT 1 FROM authors WHERE permalink = permalink AND id != exclude_id);
            ELSE
                RETURN NOT EXISTS (SELECT 1 FROM authors WHERE permalink = permalink);
            END IF;
        WHEN 'publisher' THEN
            IF exclude_id IS NOT NULL THEN
                RETURN NOT EXISTS (SELECT 1 FROM publishers WHERE permalink = permalink AND id != exclude_id);
            ELSE
                RETURN NOT EXISTS (SELECT 1 FROM publishers WHERE permalink = permalink);
            END IF;
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get entity by permalink
CREATE OR REPLACE FUNCTION get_entity_by_permalink(permalink text, entity_type text)
RETURNS uuid AS $$
DECLARE
    entity_id uuid;
BEGIN
    CASE entity_type
        WHEN 'user' THEN
            SELECT id INTO entity_id FROM users WHERE permalink = permalink LIMIT 1;
        WHEN 'group' THEN
            SELECT id INTO entity_id FROM groups WHERE permalink = permalink LIMIT 1;
        WHEN 'event' THEN
            SELECT id INTO entity_id FROM events WHERE permalink = permalink LIMIT 1;
        WHEN 'book' THEN
            SELECT id INTO entity_id FROM books WHERE permalink = permalink LIMIT 1;
        WHEN 'author' THEN
            SELECT id INTO entity_id FROM authors WHERE permalink = permalink LIMIT 1;
        WHEN 'publisher' THEN
            SELECT id INTO entity_id FROM publishers WHERE permalink = permalink LIMIT 1;
        ELSE
            RETURN NULL;
    END CASE;
    
    RETURN entity_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON COLUMN "public"."users"."permalink" IS 'Custom URL-friendly identifier for users';
COMMENT ON COLUMN "public"."groups"."permalink" IS 'Custom URL-friendly identifier for groups';
COMMENT ON COLUMN "public"."events"."permalink" IS 'Custom URL-friendly identifier for events';
COMMENT ON COLUMN "public"."books"."permalink" IS 'Custom URL-friendly identifier for books';
COMMENT ON COLUMN "public"."authors"."permalink" IS 'Custom URL-friendly identifier for authors';
COMMENT ON COLUMN "public"."publishers"."permalink" IS 'Custom URL-friendly identifier for publishers';

COMMENT ON FUNCTION generate_permalink(text, text) IS 'Generates a unique permalink from input text';
COMMENT ON FUNCTION validate_permalink(text) IS 'Validates if a permalink format is correct';
COMMENT ON FUNCTION check_permalink_availability(text, text, uuid) IS 'Checks if a permalink is available for a given entity type';
COMMENT ON FUNCTION get_entity_by_permalink(text, text) IS 'Gets entity ID by permalink and entity type'; 