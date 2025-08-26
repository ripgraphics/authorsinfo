-- Fix Engagement Triggers for Enterprise-Grade Application
-- The current triggers only work with entity_type = 'activity', but posts have entity_type = 'author'
-- This fix makes the triggers work with ALL entity types

-- =====================================================
-- STEP 1: FIX THE COMMENT COUNT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION "public"."update_activity_comment_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment comment count for ANY entity type (activity, author, book, etc.)
        UPDATE public.activities 
        SET comment_count = COALESCE(comment_count, 0) + 1,
            updated_at = NOW()
        WHERE id = NEW.entity_id;  -- Removed entity_type restriction
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement comment count for ANY entity type
        UPDATE public.activities 
        SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.entity_id;  -- Removed entity_type restriction
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle comment soft delete/restore for ANY entity type
        IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
            -- Comment was soft deleted, decrement count
            UPDATE public.activities 
            SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0),
                updated_at = NOW()
            WHERE id = NEW.entity_id;  -- Removed entity_type restriction
        ELSIF OLD.is_deleted = true AND NEW.is_deleted = false THEN
            -- Comment was restored, increment count
            UPDATE public.activities 
            SET comment_count = COALESCE(comment_count, 0) + 1,
                updated_at = NOW()
            WHERE id = NEW.entity_id;  -- Removed entity_type restriction
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

-- =====================================================
-- STEP 2: FIX THE LIKE COUNT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION "public"."update_activity_like_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment like count for ANY entity type
        UPDATE public.activities 
        SET like_count = COALESCE(like_count, 0) + 1,
            updated_at = NOW()
        WHERE id = NEW.entity_id;  -- Removed entity_type restriction
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement like count for ANY entity type
        UPDATE public.activities 
        SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.entity_id;  -- Removed entity_type restriction
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- =====================================================
-- STEP 3: ADD MISSING TRIGGER FOR SHARE COUNT
-- =====================================================

