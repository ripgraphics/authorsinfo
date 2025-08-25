-- ENTERPRISE-GRADE ENGAGEMENT SYSTEM CONSOLIDATION
-- This migration creates 2 clean, scalable tables to replace the fragmented mess

-- Step 1: Create the new consolidated tables
CREATE TABLE IF NOT EXISTS "public"."engagement_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "engagement_likes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "engagement_likes_user_entity_unique" UNIQUE ("user_id", "entity_type", "entity_id")
);

CREATE TABLE IF NOT EXISTS "public"."engagement_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "comment_text" "text" NOT NULL,
    "parent_comment_id" "uuid",
    "comment_depth" integer DEFAULT 0,
    "thread_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reply_count" integer DEFAULT 0,
    "is_hidden" boolean DEFAULT false,
    "is_deleted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "engagement_comments_pkey" PRIMARY KEY ("id")
);

-- Step 2: Add proper indexes for performance
CREATE INDEX IF NOT EXISTS "idx_engagement_likes_entity" ON "public"."engagement_likes" ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_engagement_likes_user" ON "public"."engagement_likes" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_engagement_likes_created" ON "public"."engagement_likes" ("created_at");

CREATE INDEX IF NOT EXISTS "idx_engagement_comments_entity" ON "public"."engagement_comments" ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_engagement_comments_user" ON "public"."engagement_comments" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_engagement_comments_parent" ON "public"."engagement_comments" ("parent_comment_id");
CREATE INDEX IF NOT EXISTS "idx_engagement_comments_thread" ON "public"."engagement_comments" ("thread_id");
CREATE INDEX IF NOT EXISTS "idx_engagement_comments_created" ON "public"."engagement_comments" ("created_at");

-- Step 3: Create enterprise-grade functions for engagement
CREATE OR REPLACE FUNCTION "public"."get_entity_engagement"(
    "p_entity_type" "text",
    "p_entity_id" "uuid"
) RETURNS TABLE(
    "likes_count" bigint,
    "comments_count" bigint,
    "recent_likes" "jsonb",
    "recent_comments" "jsonb"
) LANGUAGE "plpgsql" SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM "public"."engagement_likes" 
         WHERE "entity_type" = p_entity_type AND "entity_id" = p_entity_id) as "likes_count",
        
        (SELECT COUNT(*) FROM "public"."engagement_comments" 
         WHERE "entity_type" = p_entity_type AND "entity_id" = p_entity_id 
         AND "is_deleted" = false AND "is_hidden" = false) as "comments_count",
        
        (SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'user_id', el.user_id,
                'created_at', el.created_at
            )
        ), '[]'::jsonb) FROM (
            SELECT el.user_id, el.created_at
            FROM "public"."engagement_likes" el
            WHERE el.entity_type = p_entity_type AND el.entity_id = p_entity_id
            ORDER BY el.created_at DESC
            LIMIT 5
        ) el) as "recent_likes",
        
        (SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', ec.id,
                'user_id', ec.user_id,
                'comment_text', ec.comment_text,
                'created_at', ec.created_at
            )
        ), '[]'::jsonb) FROM (
            SELECT ec.id, ec.user_id, ec.comment_text, ec.created_at
            FROM "public"."engagement_comments" ec
            WHERE ec.entity_type = p_entity_type AND ec.entity_id = p_entity_id
            AND ec.is_deleted = false AND ec.is_hidden = false
            ORDER BY ec.created_at DESC
            LIMIT 5
        ) ec) as "recent_comments";
END;
$$;

-- Step 4: Create function to toggle like
CREATE OR REPLACE FUNCTION "public"."toggle_entity_like"(
    "p_user_id" "uuid",
    "p_entity_type" "text",
    "p_entity_id" "uuid"
) RETURNS boolean LANGUAGE "plpgsql" SECURITY DEFINER AS $$
DECLARE
    "like_exists" boolean;
BEGIN
    -- Check if like exists
    SELECT EXISTS(
        SELECT 1 FROM "public"."engagement_likes" 
        WHERE "user_id" = p_user_id 
        AND "entity_type" = p_entity_type 
        AND "entity_id" = p_entity_id
    ) INTO "like_exists";
    
    IF "like_exists" THEN
        -- Remove like
        DELETE FROM "public"."engagement_likes" 
        WHERE "user_id" = p_user_id 
        AND "entity_type" = p_entity_type 
        AND "entity_id" = p_entity_id;
        RETURN false;
    ELSE
        -- Add like
        INSERT INTO "public"."engagement_likes" ("user_id", "entity_type", "entity_id")
        VALUES (p_user_id, p_entity_type, p_entity_id);
        RETURN true;
    END IF;
END;
$$;

-- Step 5: Create function to add comment
CREATE OR REPLACE FUNCTION "public"."add_entity_comment"(
    "p_user_id" "uuid",
    "p_entity_type" "text",
    "p_entity_id" "uuid",
    "p_comment_text" "text",
    "p_parent_comment_id" "uuid" DEFAULT NULL
) RETURNS "uuid" LANGUAGE "plpgsql" SECURITY DEFINER AS $$
DECLARE
    "new_comment_id" "uuid";
    "parent_depth" integer := 0;
    "thread_id" "uuid";
BEGIN
    -- Generate new comment ID
    "new_comment_id" := gen_random_uuid();
    
    -- Handle parent comment logic
    IF p_parent_comment_id IS NOT NULL THEN
        SELECT "comment_depth" + 1, "thread_id" 
        INTO "parent_depth", "thread_id"
        FROM "public"."engagement_comments" 
        WHERE "id" = p_parent_comment_id;
        
        -- Update parent's reply count
        UPDATE "public"."engagement_comments" 
        SET "reply_count" = "reply_count" + 1
        WHERE "id" = p_parent_comment_id;
    ELSE
        "thread_id" := gen_random_uuid();
    END IF;
    
    -- Insert the comment
    INSERT INTO "public"."engagement_comments" (
        "id", "user_id", "entity_type", "entity_id", "comment_text", 
        "parent_comment_id", "comment_depth", "thread_id"
    ) VALUES (
        "new_comment_id", p_user_id, p_entity_type, p_entity_id, p_comment_text,
        p_parent_comment_id, "parent_depth", "thread_id"
    );
    
    RETURN "new_comment_id";
END;
$$;

-- Step 6: Grant permissions
GRANT ALL ON "public"."engagement_likes" TO "authenticated";
GRANT ALL ON "public"."engagement_comments" TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_entity_engagement"("text", "uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."toggle_entity_like"("uuid", "text", "uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."add_entity_comment"("uuid", "text", "uuid", "text", "uuid") TO "authenticated";

-- Step 7: Add comments
COMMENT ON TABLE "public"."engagement_likes" IS 'Enterprise-grade consolidated likes table for all entity types';
COMMENT ON TABLE "public"."engagement_comments" IS 'Enterprise-grade consolidated comments table for all entity types';
COMMENT ON FUNCTION "public"."get_entity_engagement"("text", "uuid") IS 'Get engagement data for any entity type';
COMMENT ON FUNCTION "public"."toggle_entity_like"("uuid", "text", "uuid") IS 'Toggle like for any entity type';
COMMENT ON FUNCTION "public"."add_entity_comment"("uuid", "text", "uuid", "text", "uuid") IS 'Add comment for any entity type';
