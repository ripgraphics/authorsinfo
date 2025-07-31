-- =====================================================================================
-- ENTERPRISE UNIFIED SOCIAL SYSTEM
-- Best-in-class unified social features for all entities
-- =====================================================================================

-- =====================================================================================
-- 1. ENHANCE EXISTING TABLES FOR UNIFIED SYSTEM
-- =====================================================================================

-- Add entity_type and entity_id columns to existing comments table
ALTER TABLE "public"."comments" 
ADD COLUMN IF NOT EXISTS "entity_type" VARCHAR(50) DEFAULT 'feed_entry',
ADD COLUMN IF NOT EXISTS "entity_id" UUID,
ADD COLUMN IF NOT EXISTS "parent_id" UUID;

-- Add entity_type and entity_id columns to existing likes table  
ALTER TABLE "public"."likes" 
ADD COLUMN IF NOT EXISTS "entity_type" VARCHAR(50) DEFAULT 'feed_entry',
ADD COLUMN IF NOT EXISTS "entity_id" UUID;

-- Update existing records to use feed_entry as entity_type
UPDATE "public"."comments" 
SET entity_id = feed_entry_id 
WHERE entity_id IS NULL AND feed_entry_id IS NOT NULL;

UPDATE "public"."likes" 
SET entity_id = feed_entry_id 
WHERE entity_id IS NULL AND feed_entry_id IS NOT NULL;

-- =====================================================================================
-- 2. CREATE UNIFIED SOCIAL FEATURES TABLES
-- =====================================================================================

-- Unified Shares System
CREATE TABLE IF NOT EXISTS "public"."shares" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "entity_type" VARCHAR(50) NOT NULL, -- photo, book, author, publisher, group, event, feed_entry, etc.
    "entity_id" UUID NOT NULL,
    "share_type" VARCHAR(50) DEFAULT 'standard' CHECK (share_type IN ('standard', 'story', 'repost', 'quote')),
    "share_platform" VARCHAR(50), -- facebook, twitter, instagram, linkedin, etc.
    "share_url" TEXT,
    "share_text" TEXT,
    "is_public" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Ensure unique shares per user per entity
    UNIQUE("user_id", "entity_type", "entity_id"),
    
    -- Indexes for performance
    CONSTRAINT "shares_entity_type_check" CHECK (
        entity_type IN ('photo', 'book', 'author', 'publisher', 'group', 'event', 'feed_entry', 'album', 'image', 'discussion', 'review')
    )
);

-- Unified Bookmarks System
CREATE TABLE IF NOT EXISTS "public"."bookmarks" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "bookmark_folder" VARCHAR(100) DEFAULT 'default',
    "notes" TEXT,
    "tags" TEXT[],
    "is_private" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Ensure unique bookmarks per user per entity
    UNIQUE("user_id", "entity_type", "entity_id"),
    
    -- Indexes for performance
    CONSTRAINT "bookmarks_entity_type_check" CHECK (
        entity_type IN ('photo', 'book', 'author', 'publisher', 'group', 'event', 'feed_entry', 'album', 'image', 'discussion', 'review')
    )
);

-- Enhanced Tags System (unified)
CREATE TABLE IF NOT EXISTS "public"."entity_tags" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "tag_name" VARCHAR(100) NOT NULL,
    "tag_category" VARCHAR(50), -- content, mood, genre, topic, etc.
    "tag_color" VARCHAR(7), -- hex color code
    "created_by" UUID REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "is_verified" BOOLEAN DEFAULT false,
    "usage_count" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Ensure unique tags per entity
    UNIQUE("entity_type", "entity_id", "tag_name"),
    
    -- Indexes for performance
    CONSTRAINT "entity_tags_entity_type_check" CHECK (
        entity_type IN ('photo', 'book', 'author', 'publisher', 'group', 'event', 'feed_entry', 'album', 'image', 'discussion', 'review')
    )
);

