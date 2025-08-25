-- CREATE POSTS TABLE
-- This script creates the posts table that is missing from your database
-- Date: 2025-08-23
-- Run this using: supabase db push

-- =====================================================
-- STEP 1: CREATE POSTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "jsonb" NOT NULL,
    "image_url" "text",
    "link_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visibility" "text" DEFAULT 'public'::"text" NOT NULL,
    "allowed_user_ids" "uuid"[],
    "is_hidden" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "content_type" "text" DEFAULT 'text'::"text",
    "metadata" "jsonb" DEFAULT '{}'::jsonb,
    "content_summary" "text",
    "media_files" "jsonb" DEFAULT '[]'::jsonb,
    "scheduled_at" timestamp with time zone,
    "published_at" timestamp with time zone,
    "tags" "text"[] DEFAULT '{}'::text[],
    "categories" "text"[] DEFAULT '{}'::text[],
    "languages" "text"[] DEFAULT '{}'::text[],
    "regions" "text"[] DEFAULT '{}'::text[],
    "content_warnings" "text"[] DEFAULT '{}'::text[],
    "sensitive_content" boolean DEFAULT false,
    "age_restriction" "text",
    "seo_title" "text",
    "seo_description" "text",
    "seo_keywords" "text"[] DEFAULT '{}'::text[],
    "publish_status" "text" DEFAULT 'published'::"text",
    "view_count" integer DEFAULT 0,
    "like_count" integer DEFAULT 0,
    "comment_count" integer DEFAULT 0,
    "share_count" integer DEFAULT 0,
    "bookmark_count" integer DEFAULT 0,
    "engagement_score" numeric DEFAULT 0,
    "trending_score" numeric DEFAULT 0,
    "is_featured" boolean DEFAULT false,
    "is_pinned" boolean DEFAULT false,
    "is_verified" boolean DEFAULT false,
    "last_activity_at" timestamp with time zone DEFAULT "now"(),
    "enterprise_features" "jsonb" DEFAULT '{}'::jsonb,
    
    -- Primary key
    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- =====================================================
-- STEP 2: ADD COMMENTS
-- =====================================================

COMMENT ON TABLE "public"."posts" IS 'Enterprise-grade posts with rich content, moderation, and analytics';
COMMENT ON COLUMN "public"."posts"."user_id" IS 'ID of the user who created the post';
COMMENT ON COLUMN "public"."posts"."content" IS 'JSONB content structure with text, type, and metadata';
COMMENT ON COLUMN "public"."posts"."image_url" IS 'Primary image URL for the post';
COMMENT ON COLUMN "public"."posts"."link_url" IS 'External link URL if post is a link';
COMMENT ON COLUMN "public"."posts"."visibility" IS 'Post visibility: public, private, friends, custom';
COMMENT ON COLUMN "public"."posts"."allowed_user_ids" IS 'Array of user IDs allowed to see private posts';
COMMENT ON COLUMN "public"."posts"."content_type" IS 'Type of content: text, image, video, link, etc.';
COMMENT ON COLUMN "public"."posts"."content_summary" IS 'Human-readable summary of the post content';
COMMENT ON COLUMN "public"."posts"."media_files" IS 'Array of media files associated with the post';
COMMENT ON COLUMN "public"."posts"."publish_status" IS 'Publication status: draft, published, scheduled, archived';
COMMENT ON COLUMN "public"."posts"."engagement_score" IS 'Calculated engagement score based on interactions';
COMMENT ON COLUMN "public"."posts"."enterprise_features" IS 'Enterprise features like analytics, moderation, etc.';

-- =====================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- User posts index
CREATE INDEX IF NOT EXISTS "idx_posts_user_id" ON "public"."posts" ("user_id");

-- Content type index
CREATE INDEX IF NOT EXISTS "idx_posts_content_type" ON "public"."posts" ("content_type");

-- Visibility index
CREATE INDEX IF NOT EXISTS "idx_posts_visibility" ON "public"."posts" ("visibility");

-- Created at index for chronological ordering
CREATE INDEX IF NOT EXISTS "idx_posts_created_at" ON "public"."posts" ("created_at" DESC);

