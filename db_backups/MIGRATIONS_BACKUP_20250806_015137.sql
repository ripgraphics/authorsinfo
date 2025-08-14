-- =====================================================
-- MIGRATIONS BACKUP
-- Backup ID: 20250806_015137
-- Created: 2025-08-06 01:51:37
-- Project: AuthorsInfo Enterprise Platform
-- Files: 17 migration files
-- =====================================================


-- =====================================================
-- MIGRATION: 20250110000000_create_posts_table.sql
-- =====================================================

-- =====================================================
-- ENTERPRISE-GRADE POSTS SYSTEM MIGRATION
-- Comprehensive social media platform architecture
-- =====================================================

-- Drop existing posts table if it exists (will recreate with enterprise features)
DROP TABLE IF EXISTS "public"."posts" CASCADE;

-- =====================================================
-- CORE POSTS TABLE - ENTERPRISE FEATURES
-- =====================================================

CREATE TABLE "public"."posts" (
    -- Primary identification
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "uuid" uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    
    -- Content and metadata
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "entity_type" text NOT NULL CHECK (entity_type IN ('user', 'book', 'author', 'publisher', 'group', 'event', 'discussion', 'review', 'article')),
    "entity_id" uuid NOT NULL,
    "content_type" text NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'photo', 'video', 'link', 'poll', 'review', 'article', 'quote', 'book_review', 'author_spotlight', 'publisher_update', 'event_announcement')),
    "content" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "content_text" text GENERATED ALWAYS AS (content->>'text') STORED,
    "content_summary" text,
    
    -- Rich media support
    "media_files" jsonb DEFAULT '[]'::jsonb,
    "thumbnail_url" text,
    "video_url" text,
    "audio_url" text,
    "document_url" text,
    
    -- Engagement metrics
    "view_count" integer DEFAULT 0,
    "like_count" integer DEFAULT 0,
    "comment_count" integer DEFAULT 0,
    "share_count" integer DEFAULT 0,
    "bookmark_count" integer DEFAULT 0,
    "reaction_count" integer DEFAULT 0,
    "engagement_score" numeric(10,4) DEFAULT 0,
    
    -- Privacy and visibility
    "visibility" text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'friends', 'followers', 'custom', 'unlisted')),
    "allowed_user_ids" uuid[] DEFAULT '{}',
    "blocked_user_ids" uuid[] DEFAULT '{}',
    "is_hidden" boolean DEFAULT false,
    "is_deleted" boolean DEFAULT false,
    "is_archived" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "is_pinned" boolean DEFAULT false,
    "is_verified" boolean DEFAULT false,
    
    -- Moderation and safety
    "moderation_status" text DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged', 'under_review')),
    "moderation_notes" text,
    "moderated_by" uuid REFERENCES auth.users(id),
    "moderated_at" timestamp with time zone,
    "content_warnings" text[] DEFAULT '{}',
    "sensitive_content" boolean DEFAULT false,
    "age_restriction" text CHECK (age_restriction IN (NULL, '13+', '16+', '18+', '21+')),
    
    -- SEO and discovery
    "seo_title" text,
    "seo_description" text,
    "seo_keywords" text[] DEFAULT '{}',
    "canonical_url" text,
    "og_image_url" text,
    "og_title" text,
    "og_description" text,
    
    -- Scheduling and publishing
    "scheduled_at" timestamp with time zone,
    "published_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "publish_status" text DEFAULT 'draft' CHECK (publish_status IN ('draft', 'scheduled', 'published', 'archived', 'deleted')),
    
    -- Analytics and tracking
    "analytics_data" jsonb DEFAULT '{}'::jsonb,
    "impression_count" integer DEFAULT 0,
    "click_count" integer DEFAULT 0,
    "conversion_count" integer DEFAULT 0,
    "bounce_rate" numeric(5,2) DEFAULT 0,
    "avg_time_on_page" integer DEFAULT 0,
    
    -- Performance and optimization
    "cache_key" text,
    "cache_expires_at" timestamp with time zone,
    "last_activity_at" timestamp with time zone DEFAULT now(),
    "hot_score" numeric(10,4) DEFAULT 0,
    "trending_score" numeric(10,4) DEFAULT 0,
    
    -- Enterprise features
    "enterprise_features" jsonb DEFAULT '{}'::jsonb,
    "compliance_tags" text[] DEFAULT '{}',
    "data_retention_policy" text,
    "backup_frequency" text DEFAULT 'daily',
    "archival_date" timestamp with time zone,
    
    -- Metadata and tracking
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "tags" text[] DEFAULT '{}',
    "categories" text[] DEFAULT '{}',
    "languages" text[] DEFAULT '{en}',
    "regions" text[] DEFAULT '{}',
    "timezone" text DEFAULT 'UTC',
    
    -- Timestamps
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "archived_at" timestamp with time zone
);

-- =====================================================
-- POST ENGAGEMENT TABLES
-- =====================================================

-- Post reactions (likes, loves, etc.)
CREATE TABLE "public"."post_reactions" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "post_id" uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "reaction_type" text NOT NULL CHECK (reaction_type IN ('like', 'love', 'haha', 'wow', 'sad', 'angry', 'care', 'celebrate', 'support')),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(post_id, user_id, reaction_type)
);

-- Post comments with threading
CREATE TABLE "public"."post_comments" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "post_id" uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "parent_id" uuid REFERENCES post_comments(id) ON DELETE CASCADE,
    "content" text NOT NULL,
    "content_type" text DEFAULT 'text' CHECK (content_type IN ('text', 'photo', 'video', 'link')),
    "media_files" jsonb DEFAULT '[]'::jsonb,
    "like_count" integer DEFAULT 0,
    "reply_count" integer DEFAULT 0,
    "is_edited" boolean DEFAULT false,
    "edited_at" timestamp with time zone,
    "is_hidden" boolean DEFAULT false,
    "is_deleted" boolean DEFAULT false,
    "moderation_status" text DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Post shares
CREATE TABLE "public"."post_shares" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "post_id" uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "share_type" text NOT NULL DEFAULT 'repost' CHECK (share_type IN ('repost', 'quote', 'link', 'story', 'message')),
    "share_content" text,
    "share_platform" text,
    "share_url" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Post bookmarks
CREATE TABLE "public"."post_bookmarks" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "post_id" uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "folder" text DEFAULT 'default',
    "notes" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(post_id, user_id)
);

-- =====================================================
-- CONTENT MODERATION SYSTEM
-- =====================================================

-- Content moderation queue
CREATE TABLE "public"."content_moderation_queue" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "content_type" text NOT NULL CHECK (content_type IN ('post', 'comment', 'user', 'group')),
    "content_id" uuid NOT NULL,
    "reported_by" uuid REFERENCES auth.users(id),
    "report_reason" text NOT NULL,
    "report_details" text,
    "moderation_priority" text DEFAULT 'normal' CHECK (moderation_priority IN ('low', 'normal', 'high', 'urgent')),
    "assigned_moderator" uuid REFERENCES auth.users(id),
    "status" text DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
    "resolution_notes" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "resolved_at" timestamp with time zone
);

-- Content flags and violations
CREATE TABLE "public"."content_violations" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "content_type" text NOT NULL,
    "content_id" uuid NOT NULL,
    "user_id" uuid NOT NULL REFERENCES auth.users(id),
    "violation_type" text NOT NULL CHECK (violation_type IN ('spam', 'harassment', 'hate_speech', 'violence', 'misinformation', 'copyright', 'privacy', 'other')),
    "violation_severity" text NOT NULL CHECK (violation_severity IN ('minor', 'moderate', 'severe', 'critical')),
    "automated_detection" boolean DEFAULT false,
    "ai_confidence_score" numeric(3,2),
    "human_reviewed" boolean DEFAULT false,
    "action_taken" text CHECK (action_taken IN ('warning', 'content_removal', 'temporary_ban', 'permanent_ban', 'feature_restriction')),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- =====================================================
-- ANALYTICS AND INSIGHTS
-- =====================================================

-- Post analytics
CREATE TABLE "public"."post_analytics" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "post_id" uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    "date" date NOT NULL,
    "views" integer DEFAULT 0,
    "unique_views" integer DEFAULT 0,
    "likes" integer DEFAULT 0,
    "comments" integer DEFAULT 0,
    "shares" integer DEFAULT 0,
    "bookmarks" integer DEFAULT 0,
    "clicks" integer DEFAULT 0,
    "impressions" integer DEFAULT 0,
    "reach" integer DEFAULT 0,
    "engagement_rate" numeric(5,4) DEFAULT 0,
    "avg_time_on_post" integer DEFAULT 0,
    "bounce_rate" numeric(5,2) DEFAULT 0,
    "conversion_rate" numeric(5,4) DEFAULT 0,
    "revenue_generated" numeric(10,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(post_id, date)
);

-- User engagement analytics
CREATE TABLE "public"."user_engagement_analytics" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "date" date NOT NULL,
    "posts_created" integer DEFAULT 0,
    "posts_viewed" integer DEFAULT 0,
    "posts_liked" integer DEFAULT 0,
    "posts_commented" integer DEFAULT 0,
    "posts_shared" integer DEFAULT 0,
    "posts_bookmarked" integer DEFAULT 0,
    "total_engagement" integer DEFAULT 0,
    "engagement_score" numeric(10,4) DEFAULT 0,
    "reach_score" numeric(10,4) DEFAULT 0,
    "influence_score" numeric(10,4) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, date)
);

-- =====================================================
-- NOTIFICATIONS AND REAL-TIME FEATURES
-- =====================================================

-- Notification preferences
CREATE TABLE "public"."notification_preferences" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "notification_type" text NOT NULL CHECK (notification_type IN ('post_like', 'post_comment', 'post_share', 'new_follower', 'mention', 'direct_message', 'group_activity', 'event_reminder', 'system_alert')),
    "email_enabled" boolean DEFAULT true,
    "push_enabled" boolean DEFAULT true,
    "in_app_enabled" boolean DEFAULT true,
    "frequency" text DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'hourly', 'daily', 'weekly', 'never')),
    "quiet_hours_start" time DEFAULT '22:00',
    "quiet_hours_end" time DEFAULT '08:00',
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, notification_type)
);

-- Notification queue
CREATE TABLE "public"."notification_queue" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "notification_type" text NOT NULL,
    "title" text NOT NULL,
    "message" text NOT NULL,
    "data" jsonb DEFAULT '{}'::jsonb,
    "priority" text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    "delivery_method" text[] DEFAULT '{in_app}' CHECK (delivery_method <@ ARRAY['email', 'push', 'sms', 'in_app']),
    "scheduled_at" timestamp with time zone DEFAULT now(),
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "read_at" timestamp with time zone,
    "status" text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    "retry_count" integer DEFAULT 0,
    "error_message" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- =====================================================
-- SEARCH AND DISCOVERY
-- =====================================================

-- Search index for posts
CREATE TABLE "public"."post_search_index" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "post_id" uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    "search_vector" tsvector,
    "tags_vector" tsvector,
    "content_vector" tsvector,
    "user_vector" tsvector,
    "entity_vector" tsvector,
    "last_indexed_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Trending topics
CREATE TABLE "public"."trending_topics" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "topic" text NOT NULL,
    "category" text,
    "post_count" integer DEFAULT 0,
    "engagement_count" integer DEFAULT 0,
    "trending_score" numeric(10,4) DEFAULT 0,
    "trend_direction" text CHECK (trend_direction IN ('rising', 'falling', 'stable')),
    "peak_time" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- =====================================================
-- ENTERPRISE FEATURES
-- =====================================================

-- Content workflows and approval
CREATE TABLE "public"."content_workflows" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "workflow_name" text NOT NULL,
    "content_type" text NOT NULL,
    "approval_required" boolean DEFAULT false,
    "approvers" uuid[] DEFAULT '{}',
    "auto_publish" boolean DEFAULT true,
    "publish_delay" interval DEFAULT '0',
    "expiration_policy" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Content scheduling
CREATE TABLE "public"."content_schedule" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "post_id" uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    "scheduled_at" timestamp with time zone NOT NULL,
    "timezone" text DEFAULT 'UTC',
    "status" text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'failed', 'cancelled')),
    "published_at" timestamp with time zone,
    "error_message" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Posts table indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_entity_type_entity_id ON posts(entity_type, entity_id);
CREATE INDEX idx_posts_content_type ON posts(content_type);
CREATE INDEX idx_posts_visibility ON posts(visibility);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_engagement_score ON posts(engagement_score DESC);
CREATE INDEX idx_posts_trending_score ON posts(trending_score DESC);
CREATE INDEX idx_posts_moderation_status ON posts(moderation_status);
CREATE INDEX idx_posts_publish_status ON posts(publish_status);
CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at);
CREATE INDEX idx_posts_expires_at ON posts(expires_at);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);
CREATE INDEX idx_posts_categories ON posts USING GIN(categories);
CREATE INDEX idx_posts_languages ON posts USING GIN(languages);
CREATE INDEX idx_posts_regions ON posts USING GIN(regions);

-- Full-text search indexes
CREATE INDEX idx_posts_content_text ON posts USING GIN(to_tsvector('english', content_text));
CREATE INDEX idx_posts_content_summary ON posts USING GIN(to_tsvector('english', content_summary));

-- Engagement indexes
CREATE INDEX idx_post_reactions_post_id ON post_reactions(post_id);
CREATE INDEX idx_post_reactions_user_id ON post_reactions(user_id);
CREATE INDEX idx_post_reactions_type ON post_reactions(reaction_type);

CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX idx_post_comments_parent_id ON post_comments(parent_id);
CREATE INDEX idx_post_comments_created_at ON post_comments(created_at DESC);

CREATE INDEX idx_post_shares_post_id ON post_shares(post_id);
CREATE INDEX idx_post_shares_user_id ON post_shares(user_id);

CREATE INDEX idx_post_bookmarks_user_id ON post_bookmarks(user_id);
CREATE INDEX idx_post_bookmarks_folder ON post_bookmarks(folder);

-- Analytics indexes
CREATE INDEX idx_post_analytics_post_id_date ON post_analytics(post_id, date);
CREATE INDEX idx_user_engagement_analytics_user_id_date ON user_engagement_analytics(user_id, date);

