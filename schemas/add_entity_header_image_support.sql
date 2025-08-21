-- Add Entity Header Image Support to All Entities
-- This enables entity header cover images to work consistently across all entity types

-- 1. Add entity_header_image_id to books table
ALTER TABLE "public"."books" 
ADD COLUMN IF NOT EXISTS "entity_header_image_id" "uuid";

-- Add comment
COMMENT ON COLUMN "public"."books"."entity_header_image_id" IS 'Entity header cover image for books (wide banner image)';

-- 2. Add entity_header_image_id to authors table  
ALTER TABLE "public"."authors" 
ADD COLUMN IF NOT EXISTS "entity_header_image_id" "uuid";

-- Add comment
COMMENT ON COLUMN "public"."authors"."entity_header_image_id" IS 'Entity header cover image for authors (wide banner image)';

-- 3. Add entity_header_image_id to publishers table
ALTER TABLE "public"."publishers" 
ADD COLUMN IF NOT EXISTS "entity_header_image_id" "uuid";

-- Add comment
COMMENT ON COLUMN "public"."publishers"."entity_header_image_id" IS 'Entity header cover image for publishers (wide banner image)';

-- 4. Add entity_header_image_id to events table
ALTER TABLE "public"."events" 
ADD COLUMN IF NOT EXISTS "entity_header_image_id" "uuid";

-- Add comment
COMMENT ON COLUMN "public"."events"."entity_header_image_id" IS 'Entity header cover image for events (wide banner image)';

-- 5. Add entity_header_image_id to groups table
ALTER TABLE "public"."groups" 
ADD COLUMN IF NOT EXISTS "entity_header_image_id" "uuid";

-- Add comment
COMMENT ON COLUMN "public"."groups"."entity_header_image_id" IS 'Entity header cover image for groups (wide banner image)';

-- 6. Add entity_header_image_id to users table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        EXECUTE 'ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "entity_header_image_id" "uuid"';
        EXECUTE 'COMMENT ON COLUMN "public"."users"."entity_header_image_id" IS ''Entity header cover image for users (wide banner image)''';
    END IF;
END $$;

-- 7. Create indexes for better performance on entity header image lookups
CREATE INDEX IF NOT EXISTS "idx_books_entity_header_image" 
ON "public"."books" ("entity_header_image_id");

CREATE INDEX IF NOT EXISTS "idx_authors_entity_header_image" 
ON "public"."authors" ("entity_header_image_id");

CREATE INDEX IF NOT EXISTS "idx_publishers_entity_header_image" 
ON "public"."publishers" ("entity_header_image_id");

CREATE INDEX IF NOT EXISTS "idx_events_entity_header_image" 
ON "public"."events" ("entity_header_image_id");

CREATE INDEX IF NOT EXISTS "idx_groups_entity_header_image" 
ON "public"."groups" ("entity_header_image_id");

