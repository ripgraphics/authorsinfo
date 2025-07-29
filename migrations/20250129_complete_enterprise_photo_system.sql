-- =====================================================================================
-- COMPLETE ENTERPRISE PHOTO GALLERY SYSTEM
-- World-class photo management with advanced features
-- =====================================================================================

-- =====================================================================================
-- 1. CORE PHOTO TABLES
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
-- 2. SOCIAL FEATURES TABLES
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
-- 3. ADVANCED TAGGING SYSTEM
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

-- Hashtags System
CREATE TABLE IF NOT EXISTS "public"."photo_hashtags" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL UNIQUE,
    "normalized_name" VARCHAR(100) NOT NULL, -- Lowercase, no special chars
    "description" TEXT,
    "category" VARCHAR(50), -- genre, mood, style, technique, etc.
    "usage_count" INTEGER DEFAULT 0,
    "trending_score" DECIMAL(10,2) DEFAULT 0,
    "is_trending" BOOLEAN DEFAULT FALSE,
    "is_featured" BOOLEAN DEFAULT FALSE,
    "is_banned" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "last_used_at" TIMESTAMP WITH TIME ZONE
);

-- Photo-Hashtag Mapping
CREATE TABLE IF NOT EXISTS "public"."photo_hashtag_mappings" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "photo_id" UUID NOT NULL REFERENCES "public"."images"("id") ON DELETE CASCADE,
    "hashtag_id" UUID NOT NULL REFERENCES "public"."photo_hashtags"("id") ON DELETE CASCADE,
    "added_by" UUID,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("photo_id", "hashtag_id")
);

-- =====================================================================================
-- 4. AI & MACHINE LEARNING FEATURES
-- =====================================================================================

-- AI Image Analysis
CREATE TABLE IF NOT EXISTS "public"."ai_image_analysis" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "photo_id" UUID NOT NULL REFERENCES "public"."images"("id") ON DELETE CASCADE,
    "analysis_type" VARCHAR(50) NOT NULL, -- object_detection, face_recognition, scene_analysis, text_extraction, etc.
    "ai_provider" VARCHAR(50) NOT NULL, -- openai, google_vision, aws_rekognition, azure_cognitive
    "model_version" VARCHAR(50),
    "confidence_score" DECIMAL(5,4),
    "results" JSONB NOT NULL, -- Analysis results in JSON format
    "processing_time_ms" INTEGER,
    "cost" DECIMAL(8,4), -- API cost for this analysis
    "status" VARCHAR(20) DEFAULT 'completed', -- pending, processing, completed, failed
    "error_message" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI-Generated Tags
CREATE TABLE IF NOT EXISTS "public"."ai_generated_tags" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "photo_id" UUID NOT NULL REFERENCES "public"."images"("id") ON DELETE CASCADE,
    "tag_name" VARCHAR(100) NOT NULL,
    "tag_category" VARCHAR(50), -- object, person, scene, emotion, style, color, etc.
    "confidence_score" DECIMAL(5,4) NOT NULL,
    "bounding_box" JSONB, -- Coordinates if applicable
    "ai_provider" VARCHAR(50) NOT NULL,
    "model_version" VARCHAR(50),
    "is_approved" BOOLEAN DEFAULT FALSE,
    "approved_by" UUID,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Moderation
CREATE TABLE IF NOT EXISTS "public"."content_moderation" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "photo_id" UUID NOT NULL REFERENCES "public"."images"("id") ON DELETE CASCADE,
    "moderation_type" VARCHAR(50) NOT NULL, -- content_safety, copyright, spam, quality
    "ai_provider" VARCHAR(50),
    "safety_score" DECIMAL(5,4), -- 0-1 safety score
    "categories" JSONB, -- Detected categories (violence, adult, etc.)
    "action_taken" VARCHAR(50), -- approved, flagged, removed, review_required
    "reviewer_id" UUID,
    "review_notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "reviewed_at" TIMESTAMP WITH TIME ZONE
);

