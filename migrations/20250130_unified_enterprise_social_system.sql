-- =====================================================================================
-- UNIFIED ENTERPRISE SOCIAL SYSTEM
-- Single system for comments, likes, shares, bookmarks, and tags across all entities
-- =====================================================================================

-- =====================================================================================
-- 1. UNIFIED SOCIAL FEATURES TABLES
-- =====================================================================================

-- Unified Comments System
CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "entity_type" VARCHAR(50) NOT NULL, -- photo, book, author, publisher, group, event, etc.
    "entity_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "parent_id" UUID REFERENCES "public"."comments"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "content_html" TEXT, -- Processed HTML version
    "mentions" UUID[], -- Array of mentioned user IDs
    "like_count" INTEGER DEFAULT 0,
    "reply_count" INTEGER DEFAULT 0,
    "is_edited" BOOLEAN DEFAULT FALSE,
    "is_pinned" BOOLEAN DEFAULT FALSE,
    "is_hidden" BOOLEAN DEFAULT FALSE,
    "moderation_status" VARCHAR(20) DEFAULT 'approved',
    "sentiment_score" DECIMAL(3,2), -- AI sentiment analysis
    "language" VARCHAR(10),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "edited_at" TIMESTAMP WITH TIME ZONE,
    "ip_address" INET,
    "user_agent" TEXT,
    UNIQUE("entity_type", "entity_id", "user_id", "parent_id", "created_at")
);

-- Unified Likes System
CREATE TABLE IF NOT EXISTS "public"."likes" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "like_type" VARCHAR(20) DEFAULT 'like', -- like, love, wow, laugh, angry, sad
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "ip_address" INET,
    "user_agent" TEXT,
    UNIQUE("entity_type", "entity_id", "user_id", "like_type")
);

-- Unified Shares System
CREATE TABLE IF NOT EXISTS "public"."shares" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "user_id" UUID,
    "share_type" VARCHAR(50) NOT NULL, -- facebook, twitter, instagram, whatsapp, email, link, embed, download
    "platform_data" JSONB, -- Platform-specific data
    "referrer_url" TEXT,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unified Bookmarks System
CREATE TABLE IF NOT EXISTS "public"."bookmarks" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "collection_name" VARCHAR(255), -- User can organize bookmarks into collections
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("entity_type", "entity_id", "user_id")
);

-- Unified Tags System
CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "tagged_entity_type" VARCHAR(50) NOT NULL, -- user, book, publisher, author, group, event, character, location
    "tagged_entity_id" UUID NOT NULL,
    "tagged_entity_name" VARCHAR(255) NOT NULL,
    "x_position" DECIMAL(5,2), -- Percentage position (for visual tags)
    "y_position" DECIMAL(5,2),
    "width" DECIMAL(5,2) DEFAULT 0,
    "height" DECIMAL(5,2) DEFAULT 0,
    "confidence_score" DECIMAL(3,2), -- AI confidence if auto-tagged
    "tagged_by" UUID, -- User who created the tag
    "verified_by" UUID, -- User who verified the tag
    "is_verified" BOOLEAN DEFAULT FALSE,
    "is_auto_generated" BOOLEAN DEFAULT FALSE,
    "visibility" VARCHAR(20) DEFAULT 'public', -- public, friends, private
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comment Likes (for liking individual comments)
CREATE TABLE IF NOT EXISTS "public"."comment_likes" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "comment_id" UUID NOT NULL REFERENCES "public"."comments"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("comment_id", "user_id")
);

