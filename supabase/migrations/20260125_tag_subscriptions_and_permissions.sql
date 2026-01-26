-- Tag Subscriptions and Permissions Extension
-- Date: 2026-01-25
-- Adds tag following, tag admins, and tag-based content discovery

-- ============================================================================
-- TAG SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."tag_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "notification_preferences" "jsonb" DEFAULT '{"mentions": true, "trending": false}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tag_subscriptions_user_tag_unique" UNIQUE ("user_id", "tag_id"),
    CONSTRAINT "tag_subscriptions_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."tag_subscriptions" OWNER TO "postgres";

COMMENT ON TABLE "public"."tag_subscriptions" IS 'User subscriptions to tags for personalized feeds';
COMMENT ON COLUMN "public"."tag_subscriptions"."notification_preferences" IS 'User preferences for tag notifications';

CREATE INDEX IF NOT EXISTS "idx_tag_subscriptions_user_id" ON "public"."tag_subscriptions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_tag_subscriptions_tag_id" ON "public"."tag_subscriptions"("tag_id");

-- ============================================================================
-- TAG PERMISSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."tag_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "permission_level" "text" NOT NULL,
    "can_curate" boolean DEFAULT false,
    "can_approve" boolean DEFAULT false,
    "can_merge" boolean DEFAULT false,
    "can_delete" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tag_permissions_tag_user_unique" UNIQUE ("tag_id", "user_id"),
    CONSTRAINT "tag_permissions_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE,
    CONSTRAINT "tag_permissions_permission_level_check" CHECK (("permission_level" = ANY (ARRAY['viewer'::"text", 'curator'::"text", 'moderator'::"text", 'admin'::"text"])))
);

ALTER TABLE "public"."tag_permissions" OWNER TO "postgres";

COMMENT ON TABLE "public"."tag_permissions" IS 'Permissions for users to manage specific tags';
COMMENT ON COLUMN "public"."tag_permissions"."permission_level" IS 'Permission level: viewer, curator, moderator, admin';

CREATE INDEX IF NOT EXISTS "idx_tag_permissions_tag_id" ON "public"."tag_permissions"("tag_id");
CREATE INDEX IF NOT EXISTS "idx_tag_permissions_user_id" ON "public"."tag_permissions"("user_id");

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE "public"."tag_subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tag_permissions" ENABLE ROW LEVEL SECURITY;

-- Tag subscriptions: Users can manage their own subscriptions
CREATE POLICY "tag_subscriptions_select_own" ON "public"."tag_subscriptions"
    FOR SELECT TO authenticated
    USING (auth.uid() = "user_id");

CREATE POLICY "tag_subscriptions_insert_own" ON "public"."tag_subscriptions"
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "tag_subscriptions_delete_own" ON "public"."tag_subscriptions"
    FOR DELETE TO authenticated
    USING (auth.uid() = "user_id");

-- Tag permissions: Users can view permissions, admins can manage
CREATE POLICY "tag_permissions_select" ON "public"."tag_permissions"
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "tag_permissions_insert_admin" ON "public"."tag_permissions"
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Tag creator can grant permissions
        EXISTS (
            SELECT 1 FROM "public"."tags" t
            WHERE t."id" = "tag_id"
            AND t."created_by" = auth.uid()
        )
        OR
        -- Existing tag admin can grant permissions
        EXISTS (
            SELECT 1 FROM "public"."tag_permissions" tp
            WHERE tp."tag_id" = "tag_id"
            AND tp."user_id" = auth.uid()
            AND tp."permission_level" = 'admin'
        )
    );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get tag-based feed for a user
CREATE OR REPLACE FUNCTION "public"."get_tag_feed"(
    "p_user_id" "uuid",
    "p_limit" integer DEFAULT 20,
    "p_offset" integer DEFAULT 0
)
RETURNS TABLE(
    "entity_type" "text",
    "entity_id" "uuid",
    "context" "text",
    "created_at" timestamp with time zone,
    "tag_id" "uuid",
    "tag_name" "text"
)
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        tg."entity_type",
        tg."entity_id",
        tg."context",
        tg."created_at",
        t."id" as "tag_id",
        t."name" as "tag_name"
    FROM "public"."tag_subscriptions" ts
    JOIN "public"."taggings" tg ON ts."tag_id" = tg."tag_id"
    JOIN "public"."tags" t ON tg."tag_id" = t."id"
    WHERE ts."user_id" = "p_user_id"
      AND t."status" = 'active'
      AND t."deleted_at" IS NULL
    ORDER BY tg."created_at" DESC
    LIMIT "p_limit"
    OFFSET "p_offset";
END;
$$;

COMMENT ON FUNCTION "public"."get_tag_feed"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) IS 'Get content feed based on user tag subscriptions';
