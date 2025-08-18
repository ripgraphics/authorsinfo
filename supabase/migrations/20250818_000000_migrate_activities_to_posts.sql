-- Migration: Migrate posts from activities table to posts table
-- Date: 2025-08-18
-- Purpose: Consolidate post system for full CRUD operations

-- Step 1: Create temporary table to store migration data
CREATE TEMP TABLE migration_posts AS
SELECT 
    id,
    user_id,
    text as content_text,
    image_url,
    link_url,
    created_at,
    updated_at,
    visibility,
    content_type,
    content_summary,
    hashtags,
    metadata,
    entity_type,
    entity_id,
    like_count,
    comment_count,
    share_count,
    view_count,
    engagement_score,
    'migrated_from_activities' as migration_source
FROM activities 
WHERE activity_type = 'post_created' 
  AND text IS NOT NULL 
  AND text != '';

-- Step 2: Insert migrated posts into posts table
INSERT INTO posts (
    id,
    user_id,
    content,
    image_url,
    link_url,
    created_at,
    updated_at,
    visibility,
    content_type,
    content_summary,
    tags,
    metadata,
    entity_type,
    entity_id,
    like_count,
    comment_count,
    share_count,
    view_count,
    engagement_score,
    publish_status,
    last_activity_at,
    enterprise_features
)
SELECT 
    id,
    user_id,
    jsonb_build_object(
        'text', content_text,
        'type', content_type,
        'summary', content_summary,
        'hashtags', hashtags,
        'migration_source', migration_source,
        'original_activity_id', id
    ) as content,
    image_url,
    link_url,
    created_at,
    COALESCE(updated_at, created_at) as updated_at,
    COALESCE(visibility, 'public') as visibility,
    COALESCE(content_type, 'text') as content_type,
    content_summary,
    COALESCE(hashtags, ARRAY[]::text[]) as tags,
    COALESCE(metadata, '{}'::jsonb) as metadata,
    COALESCE(entity_type, 'user') as entity_type,
    entity_id,
    COALESCE(like_count, 0) as like_count,
    COALESCE(comment_count, 0) as comment_count,
    COALESCE(share_count, 0) as share_count,
    COALESCE(view_count, 0) as view_count,
    COALESCE(engagement_score, 0) as engagement_score,
    'published' as publish_status,
    COALESCE(updated_at, created_at) as last_activity_at,
    jsonb_build_object(
        'migration_source', migration_source,
        'migrated_at', now(),
        'original_activity_id', id
    ) as enterprise_features
FROM migration_posts;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_entity_type_entity_id ON posts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_publish_status ON posts(publish_status);
CREATE INDEX IF NOT EXISTS idx_posts_content_gin ON posts USING GIN (content);
CREATE INDEX IF NOT EXISTS idx_posts_tags_gin ON posts USING GIN (tags);

-- Step 4: Create RLS policies for posts table
CREATE POLICY IF NOT EXISTS "Users can read public posts" ON posts
    FOR SELECT USING (visibility = 'public');

CREATE POLICY IF NOT EXISTS "Users can read their own posts" ON posts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can read friends posts" ON posts
    FOR SELECT USING (
        visibility = 'friends' AND 
        EXISTS (
            SELECT 1 FROM friends 
            WHERE (user_id = auth.uid() AND friend_id = posts.user_id) 
               OR (friend_id = auth.uid() AND user_id = posts.user_id)
        )
    );

CREATE POLICY IF NOT EXISTS "Users can create posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- Step 5: Create foreign key relationships
-- Add foreign key to users table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE posts 
        ADD CONSTRAINT IF NOT EXISTS fk_posts_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 6: Create function to get posts for timeline
