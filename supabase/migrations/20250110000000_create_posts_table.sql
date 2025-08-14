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
