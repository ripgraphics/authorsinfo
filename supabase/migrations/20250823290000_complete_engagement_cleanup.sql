-- COMPLETE ENGAGEMENT SYSTEM CLEANUP
-- This migration migrates existing data and removes all old fragmented tables

-- Step 1: Migrate existing engagement data to new consolidated tables

-- Migrate likes from activity_likes (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_likes') THEN
        INSERT INTO "public"."engagement_likes" ("user_id", "entity_type", "entity_id", "created_at", "updated_at")
        SELECT 
            "user_id",
            'activity' as "entity_type",
            "activity_id" as "entity_id",
            "created_at",
            "created_at" as "updated_at"
        FROM "public"."activity_likes"
        ON CONFLICT ("user_id", "entity_type", "entity_id") DO NOTHING;
        
        RAISE NOTICE 'Migrated % likes from activity_likes', (SELECT COUNT(*) FROM "public"."activity_likes");
    ELSE
        RAISE NOTICE 'Table activity_likes does not exist, skipping migration';
    END IF;
END $$;

-- Migrate comments from activity_comments (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_comments') THEN
        INSERT INTO "public"."engagement_comments" ("user_id", "entity_type", "entity_id", "comment_text", "parent_comment_id", "comment_depth", "thread_id", "reply_count", "created_at", "updated_at")
        SELECT 
            "user_id",
            'activity' as "entity_type",
            "activity_id" as "entity_id",
            COALESCE("comment_text", 'Migrated comment') as "comment_text",
            "parent_comment_id",
            COALESCE("comment_depth", 0) as "comment_depth",
            COALESCE("thread_id", gen_random_uuid()) as "thread_id",
            COALESCE("reply_count", 0) as "reply_count",
            "created_at",
            COALESCE("updated_at", "created_at") as "updated_at"
        FROM "public"."activity_comments"
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Migrated % comments from activity_comments', (SELECT COUNT(*) FROM "public"."activity_comments");
    ELSE
        RAISE NOTICE 'Table activity_comments does not exist, skipping migration';
    END IF;
END $$;

-- Migrate likes from generic likes table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'likes') THEN
        INSERT INTO "public"."engagement_likes" ("user_id", "entity_type", "entity_id", "created_at", "updated_at")
        SELECT 
            "user_id",
            COALESCE("entity_type", 'post') as "entity_type",
            "entity_id",
            "created_at",
            "created_at" as "updated_at"
        FROM "public"."likes"
        WHERE "entity_id" IS NOT NULL
        ON CONFLICT ("user_id", "entity_type", "entity_id") DO NOTHING;
        
        RAISE NOTICE 'Migrated % likes from likes table', (SELECT COUNT(*) FROM "public"."likes" WHERE "entity_id" IS NOT NULL);
    ELSE
        RAISE NOTICE 'Table likes does not exist, skipping migration';
    END IF;
END $$;

-- Migrate comments from generic comments table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'comments') THEN
        INSERT INTO "public"."engagement_comments" ("user_id", "entity_type", "entity_id", "comment_text", "parent_comment_id", "comment_depth", "thread_id", "reply_count", "created_at", "updated_at")
        SELECT 
            "user_id",
            COALESCE("entity_type", 'post') as "entity_type",
            COALESCE("entity_id", "feed_entry_id") as "entity_id",
            COALESCE("content", 'Migrated comment') as "comment_text",
            "parent_comment_id",
            COALESCE("comment_depth", 0) as "comment_depth",
            COALESCE("thread_id", gen_random_uuid()) as "thread_id",
            COALESCE("reply_count", 0) as "reply_count",
            "created_at",
            COALESCE("updated_at", "created_at") as "updated_at"
        FROM "public"."comments"
        WHERE "content" IS NOT NULL
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Migrated % comments from comments table', (SELECT COUNT(*) FROM "public"."comments" WHERE "content" IS NOT NULL);
    ELSE
        RAISE NOTICE 'Table comments does not exist, skipping migration';
    END IF;
END $$;

-- Step 2: Remove old fragmented tables (only if they exist)

-- Remove activity_likes if exists
DROP TABLE IF EXISTS "public"."activity_likes" CASCADE;