-- Comment Reactions System
CREATE TABLE IF NOT EXISTS "public"."comment_reactions" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "comment_id" UUID NOT NULL REFERENCES "public"."comments"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "reaction_type" VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'haha', 'wow', 'sad', 'angry', 'care')),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Ensure unique reactions per user per comment
    UNIQUE("comment_id", "user_id", "reaction_type")
);

-- =====================================================================================
-- 3. CREATE PERFORMANCE INDEXES
-- =====================================================================================

-- Comments indexes
CREATE INDEX IF NOT EXISTS "idx_comments_entity_lookup" ON "public"."comments"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_comments_user_created" ON "public"."comments"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_comments_parent_id" ON "public"."comments"("parent_id") WHERE "parent_id" IS NOT NULL;

-- Likes indexes
CREATE INDEX IF NOT EXISTS "idx_likes_entity_lookup" ON "public"."likes"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_likes_user_created" ON "public"."likes"("user_id", "created_at");

-- Shares indexes
CREATE INDEX IF NOT EXISTS "idx_shares_entity_lookup" ON "public"."shares"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_shares_user_created" ON "public"."shares"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_shares_platform" ON "public"."shares"("share_platform");

-- Bookmarks indexes
CREATE INDEX IF NOT EXISTS "idx_bookmarks_entity_lookup" ON "public"."bookmarks"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_bookmarks_user_folder" ON "public"."bookmarks"("user_id", "bookmark_folder");
CREATE INDEX IF NOT EXISTS "idx_bookmarks_tags" ON "public"."bookmarks" USING GIN("tags");

-- Entity tags indexes
CREATE INDEX IF NOT EXISTS "idx_entity_tags_entity_lookup" ON "public"."entity_tags"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_entity_tags_name_category" ON "public"."entity_tags"("tag_name", "tag_category");
CREATE INDEX IF NOT EXISTS "idx_entity_tags_usage" ON "public"."entity_tags"("usage_count" DESC);

-- Comment reactions indexes
CREATE INDEX IF NOT EXISTS "idx_comment_reactions_comment" ON "public"."comment_reactions"("comment_id");
CREATE INDEX IF NOT EXISTS "idx_comment_reactions_user" ON "public"."comment_reactions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_comment_reactions_type" ON "public"."comment_reactions"("reaction_type");

-- =====================================================================================
-- 4. CREATE ENTERPRISE HELPER FUNCTIONS
-- =====================================================================================

-- Get entity social statistics
CREATE OR REPLACE FUNCTION "public"."get_entity_social_stats"(
    p_entity_type VARCHAR(50),
    p_entity_id UUID,
    p_user_id UUID DEFAULT NULL
) RETURNS TABLE(
    like_count BIGINT,
    comment_count BIGINT,
    share_count BIGINT,
    bookmark_count BIGINT,
    tag_count BIGINT,
    is_liked BOOLEAN,
    is_bookmarked BOOLEAN,
    user_reaction_type VARCHAR(20)
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM "public"."likes" 
         WHERE entity_type = p_entity_type AND entity_id = p_entity_id)::BIGINT,
        
        (SELECT COUNT(*) FROM "public"."comments" 
         WHERE entity_type = p_entity_type AND entity_id = p_entity_id 
         AND is_deleted = false AND is_hidden = false)::BIGINT,
        
        (SELECT COUNT(*) FROM "public"."shares" 
         WHERE entity_type = p_entity_type AND entity_id = p_entity_id)::BIGINT,
        
        (SELECT COUNT(*) FROM "public"."bookmarks" 
         WHERE entity_type = p_entity_type AND entity_id = p_entity_id)::BIGINT,
        
        (SELECT COUNT(*) FROM "public"."entity_tags" 
         WHERE entity_type = p_entity_type AND entity_id = p_entity_id)::BIGINT,
        
        CASE WHEN p_user_id IS NOT NULL THEN
            EXISTS(SELECT 1 FROM "public"."likes" 
                   WHERE entity_type = p_entity_type AND entity_id = p_entity_id 
                   AND user_id = p_user_id)
        ELSE false END,
        
        CASE WHEN p_user_id IS NOT NULL THEN
            EXISTS(SELECT 1 FROM "public"."bookmarks" 
                   WHERE entity_type = p_entity_type AND entity_id = p_entity_id 
                   AND user_id = p_user_id)
        ELSE false END,
        
        CASE WHEN p_user_id IS NOT NULL THEN
            (SELECT reaction_type FROM "public"."comment_reactions" cr
             JOIN "public"."comments" c ON cr.comment_id = c.id
             WHERE c.entity_type = p_entity_type AND c.entity_id = p_entity_id 
             AND cr.user_id = p_user_id
             ORDER BY cr.created_at DESC LIMIT 1)
        ELSE NULL END;