-- =====================================================================================
-- 5. ANALYTICS & BUSINESS INTELLIGENCE
-- =====================================================================================

-- Comprehensive Photo Analytics
CREATE TABLE IF NOT EXISTS "public"."photo_analytics" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "photo_id" UUID NOT NULL REFERENCES "public"."images"("id") ON DELETE CASCADE,
    "event_type" VARCHAR(50) NOT NULL, -- view, like, comment, share, download, tag, bookmark, report
    "user_id" UUID,
    "session_id" VARCHAR(255),
    "ip_address" INET,
    "user_agent" TEXT,
    "referrer_url" TEXT,
    "country" VARCHAR(2),
    "region" VARCHAR(100),
    "city" VARCHAR(100),
    "device_type" VARCHAR(50), -- desktop, tablet, mobile, bot
    "browser" VARCHAR(50),
    "os" VARCHAR(50),
    "duration_seconds" INTEGER, -- How long they viewed
    "interaction_data" JSONB, -- Event-specific data
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photo Performance Metrics (Aggregated)
CREATE TABLE IF NOT EXISTS "public"."photo_performance" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "photo_id" UUID NOT NULL REFERENCES "public"."images"("id") ON DELETE CASCADE,
    "date" DATE NOT NULL,
    "views" INTEGER DEFAULT 0,
    "unique_views" INTEGER DEFAULT 0,
    "likes" INTEGER DEFAULT 0,
    "comments" INTEGER DEFAULT 0,
    "shares" INTEGER DEFAULT 0,
    "downloads" INTEGER DEFAULT 0,
    "bookmarks" INTEGER DEFAULT 0,
    "tags_added" INTEGER DEFAULT 0,
    "engagement_rate" DECIMAL(5,4) DEFAULT 0,
    "viral_coefficient" DECIMAL(8,4) DEFAULT 0,
    "revenue_generated" DECIMAL(10,2) DEFAULT 0,
    "click_through_rate" DECIMAL(5,4) DEFAULT 0,
    "bounce_rate" DECIMAL(5,4) DEFAULT 0,
    "average_view_duration" DECIMAL(8,2) DEFAULT 0,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("photo_id", "date")
);

-- User Engagement Tracking
CREATE TABLE IF NOT EXISTS "public"."user_photo_engagement" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID NOT NULL,
    "photo_id" UUID NOT NULL REFERENCES "public"."images"("id") ON DELETE CASCADE,
    "total_views" INTEGER DEFAULT 0,
    "total_time_spent" INTEGER DEFAULT 0, -- Total seconds
    "last_viewed_at" TIMESTAMP WITH TIME ZONE,
    "has_liked" BOOLEAN DEFAULT FALSE,
    "has_commented" BOOLEAN DEFAULT FALSE,
    "has_shared" BOOLEAN DEFAULT FALSE,
    "has_bookmarked" BOOLEAN DEFAULT FALSE,
    "has_downloaded" BOOLEAN DEFAULT FALSE,
    "engagement_score" DECIMAL(5,2) DEFAULT 0,
    "first_interaction" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "last_interaction" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("user_id", "photo_id")
);

-- =====================================================================================
-- 6. MONETIZATION FEATURES
-- =====================================================================================

-- Photo Monetization Settings
CREATE TABLE IF NOT EXISTS "public"."photo_monetization" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "photo_id" UUID NOT NULL REFERENCES "public"."images"("id") ON DELETE CASCADE,
    "owner_id" UUID NOT NULL,
    "license_type" VARCHAR(50) NOT NULL, -- royalty_free, rights_managed, editorial, creative_commons
    "price_tier" VARCHAR(20), -- free, basic, premium, exclusive
    "base_price" DECIMAL(10,2) DEFAULT 0,
    "extended_price" DECIMAL(10,2) DEFAULT 0,
    "subscription_only" BOOLEAN DEFAULT FALSE,
    "exclusive_until" TIMESTAMP WITH TIME ZONE,
    "usage_rights" JSONB, -- Detailed usage permissions
    "geographic_restrictions" VARCHAR(255)[],
    "industry_restrictions" VARCHAR(255)[],
    "max_print_size" VARCHAR(50),
    "revenue_share_percentage" DECIMAL(5,2) DEFAULT 70.00,
    "total_sales" INTEGER DEFAULT 0,
    "total_revenue" DECIMAL(12,2) DEFAULT 0,
    "is_available_for_sale" BOOLEAN DEFAULT TRUE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photo Purchases/Downloads
