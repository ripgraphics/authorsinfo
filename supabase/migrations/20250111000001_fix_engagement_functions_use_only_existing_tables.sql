-- Fix engagement functions to use ONLY existing tables (likes and comments)
-- Remove references to activity_likes and activity_comments which don't exist in database

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
        -- Use likes table for all entity types
        COALESCE((SELECT COUNT(*) FROM "public"."likes" 
                  WHERE "entity_type" = p_entity_type AND "entity_id" = p_entity_id), 0) as "likes_count",
        
        -- Use comments table for all entity types
        COALESCE((SELECT COUNT(*) FROM "public"."comments" 
                  WHERE "entity_type" = p_entity_type AND "entity_id" = p_entity_id 
                  AND "is_deleted" = false AND "is_hidden" = false), 0) as "comments_count",
        
        -- Recent likes: use likes table for all entity types
        COALESCE((SELECT jsonb_agg(
            jsonb_build_object(
                'user_id', el.user_id,
                'created_at', el.created_at
            )
        ) FROM (
            SELECT el.user_id, el.created_at
            FROM "public"."likes" el
            WHERE el.entity_type = p_entity_type AND el.entity_id = p_entity_id
            ORDER BY el.created_at DESC
            LIMIT 5
        ) el), '[]'::jsonb) as "recent_likes",
        
        -- Recent comments: use comments table for all entity types
        COALESCE((SELECT jsonb_agg(
            jsonb_build_object(
                'id', ec.id,
                'user_id', ec.user_id,
                'comment_text', ec.content,
                'created_at', ec.created_at
            )
        ) FROM (
            SELECT ec.id, ec.user_id, ec.content, ec.created_at
            FROM "public"."comments" ec
            WHERE ec.entity_type = p_entity_type AND ec.entity_id = p_entity_id
            AND ec.is_deleted = false AND ec.is_hidden = false
            ORDER BY ec.created_at DESC
            LIMIT 5
        ) ec), '[]'::jsonb) as "recent_comments";
END;
$$;

-- Update toggle_entity_like to use 'likes' table for all entity types
CREATE OR REPLACE FUNCTION "public"."toggle_entity_like"(
    "p_user_id" "uuid",
    "p_entity_type" "text",
    "p_entity_id" "uuid"
) RETURNS boolean LANGUAGE "plpgsql" SECURITY DEFINER AS $$
DECLARE
    "like_exists" boolean;
BEGIN
    -- Use likes table for all entity types
    SELECT EXISTS(
        SELECT 1 FROM "public"."likes" 
        WHERE "user_id" = p_user_id 
        AND "entity_type" = p_entity_type 
        AND "entity_id" = p_entity_id
    ) INTO "like_exists";
    
    IF "like_exists" THEN
        -- Remove like
        DELETE FROM "public"."likes" 
        WHERE "user_id" = p_user_id 
        AND "entity_type" = p_entity_type 
        AND "entity_id" = p_entity_id;
        RETURN false;
    ELSE
        -- Add like
        INSERT INTO "public"."likes" ("user_id", "entity_type", "entity_id")
        VALUES (p_user_id, p_entity_type, p_entity_id);
        RETURN true;
    END IF;
END;
$$;

-- Update add_entity_comment to use 'comments' table for all entity types
CREATE OR REPLACE FUNCTION "public"."add_entity_comment"(
    "p_user_id" "uuid",
    "p_entity_type" "text",
    "p_entity_id" "uuid",
    "p_comment_text" "text",
    "p_parent_comment_id" "uuid" DEFAULT NULL
) RETURNS "uuid" LANGUAGE "plpgsql" SECURITY DEFINER AS $$
DECLARE
    "new_comment_id" "uuid";
BEGIN
    -- Generate new comment ID
    "new_comment_id" := gen_random_uuid();
    
    -- Insert comment into comments table for all entity types
    INSERT INTO "public"."comments" (
        "id",
        "user_id",
        "entity_type",
        "entity_id",
        "content",
        "parent_id",
        "is_deleted",
        "is_hidden",
        "created_at",
        "updated_at"
    ) VALUES (
        "new_comment_id",
        p_user_id,
        p_entity_type,
        p_entity_id,
        p_comment_text,
        p_parent_comment_id,
        false,
        false,
        NOW(),
        NOW()
    );
    
    RETURN "new_comment_id";
END;
$$;