END;
$$;

-- Check if user has liked entity
CREATE OR REPLACE FUNCTION "public"."has_user_liked_entity"(
    p_user_id UUID,
    p_entity_type VARCHAR(50),
    p_entity_id UUID
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM "public"."likes" 
        WHERE user_id = p_user_id 
        AND entity_type = p_entity_type 
        AND entity_id = p_entity_id
    );
END;
$$;

-- Toggle entity like
CREATE OR REPLACE FUNCTION "public"."toggle_entity_like"(
    p_user_id UUID,
    p_entity_type VARCHAR(50),
    p_entity_id UUID
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_is_liked BOOLEAN;
BEGIN
    -- Check if already liked
    SELECT EXISTS(
        SELECT 1 FROM "public"."likes" 
        WHERE user_id = p_user_id 
        AND entity_type = p_entity_type 
        AND entity_id = p_entity_id
    ) INTO v_is_liked;
    
    IF v_is_liked THEN
        -- Remove like
        DELETE FROM "public"."likes" 
        WHERE user_id = p_user_id 
        AND entity_type = p_entity_type 
        AND entity_id = p_entity_id;
        RETURN false;
    ELSE
        -- Add like
        INSERT INTO "public"."likes" (user_id, entity_type, entity_id)
        VALUES (p_user_id, p_entity_type, p_entity_id);
        RETURN true;
    END IF;
END;
$$;

-- Add entity comment
CREATE OR REPLACE FUNCTION "public"."add_entity_comment"(
    p_user_id UUID,
    p_entity_type VARCHAR(50),
    p_entity_id UUID,
    p_content TEXT,
    p_parent_id UUID DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_comment_id UUID;
BEGIN
    INSERT INTO "public"."comments" (
        user_id, 
        entity_type, 
        entity_id, 
        content, 
        parent_id
    ) VALUES (
        p_user_id, 
        p_entity_type, 
        p_entity_id, 
        p_content, 
        p_parent_id
    ) RETURNING id INTO v_comment_id;
    
    RETURN v_comment_id;
END;
$$;

-- =====================================================================================
-- 5. CREATE ROW LEVEL SECURITY POLICIES
-- =====================================================================================

-- Enable RLS on all social tables
ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."likes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."shares" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."bookmarks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."entity_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."comment_reactions" ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "comments_select_policy" ON "public"."comments"
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "comments_insert_policy" ON "public"."comments"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_update_policy" ON "public"."comments"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "comments_delete_policy" ON "public"."comments"
    FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "likes_select_policy" ON "public"."likes"
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "likes_insert_policy" ON "public"."likes"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_delete_policy" ON "public"."likes"
    FOR DELETE USING (auth.uid() = user_id);

-- Shares policies
CREATE POLICY "shares_select_policy" ON "public"."shares"
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "shares_insert_policy" ON "public"."shares"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shares_update_policy" ON "public"."shares"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "shares_delete_policy" ON "public"."shares"
    FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "bookmarks_select_policy" ON "public"."bookmarks"
    FOR SELECT USING (auth.uid() = user_id OR is_private = false);

CREATE POLICY "bookmarks_insert_policy" ON "public"."bookmarks"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_update_policy" ON "public"."bookmarks"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_delete_policy" ON "public"."bookmarks"
    FOR DELETE USING (auth.uid() = user_id);

-- Entity tags policies
CREATE POLICY "entity_tags_select_policy" ON "public"."entity_tags"
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "entity_tags_insert_policy" ON "public"."entity_tags"
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "entity_tags_update_policy" ON "public"."entity_tags"
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "entity_tags_delete_policy" ON "public"."entity_tags"
    FOR DELETE USING (auth.uid() = created_by);

-- Comment reactions policies
CREATE POLICY "comment_reactions_select_policy" ON "public"."comment_reactions"
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "comment_reactions_insert_policy" ON "public"."comment_reactions"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comment_reactions_update_policy" ON "public"."comment_reactions"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "comment_reactions_delete_policy" ON "public"."comment_reactions"
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================================================
-- 6. CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER "update_shares_updated_at" 
    BEFORE UPDATE ON "public"."shares" 
    FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE TRIGGER "update_bookmarks_updated_at" 
    BEFORE UPDATE ON "public"."bookmarks" 
    FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE TRIGGER "update_entity_tags_updated_at" 
    BEFORE UPDATE ON "public"."entity_tags" 
    FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- =====================================================================================
-- 7. CREATE ANALYTICS VIEWS
-- =====================================================================================

-- Entity social analytics view
CREATE OR REPLACE VIEW "public"."entity_social_analytics" AS
SELECT 
    entities.entity_type,
    entities.entity_id,
    COUNT(DISTINCT l.user_id) as unique_likers,
    COUNT(DISTINCT c.user_id) as unique_commenters,
    COUNT(DISTINCT s.user_id) as unique_sharers,
    COUNT(DISTINCT b.user_id) as unique_bookmarkers,
    COUNT(l.id) as total_likes,
    COUNT(c.id) as total_comments,
    COUNT(s.id) as total_shares,
    COUNT(b.id) as total_bookmarks,
    COUNT(et.id) as total_tags,
    AVG(CASE WHEN c.created_at >= now() - INTERVAL '7 days' THEN 1 ELSE 0 END) as recent_engagement_score
FROM (
    SELECT DISTINCT entity_type, entity_id FROM "public"."likes"
    UNION
    SELECT DISTINCT entity_type, entity_id FROM "public"."comments"
    UNION
    SELECT DISTINCT entity_type, entity_id FROM "public"."shares"
    UNION
    SELECT DISTINCT entity_type, entity_id FROM "public"."bookmarks"
    UNION
    SELECT DISTINCT entity_type, entity_id FROM "public"."entity_tags"
) entities
LEFT JOIN "public"."likes" l ON entities.entity_type = l.entity_type AND entities.entity_id = l.entity_id
LEFT JOIN "public"."comments" c ON entities.entity_type = c.entity_type AND entities.entity_id = c.entity_id AND c.is_deleted = false
LEFT JOIN "public"."shares" s ON entities.entity_type = s.entity_type AND entities.entity_id = s.entity_id
LEFT JOIN "public"."bookmarks" b ON entities.entity_type = b.entity_type AND entities.entity_id = b.entity_id
LEFT JOIN "public"."entity_tags" et ON entities.entity_type = et.entity_type AND entities.entity_id = et.entity_id
GROUP BY entities.entity_type, entities.entity_id;

-- =====================================================================================
-- 8. CREATE MIGRATION COMPLETION LOG
-- =====================================================================================

-- =====================================================================================
-- MIGRATION COMPLETE
-- =====================================================================================

COMMENT ON TABLE "public"."shares" IS 'Enterprise unified sharing system for all entities';
COMMENT ON TABLE "public"."bookmarks" IS 'Enterprise unified bookmarking system for all entities';
COMMENT ON TABLE "public"."entity_tags" IS 'Enterprise unified tagging system for all entities';
COMMENT ON TABLE "public"."comment_reactions" IS 'Enterprise comment reaction system';

COMMENT ON FUNCTION "public"."get_entity_social_stats" IS 'Get comprehensive social statistics for any entity';
COMMENT ON FUNCTION "public"."has_user_liked_entity" IS 'Check if user has liked a specific entity';
COMMENT ON FUNCTION "public"."toggle_entity_like" IS 'Toggle like status for any entity';
COMMENT ON FUNCTION "public"."add_entity_comment" IS 'Add comment to any entity with parent support'; 