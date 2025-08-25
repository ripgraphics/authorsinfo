-- CREATE MISSING SOCIAL TABLES
-- This script creates the missing tables that are causing 404 errors
-- Date: 2025-08-23
-- Run this using: supabase db push

-- =====================================================
-- STEP 1: CREATE FRIENDSHIPS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS "public"."friendships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friend_id" "uuid" NOT NULL,
    "status" "text" NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "responded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::jsonb,
    "notes" "text",
    "is_hidden" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "enterprise_features" "jsonb" DEFAULT '{}'::jsonb,
    
    -- Primary key
    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id"),
    
    -- Unique constraint to prevent duplicate friendships
    CONSTRAINT "friendships_user_friend_unique" UNIQUE ("user_id", "friend_id"),
    
    -- Check that user cannot be friends with themselves
    CONSTRAINT "friendships_no_self_friendship" CHECK ("user_id" != "friend_id")
);

-- Add comments
COMMENT ON TABLE "public"."friendships" IS 'Enterprise-grade friendships table for managing user relationships';
COMMENT ON COLUMN "public"."friendships"."status" IS 'Friendship status: pending, accepted, rejected, blocked';
COMMENT ON COLUMN "public"."friendships"."requested_at" IS 'When the friendship request was sent';
COMMENT ON COLUMN "public"."friendships"."responded_at" IS 'When the friendship request was responded to';
COMMENT ON COLUMN "public"."friendships"."metadata" IS 'Additional metadata for the friendship';
COMMENT ON COLUMN "public"."friendships"."notes" IS 'User notes about the friendship';
COMMENT ON COLUMN "public"."friendships"."enterprise_features" IS 'Enterprise features like analytics, moderation, etc.';

-- =====================================================
-- STEP 2: CREATE FOLLOWS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS "public"."follows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "status" "text" NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'muted', 'blocked', 'pending')),
    "followed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "unfollowed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::jsonb,
    "notification_preferences" "jsonb" DEFAULT '{"posts": true, "stories": true, "events": true}'::jsonb,
    "is_hidden" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "enterprise_features" "jsonb" DEFAULT '{}'::jsonb,
    
    -- Primary key
    CONSTRAINT "follows_pkey" PRIMARY KEY ("id"),
    
    -- Unique constraint to prevent duplicate follows
    CONSTRAINT "follows_follower_following_unique" UNIQUE ("follower_id", "following_id"),
    
    -- Check that user cannot follow themselves
    CONSTRAINT "follows_no_self_follow" CHECK ("follower_id" != "following_id")
);

-- Add comments
COMMENT ON TABLE "public"."follows" IS 'Enterprise-grade follows table for managing user subscriptions';
COMMENT ON COLUMN "public"."follows"."status" IS 'Follow status: active, muted, blocked, pending';
COMMENT ON COLUMN "public"."follows"."followed_at" IS 'When the user started following';
COMMENT ON COLUMN "public"."follows"."unfollowed_at" IS 'When the user stopped following (if applicable)';
COMMENT ON COLUMN "public"."follows"."notification_preferences" IS 'User preferences for notifications from followed users';
COMMENT ON COLUMN "public"."follows"."enterprise_features" IS 'Enterprise features like analytics, moderation, etc.';

-- =====================================================
-- STEP 3: CREATE ENGAGEMENT TABLES
-- =====================================================

-- Likes table
CREATE TABLE IF NOT EXISTS "public"."likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_id" "uuid" NOT NULL,
    "like_type" "text" DEFAULT 'like' CHECK (like_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::jsonb,
    "is_hidden" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    
    -- Primary key
    CONSTRAINT "likes_pkey" PRIMARY KEY ("id"),
    
    -- Unique constraint to prevent duplicate likes
    CONSTRAINT "likes_user_post_unique" UNIQUE ("user_id", "post_id")
);

-- Comments table
CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_id" "uuid" NOT NULL,
    "parent_comment_id" "uuid",
    "content" "jsonb" NOT NULL,
    "content_text" "text" GENERATED ALWAYS AS (content->>'text') STORED,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::jsonb,
    "is_hidden" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "moderation_status" "text" DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
    "enterprise_features" "jsonb" DEFAULT '{}'::jsonb,
    
    -- Primary key
    CONSTRAINT "comments_pkey" PRIMARY KEY ("id"),
    
    -- Foreign key to parent comment for nested replies
    CONSTRAINT "comments_parent_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS "public"."bookmarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::jsonb,
    "notes" "text",
    "is_hidden" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    
    -- Primary key
    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id"),
    
    -- Unique constraint to prevent duplicate bookmarks
    CONSTRAINT "bookmarks_user_post_unique" UNIQUE ("user_id", "post_id")
);

