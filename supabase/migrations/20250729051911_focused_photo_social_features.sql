-- =====================================================================================
-- FOCUSED PHOTO SOCIAL FEATURES
-- Adding only the core missing social features for enterprise photo gallery
-- =====================================================================================

-- =====================================================================================
-- 1. CORE SOCIAL FEATURES TABLES
-- =====================================================================================

-- Photo Likes System
CREATE TABLE IF NOT EXISTS "public"."photo_likes" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "photo_id" UUID NOT NULL REFERENCES "public"."images"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL,
    "like_type" VARCHAR(20) DEFAULT 'like', -- like, love, wow, laugh, angry, sad
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "ip_address" INET,
    "user_agent" TEXT,
    UNIQUE("photo_id", "user_id", "like_type")
);

-- Photo Comments System with Threading
CREATE TABLE IF NOT EXISTS "public"."photo_comments" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "photo_id" UUID NOT NULL REFERENCES "public"."images"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL,
    "parent_id" UUID REFERENCES "public"."photo_comments"("id") ON DELETE CASCADE,
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
    "user_agent" TEXT
);

-- Comment Likes
CREATE TABLE IF NOT EXISTS "public"."comment_likes" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "comment_id" UUID NOT NULL REFERENCES "public"."photo_comments"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("comment_id", "user_id")
);

-- Photo Shares Tracking
CREATE TABLE IF NOT EXISTS "public"."photo_shares" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "photo_id" UUID NOT NULL REFERENCES "public"."images"("id") ON DELETE CASCADE,
    "user_id" UUID,
    "share_type" VARCHAR(50) NOT NULL, -- facebook, twitter, instagram, whatsapp, email, link, embed, download
    "platform_data" JSONB, -- Platform-specific data
    "referrer_url" TEXT,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photo Bookmarks/Favorites
CREATE TABLE IF NOT EXISTS "public"."photo_bookmarks" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "photo_id" UUID NOT NULL REFERENCES "public"."images"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL,
    "collection_name" VARCHAR(255), -- User can organize bookmarks into collections
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("photo_id", "user_id")
);

-- =====================================================================================
-- 2. ADVANCED TAGGING SYSTEM
-- =====================================================================================

-- Photo Tags (Entity Tagging)
CREATE TABLE IF NOT EXISTS "public"."photo_tags" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "photo_id" UUID NOT NULL REFERENCES "public"."images"("id") ON DELETE CASCADE,
    "entity_type" VARCHAR(50) NOT NULL, -- user, book, publisher, author, group, event, character, location
    "entity_id" UUID NOT NULL,
    "entity_name" VARCHAR(255) NOT NULL,
    "x_position" DECIMAL(5,2) NOT NULL, -- Percentage position on image
    "y_position" DECIMAL(5,2) NOT NULL,
    "width" DECIMAL(5,2) DEFAULT 0, -- Tag box width
    "height" DECIMAL(5,2) DEFAULT 0, -- Tag box height
    "confidence_score" DECIMAL(3,2), -- AI confidence if auto-tagged
    "tagged_by" UUID, -- User who created the tag
    "verified_by" UUID, -- User who verified the tag
    "is_verified" BOOLEAN DEFAULT FALSE,
    "is_auto_generated" BOOLEAN DEFAULT FALSE,
    "visibility" VARCHAR(20) DEFAULT 'public', -- public, friends, private
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================================
-- 3. ENHANCED COLUMNS FOR EXISTING TABLES
-- =====================================================================================

-- Enhanced images table with enterprise features
ALTER TABLE "public"."images" 
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "tags" TEXT[],
ADD COLUMN IF NOT EXISTS "location" JSONB,
ADD COLUMN IF NOT EXISTS "camera_info" JSONB,
ADD COLUMN IF NOT EXISTS "edit_history" JSONB[],
ADD COLUMN IF NOT EXISTS "quality_score" DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS "content_rating" VARCHAR(20) DEFAULT 'safe',
ADD COLUMN IF NOT EXISTS "upload_source" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "ip_address" INET,
ADD COLUMN IF NOT EXISTS "user_agent" TEXT,
ADD COLUMN IF NOT EXISTS "download_count" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "view_count" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "like_count" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "comment_count" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "share_count" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "revenue_generated" DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS "is_monetized" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "is_nsfw" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "is_ai_generated" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "copyright_status" VARCHAR(50) DEFAULT 'original',
ADD COLUMN IF NOT EXISTS "license_type" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "watermark_applied" BOOLEAN DEFAULT FALSE;

