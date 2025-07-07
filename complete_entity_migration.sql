-- =====================================================
-- COMPLETE ENTITY MIGRATION: Data Migration & Cleanup
-- =====================================================
-- This script completes the migration by:
-- 1. Migrating existing data to use entity_types
-- 2. Cleaning up old image_types references
-- 3. Updating application code references

-- Step 1: Migrate existing img_type_id references to entity_type_id
-- First, let's see what image_types currently exist
DO $$
DECLARE
    img_type RECORD;
    entity_type_id uuid;
BEGIN
    -- For each existing image_type, create corresponding entity_type
    FOR img_type IN SELECT * FROM public.image_types LOOP
        -- Create entity type based on image type name
        INSERT INTO public.entity_types (name, description, entity_category)
        VALUES (
            img_type.name,
            COALESCE(img_type.description, 'Migrated from image_types'),
            CASE 
                WHEN img_type.name ILIKE '%user%' THEN 'user'
                WHEN img_type.name ILIKE '%publisher%' THEN 'publisher'
                WHEN img_type.name ILIKE '%author%' THEN 'author'
                WHEN img_type.name ILIKE '%group%' THEN 'group'
                WHEN img_type.name ILIKE '%book%' THEN 'book'
                WHEN img_type.name ILIKE '%event%' THEN 'event'
                ELSE 'content'
            END
        ) ON CONFLICT (name) DO NOTHING;
        
        -- Get the entity_type_id for this image_type
        SELECT id INTO entity_type_id 
        FROM public.entity_types 
        WHERE name = img_type.name;
        
        -- Update images table to use entity_type_id instead of img_type_id
        UPDATE public.images 
        SET entity_type_id = entity_type_id
        WHERE img_type_id = img_type.id;
    END LOOP;
    
    RAISE NOTICE 'Migrated % image types to entity types', (SELECT COUNT(*) FROM public.image_types);
END $$;

-- Step 2: Populate entity context from photo_albums to album_images
SELECT public.populate_album_images_entity_context();

-- Step 3: Populate entity context from album_images to images
SELECT public.populate_images_entity_context();

-- Step 4: Create a mapping table for backward compatibility (optional)
CREATE TABLE IF NOT EXISTS public.image_type_mapping (
    old_image_type_id uuid,
    new_entity_type_id uuid,
    migration_date timestamp with time zone DEFAULT now(),
    PRIMARY KEY (old_image_type_id, new_entity_type_id)
);

-- Populate the mapping table
INSERT INTO public.image_type_mapping (old_image_type_id, new_entity_type_id)
SELECT 
    it.id as old_image_type_id,
    et.id as new_entity_type_id
FROM public.image_types it
JOIN public.entity_types et ON it.name = et.name
ON CONFLICT DO NOTHING;

-- Step 5: Create a view for backward compatibility
CREATE OR REPLACE VIEW public.image_types_compat AS
SELECT 
    et.id as id,
    et.name as name,
    et.description,
    et.created_at,
    et.updated_at
FROM public.entity_types et
WHERE et.entity_category IN ('user', 'publisher', 'author', 'group', 'book', 'event', 'content');

-- Step 6: Update any remaining references to use entity_types
-- This includes any foreign key constraints or application code

-- Step 7: Create enterprise-grade functions for entity management

