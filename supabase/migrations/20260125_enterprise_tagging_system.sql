-- Enterprise Tagging System Migration
-- Date: 2026-01-25
-- Comprehensive Facebook-style tagging system supporting mentions, hashtags, locations, and taxonomy

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- CORE TAG TABLES
-- ============================================================================

-- Tags table: Canonical tag records
CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_by" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "default_locale" "text" DEFAULT 'en'::"text",
    "localized_names" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "tags_type_check" CHECK (("type" = ANY (ARRAY['user'::"text", 'entity'::"text", 'topic'::"text", 'collaborator'::"text", 'location'::"text", 'taxonomy'::"text"]))),
    CONSTRAINT "tags_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'archived'::"text", 'blocked'::"text", 'pending'::"text"]))),
    CONSTRAINT "tags_slug_unique" UNIQUE ("slug", "type")
);

ALTER TABLE "public"."tags" OWNER TO "postgres";

COMMENT ON TABLE "public"."tags" IS 'Canonical tag records for all tag types (user mentions, entities, topics, locations, taxonomy)';
COMMENT ON COLUMN "public"."tags"."name" IS 'Display name of the tag';
COMMENT ON COLUMN "public"."tags"."slug" IS 'URL-friendly identifier, unique per type';
COMMENT ON COLUMN "public"."tags"."type" IS 'Type of tag: user, entity, topic, collaborator, location, taxonomy';
COMMENT ON COLUMN "public"."tags"."status" IS 'Tag status: active, archived, blocked, pending';
COMMENT ON COLUMN "public"."tags"."created_by" IS 'User who created this tag (for taxonomy/topic tags)';
COMMENT ON COLUMN "public"."tags"."metadata" IS 'Additional data: location coordinates, entity_id for user/entity tags, taxonomy hierarchy, etc.';
COMMENT ON COLUMN "public"."tags"."usage_count" IS 'Cached count of taggings using this tag';
COMMENT ON COLUMN "public"."tags"."default_locale" IS 'Default locale for this tag (e.g., en, es, fr)';
COMMENT ON COLUMN "public"."tags"."localized_names" IS 'Localized names: {"es": "nombre en español", "fr": "nom en français"}';

-- Tag aliases table: Synonyms and redirects
CREATE TABLE IF NOT EXISTS "public"."tag_aliases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "alias" "text" NOT NULL,
    "alias_slug" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tag_aliases_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE,
    CONSTRAINT "tag_aliases_alias_unique" UNIQUE ("alias", "alias_slug")
);

ALTER TABLE "public"."tag_aliases" OWNER TO "postgres";

COMMENT ON TABLE "public"."tag_aliases" IS 'Aliases and synonyms for tags (e.g., #book vs #books)';
COMMENT ON COLUMN "public"."tag_aliases"."tag_id" IS 'Reference to canonical tag';
COMMENT ON COLUMN "public"."tag_aliases"."alias" IS 'Alternative name for the tag';
COMMENT ON COLUMN "public"."tag_aliases"."alias_slug" IS 'URL-friendly alias identifier';

-- Taggings table: Polymorphic join table
CREATE TABLE IF NOT EXISTS "public"."taggings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "tagged_by" "uuid",
    "context" "text" NOT NULL,
    "position_start" integer,
    "position_end" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "taggings_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE,
    CONSTRAINT "taggings_context_check" CHECK (("context" = ANY (ARRAY['post'::"text", 'comment'::"text", 'profile'::"text", 'message'::"text", 'photo'::"text", 'activity'::"text", 'book'::"text", 'author'::"text", 'group'::"text", 'event'::"text"]))),
    CONSTRAINT "taggings_unique" UNIQUE ("tag_id", "entity_type", "entity_id", "context")
);

ALTER TABLE "public"."taggings" OWNER TO "postgres";

COMMENT ON TABLE "public"."taggings" IS 'Polymorphic tagging relationships linking tags to any entity';
COMMENT ON COLUMN "public"."taggings"."entity_type" IS 'Type of entity being tagged (post, comment, user, etc.)';
COMMENT ON COLUMN "public"."taggings"."entity_id" IS 'ID of the entity being tagged';
COMMENT ON COLUMN "public"."taggings"."tagged_by" IS 'User who created this tagging';
COMMENT ON COLUMN "public"."taggings"."context" IS 'Context where tag appears: post, comment, profile, message, photo, etc.';
COMMENT ON COLUMN "public"."taggings"."position_start" IS 'Character position start for inline mentions';
COMMENT ON COLUMN "public"."taggings"."position_end" IS 'Character position end for inline mentions';
COMMENT ON COLUMN "public"."taggings"."metadata" IS 'Additional context: notification sent, approval status, etc.';