CREATE TABLE IF NOT EXISTS "public"."photo_purchases" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "photo_id" UUID NOT NULL REFERENCES "public"."images"("id") ON DELETE RESTRICT,
    "buyer_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "license_type" VARCHAR(50) NOT NULL,
    "purchase_price" DECIMAL(10,2) NOT NULL,
    "platform_fee" DECIMAL(10,2) NOT NULL,
    "seller_earnings" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) DEFAULT 'USD',
    "payment_method" VARCHAR(50),
    "payment_transaction_id" VARCHAR(255),
    "download_limit" INTEGER DEFAULT 1,
    "downloads_used" INTEGER DEFAULT 0,
    "license_starts_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "license_expires_at" TIMESTAMP WITH TIME ZONE,
    "usage_terms" JSONB,
    "invoice_number" VARCHAR(100),
    "tax_amount" DECIMAL(10,2) DEFAULT 0,
    "refund_amount" DECIMAL(10,2) DEFAULT 0,
    "status" VARCHAR(20) DEFAULT 'completed', -- pending, completed, refunded, disputed
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription Access Tracking
CREATE TABLE IF NOT EXISTS "public"."subscription_downloads" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "photo_id" UUID NOT NULL REFERENCES "public"."images"("id") ON DELETE RESTRICT,
    "user_id" UUID NOT NULL,
    "subscription_tier" VARCHAR(50) NOT NULL,
    "credits_used" INTEGER DEFAULT 1,
    "download_size" VARCHAR(20), -- small, medium, large, original
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================================
-- 7. ADVANCED COLLECTIONS & ORGANIZATION
-- =====================================================================================

-- Enhanced Photo Collections
CREATE TABLE IF NOT EXISTS "public"."photo_collections" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "cover_photo_id" UUID REFERENCES "public"."images"("id"),
    "visibility" VARCHAR(20) DEFAULT 'public', -- public, unlisted, private, followers_only
    "collection_type" VARCHAR(50) DEFAULT 'custom', -- custom, smart, featured, trending
    "smart_criteria" JSONB, -- For smart collections
    "tags" VARCHAR(100)[],
    "photo_count" INTEGER DEFAULT 0,
    "view_count" INTEGER DEFAULT 0,
    "like_count" INTEGER DEFAULT 0,
    "share_count" INTEGER DEFAULT 0,
    "follower_count" INTEGER DEFAULT 0,
    "is_featured" BOOLEAN DEFAULT FALSE,
    "is_trending" BOOLEAN DEFAULT FALSE,
    "sort_order" VARCHAR(50) DEFAULT 'date_added_desc',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photo-Collection Mappings
CREATE TABLE IF NOT EXISTS "public"."collection_photos" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "collection_id" UUID NOT NULL REFERENCES "public"."photo_collections"("id") ON DELETE CASCADE,
    "photo_id" UUID NOT NULL REFERENCES "public"."images"("id") ON DELETE CASCADE,
    "added_by" UUID,
    "sort_order" INTEGER DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("collection_id", "photo_id")
);

-- Collection Followers
CREATE TABLE IF NOT EXISTS "public"."collection_followers" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "collection_id" UUID NOT NULL REFERENCES "public"."photo_collections"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL,
    "notification_settings" JSONB DEFAULT '{"new_photos": true, "updates": false}',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("collection_id", "user_id")
);

-- =====================================================================================
-- 8. ADVANCED SEARCH & DISCOVERY
-- =====================================================================================

