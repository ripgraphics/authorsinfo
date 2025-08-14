-- Fix engagement tables RLS policies
-- This migration ensures proper RLS policies are in place for engagement tables

-- Enable RLS on engagement tables (in case they weren't enabled)
ALTER TABLE "public"."post_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."post_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."post_shares" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."post_bookmarks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notification_queue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."trending_topics" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "post_reactions_insert_policy" ON "public"."post_reactions";
DROP POLICY IF EXISTS "post_reactions_select_policy" ON "public"."post_reactions";
DROP POLICY IF EXISTS "post_reactions_delete_policy" ON "public"."post_reactions";

DROP POLICY IF EXISTS "post_comments_insert_policy" ON "public"."post_comments";
DROP POLICY IF EXISTS "post_comments_select_policy" ON "public"."post_comments";
DROP POLICY IF EXISTS "post_comments_update_policy" ON "public"."post_comments";
DROP POLICY IF EXISTS "post_comments_delete_policy" ON "public"."post_comments";

DROP POLICY IF EXISTS "post_shares_insert_policy" ON "public"."post_shares";
DROP POLICY IF EXISTS "post_shares_select_policy" ON "public"."post_shares";
DROP POLICY IF EXISTS "post_shares_delete_policy" ON "public"."post_shares";

DROP POLICY IF EXISTS "post_bookmarks_insert_policy" ON "public"."post_bookmarks";
DROP POLICY IF EXISTS "post_bookmarks_select_policy" ON "public"."post_bookmarks";
DROP POLICY IF EXISTS "post_bookmarks_update_policy" ON "public"."post_bookmarks";
DROP POLICY IF EXISTS "post_bookmarks_delete_policy" ON "public"."post_bookmarks";

DROP POLICY IF EXISTS "notification_queue_insert_policy" ON "public"."notification_queue";
DROP POLICY IF EXISTS "notification_queue_select_policy" ON "public"."notification_queue";
DROP POLICY IF EXISTS "notification_queue_update_policy" ON "public"."notification_queue";

DROP POLICY IF EXISTS "trending_topics_select_policy" ON "public"."trending_topics";

-- Create RLS policies for post_reactions
CREATE POLICY "post_reactions_insert_policy" ON "public"."post_reactions"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_reactions_select_policy" ON "public"."post_reactions"
    FOR SELECT USING (true);

CREATE POLICY "post_reactions_delete_policy" ON "public"."post_reactions"
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for post_comments
CREATE POLICY "post_comments_insert_policy" ON "public"."post_comments"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_comments_select_policy" ON "public"."post_comments"
    FOR SELECT USING (true);

CREATE POLICY "post_comments_update_policy" ON "public"."post_comments"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "post_comments_delete_policy" ON "public"."post_comments"
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for post_shares
CREATE POLICY "post_shares_insert_policy" ON "public"."post_shares"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_shares_select_policy" ON "public"."post_shares"
    FOR SELECT USING (true);

CREATE POLICY "post_shares_delete_policy" ON "public"."post_shares"
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for post_bookmarks
CREATE POLICY "post_bookmarks_insert_policy" ON "public"."post_bookmarks"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_bookmarks_select_policy" ON "public"."post_bookmarks"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "post_bookmarks_update_policy" ON "public"."post_bookmarks"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "post_bookmarks_delete_policy" ON "public"."post_bookmarks"
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for notification_queue
CREATE POLICY "notification_queue_insert_policy" ON "public"."notification_queue"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_queue_select_policy" ON "public"."notification_queue"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notification_queue_update_policy" ON "public"."notification_queue"
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for trending_topics (read-only for all users)
CREATE POLICY "trending_topics_select_policy" ON "public"."trending_topics"
    FOR SELECT USING (true);

-- Add comments for documentation
COMMENT ON TABLE "public"."post_reactions" IS 'User reactions to posts (like, love, etc.)';
COMMENT ON TABLE "public"."post_comments" IS 'Comments on posts with support for nested replies';
COMMENT ON TABLE "public"."post_shares" IS 'Post sharing activity (reposts, shares)';
COMMENT ON TABLE "public"."post_bookmarks" IS 'User bookmarks of posts';
COMMENT ON TABLE "public"."notification_queue" IS 'Queue for user notifications';
COMMENT ON TABLE "public"."trending_topics" IS 'Trending topics and hashtags';