-- Search indexes
CREATE INDEX idx_post_search_index_vector ON post_search_index USING GIN(search_vector);
CREATE INDEX idx_post_search_index_tags ON post_search_index USING GIN(tags_vector);
CREATE INDEX idx_post_search_index_content ON post_search_index USING GIN(content_vector);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_schedule ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Users can view public posts" ON posts FOR SELECT USING (visibility = 'public' AND is_deleted = false AND is_hidden = false);
CREATE POLICY "Users can view their own posts" ON posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view posts from followed users" ON posts FOR SELECT USING (visibility = 'followers' AND is_deleted = false AND is_hidden = false);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Engagement policies
CREATE POLICY "Users can view reactions" ON post_reactions FOR SELECT USING (true);
CREATE POLICY "Users can create reactions" ON post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reactions" ON post_reactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view comments" ON post_comments FOR SELECT USING (is_deleted = false AND is_hidden = false);
CREATE POLICY "Users can create comments" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON post_comments FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update engagement scores
CREATE OR REPLACE FUNCTION update_post_engagement_score()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts 
    SET engagement_score = (
        (COALESCE(like_count, 0) * 1) +
        (COALESCE(comment_count, 0) * 3) +
        (COALESCE(share_count, 0) * 5) +
        (COALESCE(bookmark_count, 0) * 2) +
        (COALESCE(view_count, 0) * 0.1)
    ) / GREATEST(EXTRACT(EPOCH FROM (now() - created_at)) / 3600, 1)
    WHERE id = NEW.post_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update engagement scores
CREATE TRIGGER trigger_update_engagement_score
    AFTER INSERT OR UPDATE OR DELETE ON post_reactions
    FOR EACH ROW EXECUTE FUNCTION update_post_engagement_score();

-- Function to update post analytics
CREATE OR REPLACE FUNCTION update_post_analytics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO post_analytics (post_id, date, views, likes, comments, shares, bookmarks)
    VALUES (NEW.id, CURRENT_DATE, NEW.view_count, NEW.like_count, NEW.comment_count, NEW.share_count, NEW.bookmark_count)
    ON CONFLICT (post_id, date) DO UPDATE SET
        views = EXCLUDED.views,
        likes = EXCLUDED.likes,
        comments = EXCLUDED.comments,
        shares = EXCLUDED.shares,
        bookmarks = EXCLUDED.bookmarks,
        engagement_rate = CASE 
            WHEN EXCLUDED.views > 0 THEN 
                (EXCLUDED.likes + EXCLUDED.comments + EXCLUDED.shares + EXCLUDED.bookmarks)::numeric / EXCLUDED.views
            ELSE 0 
        END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update analytics
CREATE TRIGGER trigger_update_post_analytics
    AFTER UPDATE OF view_count, like_count, comment_count, share_count, bookmark_count ON posts
    FOR EACH ROW EXECUTE FUNCTION update_post_analytics();

-- Function to update search index
CREATE OR REPLACE FUNCTION update_post_search_index()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO post_search_index (post_id, search_vector, tags_vector, content_vector)
    VALUES (
        NEW.id,
        to_tsvector('english', COALESCE(NEW.content_text, '') || ' ' || COALESCE(NEW.content_summary, '')),
        to_tsvector('english', array_to_string(NEW.tags, ' ')),
        to_tsvector('english', COALESCE(NEW.content_text, ''))
    )
    ON CONFLICT (post_id) DO UPDATE SET
        search_vector = EXCLUDED.search_vector,
        tags_vector = EXCLUDED.tags_vector,
        content_vector = EXCLUDED.content_vector,
        last_indexed_at = now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update search index
CREATE TRIGGER trigger_update_search_index
    AFTER INSERT OR UPDATE OF content_text, content_summary, tags ON posts
    FOR EACH ROW EXECUTE FUNCTION update_post_search_index();

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE posts IS 'Enterprise-grade posts table with comprehensive social media features';
COMMENT ON COLUMN posts.content IS 'JSON object containing post content based on content_type';
COMMENT ON COLUMN posts.engagement_score IS 'Calculated engagement score based on likes, comments, shares, and time';
COMMENT ON COLUMN posts.trending_score IS 'Real-time trending score for content discovery';
COMMENT ON COLUMN posts.enterprise_features IS 'JSON object containing enterprise-specific features and settings';

COMMENT ON TABLE post_reactions IS 'User reactions to posts (likes, loves, etc.)';
COMMENT ON TABLE post_comments IS 'Threaded comments on posts with moderation support';
COMMENT ON TABLE post_shares IS 'Post sharing and reposting functionality';
COMMENT ON TABLE post_bookmarks IS 'User bookmarks and collections';

COMMENT ON TABLE content_moderation_queue IS 'Content moderation and safety system';
COMMENT ON TABLE post_analytics IS 'Daily analytics for posts and engagement';
COMMENT ON TABLE notification_queue IS 'Notification delivery system with multiple channels';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- End of 20250110000000_create_posts_table.sql


-- =====================================================
-- MIGRATION: 20250111000000_update_posts_table.sql
-- =====================================================

-- Create entities table for tracking entity engagement
CREATE TABLE IF NOT EXISTS "public"."entities" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "type" text NOT NULL,
    "name" text,
    "description" text,
    "engagement_count" integer DEFAULT 0,
    "post_count" integer DEFAULT 0,
    "last_engagement" timestamp with time zone,
    "last_post" timestamp with time zone,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Add primary key to entities table
ALTER TABLE "public"."entities" 
ADD CONSTRAINT "entities_pkey" PRIMARY KEY ("id");

-- Create index on entities table
CREATE INDEX IF NOT EXISTS "entities_type_id_idx" ON "public"."entities" ("type", "id");

-- Create engagement_analytics table for tracking user engagement
CREATE TABLE IF NOT EXISTS "public"."engagement_analytics" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "action" text NOT NULL,
    "entity_id" uuid NOT NULL,
    "entity_type" text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now(),
    "metadata" jsonb DEFAULT '{}'::jsonb
);

-- Add primary key to engagement_analytics table
ALTER TABLE "public"."engagement_analytics" 
ADD CONSTRAINT "engagement_analytics_pkey" PRIMARY KEY ("id");

-- Create index on engagement_analytics table
CREATE INDEX IF NOT EXISTS "engagement_analytics_user_action_idx" ON "public"."engagement_analytics" ("user_id", "action");
CREATE INDEX IF NOT EXISTS "engagement_analytics_entity_idx" ON "public"."engagement_analytics" ("entity_type", "entity_id");

-- Add RLS policies for entities table
ALTER TABLE "public"."entities" ENABLE ROW LEVEL SECURITY;

-- Policy for users to read all entities
CREATE POLICY "Users can read entities" ON "public"."entities"
    FOR SELECT USING (true);

-- Policy for users to insert entities
CREATE POLICY "Users can insert entities" ON "public"."entities"
    FOR INSERT WITH CHECK (true);

-- Policy for users to update entities
CREATE POLICY "Users can update entities" ON "public"."entities"
    FOR UPDATE USING (true);

-- Add RLS policies for engagement_analytics table
ALTER TABLE "public"."engagement_analytics" ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own engagement analytics
CREATE POLICY "Users can read their own engagement analytics" ON "public"."engagement_analytics"
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own engagement analytics
CREATE POLICY "Users can insert their own engagement analytics" ON "public"."engagement_analytics"
    FOR INSERT WITH CHECK (auth.uid() = user_id); 
-- End of 20250111000000_update_posts_table.sql


-- =====================================================
-- MIGRATION: 20250112000000_add_enterprise_columns_to_posts.sql
-- =====================================================

-- Add enterprise columns to posts table
-- This migration adds the columns needed for the enterprise posts system

-- Add entity-related columns
ALTER TABLE "public"."posts" 
ADD COLUMN IF NOT EXISTS "entity_type" "text",
ADD COLUMN IF NOT EXISTS "entity_id" "text",
ADD COLUMN IF NOT EXISTS "content_type" "text" DEFAULT 'text',
ADD COLUMN IF NOT EXISTS "content_summary" "text",
ADD COLUMN IF NOT EXISTS "media_files" "jsonb" DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "scheduled_at" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "tags" "text"[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "categories" "text"[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "languages" "text"[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "regions" "text"[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "content_warnings" "text"[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "sensitive_content" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "age_restriction" "text",
ADD COLUMN IF NOT EXISTS "seo_title" "text",
ADD COLUMN IF NOT EXISTS "seo_description" "text",
ADD COLUMN IF NOT EXISTS "seo_keywords" "text"[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "publish_status" "text" DEFAULT 'published',
ADD COLUMN IF NOT EXISTS "view_count" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "like_count" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "comment_count" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "share_count" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "bookmark_count" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "engagement_score" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "trending_score" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "is_featured" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "is_pinned" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "is_verified" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "last_activity_at" timestamp with time zone DEFAULT "now"(),
ADD COLUMN IF NOT EXISTS "metadata" "jsonb" DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "enterprise_features" "jsonb" DEFAULT '{}'::jsonb;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "posts_entity_type_entity_id_idx" ON "public"."posts" ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "posts_content_type_idx" ON "public"."posts" ("content_type");
CREATE INDEX IF NOT EXISTS "posts_publish_status_idx" ON "public"."posts" ("publish_status");
CREATE INDEX IF NOT EXISTS "posts_created_at_idx" ON "public"."posts" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "posts_engagement_score_idx" ON "public"."posts" ("engagement_score" DESC);
CREATE INDEX IF NOT EXISTS "posts_trending_score_idx" ON "public"."posts" ("trending_score" DESC);

-- Add comments for documentation
COMMENT ON COLUMN "public"."posts"."entity_type" IS 'Type of entity this post is about (user, book, author, etc.)';
COMMENT ON COLUMN "public"."posts"."entity_id" IS 'ID of the entity this post is about';
COMMENT ON COLUMN "public"."posts"."content_type" IS 'Type of content (text, photo, video, etc.)';
COMMENT ON COLUMN "public"."posts"."content_summary" IS 'Auto-generated summary of the post content';
COMMENT ON COLUMN "public"."posts"."media_files" IS 'Array of media file URLs and metadata';
COMMENT ON COLUMN "public"."posts"."scheduled_at" IS 'When this post is scheduled to be published';
COMMENT ON COLUMN "public"."posts"."published_at" IS 'When this post was actually published';
COMMENT ON COLUMN "public"."posts"."tags" IS 'Array of tags for categorization';
COMMENT ON COLUMN "public"."posts"."categories" IS 'Array of categories for organization';
COMMENT ON COLUMN "public"."posts"."languages" IS 'Languages this post is available in';
COMMENT ON COLUMN "public"."posts"."regions" IS 'Geographic regions this post is relevant to';
COMMENT ON COLUMN "public"."posts"."content_warnings" IS 'Content warnings for sensitive material';
COMMENT ON COLUMN "public"."posts"."sensitive_content" IS 'Whether this post contains sensitive content';
COMMENT ON COLUMN "public"."posts"."age_restriction" IS 'Age restriction level for this post';
COMMENT ON COLUMN "public"."posts"."seo_title" IS 'SEO-optimized title for search engines';
COMMENT ON COLUMN "public"."posts"."seo_description" IS 'SEO-optimized description for search engines';
COMMENT ON COLUMN "public"."posts"."seo_keywords" IS 'SEO keywords for search optimization';
COMMENT ON COLUMN "public"."posts"."publish_status" IS 'Current publication status (draft, published, scheduled, etc.)';
COMMENT ON COLUMN "public"."posts"."view_count" IS 'Number of times this post has been viewed';
COMMENT ON COLUMN "public"."posts"."like_count" IS 'Number of likes on this post';
COMMENT ON COLUMN "public"."posts"."comment_count" IS 'Number of comments on this post';
COMMENT ON COLUMN "public"."posts"."share_count" IS 'Number of times this post has been shared';
COMMENT ON COLUMN "public"."posts"."bookmark_count" IS 'Number of times this post has been bookmarked';
COMMENT ON COLUMN "public"."posts"."engagement_score" IS 'Calculated engagement score based on interactions';
COMMENT ON COLUMN "public"."posts"."trending_score" IS 'Calculated trending score based on recent activity';
COMMENT ON COLUMN "public"."posts"."is_featured" IS 'Whether this post is featured/promoted';
COMMENT ON COLUMN "public"."posts"."is_pinned" IS 'Whether this post is pinned to the top';
COMMENT ON COLUMN "public"."posts"."is_verified" IS 'Whether this post is from a verified source';
COMMENT ON COLUMN "public"."posts"."last_activity_at" IS 'Timestamp of the last activity on this post';
COMMENT ON COLUMN "public"."posts"."metadata" IS 'Additional metadata for the post';
COMMENT ON COLUMN "public"."posts"."enterprise_features" IS 'Enterprise-specific features and settings';

-- End of 20250112000000_add_enterprise_columns_to_posts.sql


-- =====================================================
-- MIGRATION: 20250112000001_create_post_engagement_tables.sql
-- =====================================================

-- Create post engagement tables for enterprise posts system

-- Post reactions table
CREATE TABLE IF NOT EXISTS "public"."post_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reaction_type" "text" NOT NULL DEFAULT 'like',
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "post_reactions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "post_reactions_post_id_user_id_reaction_type_key" UNIQUE ("post_id", "user_id", "reaction_type")
);

-- Post comments table
CREATE TABLE IF NOT EXISTS "public"."post_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_comment_id" "uuid",
    "content" "text" NOT NULL,
    "is_edited" boolean DEFAULT false,
    "is_hidden" boolean DEFAULT false,
    "is_deleted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

-- Post shares table
CREATE TABLE IF NOT EXISTS "public"."post_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "share_type" "text" NOT NULL DEFAULT 'repost',
    "share_content" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "post_shares_pkey" PRIMARY KEY ("id")
);

-- Post bookmarks table
CREATE TABLE IF NOT EXISTS "public"."post_bookmarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "folder" "text" DEFAULT 'default',
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "post_bookmarks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "post_bookmarks_post_id_user_id_key" UNIQUE ("post_id", "user_id")
);

-- Notification queue table
CREATE TABLE IF NOT EXISTS "public"."notification_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "notification_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "data" "jsonb" DEFAULT '{}'::jsonb,
    "is_read" boolean DEFAULT false,
    "is_sent" boolean DEFAULT false,
    "scheduled_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notification_queue_pkey" PRIMARY KEY ("id")
);

-- Trending topics table
CREATE TABLE IF NOT EXISTS "public"."trending_topics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "topic" "text" NOT NULL,
    "category" "text",
    "trending_score" numeric DEFAULT 0,
    "post_count" integer DEFAULT 0,
    "engagement_count" integer DEFAULT 0,
    "last_activity_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "trending_topics_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "trending_topics_topic_key" UNIQUE ("topic")
);

-- Add foreign key constraints
ALTER TABLE "public"."post_reactions" ADD CONSTRAINT "post_reactions_post_id_fkey" 
    FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;

ALTER TABLE "public"."post_reactions" ADD CONSTRAINT "post_reactions_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."post_comments" ADD CONSTRAINT "post_comments_post_id_fkey" 
    FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;

ALTER TABLE "public"."post_comments" ADD CONSTRAINT "post_comments_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."post_comments" ADD CONSTRAINT "post_comments_parent_comment_id_fkey" 
    FOREIGN KEY ("parent_comment_id") REFERENCES "public"."post_comments"("id") ON DELETE CASCADE;

ALTER TABLE "public"."post_shares" ADD CONSTRAINT "post_shares_post_id_fkey" 
    FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;

ALTER TABLE "public"."post_shares" ADD CONSTRAINT "post_shares_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."post_bookmarks" ADD CONSTRAINT "post_bookmarks_post_id_fkey" 
    FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;

ALTER TABLE "public"."post_bookmarks" ADD CONSTRAINT "post_bookmarks_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."notification_queue" ADD CONSTRAINT "notification_queue_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "post_reactions_post_id_idx" ON "public"."post_reactions" ("post_id");
CREATE INDEX IF NOT EXISTS "post_reactions_user_id_idx" ON "public"."post_reactions" ("user_id");
CREATE INDEX IF NOT EXISTS "post_reactions_reaction_type_idx" ON "public"."post_reactions" ("reaction_type");

CREATE INDEX IF NOT EXISTS "post_comments_post_id_idx" ON "public"."post_comments" ("post_id");
CREATE INDEX IF NOT EXISTS "post_comments_user_id_idx" ON "public"."post_comments" ("user_id");
CREATE INDEX IF NOT EXISTS "post_comments_parent_comment_id_idx" ON "public"."post_comments" ("parent_comment_id");
CREATE INDEX IF NOT EXISTS "post_comments_created_at_idx" ON "public"."post_comments" ("created_at" DESC);

CREATE INDEX IF NOT EXISTS "post_shares_post_id_idx" ON "public"."post_shares" ("post_id");
CREATE INDEX IF NOT EXISTS "post_shares_user_id_idx" ON "public"."post_shares" ("user_id");
CREATE INDEX IF NOT EXISTS "post_shares_share_type_idx" ON "public"."post_shares" ("share_type");

CREATE INDEX IF NOT EXISTS "post_bookmarks_post_id_idx" ON "public"."post_bookmarks" ("post_id");
CREATE INDEX IF NOT EXISTS "post_bookmarks_user_id_idx" ON "public"."post_bookmarks" ("user_id");
CREATE INDEX IF NOT EXISTS "post_bookmarks_folder_idx" ON "public"."post_bookmarks" ("folder");

CREATE INDEX IF NOT EXISTS "notification_queue_user_id_idx" ON "public"."notification_queue" ("user_id");
CREATE INDEX IF NOT EXISTS "notification_queue_is_read_idx" ON "public"."notification_queue" ("is_read");
CREATE INDEX IF NOT EXISTS "notification_queue_is_sent_idx" ON "public"."notification_queue" ("is_sent");
CREATE INDEX IF NOT EXISTS "notification_queue_scheduled_at_idx" ON "public"."notification_queue" ("scheduled_at");

CREATE INDEX IF NOT EXISTS "trending_topics_trending_score_idx" ON "public"."trending_topics" ("trending_score" DESC);
CREATE INDEX IF NOT EXISTS "trending_topics_category_idx" ON "public"."trending_topics" ("category");
CREATE INDEX IF NOT EXISTS "trending_topics_last_activity_at_idx" ON "public"."trending_topics" ("last_activity_at" DESC);

-- Add RLS policies
ALTER TABLE "public"."post_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."post_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."post_shares" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."post_bookmarks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notification_queue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."trending_topics" ENABLE ROW LEVEL SECURITY;

-- Post reactions policies
CREATE POLICY "post_reactions_insert_policy" ON "public"."post_reactions"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_reactions_select_policy" ON "public"."post_reactions"
    FOR SELECT USING (true);

CREATE POLICY "post_reactions_delete_policy" ON "public"."post_reactions"
    FOR DELETE USING (auth.uid() = user_id);

-- Post comments policies
CREATE POLICY "post_comments_insert_policy" ON "public"."post_comments"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_comments_select_policy" ON "public"."post_comments"
    FOR SELECT USING (true);

CREATE POLICY "post_comments_update_policy" ON "public"."post_comments"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "post_comments_delete_policy" ON "public"."post_comments"
    FOR DELETE USING (auth.uid() = user_id);

-- Post shares policies
CREATE POLICY "post_shares_insert_policy" ON "public"."post_shares"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_shares_select_policy" ON "public"."post_shares"
    FOR SELECT USING (true);

CREATE POLICY "post_shares_delete_policy" ON "public"."post_shares"
    FOR DELETE USING (auth.uid() = user_id);

-- Post bookmarks policies
CREATE POLICY "post_bookmarks_insert_policy" ON "public"."post_bookmarks"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_bookmarks_select_policy" ON "public"."post_bookmarks"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "post_bookmarks_update_policy" ON "public"."post_bookmarks"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "post_bookmarks_delete_policy" ON "public"."post_bookmarks"
    FOR DELETE USING (auth.uid() = user_id);

-- Notification queue policies
CREATE POLICY "notification_queue_insert_policy" ON "public"."notification_queue"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_queue_select_policy" ON "public"."notification_queue"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notification_queue_update_policy" ON "public"."notification_queue"
    FOR UPDATE USING (auth.uid() = user_id);

-- Trending topics policies (read-only for all users)
CREATE POLICY "trending_topics_select_policy" ON "public"."trending_topics"
    FOR SELECT USING (true);

-- Add comments for documentation
COMMENT ON TABLE "public"."post_reactions" IS 'User reactions to posts (like, love, etc.)';
COMMENT ON TABLE "public"."post_comments" IS 'Comments on posts with support for nested replies';
COMMENT ON TABLE "public"."post_shares" IS 'Post sharing activity (reposts, shares)';
COMMENT ON TABLE "public"."post_bookmarks" IS 'User bookmarks of posts';
COMMENT ON TABLE "public"."notification_queue" IS 'Queue for user notifications';
COMMENT ON TABLE "public"."trending_topics" IS 'Trending topics and hashtags';

-- End of 20250112000001_create_post_engagement_tables.sql


-- =====================================================
-- MIGRATION: 20250115_enterprise_photo_system_enhancement.sql
-- =====================================================

-- ENTERPRISE PHOTO SYSTEM ENHANCEMENT MIGRATION
-- This migration adds the missing enterprise tables for analytics, monetization, and community features
-- Based on the actual database schema analysis and enterprise platform requirements

-- ============================================================================
-- 1. PHOTO ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."photo_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "image_id" "uuid",
    "event_type" "text" NOT NULL,
    "user_id" "uuid",
    "session_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "photo_analytics_event_type_check" CHECK (
        "event_type" IN ('view', 'click', 'share', 'download', 'like', 'upload', 'delete', 'edit', 'comment', 'purchase')
    )
);