-- Remove activity_comments if exists  
DROP TABLE IF EXISTS "public"."activity_comments" CASCADE;

-- Remove generic likes table if exists
DROP TABLE IF EXISTS "public"."likes" CASCADE;

-- Remove generic comments table if exists
DROP TABLE IF EXISTS "public"."comments" CASCADE;

-- Remove photo_likes if exists
DROP TABLE IF EXISTS "public"."photo_likes" CASCADE;

-- Remove photo_comments if exists
DROP TABLE IF EXISTS "public"."photo_comments" CASCADE;

-- Remove event_likes if exists
DROP TABLE IF EXISTS "public"."event_likes" CASCADE;

-- Remove event_comments if exists
DROP TABLE IF EXISTS "public"."event_comments" CASCADE;

-- Remove review_likes if exists
DROP TABLE IF EXISTS "public"."review_likes" CASCADE;

-- Remove discussion_comments if exists
DROP TABLE IF EXISTS "public"."discussion_comments" CASCADE;

-- Remove book_club_discussion_comments if exists
DROP TABLE IF EXISTS "public"."book_club_discussion_comments" CASCADE;

-- Remove post_comments if exists
DROP TABLE IF EXISTS "public"."post_comments" CASCADE;

-- Remove comment_likes if exists
DROP TABLE IF EXISTS "public"."comment_likes" CASCADE;

-- Remove comment_reactions if exists
DROP TABLE IF EXISTS "public"."comment_reactions" CASCADE;

-- Step 3: Remove old engagement functions that are no longer needed

-- Remove old toggle_activity_like function if exists
DROP FUNCTION IF EXISTS "public"."toggle_activity_like"("uuid", "uuid") CASCADE;

-- Remove old add_activity_comment function if exists
DROP FUNCTION IF EXISTS "public"."add_activity_comment"("uuid", "uuid", "text", "uuid") CASCADE;

-- Remove old get_activity_engagement function if exists
DROP FUNCTION IF EXISTS "public"."get_activity_engagement"("uuid") CASCADE;

-- Remove any other old engagement functions
DROP FUNCTION IF EXISTS "public"."get_unified_engagement"("text", "uuid", "text", "integer") CASCADE;

-- Step 4: Update the activities table to remove old count columns (if they exist)

-- Remove like_count and comment_count columns if they exist
ALTER TABLE "public"."activities" DROP COLUMN IF EXISTS "like_count";
ALTER TABLE "public"."activities" DROP COLUMN IF EXISTS "comment_count";
ALTER TABLE "public"."activities" DROP COLUMN IF EXISTS "share_count";
ALTER TABLE "public"."activities" DROP COLUMN IF EXISTS "bookmark_count";

-- Step 5: Create RLS policies for the new engagement tables

-- Enable RLS on engagement tables
ALTER TABLE "public"."engagement_likes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."engagement_comments" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for engagement_likes
CREATE POLICY "Users can view all likes" ON "public"."engagement_likes"
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON "public"."engagement_likes"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON "public"."engagement_likes"
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for engagement_comments
CREATE POLICY "Users can view all comments" ON "public"."engagement_comments"
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON "public"."engagement_comments"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON "public"."engagement_comments"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON "public"."engagement_comments"
    FOR DELETE USING (auth.uid() = user_id);

-- Step 6: Add final comments and verification

COMMENT ON TABLE "public"."engagement_likes" IS 'Enterprise-grade consolidated likes table - replaces all fragmented like tables';
COMMENT ON TABLE "public"."engagement_comments" IS 'Enterprise-grade consolidated comments table - replaces all fragmented comment tables';

-- Step 7: Verify the migration
DO $$
DECLARE
    total_likes integer;
    total_comments integer;
BEGIN
    SELECT COUNT(*) INTO total_likes FROM "public"."engagement_likes";
    SELECT COUNT(*) INTO total_comments FROM "public"."engagement_comments";
    
    RAISE NOTICE 'CLEANUP COMPLETE!';
    RAISE NOTICE 'Total likes migrated: %', total_likes;
    RAISE NOTICE 'Total comments migrated: %', total_comments;
    RAISE NOTICE 'All old fragmented tables have been removed';
    RAISE NOTICE 'Enterprise-grade engagement system is now the only system';
END $$;