-- Published posts index
CREATE INDEX IF NOT EXISTS "idx_posts_publish_status" ON "public"."posts" ("publish_status");

-- Featured posts index
CREATE INDEX IF NOT EXISTS "idx_posts_featured" ON "public"."posts" ("is_featured");

-- Engagement score index for trending
CREATE INDEX IF NOT EXISTS "idx_posts_engagement_score" ON "public"."posts" ("engagement_score" DESC);

-- Tags index for search
CREATE INDEX IF NOT EXISTS "idx_posts_tags" ON "public"."posts" USING gin ("tags");

-- Content JSONB index for efficient querying
CREATE INDEX IF NOT EXISTS "idx_posts_content" ON "public"."posts" USING gin ("content");

-- Metadata index
CREATE INDEX IF NOT EXISTS "idx_posts_metadata" ON "public"."posts" USING gin ("metadata");

-- =====================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: CREATE RLS POLICIES
-- =====================================================

-- Users can view public posts
CREATE POLICY "posts_select_public" ON "public"."posts"
    FOR SELECT USING (
        visibility = 'public' 
        AND is_deleted = false 
        AND is_hidden = false
        AND publish_status = 'published'
    );

-- Users can view their own posts
CREATE POLICY "posts_select_own" ON "public"."posts"
    FOR SELECT USING (
        auth.uid() = user_id 
        AND is_deleted = false
    );

-- Users can view posts shared with them
CREATE POLICY "posts_select_shared" ON "public"."posts"
    FOR SELECT USING (
        visibility = 'custom' 
        AND auth.uid() = ANY(allowed_user_ids)
        AND is_deleted = false 
        AND is_hidden = false
        AND publish_status = 'published'
    );

-- Users can create posts
CREATE POLICY "posts_insert" ON "public"."posts"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "posts_update" ON "public"."posts"
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "posts_delete" ON "public"."posts"
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 6: CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_posts_updated_at
    BEFORE UPDATE ON "public"."posts"
    FOR EACH ROW
    EXECUTE FUNCTION update_posts_updated_at();

-- =====================================================
-- STEP 7: CREATE SAMPLE POSTS FOR TESTING
-- =====================================================

-- Insert sample posts to test the system
INSERT INTO "public"."posts" (
    user_id,
    content,
    content_type,
    content_summary,
    visibility,
    publish_status
) VALUES 
(
    (SELECT id FROM auth.users LIMIT 1),
    '{"text": "Welcome to our new social platform! This is a sample text post.", "type": "text", "created_at": "2025-08-23T10:00:00Z"}',
    'text',
    'Welcome to our new social platform! This is a sample text post.',
    'public',
    'published'
),
(
    (SELECT id FROM auth.users LIMIT 1),
    '{"text": "Check out this amazing book cover!", "type": "image", "image_url": "https://example.com/sample-cover.jpg", "created_at": "2025-08-23T10:01:00Z"}',
    'image',
    'Check out this amazing book cover!',
    'public',
    'published'
),
(
    (SELECT id FROM auth.users LIMIT 1),
    '{"text": "Just finished reading an incredible novel. Highly recommend!", "type": "text", "created_at": "2025-08-23T10:02:00Z"}',
    'text',
    'Just finished reading an incredible novel. Highly recommend!',
    'public',
    'published'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 8: VERIFY TABLE CREATION
-- =====================================================

-- Verify the table was created successfully
DO $$
DECLARE
    table_exists BOOLEAN;
    sample_posts_count INTEGER;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'posts'
    ) INTO table_exists;
    
    -- Count sample posts
    SELECT COUNT(*) INTO sample_posts_count FROM "public"."posts";
    
    RAISE NOTICE '=== POSTS TABLE CREATION VERIFICATION ===';
    RAISE NOTICE 'Table exists: %', table_exists;
    RAISE NOTICE 'Sample posts created: %', sample_posts_count;
    
    IF table_exists AND sample_posts_count > 0 THEN
        RAISE NOTICE '✅ Posts table created successfully with sample data!';
    ELSE
        RAISE NOTICE '❌ Posts table creation may have failed';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;