-- Tag policies table: Per-entity tagging constraints
CREATE TABLE IF NOT EXISTS "public"."tag_policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "allow_user_mentions" boolean DEFAULT true,
    "allow_entity_mentions" boolean DEFAULT true,
    "allow_hashtags" boolean DEFAULT true,
    "require_approval" boolean DEFAULT false,
    "blocked_tag_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "allowed_tag_types" "text"[] DEFAULT ARRAY['user'::"text", 'entity'::"text", 'topic'::"text", 'collaborator'::"text", 'location'::"text", 'taxonomy'::"text"],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tag_policies_entity_unique" UNIQUE ("entity_type", "entity_id")
);

ALTER TABLE "public"."tag_policies" OWNER TO "postgres";

COMMENT ON TABLE "public"."tag_policies" IS 'Tagging policies and constraints per entity (e.g., user opt-out, group restrictions)';
COMMENT ON COLUMN "public"."tag_policies"."entity_type" IS 'Type of entity (user, group, etc.)';
COMMENT ON COLUMN "public"."tag_policies"."entity_id" IS 'Specific entity ID (NULL for global defaults)';
COMMENT ON COLUMN "public"."tag_policies"."allow_user_mentions" IS 'Whether user mentions are allowed';
COMMENT ON COLUMN "public"."tag_policies"."blocked_tag_ids" IS 'List of tag IDs that are blocked for this entity';

-- Tag audit log table: Compliance and moderation traceability
CREATE TABLE IF NOT EXISTS "public"."tag_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tag_id" "uuid",
    "tagging_id" "uuid",
    "action" "text" NOT NULL,
    "actor_id" "uuid",
    "entity_type" "text",
    "entity_id" "uuid",
    "old_value" "jsonb",
    "new_value" "jsonb",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tag_audit_log_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE SET NULL,
    CONSTRAINT "tag_audit_log_tagging_id_fkey" FOREIGN KEY ("tagging_id") REFERENCES "public"."taggings"("id") ON DELETE SET NULL,
    CONSTRAINT "tag_audit_log_action_check" CHECK (("action" = ANY (ARRAY['create'::"text", 'update'::"text", 'delete'::"text", 'block'::"text", 'unblock'::"text", 'merge'::"text", 'approve'::"text", 'reject'::"text"])))
);

ALTER TABLE "public"."tag_audit_log" OWNER TO "postgres";