CREATE OR REPLACE FUNCTION get_user_timeline_posts(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    content JSONB,
    image_url TEXT,
    link_url TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    visibility TEXT,
    content_type TEXT,
    content_summary TEXT,
    tags TEXT[],
    like_count INTEGER,
    comment_count INTEGER,
    share_count INTEGER,
    view_count INTEGER,
    engagement_score NUMERIC,
    publish_status TEXT,
    last_activity_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.content,
        p.image_url,
        p.link_url,
        p.created_at,
        p.updated_at,
        p.visibility,
        p.content_type,
        p.content_summary,
        p.tags,
        p.like_count,
        p.comment_count,
        p.share_count,
        p.view_count,
        p.engagement_score,
        p.publish_status,
        p.last_activity_at
    FROM posts p
    WHERE p.user_id = p_user_id
      AND p.publish_status = 'published'
      AND p.is_deleted = false
      AND p.is_hidden = false
      AND (
          p.visibility = 'public' OR
          p.visibility = 'friends' OR
          p.user_id = auth.uid()
      )
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Step 7: Create function to get posts by entity
CREATE OR REPLACE FUNCTION get_entity_posts(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    content JSONB,
    image_url TEXT,
    link_url TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    visibility TEXT,
    content_type TEXT,
    content_summary TEXT,
    tags TEXT[],
    like_count INTEGER,
    comment_count INTEGER,
    share_count INTEGER,
    view_count INTEGER,
    engagement_score NUMERIC,
    publish_status TEXT,
    last_activity_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.content,
        p.image_url,
        p.link_url,
        p.created_at,
        p.updated_at,
        p.visibility,
        p.content_type,
        p.content_summary,
        p.tags,
        p.like_count,
        p.comment_count,
        p.share_count,
        p.view_count,
        p.engagement_score,
        p.publish_status,
        p.last_activity_at
    FROM posts p
    WHERE p.entity_type = p_entity_type
      AND p.entity_id = p_entity_id
      AND p.publish_status = 'published'
      AND p.is_deleted = false
      AND p.is_hidden = false
      AND (
          p.visibility = 'public' OR
          p.visibility = 'friends' OR
          p.user_id = auth.uid()
      )
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Step 8: Create view for backward compatibility
CREATE OR REPLACE VIEW activities_posts_view AS
SELECT 
    p.id,
    p.user_id,
    'post_created' as activity_type,
    p.content->>'text' as text,
    p.image_url,
    p.link_url,
    p.created_at,
    p.updated_at,
    p.visibility,
    p.content_type,
    p.content_summary,
    p.tags as hashtags,
    p.metadata,
    p.entity_type,
    p.entity_id,
    p.like_count,
    p.comment_count,
    p.share_count,
    p.view_count,
    p.engagement_score,
    p.content as data
FROM posts p
WHERE p.publish_status = 'published'
  AND p.is_deleted = false
  AND p.is_hidden = false;

-- Step 9: Create data validation function
CREATE OR REPLACE FUNCTION validate_posts_migration()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT,
    count_value INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check 1: Count verification
    RETURN QUERY
    SELECT 
        'Count Verification'::TEXT,
        CASE 
            WHEN (SELECT COUNT(*) FROM posts WHERE content->>'migration_source' = 'migrated_from_activities') = 
                 (SELECT COUNT(*) FROM activities WHERE activity_type = 'post_created' AND text IS NOT NULL AND text != '')
            THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        'Migrated posts count matches source activities count'::TEXT,
        (SELECT COUNT(*) FROM posts WHERE content->>'migration_source' = 'migrated_from_activities')::INTEGER;
    
    -- Check 2: Data integrity
    RETURN QUERY
    SELECT 
        'Data Integrity'::TEXT,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM posts p 
                JOIN activities a ON p.content->>'original_activity_id' = a.id::TEXT
                WHERE p.content->>'migration_source' = 'migrated_from_activities'
                  AND p.content->>'text' = a.text
            )
            THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        'Post content matches original activity content'::TEXT,
        (SELECT COUNT(*) FROM posts p 
         JOIN activities a ON p.content->>'original_activity_id' = a.id::TEXT
         WHERE p.content->>'migration_source' = 'migrated_from_activities'
           AND p.content->>'text' = a.text)::INTEGER;
    
    -- Check 3: User association
    RETURN QUERY
    SELECT 
        'User Association'::TEXT,
        CASE 
            WHEN NOT EXISTS (
                SELECT 1 FROM posts p 
                JOIN activities a ON p.content->>'original_activity_id' = a.id::TEXT
                WHERE p.content->>'migration_source' = 'migrated_from_activities'
                  AND p.user_id != a.user_id
            )
            THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        'All migrated posts maintain correct user association'::TEXT,
        (SELECT COUNT(*) FROM posts WHERE content->>'migration_source' = 'migrated_from_activities')::INTEGER;
END;
$$;

-- Step 10: Create rollback function
CREATE OR REPLACE FUNCTION rollback_posts_migration()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete migrated posts
    DELETE FROM posts WHERE content->>'migration_source' = 'migrated_from_activities';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN 'Rollback completed. Deleted ' || deleted_count || ' migrated posts.';
END;
$$;

-- Step 11: Create migration status function
CREATE OR REPLACE FUNCTION get_migration_status()
RETURNS TABLE (
    total_activities INTEGER,
    migrated_posts INTEGER,
    new_posts INTEGER,
    migration_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM activities WHERE activity_type = 'post_created' AND text IS NOT NULL AND text != '')::INTEGER,
        (SELECT COUNT(*) FROM posts WHERE content->>'migration_source' = 'migrated_from_activities')::INTEGER,
        (SELECT COUNT(*) FROM posts WHERE content->>'migration_source' IS NULL)::INTEGER,
        CASE 
            WHEN (SELECT COUNT(*) FROM posts WHERE content->>'migration_source' = 'migrated_from_activities') = 
                 (SELECT COUNT(*) FROM activities WHERE activity_type = 'post_created' AND text IS NOT NULL AND text != '')
            THEN 'COMPLETED'::TEXT
            ELSE 'INCOMPLETE'::TEXT
        END;
END;
$$;

-- Step 12: Log migration results
DO $$
DECLARE
    migrated_count INTEGER;
    total_activities INTEGER;
BEGIN
    -- Get count of migrated posts
    SELECT COUNT(*) INTO migrated_count FROM posts WHERE content->>'migration_source' = 'migrated_from_activities';
    
    -- Get total count of post activities
    SELECT COUNT(*) INTO total_activities FROM activities WHERE activity_type = 'post_created' AND text IS NOT NULL AND text != '';
    
    -- Log migration results
    RAISE NOTICE 'Migration completed: % posts migrated from activities table', migrated_count;
    RAISE NOTICE 'Total post activities found: %', total_activities;
    
    -- Validate migration
    IF migrated_count = total_activities THEN
        RAISE NOTICE 'Migration validation: SUCCESS - All posts migrated successfully';
    ELSE
        RAISE WARNING 'Migration validation: WARNING - Count mismatch. Migrated: %, Total: %', migrated_count, total_activities;
    END IF;
END $$;

-- Migration completed successfully
COMMENT ON FUNCTION get_user_timeline_posts IS 'Get posts for user timeline (replaces activities query)';
COMMENT ON FUNCTION get_entity_posts IS 'Get posts by entity type and ID';
COMMENT ON FUNCTION validate_posts_migration IS 'Validate the integrity of posts migration';
COMMENT ON FUNCTION rollback_posts_migration IS 'Emergency rollback function for posts migration';
COMMENT ON FUNCTION get_migration_status IS 'Get current migration status and statistics';
COMMENT ON VIEW activities_posts_view IS 'Backward compatibility view for activities posts';