-- Search Query Tracking
CREATE TABLE IF NOT EXISTS "public"."search_queries" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID,
    "query_text" TEXT NOT NULL,
    "query_type" VARCHAR(50), -- text, visual, reverse_image, ai_generated
    "filters_applied" JSONB,
    "results_count" INTEGER,
    "clicked_result_ids" UUID[],
    "session_id" VARCHAR(255),
    "ip_address" INET,
    "execution_time_ms" INTEGER,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trending Content
CREATE TABLE IF NOT EXISTS "public"."trending_content" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "content_type" VARCHAR(50) NOT NULL, -- photo, hashtag, collection, user
    "content_id" UUID NOT NULL,
    "trend_score" DECIMAL(10,4) NOT NULL,
    "velocity" DECIMAL(10,4) NOT NULL, -- Rate of growth
    "time_window" VARCHAR(20) NOT NULL, -- 1h, 6h, 24h, 7d, 30d
    "geographic_region" VARCHAR(100),
    "demographic_segment" VARCHAR(100),
    "calculated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "expires_at" TIMESTAMP WITH TIME ZONE
);

-- =====================================================================================
-- 9. COLLABORATION FEATURES
-- =====================================================================================

-- Photo Collaboration Invites
CREATE TABLE IF NOT EXISTS "public"."photo_collaborations" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "photo_id" UUID NOT NULL REFERENCES "public"."images"("id") ON DELETE CASCADE,
    "owner_id" UUID NOT NULL,
    "collaborator_id" UUID NOT NULL,
    "role" VARCHAR(50) NOT NULL, -- editor, commenter, viewer
    "permissions" JSONB, -- Detailed permissions
    "invited_by" UUID,
    "status" VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, revoked
    "message" TEXT,
    "invited_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "responded_at" TIMESTAMP WITH TIME ZONE,
    "expires_at" TIMESTAMP WITH TIME ZONE
);

-- Photo Editing History
CREATE TABLE IF NOT EXISTS "public"."photo_edit_history" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "photo_id" UUID NOT NULL REFERENCES "public"."images"("id") ON DELETE CASCADE,
    "editor_id" UUID NOT NULL,
    "edit_type" VARCHAR(50) NOT NULL, -- crop, filter, adjust, watermark, text_overlay
    "edit_data" JSONB NOT NULL, -- Edit parameters
    "before_url" TEXT, -- URL of image before edit
    "after_url" TEXT, -- URL of image after edit
    "processing_time_ms" INTEGER,
    "file_size_change" INTEGER, -- Bytes change
    "quality_score_change" DECIMAL(4,2),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================================
-- 10. ENTERPRISE FEATURES
-- =====================================================================================

-- Brand/Organization Photo Management
CREATE TABLE IF NOT EXISTS "public"."brand_photo_guidelines" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "organization_id" UUID NOT NULL,
    "guideline_type" VARCHAR(50) NOT NULL, -- style, branding, compliance, quality
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "rules" JSONB NOT NULL,
    "auto_enforcement" BOOLEAN DEFAULT FALSE,
    "violation_action" VARCHAR(50) DEFAULT 'flag', -- flag, reject, auto_fix
    "created_by" UUID,
    "is_active" BOOLEAN DEFAULT TRUE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photo Compliance Tracking
CREATE TABLE IF NOT EXISTS "public"."photo_compliance" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "photo_id" UUID NOT NULL REFERENCES "public"."images"("id") ON DELETE CASCADE,
    "guideline_id" UUID NOT NULL REFERENCES "public"."brand_photo_guidelines"("id"),
    "compliance_status" VARCHAR(20) NOT NULL, -- compliant, violation, review_needed
    "violation_details" JSONB,
    "auto_checked" BOOLEAN DEFAULT FALSE,
    "reviewed_by" UUID,
    "review_notes" TEXT,
    "remediation_suggested" TEXT,
    "checked_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "reviewed_at" TIMESTAMP WITH TIME ZONE
);