COMMENT ON TABLE "public"."tag_audit_log" IS 'Audit trail for all tag and tagging operations for compliance and moderation';
COMMENT ON COLUMN "public"."tag_audit_log"."action" IS 'Action performed: create, update, delete, block, unblock, merge, approve, reject';
COMMENT ON COLUMN "public"."tag_audit_log"."actor_id" IS 'User who performed the action';
COMMENT ON COLUMN "public"."tag_audit_log"."old_value" IS 'Previous state (JSON)';
COMMENT ON COLUMN "public"."tag_audit_log"."new_value" IS 'New state (JSON)';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS "idx_tags_type_status" ON "public"."tags"("type", "status");
CREATE INDEX IF NOT EXISTS "idx_tags_slug" ON "public"."tags"("slug");
CREATE INDEX IF NOT EXISTS "idx_tags_usage_count" ON "public"."tags"("usage_count" DESC);
CREATE INDEX IF NOT EXISTS "idx_tags_created_at" ON "public"."tags"("created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_tag_aliases_tag_id" ON "public"."tag_aliases"("tag_id");
CREATE INDEX IF NOT EXISTS "idx_tag_aliases_alias" ON "public"."tag_aliases"("alias");
CREATE INDEX IF NOT EXISTS "idx_tag_aliases_alias_slug" ON "public"."tag_aliases"("alias_slug");

CREATE INDEX IF NOT EXISTS "idx_taggings_tag_id" ON "public"."taggings"("tag_id");
CREATE INDEX IF NOT EXISTS "idx_taggings_entity" ON "public"."taggings"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_taggings_context" ON "public"."taggings"("context");
CREATE INDEX IF NOT EXISTS "idx_taggings_tagged_by" ON "public"."taggings"("tagged_by");
CREATE INDEX IF NOT EXISTS "idx_taggings_created_at" ON "public"."taggings"("created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_tag_policies_entity" ON "public"."tag_policies"("entity_type", "entity_id");

CREATE INDEX IF NOT EXISTS "idx_tag_audit_log_tag_id" ON "public"."tag_audit_log"("tag_id");
CREATE INDEX IF NOT EXISTS "idx_tag_audit_log_tagging_id" ON "public"."tag_audit_log"("tagging_id");
CREATE INDEX IF NOT EXISTS "idx_tag_audit_log_actor" ON "public"."tag_audit_log"("actor_id");
CREATE INDEX IF NOT EXISTS "idx_tag_audit_log_created_at" ON "public"."tag_audit_log"("created_at" DESC);

-- Full-text search index for tag names
CREATE INDEX IF NOT EXISTS "idx_tags_name_trgm" ON "public"."tags" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_tag_aliases_alias_trgm" ON "public"."tag_aliases" USING gin ("alias" gin_trgm_ops);

-- ============================================================================
-- FUNCTIONS FOR TAG OPERATIONS
-- ============================================================================

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION "public"."generate_tag_slug"("name" "text")
RETURNS "text"
LANGUAGE "plpgsql"
IMMUTABLE
AS $$
BEGIN
    RETURN lower(regexp_replace(regexp_replace(trim("name"), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$;

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION "public"."update_tag_usage_count"()
RETURNS "trigger"
LANGUAGE "plpgsql"
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE "public"."tags" SET "usage_count" = "usage_count" + 1 WHERE "id" = NEW."tag_id";
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE "public"."tags" SET "usage_count" = GREATEST("usage_count" - 1, 0) WHERE "id" = OLD."tag_id";
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Trigger to update usage count
DROP TRIGGER IF EXISTS "trg_update_tag_usage_count" ON "public"."taggings";
CREATE TRIGGER "trg_update_tag_usage_count"
AFTER INSERT OR DELETE ON "public"."taggings"
FOR EACH ROW EXECUTE FUNCTION "public"."update_tag_usage_count"();

-- Function to sync hashtags array in posts/activities from taggings
CREATE OR REPLACE FUNCTION "public"."sync_hashtags_from_taggings"("p_entity_type" "text", "p_entity_id" "uuid")
RETURNS "void"
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
DECLARE
    v_hashtags "text"[];
BEGIN
    SELECT array_agg(t."name" ORDER BY tg."created_at")
    INTO v_hashtags
    FROM "public"."taggings" tg
    JOIN "public"."tags" t ON tg."tag_id" = t."id"
    WHERE tg."entity_type" = "p_entity_type"
      AND tg."entity_id" = "p_entity_id"
      AND tg."context" IN ('post', 'activity')
      AND t."type" = 'topic';

    IF "p_entity_type" = 'post' THEN
        UPDATE "public"."posts" SET "hashtags" = COALESCE(v_hashtags, '{}'::"text"[]) WHERE "id" = "p_entity_id";
    ELSIF "p_entity_type" = 'activity' THEN
        UPDATE "public"."activities" SET "hashtags" = COALESCE(v_hashtags, '{}'::"text"[]) WHERE "id" = "p_entity_id";
    END IF;
END;
$$;

-- Function to sync mentions array in comments from taggings
CREATE OR REPLACE FUNCTION "public"."sync_mentions_from_taggings"("p_comment_id" "uuid")
RETURNS "void"
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
DECLARE
    v_mentions "uuid"[];
BEGIN
    SELECT array_agg((t."metadata"->>'entity_id')::"uuid")
    INTO v_mentions
    FROM "public"."taggings" tg
    JOIN "public"."tags" t ON tg."tag_id" = t."id"
    WHERE tg."entity_id" = "p_comment_id"
      AND tg."context" = 'comment'
      AND t."type" = 'user';

    UPDATE "public"."comments" SET "mentions" = COALESCE(v_mentions, '{}'::"uuid"[]) WHERE "id" = "p_comment_id";
END;
$$;

-- Function to find or create tag
CREATE OR REPLACE FUNCTION "public"."find_or_create_tag"(
    "p_name" "text",
    "p_type" "text",
    "p_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "p_created_by" "uuid" DEFAULT NULL
)
RETURNS "uuid"
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
DECLARE
    v_tag_id "uuid";
    v_slug "text";
BEGIN
    v_slug := "public"."generate_tag_slug"("p_name");

    -- Try to find existing tag by slug and type
    SELECT "id" INTO v_tag_id
    FROM "public"."tags"
    WHERE "slug" = v_slug AND "type" = "p_type" AND "deleted_at" IS NULL
    LIMIT 1;

    -- If not found, create new tag
    IF v_tag_id IS NULL THEN
        INSERT INTO "public"."tags" ("name", "slug", "type", "metadata", "created_by")
        VALUES ("p_name", v_slug, "p_type", "p_metadata", "p_created_by")
        RETURNING "id" INTO v_tag_id;
    END IF;

    RETURN v_tag_id;
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tag_aliases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."taggings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tag_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tag_audit_log" ENABLE ROW LEVEL SECURITY;

-- Tags: Everyone can read active tags, authenticated users can create
-- Enhanced: Respect entity visibility for user/entity tags
CREATE POLICY "tags_select_active" ON "public"."tags"
    FOR SELECT TO authenticated, anon
    USING (
        "status" = 'active' 
        AND "deleted_at" IS NULL
        AND (
            -- Public tags (topics, taxonomy) are always visible
            "type" IN ('topic', 'taxonomy', 'location')
            OR
            -- User tags: check if user profile is discoverable
            (
                "type" = 'user' 
                AND EXISTS (
                    SELECT 1 FROM "public"."profiles" p
                    WHERE p."user_id" = ("metadata"->>'entity_id')::uuid
                    AND p."profile_visibility" IN ('public', 'followers')
                )
            )
            OR
            -- Entity tags: check entity visibility
            (
                "type" = 'entity'
                AND (
                    -- Authors and books are generally public
                    ("metadata"->>'entity_type') IN ('author', 'book')
                    OR
                    -- Groups: check if public or user is member
                    (
                        ("metadata"->>'entity_type") = 'group'
                        AND (
                            EXISTS (
                                SELECT 1 FROM "public"."groups" g
                                WHERE g."id" = ("metadata"->>'entity_id')::uuid
                                AND g."is_private" = false
                            )
                            OR
                            EXISTS (
                                SELECT 1 FROM "public"."group_members" gm
                                WHERE gm."group_id" = ("metadata"->>'entity_id')::uuid
                                AND gm."user_id" = auth.uid()
                            )
                        )
                    )
                    OR
                    -- Events: check if public
                    (
                        ("metadata"->>'entity_type") = 'event'
                        AND EXISTS (
                            SELECT 1 FROM "public"."events" e
                            WHERE e."id" = ("metadata"->>'entity_id')::uuid
                            AND e."visibility" = 'public'
                        )
                    )
                )
            )
        )
    );

CREATE POLICY "tags_insert_authenticated" ON "public"."tags"
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "tags_update_own" ON "public"."tags"
    FOR UPDATE TO authenticated
    USING ("created_by" = auth.uid());

-- Tag aliases: Read-only for everyone
CREATE POLICY "tag_aliases_select" ON "public"."tag_aliases"
    FOR SELECT TO authenticated, anon
    USING (true);

CREATE POLICY "tag_aliases_insert_authenticated" ON "public"."tag_aliases"
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Taggings: Enhanced visibility based on entity context
CREATE POLICY "taggings_select" ON "public"."taggings"
    FOR SELECT TO authenticated, anon
    USING (
        -- Can see taggings on public entities
        (
            "entity_type" = 'post'
            AND EXISTS (
                SELECT 1 FROM "public"."posts" p
                WHERE p."id" = "entity_id"
                AND p."visibility" = 'public'
                AND p."deleted_at" IS NULL
            )
        )
        OR
        (
            "entity_type" = 'activity'
            AND EXISTS (
                SELECT 1 FROM "public"."activities" a
                WHERE a."id" = "entity_id"
                AND a."visibility" = 'public'
                AND a."deleted_at" IS NULL
            )
        )
        OR
        -- Can see taggings on own content
        EXISTS (
            SELECT 1 FROM "public"."posts" p
            WHERE p."id" = "entity_id"
            AND p."user_id" = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM "public"."activities" a
            WHERE a."id" = "entity_id"
            AND a."user_id" = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM "public"."comments" c
            WHERE c."id" = "entity_id"
            AND c."user_id" = auth.uid()
        )
        OR
        -- Can see taggings in groups you're a member of
        (
            "context" = 'post'
            AND EXISTS (
                SELECT 1 FROM "public"."posts" p
                JOIN "public"."groups" g ON p."entity_type" = 'group' AND p."entity_id" = g."id"
                WHERE p."id" = "entity_id"
                AND (
                    g."is_private" = false
                    OR EXISTS (
                        SELECT 1 FROM "public"."group_members" gm
                        WHERE gm."group_id" = g."id"
                        AND gm."user_id" = auth.uid()
                    )
                )
            )
        )
    );

CREATE POLICY "taggings_insert_authenticated" ON "public"."taggings"
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = "tagged_by" 
        AND
        -- Can only tag content you own or have permission to tag
        (
            EXISTS (
                SELECT 1 FROM "public"."posts" p
                WHERE p."id" = "entity_id"
                AND p."user_id" = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM "public"."activities" a
                WHERE a."id" = "entity_id"
                AND a."user_id" = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM "public"."comments" c
                WHERE c."id" = "entity_id"
                AND c."user_id" = auth.uid()
            )
        )
    );

CREATE POLICY "taggings_delete_own" ON "public"."taggings"
    FOR DELETE TO authenticated
    USING (
        auth.uid() = "tagged_by"
        OR
        -- Can delete taggings on own content
        EXISTS (
            SELECT 1 FROM "public"."posts" p
            WHERE p."id" = "entity_id"
            AND p."user_id" = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM "public"."activities" a
            WHERE a."id" = "entity_id"
            AND a."user_id" = auth.uid()
        )
    );

-- Tag policies: Read for everyone, write for admins/entity owners
CREATE POLICY "tag_policies_select" ON "public"."tag_policies"
    FOR SELECT TO authenticated, anon
    USING (true);

CREATE POLICY "tag_policies_insert_authenticated" ON "public"."tag_policies"
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Tag audit log: Read-only for authenticated users
CREATE POLICY "tag_audit_log_select" ON "public"."tag_audit_log"
    FOR SELECT TO authenticated
    USING (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION "public"."generate_tag_slug"("name" "text") IS 'Generates URL-friendly slug from tag name';
COMMENT ON FUNCTION "public"."update_tag_usage_count"() IS 'Automatically updates tag usage count when taggings are created/deleted';
COMMENT ON FUNCTION "public"."sync_hashtags_from_taggings"("p_entity_type" "text", "p_entity_id" "uuid") IS 'Syncs hashtags array in posts/activities from taggings table for backward compatibility';
COMMENT ON FUNCTION "public"."sync_mentions_from_taggings"("p_comment_id" "uuid") IS 'Syncs mentions array in comments from taggings table for backward compatibility';
COMMENT ON FUNCTION "public"."find_or_create_tag"("p_name" "text", "p_type" "text", "p_metadata" "jsonb", "p_created_by" "uuid") IS 'Finds existing tag or creates new one, returns tag ID';

-- ============================================================================
-- FUZZY MATCHING FUNCTIONS
-- ============================================================================

-- Function to search tags with fuzzy matching using pg_trgm
CREATE OR REPLACE FUNCTION "public"."search_tags_fuzzy"(
    "p_query" "text",
    "p_types" "text"[] DEFAULT NULL,
    "p_limit" integer DEFAULT 20,
    "p_similarity_threshold" numeric DEFAULT 0.3
)
RETURNS TABLE(
    "id" "uuid",
    "name" "text",
    "slug" "text",
    "type" "text",
    "metadata" "jsonb",
    "usage_count" integer,
    "created_at" timestamp with time zone,
    "similarity" numeric
)
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t."id",
        t."name",
        t."slug",
        t."type",
        t."metadata",
        t."usage_count",
        t."created_at",
        GREATEST(
            similarity(t."name", "p_query"),
            similarity(t."slug", "p_query")
        ) as "similarity"
    FROM "public"."tags" t
    WHERE t."status" = 'active'
      AND t."deleted_at" IS NULL
      AND (
        ("p_types" IS NULL) OR (t."type" = ANY("p_types"))
      )
      AND (
        similarity(t."name", "p_query") > "p_similarity_threshold"
        OR similarity(t."slug", "p_query") > "p_similarity_threshold"
        OR t."name" ILIKE '%' || "p_query" || '%'
        OR t."slug" ILIKE '%' || "p_query" || '%'
      )
    ORDER BY 
        -- Exact match first
        CASE 
            WHEN LOWER(t."name") = LOWER("p_query") THEN 0
            WHEN LOWER(t."slug") = LOWER("p_query") THEN 0
            WHEN LOWER(t."name") LIKE LOWER("p_query") || '%' THEN 1
            WHEN LOWER(t."slug") LIKE LOWER("p_query") || '%' THEN 1
            ELSE 2
        END,
        GREATEST(
            similarity(t."name", "p_query"),
            similarity(t."slug", "p_query")
        ) DESC,
        t."usage_count" DESC,
        t."created_at" DESC
    LIMIT "p_limit";
END;
$$;

COMMENT ON FUNCTION "public"."search_tags_fuzzy"("p_query" "text", "p_types" "text"[], "p_limit" integer, "p_similarity_threshold" numeric) IS 'Fuzzy search tags using pg_trgm similarity with configurable threshold';

-- Function to merge tags (admin tool)
CREATE OR REPLACE FUNCTION "public"."merge_tags"(
    "p_source_tag_id" "uuid",
    "p_target_tag_id" "uuid",
    "p_actor_id" "uuid"
)
RETURNS "void"
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
DECLARE
    v_source_tag RECORD;
    v_target_tag RECORD;
BEGIN
    -- Get source and target tags
    SELECT * INTO v_source_tag FROM "public"."tags" WHERE "id" = "p_source_tag_id";
    SELECT * INTO v_target_tag FROM "public"."tags" WHERE "id" = "p_target_tag_id";

    IF v_source_tag IS NULL OR v_target_tag IS NULL THEN
        RAISE EXCEPTION 'Source or target tag not found';
    END IF;

    IF v_source_tag."type" <> v_target_tag."type" THEN
        RAISE EXCEPTION 'Cannot merge tags of different types';
    END IF;

    -- Create alias from source to target
    INSERT INTO "public"."tag_aliases" ("tag_id", "alias", "alias_slug")
    VALUES (
        "p_target_tag_id",
        v_source_tag."name",
        v_source_tag."slug"
    )
    ON CONFLICT DO NOTHING;

    -- Move all taggings from source to target
    UPDATE "public"."taggings"
    SET "tag_id" = "p_target_tag_id",
        "updated_at" = NOW()
    WHERE "tag_id" = "p_source_tag_id";

    -- Update target tag usage count
    UPDATE "public"."tags"
    SET "usage_count" = (
        SELECT COUNT(*) FROM "public"."taggings" WHERE "tag_id" = "p_target_tag_id"
    )
    WHERE "id" = "p_target_tag_id";

    -- Archive source tag
    UPDATE "public"."tags"
    SET "status" = 'archived',
        "deleted_at" = NOW(),
        "updated_at" = NOW()
    WHERE "id" = "p_source_tag_id";

    -- Log merge in audit log
    INSERT INTO "public"."tag_audit_log" (
        "tag_id",
        "action",
        "actor_id",
        "old_value",
        "new_value",
        "reason"
    ) VALUES (
        "p_source_tag_id",
        'merge',
        "p_actor_id",
        jsonb_build_object('id', v_source_tag."id", 'name', v_source_tag."name"),
        jsonb_build_object('id', v_target_tag."id", 'name', v_target_tag."name"),
        'Merged into ' || v_target_tag."name"
    );
END;
$$;

COMMENT ON FUNCTION "public"."merge_tags"("p_source_tag_id" "uuid", "p_target_tag_id" "uuid", "p_actor_id" "uuid") IS 'Merges source tag into target tag, moving all taggings and creating alias';

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- Top tags materialized view: Most used tags (materialized for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS "public"."mv_tag_analytics_top_tags" AS
SELECT 
    t."id",
    t."name",
    t."slug",
    t."type",
    t."usage_count",
    COUNT(tg."id") as "taggings_count",
    COUNT(DISTINCT tg."tagged_by") as "unique_taggers",
    MAX(tg."created_at") as "last_used_at",
    MIN(tg."created_at") as "first_used_at"
FROM "public"."tags" t
LEFT JOIN "public"."taggings" tg ON t."id" = tg."tag_id"
WHERE t."status" = 'active' AND t."deleted_at" IS NULL
GROUP BY t."id", t."name", t."slug", t."type", t."usage_count";

CREATE UNIQUE INDEX IF NOT EXISTS "idx_mv_tag_analytics_top_tags_id" ON "public"."mv_tag_analytics_top_tags"("id");
CREATE INDEX IF NOT EXISTS "idx_mv_tag_analytics_top_tags_usage" ON "public"."mv_tag_analytics_top_tags"("usage_count" DESC, "taggings_count" DESC);

COMMENT ON MATERIALIZED VIEW "public"."mv_tag_analytics_top_tags" IS 'Materialized view showing top tags by usage (refresh periodically)';

-- Regular view for backward compatibility
CREATE OR REPLACE VIEW "public"."tag_analytics_top_tags" AS
SELECT * FROM "public"."mv_tag_analytics_top_tags"
ORDER BY "usage_count" DESC, "taggings_count" DESC;

COMMENT ON VIEW "public"."tag_analytics_top_tags" IS 'Analytics view showing top tags by usage (reads from materialized view)';

-- Tag trends materialized view: Tags trending in recent period
CREATE MATERIALIZED VIEW IF NOT EXISTS "public"."mv_tag_analytics_trending" AS
SELECT 
    t."id",
    t."name",
    t."slug",
    t."type",
    COUNT(tg."id") FILTER (WHERE tg."created_at" >= NOW() - INTERVAL '7 days') as "recent_count",
    COUNT(tg."id") FILTER (WHERE tg."created_at" >= NOW() - INTERVAL '30 days') as "month_count",
    COUNT(tg."id") as "total_count",
    (COUNT(tg."id") FILTER (WHERE tg."created_at" >= NOW() - INTERVAL '7 days')::numeric / 
     NULLIF(COUNT(tg."id") FILTER (WHERE tg."created_at" >= NOW() - INTERVAL '30 days'), 0) * 100) as "growth_percentage"
FROM "public"."tags" t
LEFT JOIN "public"."taggings" tg ON t."id" = tg."tag_id"
WHERE t."status" = 'active' AND t."deleted_at" IS NULL
GROUP BY t."id", t."name", t."slug", t."type"
HAVING COUNT(tg."id") FILTER (WHERE tg."created_at" >= NOW() - INTERVAL '7 days') > 0;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_mv_tag_analytics_trending_id" ON "public"."mv_tag_analytics_trending"("id");
CREATE INDEX IF NOT EXISTS "idx_mv_tag_analytics_trending_recent" ON "public"."mv_tag_analytics_trending"("recent_count" DESC, "growth_percentage" DESC);

COMMENT ON MATERIALIZED VIEW "public"."mv_tag_analytics_trending" IS 'Materialized view showing trending tags (refresh periodically)';

-- Regular view for backward compatibility
CREATE OR REPLACE VIEW "public"."tag_analytics_trending" AS
SELECT * FROM "public"."mv_tag_analytics_trending"
ORDER BY "recent_count" DESC, "growth_percentage" DESC;

COMMENT ON VIEW "public"."tag_analytics_trending" IS 'Analytics view showing trending tags in the last 7 days (reads from materialized view)';

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION "public"."refresh_tag_analytics"()
RETURNS "void"
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY "public"."mv_tag_analytics_top_tags";
    REFRESH MATERIALIZED VIEW CONCURRENTLY "public"."mv_tag_analytics_trending";
END;
$$;

COMMENT ON FUNCTION "public"."refresh_tag_analytics"() IS 'Refreshes all tag analytics materialized views (run periodically via cron)';

-- Tag context analytics: Tag usage by context
CREATE OR REPLACE VIEW "public"."tag_analytics_by_context" AS
SELECT 
    tg."context",
    t."type" as "tag_type",
    COUNT(tg."id") as "usage_count",
    COUNT(DISTINCT tg."entity_id") as "unique_entities",
    COUNT(DISTINCT tg."tagged_by") as "unique_taggers"
FROM "public"."taggings" tg
JOIN "public"."tags" t ON tg."tag_id" = t."id"
WHERE t."status" = 'active' AND t."deleted_at" IS NULL
GROUP BY tg."context", t."type"
ORDER BY tg."context", "usage_count" DESC;

COMMENT ON VIEW "public"."tag_analytics_by_context" IS 'Analytics view showing tag usage breakdown by context and tag type';

-- User mention analytics: Most mentioned users
CREATE OR REPLACE VIEW "public"."tag_analytics_most_mentioned_users" AS
SELECT 
    (t."metadata"->>'entity_id')::uuid as "user_id",
    u."name" as "user_name",
    u."permalink" as "user_permalink",
    COUNT(tg."id") as "mention_count",
    COUNT(DISTINCT tg."tagged_by") as "mentioned_by_count",
    COUNT(DISTINCT tg."context") as "contexts_count",
    MAX(tg."created_at") as "last_mentioned_at"
FROM "public"."taggings" tg
JOIN "public"."tags" t ON tg."tag_id" = t."id"
LEFT JOIN "public"."users" u ON (t."metadata"->>'entity_id')::uuid = u."id"
WHERE t."type" = 'user' AND t."status" = 'active' AND t."deleted_at" IS NULL
GROUP BY (t."metadata"->>'entity_id')::uuid, u."name", u."permalink"
ORDER BY "mention_count" DESC;

COMMENT ON VIEW "public"."tag_analytics_most_mentioned_users" IS 'Analytics view showing most mentioned users';

-- ============================================================================
-- TRIGGERS FOR NOTIFICATIONS
-- ============================================================================

-- Function to create mention notifications when taggings are created
CREATE OR REPLACE FUNCTION "public"."notify_on_user_mention"()
RETURNS "trigger"
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
DECLARE
    v_tag_type "text";
    v_mentioned_user_id "uuid";
    v_tagger_id "uuid";
    v_tagger_name "text";
    v_context_title "text";
    v_context_message "text";
BEGIN
    -- Get tag type
    SELECT t."type", (t."metadata"->>'entity_id')::uuid, tg."tagged_by"
    INTO v_tag_type, v_mentioned_user_id, v_tagger_id
    FROM "public"."tags" t
    WHERE t."id" = NEW."tag_id";

    -- Only process user mentions
    IF v_tag_type <> 'user' OR v_mentioned_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Don't notify if user mentioned themselves
    IF v_mentioned_user_id = v_tagger_id THEN
        RETURN NEW;
    END IF;

    -- Get tagger name
    SELECT "name" INTO v_tagger_name
    FROM "public"."users"
    WHERE "id" = v_tagger_id;

    v_tagger_name := COALESCE(v_tagger_name, 'Someone');

    -- Determine notification message based on context
    CASE NEW."context"
        WHEN 'post' THEN
            v_context_title := 'You were mentioned in a post';
            v_context_message := v_tagger_name || ' mentioned you in a post';
        WHEN 'comment' THEN
            v_context_title := 'You were mentioned in a comment';
            v_context_message := v_tagger_name || ' mentioned you in a comment';
        WHEN 'message' THEN
            v_context_title := 'You were mentioned in a message';
            v_context_message := v_tagger_name || ' mentioned you in a message';
        ELSE
            v_context_title := 'You were mentioned';
            v_context_message := v_tagger_name || ' mentioned you';
    END CASE;

    -- Check if notification already exists (avoid duplicates)
    IF NOT EXISTS (
        SELECT 1 FROM "public"."notifications"
        WHERE "recipient_id" = v_mentioned_user_id
          AND "type" = 'mention'
          AND ("data"->>'entity_id')::text = NEW."entity_id"::text
          AND ("data"->>'entity_type')::text = NEW."entity_type"
          AND "is_read" = false
          AND "created_at" > NOW() - INTERVAL '1 hour'
    ) THEN
        -- Create notification
        INSERT INTO "public"."notifications" (
            "recipient_id",
            "type",
            "title",
            "message",
            "data"
        ) VALUES (
            v_mentioned_user_id,
            'mention',
            v_context_title,
            v_context_message,
            jsonb_build_object(
                'entity_id', NEW."entity_id",
                'entity_type', NEW."entity_type",
                'context', NEW."context",
                'tagged_by', v_tagger_id,
                'tag_id', NEW."tag_id",
                'tagging_id', NEW."id"
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS "trg_notify_on_user_mention" ON "public"."taggings";
CREATE TRIGGER "trg_notify_on_user_mention"
AFTER INSERT ON "public"."taggings"
FOR EACH ROW
WHEN (NEW."context" IN ('post', 'comment', 'message', 'photo'))
EXECUTE FUNCTION "public"."notify_on_user_mention"();

COMMENT ON FUNCTION "public"."notify_on_user_mention"() IS 'Automatically creates notifications when users are mentioned in posts, comments, or messages';