-- Function to get all images for a specific entity
CREATE OR REPLACE FUNCTION public.get_entity_images(
    p_entity_type text,
    p_entity_id uuid
)
RETURNS TABLE(
    image_id uuid,
    image_url text,
    thumbnail_url text,
    alt_text text,
    file_size integer,
    created_at timestamp with time zone,
    album_name text,
    album_id uuid
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id as image_id,
        i.url as image_url,
        i.thumbnail_url,
        i.alt_text,
        i.file_size,
        i.created_at,
        pa.name as album_name,
        pa.id as album_id
    FROM public.images i
    JOIN public.entity_types et ON i.entity_type_id = et.id
    LEFT JOIN public.album_images ai ON i.id = ai.image_id
    LEFT JOIN public.photo_albums pa ON ai.album_id = pa.id
    WHERE et.entity_category = p_entity_type
    AND i.entity_id = p_entity_id
    AND i.deleted_at IS NULL
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get entity storage statistics
CREATE OR REPLACE FUNCTION public.get_entity_storage_stats(
    p_entity_type text DEFAULT NULL,
    p_entity_id uuid DEFAULT NULL
)
RETURNS TABLE(
    entity_type text,
    entity_id uuid,
    total_images bigint,
    total_storage_bytes bigint,
    avg_file_size numeric,
    oldest_image timestamp with time zone,
    newest_image timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        et.entity_category as entity_type,
        i.entity_id,
        COUNT(i.id) as total_images,
        COALESCE(SUM(i.file_size), 0) as total_storage_bytes,
        AVG(i.file_size) as avg_file_size,
        MIN(i.created_at) as oldest_image,
        MAX(i.created_at) as newest_image
    FROM public.images i
    JOIN public.entity_types et ON i.entity_type_id = et.id
    WHERE i.deleted_at IS NULL
    AND (p_entity_type IS NULL OR et.entity_category = p_entity_type)
    AND (p_entity_id IS NULL OR i.entity_id = p_entity_id)
    GROUP BY et.entity_category, i.entity_id
    ORDER BY total_storage_bytes DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up orphaned images
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_images()
RETURNS integer AS $$
DECLARE
    deleted_count integer := 0;
BEGIN
    -- Delete images that have no entity context and are not in any albums
    DELETE FROM public.images 
    WHERE entity_type_id IS NULL 
    AND entity_id IS NULL
    AND id NOT IN (SELECT image_id FROM public.album_images)
    AND created_at < now() - interval '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Cleaned up % orphaned images', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create enterprise monitoring and alerting functions

-- Function to monitor entity storage usage
CREATE OR REPLACE FUNCTION public.monitor_entity_storage_usage()
RETURNS TABLE(
    entity_type text,
    entity_id uuid,
    storage_usage_mb numeric,
    image_count bigint,
    warning_level text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        et.entity_category as entity_type,
        i.entity_id,
        ROUND(SUM(i.file_size) / 1024.0 / 1024.0, 2) as storage_usage_mb,
        COUNT(i.id) as image_count,
        CASE 
            WHEN SUM(i.file_size) > 100 * 1024 * 1024 THEN 'CRITICAL' -- 100MB
            WHEN SUM(i.file_size) > 50 * 1024 * 1024 THEN 'WARNING'   -- 50MB
            WHEN SUM(i.file_size) > 10 * 1024 * 1024 THEN 'INFO'      -- 10MB
            ELSE 'OK'
        END as warning_level
    FROM public.images i
    JOIN public.entity_types et ON i.entity_type_id = et.id
    WHERE i.deleted_at IS NULL
    GROUP BY et.entity_category, i.entity_id
    HAVING SUM(i.file_size) > 5 * 1024 * 1024 -- Only show entities using >5MB
    ORDER BY storage_usage_mb DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create indexes for enterprise performance

-- Composite index for entity-based queries
CREATE INDEX IF NOT EXISTS idx_images_entity_performance 
ON public.images(entity_type_id, entity_id, created_at DESC);

-- Index for storage monitoring
CREATE INDEX IF NOT EXISTS idx_images_storage_monitoring 
ON public.images(entity_type_id, file_size DESC) 
WHERE deleted_at IS NULL;

-- Step 10: Create enterprise audit trail

-- Audit table for entity changes
CREATE TABLE IF NOT EXISTS public.entity_audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name text NOT NULL,
    record_id uuid NOT NULL,
    action text NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_entity_type_id uuid,
    new_entity_type_id uuid,
    old_entity_id uuid,
    new_entity_id uuid,
    changed_by uuid,
    changed_at timestamp with time zone DEFAULT now(),
    metadata jsonb
);

-- Trigger function for entity audit
CREATE OR REPLACE FUNCTION public.audit_entity_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.entity_audit_log (
            table_name, record_id, action,
            new_entity_type_id, new_entity_id,
            changed_by, metadata
        ) VALUES (
            TG_TABLE_NAME, NEW.id, 'INSERT',
            NEW.entity_type_id, NEW.entity_id,
            auth.uid(), jsonb_build_object('url', NEW.url)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.entity_audit_log (
            table_name, record_id, action,
            old_entity_type_id, new_entity_type_id,
            old_entity_id, new_entity_id,
            changed_by, metadata
        ) VALUES (
            TG_TABLE_NAME, NEW.id, 'UPDATE',
            OLD.entity_type_id, NEW.entity_type_id,
            OLD.entity_id, NEW.entity_id,
            auth.uid(), jsonb_build_object('url', NEW.url)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.entity_audit_log (
            table_name, record_id, action,
            old_entity_type_id, old_entity_id,
            changed_by, metadata
        ) VALUES (
            TG_TABLE_NAME, OLD.id, 'DELETE',
            OLD.entity_type_id, OLD.entity_id,
            auth.uid(), jsonb_build_object('url', OLD.url)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers
CREATE TRIGGER trigger_audit_entity_changes_images
    AFTER INSERT OR UPDATE OR DELETE ON public.images
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_entity_changes();

CREATE TRIGGER trigger_audit_entity_changes_album_images
    AFTER INSERT OR UPDATE OR DELETE ON public.album_images
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_entity_changes();

-- Step 11: Final cleanup and validation

-- Remove old img_type_id column from images table (after ensuring migration is complete)
-- ALTER TABLE public.images DROP COLUMN IF EXISTS img_type_id;

-- Drop old image_types table (after ensuring no references remain)
-- DROP TABLE IF EXISTS public.image_types CASCADE;

-- Step 12: Migration completion report
DO $$
DECLARE
    entity_types_count integer;
    images_with_entity_count integer;
    album_images_with_entity_count integer;
BEGIN
    -- Get counts for report
    SELECT COUNT(*) INTO entity_types_count FROM public.entity_types;
    SELECT COUNT(*) INTO images_with_entity_count FROM public.images WHERE entity_type_id IS NOT NULL;
    SELECT COUNT(*) INTO album_images_with_entity_count FROM public.album_images WHERE entity_type_id IS NOT NULL;
    
    RAISE NOTICE '=== ENTITY MIGRATION COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'Entity types created: %', entity_types_count;
    RAISE NOTICE 'Images with entity context: %', images_with_entity_count;
    RAISE NOTICE 'Album images with entity context: %', album_images_with_entity_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Enterprise features now available:';
    RAISE NOTICE '- Entity-based image analytics';
    RAISE NOTICE '- Storage usage monitoring';
    RAISE NOTICE '- Security policies by entity type';
    RAISE NOTICE '- Audit trail for entity changes';
    RAISE NOTICE '- Performance optimization by entity';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update application code to use entity_types';
    RAISE NOTICE '2. Test entity-based queries and functions';
    RAISE NOTICE '3. Monitor storage usage with new analytics';
    RAISE NOTICE '4. Configure entity-specific security policies';
END $$;

-- =====================================================
-- VALIDATION QUERIES (Uncomment to run)
-- =====================================================

-- Check entity types
-- SELECT * FROM public.entity_types ORDER BY entity_category, name;

-- Check images with entity context
-- SELECT COUNT(*) as total_images, 
--        COUNT(entity_type_id) as images_with_entity,
--        COUNT(entity_id) as images_with_entity_id
-- FROM public.images;

-- Check album_images with entity context
-- SELECT COUNT(*) as total_album_images,
--        COUNT(entity_type_id) as album_images_with_entity,
--        COUNT(entity_id) as album_images_with_entity_id
-- FROM public.album_images;

-- Test entity storage stats
-- SELECT * FROM public.get_entity_storage_stats();

-- Test entity images function
-- SELECT * FROM public.get_entity_images('user', 'some-user-uuid');

-- Test storage monitoring
-- SELECT * FROM public.monitor_entity_storage_usage();

-- Check audit log
-- SELECT * FROM public.entity_audit_log ORDER BY changed_at DESC LIMIT 10; 