-- Advanced Workflow Management
CREATE TABLE IF NOT EXISTS "public"."photo_workflows" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "photo_id" UUID NOT NULL REFERENCES "public"."images"("id") ON DELETE CASCADE,
    "workflow_type" VARCHAR(50) NOT NULL, -- approval, moderation, publishing, archival
    "current_stage" VARCHAR(100) NOT NULL,
    "assignee_id" UUID,
    "priority" VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    "due_date" TIMESTAMP WITH TIME ZONE,
    "status" VARCHAR(20) DEFAULT 'active', -- active, paused, completed, cancelled
    "workflow_data" JSONB,
    "stage_history" JSONB[],
    "created_by" UUID,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================================
-- 11. INDEXES FOR PERFORMANCE
-- =====================================================================================

-- Core performance indexes
CREATE INDEX IF NOT EXISTS idx_images_owner_created_at ON "public"."images"(metadata->>'owner_id', created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_featured ON "public"."images"(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_images_monetized ON "public"."images"(is_monetized) WHERE is_monetized = true;
CREATE INDEX IF NOT EXISTS idx_images_quality_score ON "public"."images"(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_images_view_count ON "public"."images"(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON "public"."images"(created_at DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_photo_analytics_photo_event ON "public"."photo_analytics"(photo_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_photo_analytics_user ON "public"."photo_analytics"(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_photo_analytics_date ON "public"."photo_analytics"(created_at::date);

-- Social features indexes
CREATE INDEX IF NOT EXISTS idx_photo_likes_photo ON "public"."photo_likes"(photo_id, created_at);
CREATE INDEX IF NOT EXISTS idx_photo_likes_user ON "public"."photo_likes"(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_photo_comments_photo ON "public"."photo_comments"(photo_id, created_at);
CREATE INDEX IF NOT EXISTS idx_photo_comments_user ON "public"."photo_comments"(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_photo_comments_parent ON "public"."photo_comments"(parent_id) WHERE parent_id IS NOT NULL;

-- Search and discovery indexes
CREATE INDEX IF NOT EXISTS idx_photo_tags_entity ON "public"."photo_tags"(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_photo ON "public"."photo_tags"(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_hashtags_trending ON "public"."photo_hashtags"(trending_score DESC) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_ai_analysis_photo ON "public"."ai_image_analysis"(photo_id, analysis_type);

-- Performance monitoring indexes
CREATE INDEX IF NOT EXISTS idx_photo_performance_date ON "public"."photo_performance"(date DESC);
CREATE INDEX IF NOT EXISTS idx_photo_performance_engagement ON "public"."photo_performance"(engagement_rate DESC);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_images_fts ON "public"."images" USING gin(to_tsvector('english', coalesce(alt_text, '') || ' ' || coalesce(description, '')));
CREATE INDEX IF NOT EXISTS idx_photo_hashtags_fts ON "public"."photo_hashtags" USING gin(to_tsvector('english', name || ' ' || coalesce(description, '')));

-- =====================================================================================
-- 12. TRIGGERS AND FUNCTIONS
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

-- Function to track analytics automatically
CREATE OR REPLACE FUNCTION track_photo_analytics_event(
    p_photo_id UUID,
    p_event_type VARCHAR(50),
    p_user_id UUID DEFAULT NULL,
    p_session_id VARCHAR(255) DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_interaction_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_analytics_id UUID;
BEGIN
    INSERT INTO "public"."photo_analytics" (
        photo_id, event_type, user_id, session_id, 
        ip_address, user_agent, interaction_data
    ) VALUES (
        p_photo_id, p_event_type, p_user_id, p_session_id,
        p_ip_address, p_user_agent, p_interaction_data
    ) RETURNING id INTO v_analytics_id;
    
    -- Update view counter for view events
    IF p_event_type = 'view' THEN
        UPDATE "public"."images" 
        SET view_count = view_count + 1 
        WHERE id = p_photo_id;
    END IF;
    
    RETURN v_analytics_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate engagement rates
CREATE OR REPLACE FUNCTION calculate_engagement_rate(p_photo_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_views INTEGER;
    v_engagements INTEGER;
    v_rate DECIMAL;
BEGIN
    SELECT view_count INTO v_views FROM "public"."images" WHERE id = p_photo_id;
    
    SELECT (like_count + comment_count + share_count) INTO v_engagements 
    FROM "public"."images" WHERE id = p_photo_id;
    
    IF v_views > 0 THEN
        v_rate := (v_engagements::DECIMAL / v_views::DECIMAL) * 100;
    ELSE
        v_rate := 0;
    END IF;
    
    RETURN v_rate;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================================
-- 13. ROW LEVEL SECURITY POLICIES
-- =====================================================================================

-- Enable RLS on all tables
ALTER TABLE "public"."photo_likes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."photo_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."photo_shares" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."photo_bookmarks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."photo_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."photo_analytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."photo_monetization" ENABLE ROW LEVEL SECURITY;

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

-- =====================================================================================
-- 14. VIEWS FOR COMPLEX QUERIES
-- =====================================================================================

-- Comprehensive photo view with all metrics
CREATE OR REPLACE VIEW "public"."enterprise_photo_metrics" AS
SELECT 
    i.id,
    i.url,
    i.thumbnail_url,
    i.alt_text,
    i.description,
    i.created_at,
    i.metadata,
    i.view_count,
    i.like_count,
    i.comment_count,
    i.share_count,
    i.download_count,
    i.revenue_generated,
    i.quality_score,
    i.is_featured,
    i.is_monetized,
    -- Engagement metrics
    calculate_engagement_rate(i.id) as engagement_rate,
    -- Tag information
    ARRAY_AGG(DISTINCT pt.entity_name) FILTER (WHERE pt.entity_name IS NOT NULL) as tagged_entities,
    ARRAY_AGG(DISTINCT ph.name) FILTER (WHERE ph.name IS NOT NULL) as hashtags,
    -- Performance metrics from last 30 days
    COALESCE(SUM(pp.views), 0) as views_30d,
    COALESCE(SUM(pp.unique_views), 0) as unique_views_30d,
    COALESCE(SUM(pp.likes), 0) as likes_30d,
    COALESCE(SUM(pp.shares), 0) as shares_30d,
    COALESCE(AVG(pp.engagement_rate), 0) as avg_engagement_30d
FROM "public"."images" i
LEFT JOIN "public"."photo_tags" pt ON i.id = pt.photo_id
LEFT JOIN "public"."photo_hashtag_mappings" phm ON i.id = phm.photo_id
LEFT JOIN "public"."photo_hashtags" ph ON phm.hashtag_id = ph.id
LEFT JOIN "public"."photo_performance" pp ON i.id = pp.photo_id 
    AND pp.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY i.id, i.url, i.thumbnail_url, i.alt_text, i.description, i.created_at, 
         i.metadata, i.view_count, i.like_count, i.comment_count, i.share_count,
         i.download_count, i.revenue_generated, i.quality_score, i.is_featured, i.is_monetized;

-- Top performing photos view
CREATE OR REPLACE VIEW "public"."trending_photos" AS
SELECT 
    emp.*,
    -- Trending score calculation
    (emp.views_30d * 0.3 + emp.likes_30d * 0.4 + emp.shares_30d * 0.3) as trending_score
FROM "public"."enterprise_photo_metrics" emp
WHERE emp.created_at >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY trending_score DESC;

-- =====================================================================================
-- COMPLETION MESSAGE
-- =====================================================================================

-- Add completion tracking
INSERT INTO "public"."schema_migrations" (version, name, executed_at) 
VALUES (
    '20250129_complete_enterprise_photo_system',
    'Complete Enterprise Photo Gallery System',
    NOW()
) ON CONFLICT (version) DO NOTHING;

-- Log the completion
DO $$
BEGIN
    RAISE NOTICE 'Enterprise Photo Gallery System installation completed successfully!';
    RAISE NOTICE 'Created % tables with advanced features:', (
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%photo%'
    );
    RAISE NOTICE 'System includes: Analytics, AI/ML, Monetization, Social Features, Advanced Search, and Enterprise Management';
END $$; 