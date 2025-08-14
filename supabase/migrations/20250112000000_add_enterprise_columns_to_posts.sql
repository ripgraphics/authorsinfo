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