-- Add comments
COMMENT ON TABLE "public"."photo_analytics" IS 'Enterprise photo analytics tracking for comprehensive insights';
COMMENT ON COLUMN "public"."photo_analytics"."event_type" IS 'Type of analytics event tracked';
COMMENT ON COLUMN "public"."photo_analytics"."metadata" IS 'Additional event metadata including user agent, referrer, etc.';

-- Create indexes for performance
CREATE INDEX "idx_photo_analytics_album_id" ON "public"."photo_analytics"("album_id");
CREATE INDEX "idx_photo_analytics_image_id" ON "public"."photo_analytics"("image_id");
CREATE INDEX "idx_photo_analytics_event_type" ON "public"."photo_analytics"("event_type");
CREATE INDEX "idx_photo_analytics_created_at" ON "public"."photo_analytics"("created_at");
CREATE INDEX "idx_photo_analytics_user_id" ON "public"."photo_analytics"("user_id");

-- ============================================================================
-- 2. PHOTO MONETIZATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."photo_monetization" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "image_id" "uuid",
    "event_type" "text" NOT NULL,
    "amount" numeric(10,2) DEFAULT 0,
    "currency" "text" DEFAULT 'USD',
    "user_id" "uuid",
    "payment_method" "text",
    "transaction_id" "text",
    "status" "text" DEFAULT 'pending',
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "photo_monetization_event_type_check" CHECK (
        "event_type" IN ('purchase', 'subscription', 'tip', 'ad_revenue', 'sponsorship', 'merchandise', 'commission')
    ),
    CONSTRAINT "photo_monetization_status_check" CHECK (
        "status" IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')
    ),
    CONSTRAINT "photo_monetization_amount_check" CHECK ("amount" >= 0)
);

-- Add comments
COMMENT ON TABLE "public"."photo_monetization" IS 'Enterprise photo monetization tracking for revenue streams';
COMMENT ON COLUMN "public"."photo_monetization"."event_type" IS 'Type of monetization event';
COMMENT ON COLUMN "public"."photo_monetization"."amount" IS 'Monetary amount in specified currency';
COMMENT ON COLUMN "public"."photo_monetization"."status" IS 'Transaction status';

-- Create indexes for performance
CREATE INDEX "idx_photo_monetization_album_id" ON "public"."photo_monetization"("album_id");
CREATE INDEX "idx_photo_monetization_image_id" ON "public"."photo_monetization"("image_id");
CREATE INDEX "idx_photo_monetization_event_type" ON "public"."photo_monetization"("event_type");
CREATE INDEX "idx_photo_monetization_status" ON "public"."photo_monetization"("status");
CREATE INDEX "idx_photo_monetization_created_at" ON "public"."photo_monetization"("created_at");
CREATE INDEX "idx_photo_monetization_user_id" ON "public"."photo_monetization"("user_id");

-- ============================================================================
-- 3. PHOTO COMMUNITY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."photo_community" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "image_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "interaction_type" "text" NOT NULL,
    "content" "text",
    "rating" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "photo_community_interaction_type_check" CHECK (
        "interaction_type" IN ('like', 'comment', 'share', 'follow', 'bookmark', 'report', 'review', 'rating')
    ),
    CONSTRAINT "photo_community_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

-- Add comments
COMMENT ON TABLE "public"."photo_community" IS 'Enterprise photo community interactions and social features';
COMMENT ON COLUMN "public"."photo_community"."interaction_type" IS 'Type of community interaction';
COMMENT ON COLUMN "public"."photo_community"."content" IS 'User-generated content (comments, reviews)';
COMMENT ON COLUMN "public"."photo_community"."rating" IS 'User rating (1-5 stars)';

-- Create indexes for performance
CREATE INDEX "idx_photo_community_album_id" ON "public"."photo_community"("album_id");
CREATE INDEX "idx_photo_community_image_id" ON "public"."photo_community"("image_id");
CREATE INDEX "idx_photo_community_user_id" ON "public"."photo_community"("user_id");
CREATE INDEX "idx_photo_community_interaction_type" ON "public"."photo_community"("interaction_type");
CREATE INDEX "idx_photo_community_created_at" ON "public"."photo_community"("created_at");

-- ============================================================================
-- 4. AI IMAGE ANALYSIS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."ai_image_analysis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "image_id" "uuid" NOT NULL,
    "analysis_type" "text" NOT NULL,
    "confidence_score" numeric(3,2) DEFAULT 0,
    "tags" "text"[] DEFAULT '{}',
    "objects_detected" "jsonb" DEFAULT '{}'::"jsonb",
    "quality_metrics" "jsonb" DEFAULT '{}'::"jsonb",
    "sentiment_score" numeric(3,2),
    "content_safety_score" numeric(3,2) DEFAULT 1.0,
    "moderation_flags" "text"[] DEFAULT '{}',
    "processing_time_ms" integer,
    "model_version" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_image_analysis_confidence_check" CHECK ("confidence_score" >= 0 AND "confidence_score" <= 1),
    CONSTRAINT "ai_image_analysis_sentiment_check" CHECK ("sentiment_score" >= -1 AND "sentiment_score" <= 1),
    CONSTRAINT "ai_image_analysis_safety_check" CHECK ("content_safety_score" >= 0 AND "content_safety_score" <= 1)
);

-- Add comments
COMMENT ON TABLE "public"."ai_image_analysis" IS 'AI-powered image analysis results for enterprise features';
COMMENT ON COLUMN "public"."ai_image_analysis"."analysis_type" IS 'Type of AI analysis performed';
COMMENT ON COLUMN "public"."ai_image_analysis"."confidence_score" IS 'AI confidence in analysis (0-1)';
COMMENT ON COLUMN "public"."ai_image_analysis"."content_safety_score" IS 'Content safety assessment (0-1)';

-- Create indexes for performance
CREATE INDEX "idx_ai_image_analysis_image_id" ON "public"."ai_image_analysis"("image_id");
CREATE INDEX "idx_ai_image_analysis_type" ON "public"."ai_image_analysis"("analysis_type");
CREATE INDEX "idx_ai_image_analysis_confidence" ON "public"."ai_image_analysis"("confidence_score");
CREATE INDEX "idx_ai_image_analysis_safety" ON "public"."ai_image_analysis"("content_safety_score");
CREATE INDEX "idx_ai_image_analysis_created_at" ON "public"."ai_image_analysis"("created_at");

-- ============================================================================
-- 5. IMAGE PROCESSING JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."image_processing_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "image_id" "uuid" NOT NULL,
    "job_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending',
    "priority" integer DEFAULT 5,
    "parameters" "jsonb" DEFAULT '{}'::"jsonb",
    "result" "jsonb",
    "error_message" "text",
    "processing_time_ms" integer,
    "worker_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    CONSTRAINT "image_processing_jobs_status_check" CHECK (
        "status" IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
    ),
    CONSTRAINT "image_processing_jobs_priority_check" CHECK ("priority" >= 1 AND "priority" <= 10)
);

-- Add comments
COMMENT ON TABLE "public"."image_processing_jobs" IS 'Image processing job queue for AI and optimization tasks';
COMMENT ON COLUMN "public"."image_processing_jobs"."job_type" IS 'Type of processing job';
COMMENT ON COLUMN "public"."image_processing_jobs"."priority" IS 'Job priority (1-10, higher is more important)';

-- Create indexes for performance
CREATE INDEX "idx_image_processing_jobs_image_id" ON "public"."image_processing_jobs"("image_id");
CREATE INDEX "idx_image_processing_jobs_status" ON "public"."image_processing_jobs"("status");
CREATE INDEX "idx_image_processing_jobs_priority" ON "public"."image_processing_jobs"("priority");
CREATE INDEX "idx_image_processing_jobs_created_at" ON "public"."image_processing_jobs"("created_at");

-- ============================================================================
-- 6. ENHANCE EXISTING TABLES WITH ENTERPRISE FEATURES
-- ============================================================================

-- Add enterprise columns to album_images table
-- NOTE: Commented out because album_images table doesn't exist yet
-- ALTER TABLE "public"."album_images" 
-- ADD COLUMN IF NOT EXISTS "view_count" integer DEFAULT 0,
-- ADD COLUMN IF NOT EXISTS "like_count" integer DEFAULT 0,
-- ADD COLUMN IF NOT EXISTS "share_count" integer DEFAULT 0,
-- ADD COLUMN IF NOT EXISTS "revenue_generated" numeric(10,2) DEFAULT 0,
-- ADD COLUMN IF NOT EXISTS "ai_tags" "text"[] DEFAULT '{}',
-- ADD COLUMN IF NOT EXISTS "community_engagement" numeric(3,2) DEFAULT 0;