-- =====================================================================================
-- 2. INDEXES FOR PERFORMANCE
-- =====================================================================================

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_entity ON "public"."comments"(entity_type, entity_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_user ON "public"."comments"(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON "public"."comments"(parent_id) WHERE parent_id IS NOT NULL;

-- Likes indexes
CREATE INDEX IF NOT EXISTS idx_likes_entity ON "public"."likes"(entity_type, entity_id, created_at);
CREATE INDEX IF NOT EXISTS idx_likes_user ON "public"."likes"(user_id, created_at);

-- Shares indexes
CREATE INDEX IF NOT EXISTS idx_shares_entity ON "public"."shares"(entity_type, entity_id, created_at);
CREATE INDEX IF NOT EXISTS idx_shares_user ON "public"."shares"(user_id, created_at);

-- Bookmarks indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_entity ON "public"."bookmarks"(entity_type, entity_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON "public"."bookmarks"(user_id, created_at);

-- Tags indexes
CREATE INDEX IF NOT EXISTS idx_tags_entity ON "public"."tags"(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_tags_tagged_entity ON "public"."tags"(tagged_entity_type, tagged_entity_id);
CREATE INDEX IF NOT EXISTS idx_tags_user ON "public"."tags"(tagged_by, created_at);

-- Comment likes indexes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON "public"."comment_likes"(comment_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON "public"."comment_likes"(user_id, created_at);

-- =====================================================================================
-- 3. HELPER FUNCTIONS
-- =====================================================================================

-- Function to get entity social stats
CREATE OR REPLACE FUNCTION get_entity_social_stats(
    p_entity_type VARCHAR(50),
    p_entity_id UUID
)
RETURNS TABLE(
    comment_count BIGINT,
    like_count BIGINT,
    share_count BIGINT,
    bookmark_count BIGINT,
    tag_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM "public"."comments" 
         WHERE entity_type = p_entity_type AND entity_id = p_entity_id),
        (SELECT COUNT(*) FROM "public"."likes" 
         WHERE entity_type = p_entity_type AND entity_id = p_entity_id),
        (SELECT COUNT(*) FROM "public"."shares" 
         WHERE entity_type = p_entity_type AND entity_id = p_entity_id),
        (SELECT COUNT(*) FROM "public"."bookmarks" 
         WHERE entity_type = p_entity_type AND entity_id = p_entity_id),
        (SELECT COUNT(*) FROM "public"."tags" 
         WHERE entity_type = p_entity_type AND entity_id = p_entity_id);
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has liked an entity
CREATE OR REPLACE FUNCTION has_user_liked_entity(
    p_entity_type VARCHAR(50),
    p_entity_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM "public"."likes" 
        WHERE entity_type = p_entity_type 
        AND entity_id = p_entity_id 
        AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has bookmarked an entity
CREATE OR REPLACE FUNCTION has_user_bookmarked_entity(
    p_entity_type VARCHAR(50),
    p_entity_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM "public"."bookmarks" 
        WHERE entity_type = p_entity_type 
        AND entity_id = p_entity_id 
        AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================================

-- Enable RLS on all tables
ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."likes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."shares" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."bookmarks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."comment_likes" ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Users can view public comments" ON "public"."comments"
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON "public"."comments"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON "public"."comments"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON "public"."comments"
    FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Users can view likes" ON "public"."likes"
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON "public"."likes"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON "public"."likes"
    FOR DELETE USING (auth.uid() = user_id);

-- Shares policies
CREATE POLICY "Users can view shares" ON "public"."shares"
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own shares" ON "public"."shares"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks" ON "public"."bookmarks"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks" ON "public"."bookmarks"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks" ON "public"."bookmarks"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" ON "public"."bookmarks"
    FOR DELETE USING (auth.uid() = user_id);

-- Tags policies
CREATE POLICY "Users can view public tags" ON "public"."tags"
    FOR SELECT USING (visibility = 'public' OR auth.uid() = tagged_by);

CREATE POLICY "Users can insert their own tags" ON "public"."tags"
    FOR INSERT WITH CHECK (auth.uid() = tagged_by);

CREATE POLICY "Users can update their own tags" ON "public"."tags"
    FOR UPDATE USING (auth.uid() = tagged_by);

CREATE POLICY "Users can delete their own tags" ON "public"."tags"
    FOR DELETE USING (auth.uid() = tagged_by);

-- Comment likes policies
CREATE POLICY "Users can view comment likes" ON "public"."comment_likes"
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comment likes" ON "public"."comment_likes"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment likes" ON "public"."comment_likes"
    FOR DELETE USING (auth.uid() = user_id); 