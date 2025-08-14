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