-- Add comments for new columns
-- COMMENT ON COLUMN "public"."album_images"."view_count" IS 'Number of views for this image in the album';
-- COMMENT ON COLUMN "public"."album_images"."like_count" IS 'Number of likes for this image in the album';
-- COMMENT ON COLUMN "public"."album_images"."share_count" IS 'Number of shares for this image in the album';
-- COMMENT ON COLUMN "public"."album_images"."revenue_generated" IS 'Total revenue generated from this image';
-- COMMENT ON COLUMN "public"."album_images"."ai_tags" IS 'AI-generated tags for the image';
-- COMMENT ON COLUMN "public"."album_images"."community_engagement" IS 'Community engagement score (0-1)';

-- Add enterprise columns to photo_albums table
-- NOTE: Commented out because photo_albums table doesn't exist yet
-- ALTER TABLE "public"."photo_albums" 
-- ADD COLUMN IF NOT EXISTS "monetization_enabled" boolean DEFAULT false,
-- ADD COLUMN IF NOT EXISTS "premium_content" boolean DEFAULT false,
-- ADD COLUMN IF NOT EXISTS "community_features" boolean DEFAULT false,
-- ADD COLUMN IF NOT EXISTS "ai_enhanced" boolean DEFAULT false,
-- ADD COLUMN IF NOT EXISTS "analytics_enabled" boolean DEFAULT false,
-- ADD COLUMN IF NOT EXISTS "revenue_generated" numeric(10,2) DEFAULT 0,
-- ADD COLUMN IF NOT EXISTS "total_subscribers" integer DEFAULT 0,
-- ADD COLUMN IF NOT EXISTS "community_score" numeric(3,2) DEFAULT 0;

-- Add comments for new columns
-- COMMENT ON COLUMN "public"."photo_albums"."monetization_enabled" IS 'Whether monetization features are enabled for this album';
-- COMMENT ON COLUMN "public"."photo_albums"."premium_content" IS 'Whether this album contains premium content';
-- COMMENT ON COLUMN "public"."photo_albums"."community_features" IS 'Whether community features are enabled';
-- COMMENT ON COLUMN "public"."photo_albums"."ai_enhanced" IS 'Whether AI features are enabled';
-- COMMENT ON COLUMN "public"."photo_albums"."analytics_enabled" IS 'Whether analytics tracking is enabled';
-- COMMENT ON COLUMN "public"."photo_albums"."revenue_generated" IS 'Total revenue generated from this album';
-- COMMENT ON COLUMN "public"."photo_albums"."total_subscribers" IS 'Number of premium subscribers';
-- COMMENT ON COLUMN "public"."photo_albums"."community_score" IS 'Community engagement score (0-1)';

-- ============================================================================
-- 7. CREATE FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Photo Analytics foreign keys
-- NOTE: Commented out because referenced tables don't exist yet
-- ALTER TABLE "public"."photo_analytics" 
-- ADD CONSTRAINT "photo_analytics_album_id_fkey" 
-- FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;

-- ALTER TABLE "public"."photo_analytics" 
-- ADD CONSTRAINT "photo_analytics_image_id_fkey" 
-- FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;

-- ALTER TABLE "public"."photo_analytics" 
-- ADD CONSTRAINT "photo_analytics_user_id_fkey" 
-- FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;

-- Photo Monetization foreign keys
-- ALTER TABLE "public"."photo_monetization" 
-- ADD CONSTRAINT "photo_monetization_album_id_fkey" 
-- FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;

-- ALTER TABLE "public"."photo_monetization" 
-- ADD CONSTRAINT "photo_monetization_image_id_fkey" 
-- FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;

-- ALTER TABLE "public"."photo_monetization" 
-- ADD CONSTRAINT "photo_monetization_user_id_fkey" 
-- FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;

-- Photo Community foreign keys
-- ALTER TABLE "public"."photo_community" 
-- ADD CONSTRAINT "photo_community_album_id_fkey" 
-- FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;

-- ALTER TABLE "public"."photo_community" 
-- ADD CONSTRAINT "photo_community_image_id_fkey" 
-- FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;

-- ALTER TABLE "public"."photo_community" 
-- ADD CONSTRAINT "photo_community_user_id_fkey" 
-- FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- AI Image Analysis foreign keys
-- ALTER TABLE "public"."ai_image_analysis" 
-- ADD CONSTRAINT "ai_image_analysis_image_id_fkey" 
-- FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;

-- Image Processing Jobs foreign keys
-- ALTER TABLE "public"."image_processing_jobs" 
-- ADD CONSTRAINT "image_processing_jobs_image_id_fkey" 
-- FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;

-- ============================================================================
-- 8. CREATE ENTERPRISE VIEWS FOR ANALYTICS
-- ============================================================================

-- Enterprise Photo Analytics View
-- CREATE OR REPLACE VIEW "public"."enterprise_photo_analytics" AS
-- SELECT 
--     pa.album_id,
--     pa.image_id,
--     pa.event_type,
--     COUNT(*) as event_count,
--     COUNT(DISTINCT pa.user_id) as unique_users,
--     COUNT(DISTINCT pa.session_id) as unique_sessions,
--     MIN(pa.created_at) as first_event,
--     MAX(pa.created_at) as last_event,
--     AVG(EXTRACT(EPOCH FROM (pa.created_at - LAG(pa.created_at) OVER (PARTITION BY pa.album_id, pa.image_id ORDER BY pa.created_at)))) as avg_time_between_events
-- FROM "public"."photo_analytics" pa
-- GROUP BY pa.album_id, pa.image_id, pa.event_type;

-- COMMENT ON VIEW "public"."enterprise_photo_analytics" IS 'Enterprise analytics view for photo engagement tracking';

-- Enterprise Photo Monetization View
CREATE OR REPLACE VIEW "public"."enterprise_photo_monetization" AS
SELECT 
    pm.album_id,
    pm.image_id,
    pm.event_type,
    SUM(pm.amount) as total_revenue,
    COUNT(*) as transaction_count,
    COUNT(DISTINCT pm.user_id) as unique_payers,
    AVG(pm.amount) as avg_transaction_value,
    MIN(pm.created_at) as first_transaction,
    MAX(pm.created_at) as last_transaction
FROM "public"."photo_monetization" pm
WHERE pm.status = 'completed'
GROUP BY pm.album_id, pm.image_id, pm.event_type;

COMMENT ON VIEW "public"."enterprise_photo_monetization" IS 'Enterprise monetization view for revenue tracking';

-- Enterprise Photo Community View
CREATE OR REPLACE VIEW "public"."enterprise_photo_community" AS
SELECT 
    pc.album_id,
    pc.image_id,
    pc.interaction_type,
    COUNT(*) as interaction_count,
    COUNT(DISTINCT pc.user_id) as unique_users,
    AVG(pc.rating) as avg_rating,
    COUNT(pc.rating) as rating_count,
    MIN(pc.created_at) as first_interaction,
    MAX(pc.created_at) as last_interaction
FROM "public"."photo_community" pc
GROUP BY pc.album_id, pc.image_id, pc.interaction_type;

COMMENT ON VIEW "public"."enterprise_photo_community" IS 'Enterprise community view for social engagement tracking';

-- ============================================================================
-- 9. CREATE ENTERPRISE FUNCTIONS
-- ============================================================================

-- Function to process image with AI
CREATE OR REPLACE FUNCTION "public"."process_image_with_ai"(
    p_image_id "uuid",
    p_analysis_types "text"[] DEFAULT ARRAY['content', 'quality', 'sentiment']
)
RETURNS "jsonb"
LANGUAGE "plpgsql"
AS $$
DECLARE
    result "jsonb";
BEGIN
    -- Create processing job
    INSERT INTO "public"."image_processing_jobs" (
        image_id, 
        job_type, 
        status, 
        priority, 
        parameters
    ) VALUES (
        p_image_id, 
        'ai_analysis', 
        'pending', 
        8, 
        jsonb_build_object('analysis_types', p_analysis_types)
    );
    
    -- Simulate AI analysis result (in production, this would call external AI service)
    result := jsonb_build_object(
        'analysis_id', gen_random_uuid(),
        'image_id', p_image_id,
        'analysis_types', p_analysis_types,
        'status', 'completed',
        'processing_time_ms', 1200
    );
    
    RETURN result;
END;
$$;

COMMENT ON FUNCTION "public"."process_image_with_ai" IS 'Enterprise function to process images with AI analysis';

-- Function to track photo analytics event
CREATE OR REPLACE FUNCTION "public"."track_photo_analytics_event"(
    p_album_id "uuid",
    p_image_id "uuid" DEFAULT NULL,
    p_event_type "text" DEFAULT 'view',
    p_user_id "uuid" DEFAULT NULL,
    p_metadata "jsonb" DEFAULT '{}'::"jsonb"
)
RETURNS "uuid"
LANGUAGE "plpgsql"
AS $$
DECLARE
    event_id "uuid";
BEGIN
    INSERT INTO "public"."photo_analytics" (
        album_id,
        image_id,
        event_type,
        user_id,
        session_id,
        metadata
    ) VALUES (
        p_album_id,
        p_image_id,
        p_event_type,
        p_user_id,
        p_metadata->>'session_id',
        p_metadata
    ) RETURNING id INTO event_id;
    
    -- Update album_images counters if applicable
    IF p_image_id IS NOT NULL THEN
        UPDATE "public"."album_images" 
        SET 
            view_count = CASE WHEN p_event_type = 'view' THEN view_count + 1 ELSE view_count END,
            like_count = CASE WHEN p_event_type = 'like' THEN like_count + 1 ELSE like_count END,
            share_count = CASE WHEN p_event_type = 'share' THEN share_count + 1 ELSE share_count END
        WHERE image_id = p_image_id AND album_id = p_album_id;
    END IF;
    
    RETURN event_id;
END;
$$;

COMMENT ON FUNCTION "public"."track_photo_analytics_event" IS 'Enterprise function to track photo analytics events';

-- ============================================================================
-- 10. CREATE ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE "public"."photo_analytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."photo_monetization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."photo_community" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_image_analysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."image_processing_jobs" ENABLE ROW LEVEL SECURITY;

-- Photo Analytics RLS Policies
CREATE POLICY "photo_analytics_select_policy" ON "public"."photo_analytics"
    FOR SELECT USING (
        auth.uid() IN (
            SELECT owner_id FROM "public"."photo_albums" WHERE id = album_id
        )
    );

CREATE POLICY "photo_analytics_insert_policy" ON "public"."photo_analytics"
    FOR INSERT WITH CHECK (true);

-- Photo Monetization RLS Policies
CREATE POLICY "photo_monetization_select_policy" ON "public"."photo_monetization"
    FOR SELECT USING (
        auth.uid() IN (
            SELECT owner_id FROM "public"."photo_albums" WHERE id = album_id
        )
    );

CREATE POLICY "photo_monetization_insert_policy" ON "public"."photo_monetization"
    FOR INSERT WITH CHECK (true);

-- Photo Community RLS Policies
CREATE POLICY "photo_community_select_policy" ON "public"."photo_community"
    FOR SELECT USING (
        auth.uid() IN (
            SELECT owner_id FROM "public"."photo_albums" WHERE id = album_id
        ) OR user_id = auth.uid()
    );

CREATE POLICY "photo_community_insert_policy" ON "public"."photo_community"
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "photo_community_update_policy" ON "public"."photo_community"
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "photo_community_delete_policy" ON "public"."photo_community"
    FOR DELETE USING (user_id = auth.uid());

-- AI Image Analysis RLS Policies
CREATE POLICY "ai_image_analysis_select_policy" ON "public"."ai_image_analysis"
    FOR SELECT USING (
        auth.uid() IN (
            SELECT pa.owner_id 
            FROM "public"."photo_albums" pa
            JOIN "public"."album_images" ai ON pa.id = ai.album_id
            WHERE ai.image_id = ai_image_analysis.image_id
        )
    );

CREATE POLICY "ai_image_analysis_insert_policy" ON "public"."ai_image_analysis"
    FOR INSERT WITH CHECK (true);

-- Image Processing Jobs RLS Policies
CREATE POLICY "image_processing_jobs_select_policy" ON "public"."image_processing_jobs"
    FOR SELECT USING (
        auth.uid() IN (
            SELECT pa.owner_id 
            FROM "public"."photo_albums" pa
            JOIN "public"."album_images" ai ON pa.id = ai.album_id
            WHERE ai.image_id = image_processing_jobs.image_id
        )
    );

CREATE POLICY "image_processing_jobs_insert_policy" ON "public"."image_processing_jobs"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "image_processing_jobs_update_policy" ON "public"."image_processing_jobs"
    FOR UPDATE USING (true);

-- ============================================================================
-- 11. CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Trigger to update album statistics when analytics events occur
CREATE OR REPLACE FUNCTION "public"."update_album_statistics_from_analytics"()
RETURNS TRIGGER AS $$
BEGIN
    -- Update photo_albums view_count, like_count, share_count based on analytics
    UPDATE "public"."photo_albums" 
    SET 
        view_count = (
            SELECT COUNT(*) 
            FROM "public"."photo_analytics" 
            WHERE album_id = NEW.album_id AND event_type = 'view'
        ),
        like_count = (
            SELECT COUNT(*) 
            FROM "public"."photo_analytics" 
            WHERE album_id = NEW.album_id AND event_type = 'like'
        ),
        share_count = (
            SELECT COUNT(*) 
            FROM "public"."photo_analytics" 
            WHERE album_id = NEW.album_id AND event_type = 'share'
        )
    WHERE id = NEW.album_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trigger_update_album_statistics_from_analytics"
    AFTER INSERT ON "public"."photo_analytics"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_album_statistics_from_analytics"();

-- Trigger to update album revenue when monetization events occur
CREATE OR REPLACE FUNCTION "public"."update_album_revenue_from_monetization"()
RETURNS TRIGGER AS $$
BEGIN
    -- Update photo_albums revenue_generated based on monetization
    UPDATE "public"."photo_albums" 
    SET revenue_generated = (
        SELECT COALESCE(SUM(amount), 0)
        FROM "public"."photo_monetization" 
        WHERE album_id = NEW.album_id AND status = 'completed'
    )
    WHERE id = NEW.album_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trigger_update_album_revenue_from_monetization"
    AFTER INSERT ON "public"."photo_monetization"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_album_revenue_from_monetization"();

-- ============================================================================
-- 12. INSERT INITIAL DATA FOR TESTING
-- ============================================================================

-- Insert sample entity types if they don't exist
INSERT INTO "public"."entity_types" (name, description, entity_category) 
VALUES 
    ('Photo Gallery', 'General photo galleries and collections', 'content'),
    ('Premium Content', 'Premium and monetized photo content', 'content'),
    ('Community Album', 'Community-driven photo albums', 'community')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- This migration creates the complete enterprise photo system infrastructure