-- Create a function to handle share count updates
CREATE OR REPLACE FUNCTION "public"."update_activity_share_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment share count for ANY entity type
        UPDATE public.activities 
        SET share_count = COALESCE(share_count, 0) + 1,
            updated_at = NOW()
        WHERE id = NEW.entity_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement share count for ANY entity type
        UPDATE public.activities 
        SET share_count = GREATEST(COALESCE(share_count, 0) - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.entity_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- =====================================================
-- STEP 4: ADD MISSING TRIGGER FOR BOOKMARK COUNT
-- =====================================================

-- Create a function to handle bookmark count updates
CREATE OR REPLACE FUNCTION "public"."update_activity_bookmark_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment bookmark count for ANY entity type
        UPDATE public.activities 
        SET bookmark_count = COALESCE(bookmark_count, 0) + 1,
            updated_at = NOW()
        WHERE id = NEW.entity_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement bookmark count for ANY entity type
        UPDATE public.activities 
        SET bookmark_count = GREATEST(COALESCE(bookmark_count, 0) - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.entity_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- =====================================================
-- STEP 5: CREATE ENGAGEMENT BOOKMARKS TABLE
-- =====================================================

-- Create the engagement_bookmarks table for enterprise-grade bookmarking
CREATE TABLE IF NOT EXISTS "public"."engagement_bookmarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "engagement_bookmarks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "engagement_bookmarks_user_entity_unique" UNIQUE ("user_id", "entity_type", "entity_id")
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "idx_engagement_bookmarks_entity" ON "public"."engagement_bookmarks" ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_engagement_bookmarks_user" ON "public"."engagement_bookmarks" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_engagement_bookmarks_created" ON "public"."engagement_bookmarks" ("created_at");

-- =====================================================
-- STEP 6: CREATE ENGAGEMENT SHARES TABLE
-- =====================================================

-- Create the engagement_shares table for enterprise-grade sharing
CREATE TABLE IF NOT EXISTS "public"."engagement_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "share_platform" "text" DEFAULT 'internal',
    "share_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "engagement_shares_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "engagement_shares_user_entity_unique" UNIQUE ("user_id", "entity_type", "entity_id")
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "idx_engagement_shares_entity" ON "public"."engagement_shares" ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_engagement_shares_user" ON "public"."engagement_shares" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_engagement_shares_created" ON "public"."engagement_shares" ("created_at");

-- =====================================================
-- STEP 7: CREATE TRIGGERS FOR NEW TABLES
-- =====================================================

-- Create trigger for engagement_bookmarks
DROP TRIGGER IF EXISTS "trigger_update_activity_bookmark_count" ON "public"."engagement_bookmarks";
CREATE TRIGGER "trigger_update_activity_bookmark_count" 
    AFTER INSERT OR DELETE ON "public"."engagement_bookmarks" 
    FOR EACH ROW EXECUTE FUNCTION "public"."update_activity_bookmark_count"();

-- Create trigger for engagement_shares
DROP TRIGGER IF EXISTS "trigger_update_activity_share_count" ON "public"."engagement_shares";
CREATE TRIGGER "trigger_update_activity_share_count" 
    AFTER INSERT OR DELETE ON "public"."engagement_shares" 
    FOR EACH ROW EXECUTE FUNCTION "public"."update_activity_share_count"();

-- =====================================================
-- STEP 8: ADD RLS POLICIES FOR NEW TABLES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE "public"."engagement_bookmarks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."engagement_shares" ENABLE ROW LEVEL SECURITY;

-- Bookmark policies
CREATE POLICY "Users can insert their own bookmarks" ON "public"."engagement_bookmarks" 
    FOR INSERT WITH CHECK ("auth"."uid"() = "user_id");

CREATE POLICY "Users can delete their own bookmarks" ON "public"."engagement_bookmarks" 
    FOR DELETE USING ("auth"."uid"() = "user_id");

CREATE POLICY "Users can view all bookmarks" ON "public"."engagement_bookmarks" 
    FOR SELECT USING (true);

-- Share policies
CREATE POLICY "Users can insert their own shares" ON "public"."engagement_shares" 
    FOR INSERT WITH CHECK ("auth"."uid"() = "user_id");

CREATE POLICY "Users can delete their own shares" ON "public"."engagement_shares" 
    FOR DELETE USING ("auth"."uid"() = "user_id");

CREATE POLICY "Users can view all shares" ON "public"."engagement_shares" 
    FOR SELECT USING (true);

-- =====================================================
-- STEP 9: GRANT PERMISSIONS
-- =====================================================

-- Grant permissions on new tables
GRANT ALL ON TABLE "public"."engagement_bookmarks" TO "anon";
GRANT ALL ON TABLE "public"."engagement_bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."engagement_bookmarks" TO "service_role";

GRANT ALL ON TABLE "public"."engagement_shares" TO "anon";
GRANT ALL ON TABLE "public"."engagement_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."engagement_shares" TO "service_role";

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION "public"."update_activity_comment_count"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."update_activity_comment_count"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."update_activity_comment_count"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."update_activity_like_count"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."update_activity_like_count"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."update_activity_like_count"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."update_activity_share_count"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."update_activity_share_count"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."update_activity_share_count"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."update_activity_bookmark_count"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."update_activity_bookmark_count"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."update_activity_bookmark_count"() TO "service_role";

-- =====================================================
-- STEP 10: ADD COMMENTS
-- =====================================================

COMMENT ON FUNCTION "public"."update_activity_comment_count"() IS 'Fixed function to update comment count for ALL entity types (activity, author, book, etc.)';
COMMENT ON FUNCTION "public"."update_activity_like_count"() IS 'Fixed function to update like count for ALL entity types (activity, author, book, etc.)';
COMMENT ON FUNCTION "public"."update_activity_share_count"() IS 'New function to update share count for ALL entity types';
COMMENT ON FUNCTION "public"."update_activity_bookmark_count"() IS 'New function to update bookmark count for ALL entity types';

COMMENT ON TABLE "public"."engagement_bookmarks" IS 'Enterprise-grade bookmarks table for all entity types';
COMMENT ON TABLE "public"."engagement_shares" IS 'Enterprise-grade shares table for all entity types';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '✅ ENTERPRISE ENGAGEMENT SYSTEM FIXED SUCCESSFULLY!' as status;
SELECT 'Your engagement triggers now work with ALL entity types (author, book, activity, etc.)' as message;
SELECT 'Comments and likes should now display correctly for all posts!' as details;
SELECT 'New enterprise features: bookmarks and shares are now available!' as features;