-- Enhanced album_images table
ALTER TABLE "public"."album_images"
ADD COLUMN IF NOT EXISTS "caption" TEXT,
ADD COLUMN IF NOT EXISTS "view_count" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "like_count" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "comment_count" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "share_count" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "revenue_generated" DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS "ai_tags" JSONB,
ADD COLUMN IF NOT EXISTS "community_engagement" DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS "last_viewed_at" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "performance_score" DECIMAL(5,2) DEFAULT 0.0;

-- =====================================================================================
-- 4. PERFORMANCE INDEXES
-- =====================================================================================

-- Core social features indexes
CREATE INDEX IF NOT EXISTS idx_photo_likes_photo ON "public"."photo_likes"(photo_id, created_at);
CREATE INDEX IF NOT EXISTS idx_photo_likes_user ON "public"."photo_likes"(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_photo_comments_photo ON "public"."photo_comments"(photo_id, created_at);
CREATE INDEX IF NOT EXISTS idx_photo_comments_user ON "public"."photo_comments"(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_photo_comments_parent ON "public"."photo_comments"(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_photo_shares_photo ON "public"."photo_shares"(photo_id, created_at);
CREATE INDEX IF NOT EXISTS idx_photo_tags_entity ON "public"."photo_tags"(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_photo ON "public"."photo_tags"(photo_id);

-- Images table performance indexes
CREATE INDEX IF NOT EXISTS idx_images_featured ON "public"."images"(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_images_monetized ON "public"."images"(is_monetized) WHERE is_monetized = true;
CREATE INDEX IF NOT EXISTS idx_images_quality_score ON "public"."images"(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_images_view_count ON "public"."images"(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON "public"."images"(created_at DESC);

-- =====================================================================================
-- 5. TRIGGERS AND FUNCTIONS
-- =====================================================================================

-- Function to update counters
CREATE OR REPLACE FUNCTION update_photo_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'photo_likes' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE "public"."images" SET like_count = like_count + 1 WHERE id = NEW.photo_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE "public"."images" SET like_count = like_count - 1 WHERE id = OLD.photo_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'photo_comments' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE "public"."images" SET comment_count = comment_count + 1 WHERE id = NEW.photo_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE "public"."images" SET comment_count = comment_count - 1 WHERE id = OLD.photo_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'photo_shares' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE "public"."images" SET share_count = share_count + 1 WHERE id = NEW.photo_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for counter updates
DROP TRIGGER IF EXISTS trigger_update_like_counters ON "public"."photo_likes";
CREATE TRIGGER trigger_update_like_counters
    AFTER INSERT OR DELETE ON "public"."photo_likes"
    FOR EACH ROW EXECUTE FUNCTION update_photo_counters();

DROP TRIGGER IF EXISTS trigger_update_comment_counters ON "public"."photo_comments";
CREATE TRIGGER trigger_update_comment_counters
    AFTER INSERT OR DELETE ON "public"."photo_comments"
    FOR EACH ROW EXECUTE FUNCTION update_photo_counters();

DROP TRIGGER IF EXISTS trigger_update_share_counters ON "public"."photo_shares";
CREATE TRIGGER trigger_update_share_counters
    AFTER INSERT ON "public"."photo_shares"
    FOR EACH ROW EXECUTE FUNCTION update_photo_counters();

-- =====================================================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =====================================================================================

-- Enable RLS on all tables
ALTER TABLE "public"."photo_likes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."photo_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."photo_shares" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."photo_bookmarks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."photo_tags" ENABLE ROW LEVEL SECURITY;

-- Basic policies for photo interactions
CREATE POLICY "Users can like photos they can view" ON "public"."photo_likes"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "public"."images" i 
            WHERE i.id = photo_id 
            AND (i.metadata->>'visibility' = 'public' OR i.metadata->>'owner_id' = auth.uid()::text)
        )
    );

CREATE POLICY "Users can comment on photos they can view" ON "public"."photo_comments"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "public"."images" i 
            WHERE i.id = photo_id 
            AND (i.metadata->>'visibility' = 'public' OR i.metadata->>'owner_id' = auth.uid()::text)
        )
    );

CREATE POLICY "Users can share photos they can view" ON "public"."photo_shares"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "public"."images" i 
            WHERE i.id = photo_id 
            AND (i.metadata->>'visibility' = 'public' OR i.metadata->>'owner_id' = auth.uid()::text)
        )
    );

CREATE POLICY "Users can bookmark photos they can view" ON "public"."photo_bookmarks"
    FOR ALL USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM "public"."images" i 
            WHERE i.id = photo_id 
            AND (i.metadata->>'visibility' = 'public' OR i.metadata->>'owner_id' = auth.uid()::text)
        )
    );

CREATE POLICY "Users can tag photos they can edit" ON "public"."photo_tags"
    FOR ALL USING (
        tagged_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM "public"."images" i 
            WHERE i.id = photo_id 
            AND i.metadata->>'owner_id' = auth.uid()::text
        )
    );