-- including analytics, monetization, community features, and AI integration
-- All tables are properly indexed, secured with RLS, and include enterprise features 
-- End of 20250115_enterprise_photo_system_enhancement.sql


-- =====================================================
-- MIGRATION: 20250131_enterprise_activity_system.sql
-- =====================================================

-- Enterprise Activity System Migration
-- Adds performance optimizations, constraints, and enterprise features

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_activity_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_entity_type ON activities(entity_type);
CREATE INDEX IF NOT EXISTS idx_activities_entity_id ON activities(entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_user_activity_entity ON activities(user_id, activity_type, entity_type, entity_id);

-- Composite index for duplicate checking
CREATE INDEX IF NOT EXISTS idx_activities_duplicate_check ON activities(user_id, activity_type, entity_type, entity_id, created_at);

-- Add check constraint for activity types
ALTER TABLE activities ADD CONSTRAINT IF NOT EXISTS activities_activity_type_check 
CHECK (activity_type IN (
  'user_registered', 'user_profile_updated', 'user_login', 'user_logout',
  'book_added', 'book_updated', 'book_deleted', 'book_reviewed', 'book_rated',
  'author_created', 'author_updated', 'author_deleted',
  'publisher_created', 'publisher_updated', 'publisher_deleted',
  'group_created', 'group_joined', 'group_left', 'group_updated',
  'reading_started', 'reading_finished', 'reading_paused', 'reading_resumed',
  'friend_requested', 'friend_accepted', 'friend_declined',
  'comment_added', 'comment_updated', 'comment_deleted',
  'post_created', 'post_updated', 'post_deleted'
));

-- Add check constraint for entity types
ALTER TABLE activities ADD CONSTRAINT IF NOT EXISTS activities_entity_type_check 
CHECK (entity_type IN ('user', 'book', 'author', 'publisher', 'group', 'event', 'review', 'comment', 'post'));

-- Add metadata column for enterprise features
ALTER TABLE activities ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add batch tracking column
ALTER TABLE activities ADD COLUMN IF NOT EXISTS batch_id TEXT;

-- Create activity analytics view
CREATE OR REPLACE VIEW activity_analytics AS
SELECT 
  DATE(created_at) as activity_date,
  activity_type,
  entity_type,
  COUNT(*) as activity_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT entity_id) as unique_entities
FROM activities 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), activity_type, entity_type
ORDER BY activity_date DESC, activity_count DESC;

-- Create activity performance view
CREATE OR REPLACE VIEW activity_performance AS
SELECT 
  activity_type,
  entity_type,
  COUNT(*) as total_activities,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT entity_id) as unique_entities,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) as avg_age_seconds,
  MIN(created_at) as first_activity,
  MAX(created_at) as last_activity
FROM activities
GROUP BY activity_type, entity_type
ORDER BY total_activities DESC;