-- 8. Add foreign key constraints to ensure image integrity
-- Books
ALTER TABLE "public"."books" 
ADD CONSTRAINT IF NOT EXISTS "books_entity_header_image_id_fkey" 
FOREIGN KEY ("entity_header_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;

-- Authors  
ALTER TABLE "public"."authors" 
ADD CONSTRAINT IF NOT EXISTS "authors_entity_header_image_id_fkey" 
FOREIGN KEY ("entity_header_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;

-- Publishers
ALTER TABLE "public"."publishers" 
ADD CONSTRAINT IF NOT EXISTS "publishers_entity_header_image_id_fkey" 
FOREIGN KEY ("entity_header_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;

-- Events
ALTER TABLE "public"."events" 
ADD CONSTRAINT IF NOT EXISTS "events_entity_header_image_id_fkey" 
FOREIGN KEY ("entity_header_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;

-- Groups
ALTER TABLE "public"."groups" 
ADD CONSTRAINT IF NOT EXISTS "groups_entity_header_image_id_fkey" 
FOREIGN KEY ("entity_header_image_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;

-- 9. Create a function to get entity header image URL for any entity type
CREATE OR REPLACE FUNCTION "public"."get_entity_header_image_url"(
    p_entity_type "text",
    p_entity_id "uuid"
) RETURNS "text"
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
DECLARE
    v_image_url "text";
BEGIN
    -- Get entity header image URL based on entity type
    CASE p_entity_type
        WHEN 'book' THEN
            SELECT i.url INTO v_image_url
            FROM "public"."books" b
            JOIN "public"."images" i ON b.entity_header_image_id = i.id
            WHERE b.id = p_entity_id;
            
        WHEN 'author' THEN
            SELECT i.url INTO v_image_url
            FROM "public"."authors" a
            JOIN "public"."images" i ON a.entity_header_image_id = i.id
            WHERE a.id = p_entity_id;
            
        WHEN 'publisher' THEN
            SELECT i.url INTO v_image_url
            FROM "public"."publishers" p
            JOIN "public"."images" i ON p.entity_header_image_id = i.id
            WHERE p.id = p_entity_id;
            
        WHEN 'event' THEN
            SELECT i.url INTO v_image_url
            FROM "public"."events" e
            JOIN "public"."images" i ON e.entity_header_image_id = i.id
            WHERE e.id = p_entity_id;
            
        WHEN 'group' THEN
            SELECT i.url INTO v_image_url
            FROM "public"."groups" g
            JOIN "public"."images" i ON g.entity_header_image_id = i.id
            WHERE g.id = p_entity_id;
            
        WHEN 'user' THEN
            SELECT i.url INTO v_image_url
            FROM "public"."users" u
            JOIN "public"."images" i ON u.entity_header_image_id = i.id
            WHERE u.id = p_entity_id;
            
        ELSE
            v_image_url := NULL;
    END CASE;
    
    RETURN v_image_url;
END;
$$;

-- Add comment
COMMENT ON FUNCTION "public"."get_entity_header_image_url"("text", "uuid") IS 'Get entity header image URL for any entity type';

-- 10. Create a view for easy entity header image management
CREATE OR REPLACE VIEW "public"."entity_header_images" AS
SELECT 
    'book' as entity_type,
    id as entity_id,
    title as entity_name,
    entity_header_image_id,
    cover_image_id
FROM "public"."books"
WHERE entity_header_image_id IS NOT NULL

UNION ALL

SELECT 
    'author' as entity_type,
    id as entity_id,
    name as entity_name,
    entity_header_image_id,
    cover_image_id
FROM "public"."authors"
WHERE entity_header_image_id IS NOT NULL

UNION ALL

SELECT 
    'publisher' as entity_type,
    id as entity_id,
    name as entity_name,
    entity_header_image_id,
    cover_image_id
FROM "public"."publishers"
WHERE entity_header_image_id IS NOT NULL

UNION ALL

SELECT 
    'event' as entity_type,
    id as entity_id,
    title as entity_name,
    entity_header_image_id,
    cover_image_id
FROM "public"."events"
WHERE entity_header_image_id IS NOT NULL

UNION ALL

SELECT 
    'group' as entity_type,
    id as entity_id,
    name as entity_name,
    entity_header_image_id,
    cover_image_id
FROM "public"."groups"
WHERE entity_header_image_id IS NOT NULL;

-- Add comment
COMMENT ON VIEW "public"."entity_header_images" IS 'View of all entities with their header and cover images for easy management';

-- 11. Create RLS policies for entity header images (if RLS is enabled)
-- This ensures users can only see entity header images for entities they have access to
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'images' 
        AND schemaname = 'public'
    ) THEN
        -- Add RLS policy for entity header images
        EXECUTE 'CREATE POLICY "entity_header_images_access" ON "public"."images"
            FOR SELECT USING (
                id IN (
                    SELECT entity_header_image_id FROM "public"."books" WHERE entity_header_image_id IS NOT NULL
                    UNION ALL
                    SELECT entity_header_image_id FROM "public"."authors" WHERE entity_header_image_id IS NOT NULL
                    UNION ALL
                    SELECT entity_header_image_id FROM "public"."publishers" WHERE entity_header_image_id IS NOT NULL
                    UNION ALL
                    SELECT entity_header_image_id FROM "public"."events" WHERE entity_header_image_id IS NOT NULL
                    UNION ALL
                    SELECT entity_header_image_id FROM "public"."groups" WHERE entity_header_image_id IS NOT NULL
                )
            )';
    END IF;
END $$;

-- Migration complete message
DO $$
BEGIN
    RAISE NOTICE 'Entity header image support has been added to all entity tables';
    RAISE NOTICE 'New fields: entity_header_image_id added to books, authors, publishers, events, groups';
    RAISE NOTICE 'New function: get_entity_header_image_url(entity_type, entity_id)';
    RAISE NOTICE 'New view: entity_header_images for easy management';
END $$;