-- Shares table
CREATE TABLE IF NOT EXISTS "public"."shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_id" "uuid" NOT NULL,
    "share_type" "text" DEFAULT 'repost' CHECK (share_type IN ('repost', 'quote', 'link', 'story')),
    "share_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::jsonb,
    "is_hidden" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    
    -- Primary key
    CONSTRAINT "shares_pkey" PRIMARY KEY ("id"),
    
    -- Unique constraint to prevent duplicate shares
    CONSTRAINT "shares_user_post_unique" UNIQUE ("user_id", "post_id")
);

-- =====================================================
-- STEP 4: ADD FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign key constraints to posts table
ALTER TABLE "public"."friendships" 
ADD CONSTRAINT "friendships_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."friendships" 
ADD CONSTRAINT "friendships_friend_id_fkey" 
FOREIGN KEY ("friend_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."follows" 
ADD CONSTRAINT "follows_follower_id_fkey" 
FOREIGN KEY ("follower_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."follows" 
ADD CONSTRAINT "follows_following_id_fkey" 
FOREIGN KEY ("following_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."likes" 
ADD CONSTRAINT "likes_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."likes" 
ADD CONSTRAINT "likes_post_id_fkey" 
FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;

ALTER TABLE "public"."comments" 
ADD CONSTRAINT "comments_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."comments" 
ADD CONSTRAINT "comments_post_id_fkey" 
FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;

ALTER TABLE "public"."bookmarks" 
ADD CONSTRAINT "bookmarks_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."bookmarks" 
ADD CONSTRAINT "bookmarks_post_id_fkey" 
FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;

ALTER TABLE "public"."shares" 
ADD CONSTRAINT "shares_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."shares" 
ADD CONSTRAINT "shares_post_id_fkey" 
FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;

-- =====================================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Friendships indexes
CREATE INDEX IF NOT EXISTS "idx_friendships_user_id" ON "public"."friendships" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_friendships_friend_id" ON "public"."friendships" ("friend_id");
CREATE INDEX IF NOT EXISTS "idx_friendships_status" ON "public"."friendships" ("status");
CREATE INDEX IF NOT EXISTS "idx_friendships_user_status" ON "public"."friendships" ("user_id", "status");

-- Follows indexes
CREATE INDEX IF NOT EXISTS "idx_follows_follower_id" ON "public"."follows" ("follower_id");
CREATE INDEX IF NOT EXISTS "idx_follows_following_id" ON "public"."follows" ("following_id");
CREATE INDEX IF NOT EXISTS "idx_follows_status" ON "public"."follows" ("status");
CREATE INDEX IF NOT EXISTS "idx_follows_follower_status" ON "public"."follows" ("follower_id", "status");

-- Engagement indexes
CREATE INDEX IF NOT EXISTS "idx_likes_user_id" ON "public"."likes" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_likes_post_id" ON "public"."likes" ("post_id");
CREATE INDEX IF NOT EXISTS "idx_likes_type" ON "public"."likes" ("like_type");

CREATE INDEX IF NOT EXISTS "idx_comments_user_id" ON "public"."comments" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_comments_post_id" ON "public"."comments" ("post_id");
CREATE INDEX IF NOT EXISTS "idx_comments_parent_id" ON "public"."comments" ("parent_comment_id");
CREATE INDEX IF NOT EXISTS "idx_comments_moderation" ON "public"."comments" ("moderation_status");

CREATE INDEX IF NOT EXISTS "idx_bookmarks_user_id" ON "public"."bookmarks" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_bookmarks_post_id" ON "public"."bookmarks" ("post_id");

CREATE INDEX IF NOT EXISTS "idx_shares_user_id" ON "public"."shares" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_shares_post_id" ON "public"."shares" ("post_id");
CREATE INDEX IF NOT EXISTS "idx_shares_type" ON "public"."shares" ("share_type");

-- =====================================================
-- STEP 6: CREATE RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE "public"."friendships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."likes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."bookmarks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."shares" ENABLE ROW LEVEL SECURITY;

-- Friendships policies
CREATE POLICY "friendships_select_policy" ON "public"."friendships"
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = friend_id OR
        status = 'accepted'
    );

CREATE POLICY "friendships_insert_policy" ON "public"."friendships"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "friendships_update_policy" ON "public"."friendships"
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "friendships_delete_policy" ON "public"."friendships"
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Follows policies
CREATE POLICY "follows_select_policy" ON "public"."follows"
    FOR SELECT USING (
        auth.uid() = follower_id OR 
        auth.uid() = following_id OR
        status = 'active'
    );

CREATE POLICY "follows_insert_policy" ON "public"."follows"
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_update_policy" ON "public"."follows"
    FOR UPDATE USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "follows_delete_policy" ON "public"."follows"
    FOR DELETE USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Likes policies
CREATE POLICY "likes_select_policy" ON "public"."likes"
    FOR SELECT USING (true);

CREATE POLICY "likes_insert_policy" ON "public"."likes"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_update_policy" ON "public"."likes"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "likes_delete_policy" ON "public"."likes"
    FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "comments_select_policy" ON "public"."comments"
    FOR SELECT USING (true);

CREATE POLICY "comments_insert_policy" ON "public"."comments"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_update_policy" ON "public"."comments"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "comments_delete_policy" ON "public"."comments"
    FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "bookmarks_select_policy" ON "public"."bookmarks"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_insert_policy" ON "public"."bookmarks"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_update_policy" ON "public"."bookmarks"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_delete_policy" ON "public"."bookmarks"
    FOR DELETE USING (auth.uid() = user_id);

-- Shares policies
CREATE POLICY "shares_select_policy" ON "public"."shares"
    FOR SELECT USING (true);

CREATE POLICY "shares_insert_policy" ON "public"."shares"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shares_update_policy" ON "public"."shares"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "shares_delete_policy" ON "public"."shares"
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 7: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get user's friends
CREATE OR REPLACE FUNCTION get_user_friends(user_uuid uuid)
RETURNS TABLE (
    friend_id uuid,
    friend_name text,
    friend_email text,
    friendship_status text,
    friendship_created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as friend_id,
        u.raw_user_meta_data->>'name' as friend_name,
        u.email as friend_email,
        f.status as friendship_status,
        f.created_at as friendship_created_at
    FROM public.friendships f
    JOIN auth.users u ON (
        CASE 
            WHEN f.user_id = user_uuid THEN f.friend_id = u.id
            WHEN f.friend_id = user_uuid THEN f.user_id = u.id
        END
    )
    WHERE (f.user_id = user_uuid OR f.friend_id = user_uuid)
      AND f.status = 'accepted'
      AND f.is_deleted = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's followers
CREATE OR REPLACE FUNCTION get_user_followers(user_uuid uuid)
RETURNS TABLE (
    follower_id uuid,
    follower_name text,
    follower_email text,
    followed_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as follower_id,
        u.raw_user_meta_data->>'name' as follower_name,
        u.email as follower_email,
        f.followed_at
    FROM public.follows f
    JOIN auth.users u ON f.follower_id = u.id
    WHERE f.following_id = user_uuid
      AND f.status = 'active'
      AND f.is_deleted = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's following
CREATE OR REPLACE FUNCTION get_user_following(user_uuid uuid)
RETURNS TABLE (
    following_id uuid,
    following_name text,
    following_email text,
    followed_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as following_id,
        u.raw_user_meta_data->>'name' as following_name,
        u.email as following_email,
        f.followed_at
    FROM public.follows f
    JOIN auth.users u ON f.following_id = u.id
    WHERE f.follower_id = user_uuid
      AND f.status = 'active'
      AND f.is_deleted = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 8: CREATE MONITORING VIEWS
-- =====================================================

-- Create a comprehensive social activity view
CREATE OR REPLACE VIEW social_activity_summary AS
SELECT 
    'friendships' as activity_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_count,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_count
FROM public.friendships
WHERE is_deleted = false

UNION ALL

SELECT 
    'follows' as activity_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as accepted_count,
    COUNT(CASE WHEN status = 'muted' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_count
FROM public.follows
WHERE is_deleted = false

UNION ALL

SELECT 
    'likes' as activity_type,
    COUNT(*) as total_count,
    0 as pending_count,
    COUNT(*) as accepted_count,
    0 as rejected_count,
    0 as blocked_count
FROM public.likes
WHERE is_deleted = false

UNION ALL

SELECT 
    'comments' as activity_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN moderation_status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN moderation_status = 'approved' THEN 1 END) as accepted_count,
    COUNT(CASE WHEN moderation_status = 'rejected' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN moderation_status = 'flagged' THEN 1 END) as blocked_count
FROM public.comments
WHERE is_deleted = false;

-- =====================================================
-- STEP 9: FINAL VERIFICATION
-- =====================================================

-- Verify all tables were created successfully
DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('friendships', 'follows', 'likes', 'comments', 'bookmarks', 'shares');
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('friendships', 'follows', 'likes', 'comments', 'bookmarks', 'shares');
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename IN ('friendships', 'follows', 'likes', 'comments', 'bookmarks', 'shares');
    
    RAISE NOTICE '=== SOCIAL TABLES CREATION COMPLETE ===';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'Policies created: %', policy_count;
    RAISE NOTICE 'Indexes created: %', index_count;
    RAISE NOTICE '=====================================';
    
    IF table_count = 6 THEN
        RAISE NOTICE '✅ All social tables created successfully!';
    ELSE
        RAISE NOTICE '❌ Some tables may not have been created properly';
    END IF;
END $$;