-- Create function to get activity statistics
CREATE OR REPLACE FUNCTION get_activity_stats()
RETURNS TABLE(
  total_activities BIGINT,
  activities_today BIGINT,
  activities_this_week BIGINT,
  activities_this_month BIGINT,
  by_type JSONB,
  by_entity JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM activities) as total_activities,
    (SELECT COUNT(*) FROM activities WHERE created_at >= CURRENT_DATE) as activities_today,
    (SELECT COUNT(*) FROM activities WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as activities_this_week,
    (SELECT COUNT(*) FROM activities WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as activities_this_month,
    (SELECT jsonb_object_agg(activity_type, count) FROM (
      SELECT activity_type, COUNT(*) as count 
      FROM activities 
      GROUP BY activity_type
    ) t) as by_type,
    (SELECT jsonb_object_agg(entity_type, count) FROM (
      SELECT entity_type, COUNT(*) as count 
      FROM activities 
      WHERE entity_type IS NOT NULL
      GROUP BY entity_type
    ) t) as by_entity;
END;
$$ LANGUAGE plpgsql;

-- Create function to check for duplicate activities
CREATE OR REPLACE FUNCTION check_activity_duplicate(
  p_user_id UUID,
  p_activity_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_hours_back INTEGER DEFAULT 24
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM activities 
    WHERE user_id = p_user_id 
      AND activity_type = p_activity_type 
      AND entity_type = p_entity_type 
      AND entity_id = p_entity_id
      AND created_at >= NOW() - (p_hours_back || ' hours')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to clean old activities (for archiving)
CREATE OR REPLACE FUNCTION archive_old_activities(p_days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM activities 
  WHERE created_at < NOW() - (p_days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get activity trends
CREATE OR REPLACE FUNCTION get_activity_trends(p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  date DATE,
  activity_count BIGINT,
  unique_users BIGINT,
  unique_entities BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(created_at) as date,
    COUNT(*) as activity_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT entity_id) as unique_entities
  FROM activities 
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE activities IS 'Enterprise-grade activity tracking system with performance optimizations and analytics support';
COMMENT ON COLUMN activities.metadata IS 'JSON metadata for enterprise features like batch tracking, IP addresses, user agents';
COMMENT ON COLUMN activities.batch_id IS 'Batch identifier for bulk operations and audit trails';
COMMENT ON INDEX idx_activities_user_activity_entity IS 'Composite index for efficient duplicate checking and filtering';
COMMENT ON INDEX idx_activities_duplicate_check IS 'Optimized index for duplicate prevention queries';

-- Grant permissions
GRANT SELECT ON activity_analytics TO authenticated;
GRANT SELECT ON activity_performance TO authenticated;
GRANT EXECUTE ON FUNCTION get_activity_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION check_activity_duplicate(UUID, TEXT, TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_activity_trends(INTEGER) TO authenticated;

-- Create RLS policies for activities table
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own activities
CREATE POLICY "Users can view their own activities" ON activities
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to see public activities (no user_id)
CREATE POLICY "Users can view public activities" ON activities
  FOR SELECT USING (user_id IS NULL);

-- Policy for system to insert activities (admin only)
CREATE POLICY "System can insert activities" ON activities
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Policy for system to update activities (admin only)
CREATE POLICY "System can update activities" ON activities
  FOR UPDATE USING (auth.role() = 'service_role');

-- Policy for system to delete activities (admin only)
CREATE POLICY "System can delete activities" ON activities
  FOR DELETE USING (auth.role() = 'service_role'); 
-- End of 20250131_enterprise_activity_system.sql


-- =====================================================
-- MIGRATION: 20250706_192200_migrate_image_types_to_entity_types.sql
-- =====================================================

-- =====================================================
-- MIGRATION: Transform image_types to entity_types
-- =====================================================
-- This script transforms the image_types table into a proper entity_types table
-- and updates all related references to maintain entity relationships

-- Step 1: Create the new entity_types table with proper structure
CREATE TABLE IF NOT EXISTS public.entity_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL UNIQUE,
    description text,
    entity_category text NOT NULL, -- 'user', 'publisher', 'author', 'group'
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT entity_types_entity_category_check 
        CHECK (entity_category = ANY (ARRAY['user', 'publisher', 'author', 'group']))
);

-- Add comments for enterprise documentation
COMMENT ON TABLE public.entity_types IS 'Centralized entity type definitions for enterprise-grade entity management';
COMMENT ON COLUMN public.entity_types.name IS 'Human-readable entity type name';
COMMENT ON COLUMN public.entity_types.entity_category IS 'Entity category for grouping and permissions';
COMMENT ON COLUMN public.entity_types.is_active IS 'Whether this entity type is currently active';

-- Step 2: Populate entity_types with current entity types
INSERT INTO public.entity_types (name, description, entity_category) VALUES
    ('User Profile', 'User profile photos and avatars', 'user'),
    ('User Album', 'User photo albums and galleries', 'user'),
    ('Publisher Logo', 'Publisher company logos and branding', 'publisher'),
    ('Publisher Gallery', 'Publisher photo galleries and content', 'publisher'),
    ('Author Portrait', 'Author profile photos and portraits', 'author'),
    ('Author Gallery', 'Author photo galleries and content', 'author'),
    ('Group Cover', 'Group cover images and banners', 'group'),
    ('Group Gallery', 'Group photo galleries and content', 'group'),
    ('Book Cover', 'Book cover images and artwork', 'book'),
    ('Event Banner', 'Event promotional banners and images', 'event'),
    ('Content Image', 'General content images and media', 'content');

-- Step 3: Add entity_type_id column to images table
ALTER TABLE public.images 
ADD COLUMN entity_type_id uuid,
ADD COLUMN entity_id uuid;

-- Add comments
COMMENT ON COLUMN public.images.entity_type_id IS 'Reference to entity_types table';
COMMENT ON COLUMN public.images.entity_id IS 'ID of the specific entity (user, publisher, author, group)';

-- Step 4: Create foreign key constraint for entity_type_id
ALTER TABLE public.images 
ADD CONSTRAINT images_entity_type_id_fkey 
FOREIGN KEY (entity_type_id) REFERENCES public.entity_types(id) ON DELETE SET NULL;

-- Step 5: Add constraint to ensure entity consistency
ALTER TABLE public.images 
ADD CONSTRAINT images_entity_consistency 
CHECK ((entity_type_id IS NULL AND entity_id IS NULL) 
       OR (entity_type_id IS NOT NULL AND entity_id IS NOT NULL));

-- Step 6: Create indexes for performance
CREATE INDEX idx_images_entity_type ON public.images(entity_type_id);
CREATE INDEX idx_images_entity_id ON public.images(entity_id);
CREATE INDEX idx_images_entity_composite ON public.images(entity_type_id, entity_id);

-- Step 7: Update album_images table to include entity context
ALTER TABLE public.album_images 
ADD COLUMN entity_type_id uuid,
ADD COLUMN entity_id uuid;

-- Add comments
COMMENT ON COLUMN public.album_images.entity_type_id IS 'Reference to entity_types table for album context';
COMMENT ON COLUMN public.album_images.entity_id IS 'ID of the specific entity for album context';

-- Step 8: Create foreign key constraint for album_images
ALTER TABLE public.album_images 
ADD CONSTRAINT album_images_entity_type_id_fkey 
FOREIGN KEY (entity_type_id) REFERENCES public.entity_types(id) ON DELETE SET NULL;

-- Step 9: Add constraint for album_images entity consistency
ALTER TABLE public.album_images 
ADD CONSTRAINT album_images_entity_consistency 
CHECK ((entity_type_id IS NULL AND entity_id IS NULL) 
       OR (entity_type_id IS NOT NULL AND entity_id IS NOT NULL));

-- Step 10: Create indexes for album_images
CREATE INDEX idx_album_images_entity_type ON public.album_images(entity_type_id);
CREATE INDEX idx_album_images_entity_id ON public.album_images(entity_id);
CREATE INDEX idx_album_images_entity_composite ON public.album_images(entity_type_id, entity_id);

-- Step 11: Create trigger function to maintain entity consistency
CREATE OR REPLACE FUNCTION public.maintain_entity_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure entity consistency when album_images is updated
    IF NEW.entity_type_id IS NOT NULL AND NEW.entity_id IS NULL THEN
        RAISE EXCEPTION 'entity_id must be provided when entity_type_id is set';
    END IF;
    
    IF NEW.entity_type_id IS NULL AND NEW.entity_id IS NOT NULL THEN
        RAISE EXCEPTION 'entity_type_id must be provided when entity_id is set';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create triggers for entity consistency
CREATE TRIGGER trigger_maintain_entity_consistency_images
    BEFORE INSERT OR UPDATE ON public.images
    FOR EACH ROW
    EXECUTE FUNCTION public.maintain_entity_consistency();

CREATE TRIGGER trigger_maintain_entity_consistency_album_images
    BEFORE INSERT OR UPDATE ON public.album_images
    FOR EACH ROW
    EXECUTE FUNCTION public.maintain_entity_consistency();

-- Step 13: Create function to populate entity context from photo_albums
CREATE OR REPLACE FUNCTION public.populate_album_images_entity_context()
RETURNS void AS $$
BEGIN
    -- Update album_images with entity context from photo_albums
    UPDATE public.album_images 
    SET 
        entity_type_id = (
            SELECT et.id 
            FROM public.entity_types et 
            WHERE et.entity_category = pa.entity_type
        ),
        entity_id = pa.entity_id
    FROM public.photo_albums pa
    WHERE album_images.album_id = pa.id
    AND pa.entity_type IS NOT NULL 
    AND pa.entity_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 14: Create function to populate images entity context from album_images
CREATE OR REPLACE FUNCTION public.populate_images_entity_context()
RETURNS void AS $$
BEGIN
    -- Update images with entity context from album_images
    UPDATE public.images 
    SET 
        entity_type_id = ai.entity_type_id,
        entity_id = ai.entity_id
    FROM public.album_images ai
    WHERE images.id = ai.image_id
    AND ai.entity_type_id IS NOT NULL 
    AND ai.entity_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 15: Create view for enterprise analytics
CREATE OR REPLACE VIEW public.entity_image_analytics AS
SELECT 
    et.name as entity_type_name,
    et.entity_category,
    COUNT(i.id) as total_images,
    COUNT(DISTINCT i.entity_id) as unique_entities,
    AVG(i.file_size) as avg_file_size,
    SUM(i.file_size) as total_storage_used,
    MIN(i.created_at) as earliest_image,
    MAX(i.created_at) as latest_image
FROM public.images i
JOIN public.entity_types et ON i.entity_type_id = et.id
WHERE i.deleted_at IS NULL
GROUP BY et.id, et.name, et.entity_category
ORDER BY total_images DESC;

-- Add comment for the view
COMMENT ON VIEW public.entity_image_analytics IS 'Enterprise analytics view for entity-based image usage and storage';

-- Step 16: Create function to get entity context for any image
CREATE OR REPLACE FUNCTION public.get_image_entity_context(image_uuid uuid)
RETURNS TABLE(
    entity_type_name text,
    entity_category text,
    entity_id uuid,
    album_name text,
    owner_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        et.name as entity_type_name,
        et.entity_category,
        i.entity_id,
        pa.name as album_name,
        p.full_name as owner_name
    FROM public.images i
    LEFT JOIN public.entity_types et ON i.entity_type_id = et.id
    LEFT JOIN public.album_images ai ON i.id = ai.image_id
    LEFT JOIN public.photo_albums pa ON ai.album_id = pa.id
    LEFT JOIN public.profiles p ON pa.owner_id = p.user_id
    WHERE i.id = image_uuid;
END;
$$ LANGUAGE plpgsql;

-- Add comment for the function
COMMENT ON FUNCTION public.get_image_entity_context(uuid) IS 'Get complete entity context for any image including album and owner information'; 
-- End of 20250706_192200_migrate_image_types_to_entity_types.sql


-- =====================================================
-- MIGRATION: 20250707000800_force_rename_follow_functions.sql
-- =====================================================

-- =====================================================
-- FORCE RENAME OLD FUNCTIONS AND CREATE NEW ONES
-- =====================================================
-- This migration will rename old functions and create new ones with unique names

-- First, rename the old functions to avoid conflicts
DO $$ 
BEGIN
    -- Rename old functions if they exist
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_existing_follow') THEN
        ALTER FUNCTION check_existing_follow(UUID, TEXT, UUID) RENAME TO check_existing_follow_old_text;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'insert_follow_record') THEN
        ALTER FUNCTION insert_follow_record(UUID, TEXT, UUID) RENAME TO insert_follow_record_old_text;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_follow_record') THEN
        ALTER FUNCTION delete_follow_record(UUID, TEXT, UUID) RENAME TO delete_follow_record_old_text;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_is_following') THEN
        ALTER FUNCTION check_is_following(UUID, TEXT, UUID) RENAME TO check_is_following_old_text;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Function doesn't exist, continue
        NULL;
END $$;

-- Now drop the renamed functions
DROP FUNCTION IF EXISTS check_existing_follow_old_text(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS insert_follow_record_old_text(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS delete_follow_record_old_text(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS check_is_following_old_text(UUID, TEXT, UUID);

-- Create new functions with UUID parameters only
CREATE OR REPLACE FUNCTION check_existing_follow(
  p_follower_id UUID,
  p_following_id UUID,
  p_target_type_id UUID
)
RETURNS TABLE(follow_exists BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT EXISTS(
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_follower_id 
    AND following_id = p_following_id
    AND target_type_id = p_target_type_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION insert_follow_record(
  p_follower_id UUID,
  p_following_id UUID,
  p_target_type_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.follows (follower_id, following_id, target_type_id)
  VALUES (p_follower_id, p_following_id, p_target_type_id)
  ON CONFLICT (follower_id, following_id, target_type_id) DO NOTHING;
  
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION delete_follow_record(
  p_follower_id UUID,
  p_following_id UUID,
  p_target_type_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.follows 
  WHERE follower_id = p_follower_id 
  AND following_id = p_following_id
  AND target_type_id = p_target_type_id;
  
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION check_is_following(
  p_follower_id UUID,
  p_following_id UUID,
  p_target_type_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_follower_id 
    AND following_id = p_following_id
    AND target_type_id = p_target_type_id
  );
END;
$$; 
-- End of 20250707000800_force_rename_follow_functions.sql


-- =====================================================
-- MIGRATION: 20250707000900_complete_follow_function_fix.sql
-- =====================================================

-- =====================================================
-- COMPLETE FOLLOW FUNCTION FIX
-- =====================================================
-- This migration will completely remove ALL follow functions and recreate only UUID versions

-- Drop ALL existing follow functions (both old and new)
DROP FUNCTION IF EXISTS check_existing_follow(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS check_existing_follow(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS check_existing_follow_old_text(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS check_existing_follow_new_uuid(UUID, UUID, UUID);

DROP FUNCTION IF EXISTS insert_follow_record(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS insert_follow_record(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS insert_follow_record_old_text(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS insert_follow_record_new_uuid(UUID, UUID, UUID);

DROP FUNCTION IF EXISTS delete_follow_record(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS delete_follow_record(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS delete_follow_record_old_text(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS delete_follow_record_new_uuid(UUID, UUID, UUID);

DROP FUNCTION IF EXISTS check_is_following(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS check_is_following(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS check_is_following_old_text(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS check_is_following_new_uuid(UUID, UUID, UUID);

-- Now create ONLY the UUID versions
CREATE OR REPLACE FUNCTION check_existing_follow(
  p_follower_id UUID,
  p_following_id UUID,
  p_target_type_id UUID
)
RETURNS TABLE(follow_exists BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT EXISTS(
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_follower_id 
    AND following_id = p_following_id
    AND target_type_id = p_target_type_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION insert_follow_record(
  p_follower_id UUID,
  p_following_id UUID,
  p_target_type_id UUID
)
RETURNS TABLE(success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if follow already exists
  IF EXISTS (
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_follower_id 
    AND following_id = p_following_id
    AND target_type_id = p_target_type_id
  ) THEN
    RETURN QUERY SELECT FALSE, 'Already following this entity';
    RETURN;
  END IF;

  -- Insert new follow record
  INSERT INTO public.follows (follower_id, following_id, target_type_id)
  VALUES (p_follower_id, p_following_id, p_target_type_id);

  RETURN QUERY SELECT TRUE, '';
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION delete_follow_record(
  p_follower_id UUID,
  p_following_id UUID,
  p_target_type_id UUID
)
RETURNS TABLE(success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete follow record
  DELETE FROM public.follows 
  WHERE follower_id = p_follower_id 
  AND following_id = p_following_id
  AND target_type_id = p_target_type_id;

  -- Check if any rows were affected
  IF FOUND THEN
    RETURN QUERY SELECT TRUE, '';
  ELSE
    RETURN QUERY SELECT FALSE, 'Follow record not found';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION check_is_following(
  p_follower_id UUID,
  p_following_id UUID,
  p_target_type_id UUID
)
RETURNS TABLE(is_following BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT EXISTS(
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_follower_id 
    AND following_id = p_following_id
    AND target_type_id = p_target_type_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_existing_follow(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_follow_record(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_follow_record(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_is_following(UUID, UUID, UUID) TO authenticated; 
-- End of 20250707000900_complete_follow_function_fix.sql


-- =====================================================
-- MIGRATION: 20250707001000_final_follow_function_cleanup.sql
-- =====================================================

-- =====================================================
-- FINAL FOLLOW FUNCTION CLEANUP
-- =====================================================
-- This migration will completely clear all follow functions and recreate them
-- to ensure no function overloading conflicts exist

-- Drop ALL possible variations of follow functions
DROP FUNCTION IF EXISTS public.check_existing_follow(UUID, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_existing_follow(UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.insert_follow_record(UUID, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.insert_follow_record(UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.delete_follow_record(UUID, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.delete_follow_record(UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_is_following(UUID, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_is_following(UUID, UUID, UUID) CASCADE;

-- Clear any function cache (removed pg_reload_conf due to permissions)

-- Recreate ONLY the UUID versions with explicit schema qualification
CREATE OR REPLACE FUNCTION public.check_existing_follow(
  p_follower_id UUID,
  p_following_id UUID,
  p_target_type_id UUID
)
RETURNS TABLE(follow_exists BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT EXISTS(
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_follower_id 
    AND following_id = p_following_id
    AND target_type_id = p_target_type_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.insert_follow_record(
  p_follower_id UUID,
  p_following_id UUID,
  p_target_type_id UUID
)
RETURNS TABLE(success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if follow already exists
  IF EXISTS (
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_follower_id 
    AND following_id = p_following_id
    AND target_type_id = p_target_type_id
  ) THEN
    RETURN QUERY SELECT FALSE, 'Already following this entity';
    RETURN;
  END IF;

  -- Insert new follow record
  INSERT INTO public.follows (follower_id, following_id, target_type_id)
  VALUES (p_follower_id, p_following_id, p_target_type_id);

  RETURN QUERY SELECT TRUE, '';
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_follow_record(
  p_follower_id UUID,
  p_following_id UUID,
  p_target_type_id UUID
)
RETURNS TABLE(success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete follow record
  DELETE FROM public.follows 
  WHERE follower_id = p_follower_id 
  AND following_id = p_following_id
  AND target_type_id = p_target_type_id;

  -- Check if any rows were affected
  IF FOUND THEN
    RETURN QUERY SELECT TRUE, '';
  ELSE
    RETURN QUERY SELECT FALSE, 'Follow record not found';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_is_following(
  p_follower_id UUID,
  p_following_id UUID,
  p_target_type_id UUID
)
RETURNS TABLE(is_following BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT EXISTS(
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_follower_id 
    AND following_id = p_following_id
    AND target_type_id = p_target_type_id
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.check_existing_follow(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_follow_record(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_follow_record(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_following(UUID, UUID, UUID) TO authenticated;

-- Verify no TEXT versions exist
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname IN ('check_existing_follow', 'insert_follow_record', 'delete_follow_record', 'check_is_following')
    AND pg_get_function_arguments(p.oid) LIKE '%text%';
    
    IF func_count > 0 THEN
        RAISE EXCEPTION 'TEXT-based follow functions still exist: %', func_count;
    END IF;
    
    RAISE NOTICE 'All follow functions are now UUID-only. Total functions: %', (
        SELECT COUNT(*) FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname IN ('check_existing_follow', 'insert_follow_record', 'delete_follow_record', 'check_is_following')
    );
END;
$$; 
-- End of 20250707001000_final_follow_function_cleanup.sql


-- =====================================================
-- MIGRATION: 20250709_enterprise_groups_schema.sql
-- =====================================================

-- Enterprise Groups Schema Migration
-- This migration adds enterprise-grade functionality to groups including:
-- - Role-based access control
-- - Audit logging
-- - Content moderation
-- - Member management
-- - Group settings
-- - Analytics tracking

-- 1. Group Roles
CREATE TABLE IF NOT EXISTS public.group_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    is_custom boolean DEFAULT false,
    permissions jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (group_id, name)
);

ALTER TABLE public.group_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group roles are viewable by group members"
    ON public.group_roles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = group_roles.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- 2. Group Members (Extend existing table)
ALTER TABLE public.group_members 
    ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.group_roles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('active', 'suspended', 'banned')) DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS last_active timestamptz DEFAULT now();

-- 3. Group Settings
CREATE TABLE IF NOT EXISTS public.group_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE UNIQUE,
    name text NOT NULL,
    description text,
    privacy text CHECK (privacy IN ('public', 'private', 'hidden')) DEFAULT 'public',
    join_type text CHECK (join_type IN ('open', 'request', 'invite')) DEFAULT 'open',
    moderation_settings jsonb NOT NULL DEFAULT '{
        "auto_moderation": false,
        "toxicity_threshold": 80,
        "require_approval": false,
        "allowed_content_types": ["text", "image", "link"],
        "banned_keywords": [],
        "notification_settings": {
            "email": true,
            "push": false,
            "slack": false,
            "discord": false
        }
    }',
    branding jsonb DEFAULT '{
        "logo_url": null,
        "banner_url": null,
        "primary_color": null,
        "secondary_color": null
    }',
    integrations jsonb DEFAULT '{
        "slack_webhook": null,
        "discord_webhook": null,
        "api_key": null
    }',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.group_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group settings are viewable by group members"
    ON public.group_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = group_settings.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- 4. Group Invitations
CREATE TABLE IF NOT EXISTS public.group_invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    email text NOT NULL,
    role_id uuid REFERENCES public.group_roles(id) ON DELETE SET NULL,
    status text CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group invitations are viewable by group members with manage_members permission"
    ON public.group_invitations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            JOIN public.group_roles gr ON gm.role_id = gr.id
            WHERE gm.group_id = group_invitations.group_id
            AND gm.user_id = auth.uid()
            AND (gr.permissions->>'manageMembers')::boolean = true
        )
    );

-- 5. Group Audit Log
CREATE TABLE IF NOT EXISTS public.group_audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    old_values jsonb,
    new_values jsonb,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.group_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs are viewable by group members with audit permission"
    ON public.group_audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            JOIN public.group_roles gr ON gm.role_id = gr.id
            WHERE gm.group_id = group_audit_log.group_id
            AND gm.user_id = auth.uid()
            AND (gr.permissions->>'viewAudit')::boolean = true
        )
    );

-- 6. Group Content Moderation
CREATE TABLE IF NOT EXISTS public.group_moderation_queue (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    content_type text NOT NULL,
    content_id uuid NOT NULL,
    reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reason text,
    status text CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    toxicity_score float,
    moderated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    moderated_at timestamptz,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.group_moderation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderation queue is viewable by group moderators"
    ON public.group_moderation_queue FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            JOIN public.group_roles gr ON gm.role_id = gr.id
            WHERE gm.group_id = group_moderation_queue.group_id
            AND gm.user_id = auth.uid()
            AND (gr.permissions->>'moderateContent')::boolean = true
        )
    );

-- 7. Group Analytics
CREATE TABLE IF NOT EXISTS public.group_analytics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    date date NOT NULL,
    metrics jsonb NOT NULL DEFAULT '{
        "total_members": 0,
        "active_members": 0,
        "new_members": 0,
        "content_created": 0,
        "content_engagement": 0,
        "reported_content": 0
    }',
    UNIQUE (group_id, date)
);

ALTER TABLE public.group_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analytics are viewable by group members with analytics permission"
    ON public.group_analytics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            JOIN public.group_roles gr ON gm.role_id = gr.id
            WHERE gm.group_id = group_analytics.group_id
            AND gm.user_id = auth.uid()
            AND (gr.permissions->>'viewAnalytics')::boolean = true
        )
    );

-- Create default roles function
CREATE OR REPLACE FUNCTION public.create_default_group_roles(group_id uuid)
RETURNS void AS $$
BEGIN
    -- Owner role
    INSERT INTO public.group_roles (group_id, name, description, is_custom, permissions)
    VALUES (
        group_id,
        'Owner',
        'Full control over the group',
        false,
        '{
            "manageRoles": true,
            "manageMembers": true,
            "manageSettings": true,
            "manageContent": true,
            "viewAnalytics": true,
            "moderateContent": true,
            "createContent": true,
            "editContent": true,
            "deleteContent": true,
            "inviteMembers": true,
            "removeMembers": true,
            "viewAudit": true
        }'::jsonb
    );

    -- Admin role
    INSERT INTO public.group_roles (group_id, name, description, is_custom, permissions)
    VALUES (
        group_id,
        'Admin',
        'Administrative control with some restrictions',
        false,
        '{
            "manageMembers": true,
            "manageContent": true,
            "viewAnalytics": true,
            "moderateContent": true,
            "createContent": true,
            "editContent": true,
            "deleteContent": true,
            "inviteMembers": true,
            "removeMembers": true,
            "viewAudit": true
        }'::jsonb
    );

    -- Moderator role
    INSERT INTO public.group_roles (group_id, name, description, is_custom, permissions)
    VALUES (
        group_id,
        'Moderator',
        'Content moderation and member management',
        false,
        '{
            "moderateContent": true,
            "createContent": true,
            "editContent": true,
            "deleteContent": true,
            "inviteMembers": true
        }'::jsonb
    );

    -- Member role
    INSERT INTO public.group_roles (group_id, name, description, is_custom, permissions)
    VALUES (
        group_id,
        'Member',
        'Standard member access',
        false,
        '{
            "createContent": true,
            "editContent": true
        }'::jsonb
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default roles when a new group is created
CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default roles
    PERFORM public.create_default_group_roles(NEW.id);
    
    -- Create default settings
    INSERT INTO public.group_settings (group_id, name, description)
    VALUES (NEW.id, NEW.name, NEW.description);
    
    -- Assign owner role to creator
    INSERT INTO public.group_members (group_id, user_id, role_id)
    VALUES (
        NEW.id,
        NEW.created_by,
        (SELECT id FROM public.group_roles WHERE group_id = NEW.id AND name = 'Owner' LIMIT 1)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_group_created
    AFTER INSERT ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_group();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role_id ON public.group_members(role_id);
CREATE INDEX IF NOT EXISTS idx_group_roles_group_id ON public.group_roles(group_id);
CREATE INDEX IF NOT EXISTS idx_group_audit_log_group_id ON public.group_audit_log(group_id);
CREATE INDEX IF NOT EXISTS idx_group_audit_log_created_at ON public.group_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_group_moderation_queue_group_id ON public.group_moderation_queue(group_id);
CREATE INDEX IF NOT EXISTS idx_group_moderation_queue_status ON public.group_moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_group_analytics_group_id_date ON public.group_analytics(group_id, date); 
-- End of 20250709_enterprise_groups_schema.sql


-- =====================================================
-- MIGRATION: 20250727200709_fix_add_image_to_entity_album_1753646828853.sql
-- =====================================================

-- Fix: Add missing add_image_to_entity_album function
-- Run this in the Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the add_image_to_entity_album function
CREATE OR REPLACE FUNCTION public.add_image_to_entity_album(
    p_entity_id uuid,
    p_entity_type text,
    p_album_type text,
    p_image_id uuid,
    p_display_order integer DEFAULT 1,
    p_is_cover boolean DEFAULT false,
    p_is_featured boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_album_id uuid;
    v_entity_type_id uuid;
    v_existing_album_images record;
    v_max_display_order integer;
BEGIN
    -- Get entity type ID
    SELECT id INTO v_entity_type_id
    FROM public.entity_types
    WHERE entity_category = p_entity_type;
    
    IF v_entity_type_id IS NULL THEN
        RAISE EXCEPTION 'Entity type % not found', p_entity_type;
    END IF;
    
    -- Check if album exists, create if it doesn't
    SELECT id INTO v_album_id
    FROM public.photo_albums
    WHERE entity_id = p_entity_id
    AND entity_type = p_entity_type
    AND album_type = p_album_type;
    
    IF v_album_id IS NULL THEN
        -- Create new album
        INSERT INTO public.photo_albums (
            name,
            description,
            entity_id,
            entity_type,
            album_type,
            is_public,
            metadata
        ) VALUES (
            p_album_type,
            'Auto-created album for ' || p_entity_type || ' ' || p_entity_id,
            p_entity_id,
            p_entity_type,
            p_album_type,
            false,
            jsonb_build_object(
                'created_via', 'add_image_to_entity_album',
                'total_images', 0,
                'total_size', 0,
                'last_modified', now()
            )
        ) RETURNING id INTO v_album_id;
    END IF;
    
    -- Check if image is already in album
    SELECT * INTO v_existing_album_images
    FROM public.album_images
    WHERE album_id = v_album_id
    AND image_id = p_image_id;
    
    IF v_existing_album_images IS NOT NULL THEN
        -- Update existing record
        UPDATE public.album_images
        SET 
            display_order = p_display_order,
            is_cover = p_is_cover,
            is_featured = p_is_featured,
            updated_at = now()
        WHERE album_id = v_album_id
        AND image_id = p_image_id;
    ELSE
        -- Get max display order if not specified
        IF p_display_order IS NULL OR p_display_order <= 0 THEN
            SELECT COALESCE(MAX(display_order), 0) + 1 INTO v_max_display_order
            FROM public.album_images
            WHERE album_id = v_album_id;
        ELSE
            v_max_display_order := p_display_order;
        END IF;
        
        -- Insert new album image record
        INSERT INTO public.album_images (
            album_id,
            image_id,
            display_order,
            is_cover,
            is_featured,
            entity_type_id,
            entity_id,
            metadata
        ) VALUES (
            v_album_id,
            p_image_id,
            v_max_display_order,
            p_is_cover,
            p_is_featured,
            v_entity_type_id,
            p_entity_id,
            jsonb_build_object(
                'added_via', 'add_image_to_entity_album',
                'added_at', now()
            )
        );
    END IF;
    
    -- Update album metadata
    UPDATE public.photo_albums
    SET 
        metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{total_images}',
            to_jsonb(
                (SELECT COUNT(*) FROM public.album_images WHERE album_id = v_album_id)
            )
        ),
        updated_at = now()
    WHERE id = v_album_id;
    
    -- If this is a cover image, clear other cover images in the same album
    IF p_is_cover THEN
        UPDATE public.album_images
        SET is_cover = false
        WHERE album_id = v_album_id
        AND image_id != p_image_id;
    END IF;
    
    -- If this is a featured image, clear other featured images in the same album
    IF p_is_featured THEN
        UPDATE public.album_images
        SET is_featured = false
        WHERE album_id = v_album_id
        AND image_id != p_image_id;
    END IF;
    
    RETURN v_album_id;
END;
$$;

-- Add function comment
COMMENT ON FUNCTION public.add_image_to_entity_album(uuid, text, text, uuid, integer, boolean, boolean) IS 
'Adds an image to an entity album, creating the album if it doesn''t exist. Returns the album ID.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.add_image_to_entity_album(uuid, text, text, uuid, integer, boolean, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_image_to_entity_album(uuid, text, text, uuid, integer, boolean, boolean) TO service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photo_albums_entity_lookup 
ON public.photo_albums(entity_id, entity_type, album_type);

CREATE INDEX IF NOT EXISTS idx_album_images_album_image 
ON public.album_images(album_id, image_id);

CREATE INDEX IF NOT EXISTS idx_album_images_entity_lookup 
ON public.album_images(entity_id, entity_type_id);

-- Verify the function was created
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'add_image_to_entity_album'
AND routine_schema = 'public'; 
-- End of 20250727200709_fix_add_image_to_entity_album_1753646828853.sql


-- =====================================================
-- MIGRATION: 20250729003259_enterprise_photo_system_final.sql
-- =====================================================

-- ENTERPRISE PHOTO SYSTEM ENHANCEMENT MIGRATION
-- This migration adds the missing enterprise tables for analytics, monetization, and community features
-- Based on the actual database schema analysis and enterprise platform requirements

-- ============================================================================
-- 1. PHOTO ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."photo_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "image_id" "uuid",
    "event_type" "text" NOT NULL,
    "user_id" "uuid",
    "session_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "photo_analytics_event_type_check" CHECK (
        "event_type" IN ('view', 'click', 'share', 'download', 'like', 'upload', 'delete', 'edit', 'comment', 'purchase')
    )
);

-- Add comments
COMMENT ON TABLE "public"."photo_analytics" IS 'Enterprise photo analytics tracking for comprehensive insights';
COMMENT ON COLUMN "public"."photo_analytics"."event_type" IS 'Type of analytics event tracked';
COMMENT ON COLUMN "public"."photo_analytics"."metadata" IS 'Additional event metadata including user agent, referrer, etc.';

-- Create indexes for performance
CREATE INDEX "idx_photo_analytics_album_id" ON "public"."photo_analytics"("album_id");
CREATE INDEX "idx_photo_analytics_image_id" ON "public"."photo_analytics"("image_id");
CREATE INDEX "idx_photo_analytics_event_type" ON "public"."photo_analytics"("event_type");
CREATE INDEX "idx_photo_analytics_created_at" ON "public"."photo_analytics"("created_at");
CREATE INDEX "idx_photo_analytics_user_id" ON "public"."photo_analytics"("user_id");

-- ============================================================================
-- 2. PHOTO MONETIZATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."photo_monetization" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "image_id" "uuid",
    "event_type" "text" NOT NULL,
    "amount" numeric(10,2) DEFAULT 0,
    "currency" "text" DEFAULT 'USD',
    "user_id" "uuid",
    "payment_method" "text",
    "transaction_id" "text",
    "status" "text" DEFAULT 'pending',
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "photo_monetization_event_type_check" CHECK (
        "event_type" IN ('purchase', 'subscription', 'tip', 'ad_revenue', 'sponsorship', 'merchandise', 'commission')
    ),
    CONSTRAINT "photo_monetization_status_check" CHECK (
        "status" IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')
    ),
    CONSTRAINT "photo_monetization_amount_check" CHECK ("amount" >= 0)
);

-- Add comments
COMMENT ON TABLE "public"."photo_monetization" IS 'Enterprise photo monetization tracking for revenue streams';
COMMENT ON COLUMN "public"."photo_monetization"."event_type" IS 'Type of monetization event';
COMMENT ON COLUMN "public"."photo_monetization"."amount" IS 'Monetary amount in specified currency';
COMMENT ON COLUMN "public"."photo_monetization"."status" IS 'Transaction status';

-- Create indexes for performance
CREATE INDEX "idx_photo_monetization_album_id" ON "public"."photo_monetization"("album_id");
CREATE INDEX "idx_photo_monetization_image_id" ON "public"."photo_monetization"("image_id");
CREATE INDEX "idx_photo_monetization_event_type" ON "public"."photo_monetization"("event_type");
CREATE INDEX "idx_photo_monetization_status" ON "public"."photo_monetization"("status");
CREATE INDEX "idx_photo_monetization_created_at" ON "public"."photo_monetization"("created_at");
CREATE INDEX "idx_photo_monetization_user_id" ON "public"."photo_monetization"("user_id");

-- ============================================================================
-- 3. PHOTO COMMUNITY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."photo_community" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "image_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "interaction_type" "text" NOT NULL,
    "content" "text",
    "rating" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "photo_community_interaction_type_check" CHECK (
        "interaction_type" IN ('like', 'comment', 'share', 'follow', 'bookmark', 'report', 'review', 'rating')
    ),
    CONSTRAINT "photo_community_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

-- Add comments
COMMENT ON TABLE "public"."photo_community" IS 'Enterprise photo community interactions and social features';
COMMENT ON COLUMN "public"."photo_community"."interaction_type" IS 'Type of community interaction';
COMMENT ON COLUMN "public"."photo_community"."content" IS 'User-generated content (comments, reviews)';
COMMENT ON COLUMN "public"."photo_community"."rating" IS 'User rating (1-5 stars)';

-- Create indexes for performance
CREATE INDEX "idx_photo_community_album_id" ON "public"."photo_community"("album_id");
CREATE INDEX "idx_photo_community_image_id" ON "public"."photo_community"("image_id");
CREATE INDEX "idx_photo_community_user_id" ON "public"."photo_community"("user_id");
CREATE INDEX "idx_photo_community_interaction_type" ON "public"."photo_community"("interaction_type");
CREATE INDEX "idx_photo_community_created_at" ON "public"."photo_community"("created_at");

-- ============================================================================
-- 4. AI IMAGE ANALYSIS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."ai_image_analysis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "image_id" "uuid" NOT NULL,
    "analysis_type" "text" NOT NULL,
    "confidence_score" numeric(3,2) DEFAULT 0,
    "tags" "text"[] DEFAULT '{}',
    "objects_detected" "jsonb" DEFAULT '{}'::"jsonb",
    "quality_metrics" "jsonb" DEFAULT '{}'::"jsonb",
    "sentiment_score" numeric(3,2),
    "content_safety_score" numeric(3,2) DEFAULT 1.0,
    "moderation_flags" "text"[] DEFAULT '{}',
    "processing_time_ms" integer,
    "model_version" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_image_analysis_confidence_check" CHECK ("confidence_score" >= 0 AND "confidence_score" <= 1),
    CONSTRAINT "ai_image_analysis_sentiment_check" CHECK ("sentiment_score" >= -1 AND "sentiment_score" <= 1),
    CONSTRAINT "ai_image_analysis_safety_check" CHECK ("content_safety_score" >= 0 AND "content_safety_score" <= 1)
);

-- Add comments
COMMENT ON TABLE "public"."ai_image_analysis" IS 'AI-powered image analysis results for enterprise features';
COMMENT ON COLUMN "public"."ai_image_analysis"."analysis_type" IS 'Type of AI analysis performed';
COMMENT ON COLUMN "public"."ai_image_analysis"."confidence_score" IS 'AI confidence in analysis (0-1)';
COMMENT ON COLUMN "public"."ai_image_analysis"."content_safety_score" IS 'Content safety assessment (0-1)';

-- Create indexes for performance
CREATE INDEX "idx_ai_image_analysis_image_id" ON "public"."ai_image_analysis"("image_id");
CREATE INDEX "idx_ai_image_analysis_type" ON "public"."ai_image_analysis"("analysis_type");
CREATE INDEX "idx_ai_image_analysis_confidence" ON "public"."ai_image_analysis"("confidence_score");
CREATE INDEX "idx_ai_image_analysis_safety" ON "public"."ai_image_analysis"("content_safety_score");
CREATE INDEX "idx_ai_image_analysis_created_at" ON "public"."ai_image_analysis"("created_at");

-- ============================================================================
-- 5. IMAGE PROCESSING JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."image_processing_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "image_id" "uuid" NOT NULL,
    "job_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending',
    "priority" integer DEFAULT 5,
    "parameters" "jsonb" DEFAULT '{}'::"jsonb",
    "result" "jsonb",
    "error_message" "text",
    "processing_time_ms" integer,
    "worker_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    CONSTRAINT "image_processing_jobs_status_check" CHECK (
        "status" IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
    ),
    CONSTRAINT "image_processing_jobs_priority_check" CHECK ("priority" >= 1 AND "priority" <= 10)
);

-- Add comments
COMMENT ON TABLE "public"."image_processing_jobs" IS 'Image processing job queue for AI and optimization tasks';
COMMENT ON COLUMN "public"."image_processing_jobs"."job_type" IS 'Type of processing job';
COMMENT ON COLUMN "public"."image_processing_jobs"."priority" IS 'Job priority (1-10, higher is more important)';

-- Create indexes for performance
CREATE INDEX "idx_image_processing_jobs_image_id" ON "public"."image_processing_jobs"("image_id");
CREATE INDEX "idx_image_processing_jobs_status" ON "public"."image_processing_jobs"("status");
CREATE INDEX "idx_image_processing_jobs_priority" ON "public"."image_processing_jobs"("priority");
CREATE INDEX "idx_image_processing_jobs_created_at" ON "public"."image_processing_jobs"("created_at");

-- ============================================================================
-- 6. ENHANCE EXISTING TABLES WITH ENTERPRISE FEATURES
-- ============================================================================

-- Add enterprise columns to album_images table
ALTER TABLE "public"."album_images" 
ADD COLUMN IF NOT EXISTS "view_count" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "like_count" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "share_count" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "revenue_generated" numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "ai_tags" "text"[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "community_engagement" numeric(3,2) DEFAULT 0;

-- Add comments for new columns
COMMENT ON COLUMN "public"."album_images"."view_count" IS 'Number of views for this image in the album';
COMMENT ON COLUMN "public"."album_images"."like_count" IS 'Number of likes for this image in the album';
COMMENT ON COLUMN "public"."album_images"."share_count" IS 'Number of shares for this image in the album';
COMMENT ON COLUMN "public"."album_images"."revenue_generated" IS 'Total revenue generated from this image';
COMMENT ON COLUMN "public"."album_images"."ai_tags" IS 'AI-generated tags for the image';
COMMENT ON COLUMN "public"."album_images"."community_engagement" IS 'Community engagement score (0-1)';

-- Add enterprise columns to photo_albums table
ALTER TABLE "public"."photo_albums" 
ADD COLUMN IF NOT EXISTS "monetization_enabled" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "premium_content" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "community_features" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "ai_enhanced" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "analytics_enabled" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "revenue_generated" numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "total_subscribers" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "community_score" numeric(3,2) DEFAULT 0;

-- Add comments for new columns
COMMENT ON COLUMN "public"."photo_albums"."monetization_enabled" IS 'Whether monetization features are enabled for this album';
COMMENT ON COLUMN "public"."photo_albums"."premium_content" IS 'Whether this album contains premium content';
COMMENT ON COLUMN "public"."photo_albums"."community_features" IS 'Whether community features are enabled';
COMMENT ON COLUMN "public"."photo_albums"."ai_enhanced" IS 'Whether AI features are enabled';
COMMENT ON COLUMN "public"."photo_albums"."analytics_enabled" IS 'Whether analytics tracking is enabled';
COMMENT ON COLUMN "public"."photo_albums"."revenue_generated" IS 'Total revenue generated from this album';
COMMENT ON COLUMN "public"."photo_albums"."total_subscribers" IS 'Number of premium subscribers';
COMMENT ON COLUMN "public"."photo_albums"."community_score" IS 'Community engagement score (0-1)';

-- ============================================================================
-- 7. CREATE FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Photo Analytics foreign keys
ALTER TABLE "public"."photo_analytics" 
ADD CONSTRAINT "photo_analytics_album_id_fkey" 
FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;

ALTER TABLE "public"."photo_analytics" 
ADD CONSTRAINT "photo_analytics_image_id_fkey" 
FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;

ALTER TABLE "public"."photo_analytics" 
ADD CONSTRAINT "photo_analytics_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;

-- Photo Monetization foreign keys
ALTER TABLE "public"."photo_monetization" 
ADD CONSTRAINT "photo_monetization_album_id_fkey" 
FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;

ALTER TABLE "public"."photo_monetization" 
ADD CONSTRAINT "photo_monetization_image_id_fkey" 
FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;

ALTER TABLE "public"."photo_monetization" 
ADD CONSTRAINT "photo_monetization_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;

-- Photo Community foreign keys
ALTER TABLE "public"."photo_community" 
ADD CONSTRAINT "photo_community_album_id_fkey" 
FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;

ALTER TABLE "public"."photo_community" 
ADD CONSTRAINT "photo_community_image_id_fkey" 
FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;

ALTER TABLE "public"."photo_community" 
ADD CONSTRAINT "photo_community_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- AI Image Analysis foreign keys
ALTER TABLE "public"."ai_image_analysis" 
ADD CONSTRAINT "ai_image_analysis_image_id_fkey" 
FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;

-- Image Processing Jobs foreign keys
ALTER TABLE "public"."image_processing_jobs" 
ADD CONSTRAINT "image_processing_jobs_image_id_fkey" 
FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;

-- ============================================================================
-- 8. CREATE ENTERPRISE VIEWS FOR ANALYTICS
-- ============================================================================

-- Enterprise Photo Analytics View
CREATE OR REPLACE VIEW "public"."enterprise_photo_analytics" AS
SELECT 
    pa.album_id,
    pa.image_id,
    pa.event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT pa.user_id) as unique_users,
    COUNT(DISTINCT pa.session_id) as unique_sessions,
    MIN(pa.created_at) as first_event,
    MAX(pa.created_at) as last_event,
    CASE 
        WHEN COUNT(*) > 1 THEN 
            EXTRACT(EPOCH FROM (MAX(pa.created_at) - MIN(pa.created_at))) / (COUNT(*) - 1)
        ELSE 0 
    END as avg_time_between_events
FROM "public"."photo_analytics" pa
GROUP BY pa.album_id, pa.image_id, pa.event_type;

COMMENT ON VIEW "public"."enterprise_photo_analytics" IS 'Enterprise analytics view for photo engagement tracking';

-- Enterprise Photo Monetization View
CREATE OR REPLACE VIEW "public"."enterprise_photo_monetization" AS
SELECT 
    pm.album_id,
    pm.image_id,
    pm.event_type,
    SUM(pm.amount) as total_revenue,
    COUNT(*) as transaction_count,
    COUNT(DISTINCT pm.user_id) as unique_payers,
    AVG(pm.amount) as avg_transaction_value,
    MIN(pm.created_at) as first_transaction,
    MAX(pm.created_at) as last_transaction
FROM "public"."photo_monetization" pm
WHERE pm.status = 'completed'
GROUP BY pm.album_id, pm.image_id, pm.event_type;

COMMENT ON VIEW "public"."enterprise_photo_monetization" IS 'Enterprise monetization view for revenue tracking';

-- Enterprise Photo Community View
CREATE OR REPLACE VIEW "public"."enterprise_photo_community" AS
SELECT 
    pc.album_id,
    pc.image_id,
    pc.interaction_type,
    COUNT(*) as interaction_count,
    COUNT(DISTINCT pc.user_id) as unique_users,
    AVG(pc.rating) as avg_rating,
    COUNT(pc.rating) as rating_count,
    MIN(pc.created_at) as first_interaction,
    MAX(pc.created_at) as last_interaction
FROM "public"."photo_community" pc
GROUP BY pc.album_id, pc.image_id, pc.interaction_type;

COMMENT ON VIEW "public"."enterprise_photo_community" IS 'Enterprise community view for social engagement tracking';

-- ============================================================================
-- 9. CREATE ENTERPRISE FUNCTIONS
-- ============================================================================

-- Function to process image with AI
CREATE OR REPLACE FUNCTION "public"."process_image_with_ai"(
    p_image_id "uuid",
    p_analysis_types "text"[] DEFAULT ARRAY['content', 'quality', 'sentiment']
)
RETURNS "jsonb"
LANGUAGE "plpgsql"
AS $$
DECLARE
    result "jsonb";
BEGIN
    -- Create processing job
    INSERT INTO "public"."image_processing_jobs" (
        image_id, 
        job_type, 
        status, 
        priority, 
        parameters
    ) VALUES (
        p_image_id, 
        'ai_analysis', 
        'pending', 
        8, 
        jsonb_build_object('analysis_types', p_analysis_types)
    );
    
    -- Simulate AI analysis result (in production, this would call external AI service)
    result := jsonb_build_object(
        'analysis_id', gen_random_uuid(),
        'image_id', p_image_id,
        'analysis_types', p_analysis_types,
        'status', 'completed',
        'processing_time_ms', 1200
    );
    
    RETURN result;
END;
$$;

COMMENT ON FUNCTION "public"."process_image_with_ai" IS 'Enterprise function to process images with AI analysis';

-- Function to track photo analytics event
CREATE OR REPLACE FUNCTION "public"."track_photo_analytics_event"(
    p_album_id "uuid",
    p_event_type "text",
    p_image_id "uuid" DEFAULT NULL,
    p_user_id "uuid" DEFAULT NULL,
    p_metadata "jsonb" DEFAULT '{}'::"jsonb"
)
RETURNS "uuid"
LANGUAGE "plpgsql"
AS $$
DECLARE
    event_id "uuid";
BEGIN
    INSERT INTO "public"."photo_analytics" (
        album_id,
        image_id,
        event_type,
        user_id,
        session_id,
        metadata
    ) VALUES (
        p_album_id,
        p_image_id,
        p_event_type,
        p_user_id,
        p_metadata->>'session_id',
        p_metadata
    ) RETURNING id INTO event_id;
    
    -- Update album_images counters if applicable
    IF p_image_id IS NOT NULL THEN
        UPDATE "public"."album_images" 
        SET 
            view_count = CASE WHEN p_event_type = 'view' THEN view_count + 1 ELSE view_count END,
            like_count = CASE WHEN p_event_type = 'like' THEN like_count + 1 ELSE like_count END,
            share_count = CASE WHEN p_event_type = 'share' THEN share_count + 1 ELSE share_count END
        WHERE image_id = p_image_id AND album_id = p_album_id;
    END IF;
    
    RETURN event_id;
END;
$$;

COMMENT ON FUNCTION "public"."track_photo_analytics_event" IS 'Enterprise function to track photo analytics events';

-- ============================================================================
-- 10. CREATE ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE "public"."photo_analytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."photo_monetization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."photo_community" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_image_analysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."image_processing_jobs" ENABLE ROW LEVEL SECURITY;

-- Photo Analytics RLS Policies
CREATE POLICY "photo_analytics_select_policy" ON "public"."photo_analytics"
    FOR SELECT USING (
        auth.uid() IN (
            SELECT owner_id FROM "public"."photo_albums" WHERE id = album_id
        )
    );

CREATE POLICY "photo_analytics_insert_policy" ON "public"."photo_analytics"
    FOR INSERT WITH CHECK (true);

-- Photo Monetization RLS Policies
CREATE POLICY "photo_monetization_select_policy" ON "public"."photo_monetization"
    FOR SELECT USING (
        auth.uid() IN (
            SELECT owner_id FROM "public"."photo_albums" WHERE id = album_id
        )
    );

CREATE POLICY "photo_monetization_insert_policy" ON "public"."photo_monetization"
    FOR INSERT WITH CHECK (true);

-- Photo Community RLS Policies
CREATE POLICY "photo_community_select_policy" ON "public"."photo_community"
    FOR SELECT USING (
        auth.uid() IN (
            SELECT owner_id FROM "public"."photo_albums" WHERE id = album_id
        ) OR user_id = auth.uid()
    );

CREATE POLICY "photo_community_insert_policy" ON "public"."photo_community"
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "photo_community_update_policy" ON "public"."photo_community"
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "photo_community_delete_policy" ON "public"."photo_community"
    FOR DELETE USING (user_id = auth.uid());

-- AI Image Analysis RLS Policies
CREATE POLICY "ai_image_analysis_select_policy" ON "public"."ai_image_analysis"
    FOR SELECT USING (
        auth.uid() IN (
            SELECT pa.owner_id 
            FROM "public"."photo_albums" pa
            JOIN "public"."album_images" ai ON pa.id = ai.album_id
            WHERE ai.image_id = ai_image_analysis.image_id
        )
    );

CREATE POLICY "ai_image_analysis_insert_policy" ON "public"."ai_image_analysis"
    FOR INSERT WITH CHECK (true);

-- Image Processing Jobs RLS Policies
CREATE POLICY "image_processing_jobs_select_policy" ON "public"."image_processing_jobs"
    FOR SELECT USING (
        auth.uid() IN (
            SELECT pa.owner_id 
            FROM "public"."photo_albums" pa
            JOIN "public"."album_images" ai ON pa.id = ai.album_id
            WHERE ai.image_id = image_processing_jobs.image_id
        )
    );

CREATE POLICY "image_processing_jobs_insert_policy" ON "public"."image_processing_jobs"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "image_processing_jobs_update_policy" ON "public"."image_processing_jobs"
    FOR UPDATE USING (true);

-- ============================================================================
-- 11. CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Trigger to update album statistics when analytics events occur
CREATE OR REPLACE FUNCTION "public"."update_album_statistics_from_analytics"()
RETURNS TRIGGER AS $$
BEGIN
    -- Update photo_albums view_count, like_count, share_count based on analytics
    UPDATE "public"."photo_albums" 
    SET 
        view_count = (
            SELECT COUNT(*) 
            FROM "public"."photo_analytics" 
            WHERE album_id = NEW.album_id AND event_type = 'view'
        ),
        like_count = (
            SELECT COUNT(*) 
            FROM "public"."photo_analytics" 
            WHERE album_id = NEW.album_id AND event_type = 'like'
        ),
        share_count = (
            SELECT COUNT(*) 
            FROM "public"."photo_analytics" 
            WHERE album_id = NEW.album_id AND event_type = 'share'
        )
    WHERE id = NEW.album_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trigger_update_album_statistics_from_analytics"
    AFTER INSERT ON "public"."photo_analytics"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_album_statistics_from_analytics"();

-- Trigger to update album revenue when monetization events occur
CREATE OR REPLACE FUNCTION "public"."update_album_revenue_from_monetization"()
RETURNS TRIGGER AS $$
BEGIN
    -- Update photo_albums revenue_generated based on monetization
    UPDATE "public"."photo_albums" 
    SET revenue_generated = (
        SELECT COALESCE(SUM(amount), 0)
        FROM "public"."photo_monetization" 
        WHERE album_id = NEW.album_id AND status = 'completed'
    )
    WHERE id = NEW.album_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trigger_update_album_revenue_from_monetization"
    AFTER INSERT ON "public"."photo_monetization"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_album_revenue_from_monetization"();

-- ============================================================================
-- 12. INSERT INITIAL DATA FOR TESTING
-- ============================================================================

-- Insert sample entity types if they don't exist
INSERT INTO "public"."entity_types" (name, description, entity_category) 
VALUES 
    ('Photo Gallery', 'General photo galleries and collections', 'content'),
    ('Premium Content', 'Premium and monetized photo content', 'content'),
    ('Community Album', 'Community-driven photo albums', 'community')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- This migration creates the complete enterprise photo system infrastructure
-- including analytics, monetization, community features, and AI integration
-- All tables are properly indexed, secured with RLS, and include enterprise features 
-- End of 20250729003259_enterprise_photo_system_final.sql


-- =====================================================
-- MIGRATION: 20250729051911_focused_photo_social_features.sql
-- =====================================================

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

-- End of 20250729051911_focused_photo_social_features.sql


-- =====================================================
-- MIGRATION: 20250730031633_add_permalink_system.sql
-- =====================================================

-- Migration: Add Permalink System
-- Date: 2025-07-30
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

-- End of 20250730031633_add_permalink_system.sql


-- =====================================================
-- MIGRATION: 20250731202053_extend_photo_albums_entity_support.sql
-- =====================================================


-- End of 20250731202053_extend_photo_albums_entity_support.sql


-- =====================================================
-- MIGRATION: 20250805_add_metadata_column.sql
-- =====================================================

-- Add metadata column to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation  
COMMENT ON COLUMN activities.metadata IS 'JSONB field containing engagement data, privacy settings, and monetization info';

-- Create index for metadata queries
CREATE INDEX IF NOT EXISTS idx_activities_metadata ON activities USING GIN (metadata);

-- Update existing activities to have default metadata
UPDATE activities SET metadata = '{}'::jsonb WHERE metadata IS NULL; 
-- End of 20250805_add_metadata_column.sql

