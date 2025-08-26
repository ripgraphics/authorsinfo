-- ============================================================================
-- CREATE MISSING ENGAGEMENT TABLES FOR ENTERPRISE ENGAGEMENT SYSTEM
-- PostgreSQL Compatible Version
-- ============================================================================

-- Create engagement_views table for enterprise-grade view tracking
CREATE TABLE IF NOT EXISTS "public"."engagement_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "view_count" integer DEFAULT 1,
    "view_duration" integer, -- in seconds
    "view_source" "text", -- 'direct', 'feed', 'search', 'share', etc.
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp DEFAULT "now"() NOT NULL,
    "updated_at" timestamp DEFAULT "now"() NOT NULL,
    CONSTRAINT "engagement_views_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "engagement_views_user_entity_unique" UNIQUE ("user_id", "entity_type", "entity_id")
);

-- Create indexes for engagement_views
CREATE INDEX IF NOT EXISTS "idx_engagement_views_entity" ON "public"."engagement_views" ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_engagement_views_user" ON "public"."engagement_views" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_engagement_views_created" ON "public"."engagement_views" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_engagement_views_updated" ON "public"."engagement_views" ("updated_at");

-- Add foreign key constraints
ALTER TABLE "public"."engagement_views" ADD CONSTRAINT "engagement_views_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Enable ROW LEVEL SECURITY
ALTER TABLE "public"."engagement_views" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for engagement_views
CREATE POLICY "Users can insert their own views" ON "public"."engagement_views"
    FOR INSERT WITH CHECK ("auth"."uid"() = "user_id" OR "user_id" IS NULL);

CREATE POLICY "Users can update their own views" ON "public"."engagement_views"
    FOR UPDATE USING ("auth"."uid"() = "user_id" OR "user_id" IS NULL);

CREATE POLICY "Users can delete their own views" ON "public"."engagement_views"
    FOR DELETE USING ("auth"."uid"() = "user_id" OR "user_id" IS NULL);

CREATE POLICY "Users can view all views" ON "public"."engagement_views"
    FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON TABLE "public"."engagement_views" TO "anon";
GRANT ALL ON TABLE "public"."engagement_views" TO "authenticated";
GRANT ALL ON TABLE "public"."engagement_views" TO "service_role";

-- Add comments
COMMENT ON TABLE "public"."engagement_views" IS 'Enterprise-grade views table for all entity types';
COMMENT ON COLUMN "public"."engagement_views"."view_duration" IS 'Duration of view in seconds';
COMMENT ON COLUMN "public"."engagement_views"."view_source" IS 'Source of the view (direct, feed, search, share, etc.)';

-- ============================================================================
-- ENSURE ALL ENGAGEMENT TABLES HAVE PROPER STRUCTURE
-- ============================================================================

-- Check if engagement_likes has reaction_type column, add if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'engagement_likes' 
        AND column_name = 'reaction_type'
    ) THEN
        ALTER TABLE "public"."engagement_likes" 
        ADD COLUMN "reaction_type" "text" DEFAULT 'like' NOT NULL;
        
        -- Add constraint for valid reaction types (without IF NOT EXISTS)
        BEGIN
            ALTER TABLE "public"."engagement_likes" 
            ADD CONSTRAINT "engagement_likes_reaction_type_check"
            CHECK ("reaction_type" IN ('like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'));
        EXCEPTION
            WHEN duplicate_object THEN
                -- Constraint already exists, do nothing
                NULL;
        END;
        
        -- Update existing records to have 'like' as default
        UPDATE "public"."engagement_likes" 
        SET "reaction_type" = 'like' 
        WHERE "reaction_type" IS NULL;
        
        -- Create index for reaction type
        CREATE INDEX IF NOT EXISTS "idx_engagement_likes_reaction_type"
        ON "public"."engagement_likes" ("reaction_type");
        
        -- Update unique constraint to allow multiple reaction types per user-entity
        -- First drop the existing unique constraint (this will also drop the associated index)
        ALTER TABLE "public"."engagement_likes" DROP CONSTRAINT IF EXISTS "engagement_likes_user_entity_unique";
        -- Then create the new unique index
        CREATE UNIQUE INDEX "engagement_likes_user_entity_reaction_unique"
        ON "public"."engagement_likes" ("user_id", "entity_type", "entity_id", "reaction_type");
        
        COMMENT ON COLUMN "public"."engagement_likes"."reaction_type" IS 'Type of reaction: like, love, care, haha, wow, sad, angry';
    END IF;
END $$;

-- ============================================================================
-- CREATE TRIGGERS FOR AUTOMATIC COUNT UPDATES
-- ============================================================================

-- Function to update activity engagement counts
CREATE OR REPLACE FUNCTION "public"."update_activity_engagement_counts"()
RETURNS TRIGGER AS $$
BEGIN
    -- Update like_count
    IF TG_TABLE_NAME = 'engagement_likes' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE "public"."activities" 
            SET "like_count" = COALESCE("like_count", 0) + 1,
                "updated_at" = NOW()
            WHERE "id" = NEW.entity_id AND NEW.entity_type = 'activity';
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE "public"."activities" 
            SET "like_count" = GREATEST(COALESCE("like_count", 0) - 1, 0),
                "updated_at" = NOW()
            WHERE "id" = OLD.entity_id AND OLD.entity_type = 'activity';
        END IF;
    END IF;
    
    -- Update comment_count
    IF TG_TABLE_NAME = 'engagement_comments' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE "public"."activities" 
            SET "comment_count" = COALESCE("comment_count", 0) + 1,
                "updated_at" = NOW()
            WHERE "id" = NEW.entity_id AND NEW.entity_type = 'activity';
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE "public"."activities" 
            SET "comment_count" = GREATEST(COALESCE("comment_count", 0) - 1, 0),
                "updated_at" = NOW()
            WHERE "id" = OLD.entity_id AND OLD.entity_type = 'activity';
        END IF;
    END IF;
    
    -- Update share_count
    IF TG_TABLE_NAME = 'engagement_shares' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE "public"."activities" 
            SET "share_count" = COALESCE("share_count", 0) + 1,
                "updated_at" = NOW()
            WHERE "id" = NEW.entity_id AND NEW.entity_type = 'activity';
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE "public"."activities" 
            SET "share_count" = GREATEST(COALESCE("share_count", 0) - 1, 0),
                "updated_at" = NOW()
            WHERE "id" = OLD.entity_id AND OLD.entity_type = 'activity';
        END IF;
    END IF;
    
    -- Update bookmark_count
    IF TG_TABLE_NAME = 'engagement_bookmarks' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE "public"."activities" 
            SET "bookmark_count" = COALESCE("bookmark_count", 0) + 1,
                "updated_at" = NOW()
            WHERE "id" = NEW.entity_id AND NEW.entity_type = 'activity';
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE "public"."activities" 
            SET "bookmark_count" = GREATEST(COALESCE("bookmark_count", 0) - 1, 0),
                "updated_at" = NOW()
            WHERE "id" = OLD.entity_id AND OLD.entity_type = 'activity';
        END IF;
    END IF;
    
    -- Update view_count (only on insert for views)
    IF TG_TABLE_NAME = 'engagement_views' AND TG_OP = 'INSERT' THEN
        UPDATE "public"."activities" 
        SET "view_count" = COALESCE("view_count", 0) + 1,
            "updated_at" = NOW()
        WHERE "id" = NEW.entity_id AND NEW.entity_type = 'activity';
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for each engagement table
DROP TRIGGER IF EXISTS "trigger_update_activity_engagement_counts_likes" ON "public"."engagement_likes";
CREATE TRIGGER "trigger_update_activity_engagement_counts_likes"
    AFTER INSERT OR DELETE ON "public"."engagement_likes"
    FOR EACH ROW EXECUTE FUNCTION "public"."update_activity_engagement_counts"();

DROP TRIGGER IF EXISTS "trigger_update_activity_engagement_counts_comments" ON "public"."engagement_comments";
CREATE TRIGGER "trigger_update_activity_engagement_counts_comments"
    AFTER INSERT OR DELETE ON "public"."engagement_comments"
    FOR EACH ROW EXECUTE FUNCTION "public"."update_activity_engagement_counts"();

DROP TRIGGER IF EXISTS "trigger_update_activity_engagement_counts_shares" ON "public"."engagement_shares";
CREATE TRIGGER "trigger_update_activity_engagement_counts_shares"
    AFTER INSERT OR DELETE ON "public"."engagement_shares"
    FOR EACH ROW EXECUTE FUNCTION "public"."update_activity_engagement_counts"();

DROP TRIGGER IF EXISTS "trigger_update_activity_engagement_counts_bookmarks" ON "public"."engagement_bookmarks";
CREATE TRIGGER "trigger_update_activity_engagement_counts_bookmarks"
    AFTER INSERT OR DELETE ON "public"."engagement_bookmarks"
    FOR EACH ROW EXECUTE FUNCTION "public"."update_activity_engagement_counts"();

DROP TRIGGER IF EXISTS "trigger_update_activity_engagement_counts_views" ON "public"."engagement_views";
CREATE TRIGGER "trigger_update_activity_engagement_counts_views"
    AFTER INSERT ON "public"."engagement_views"
    FOR EACH ROW EXECUTE FUNCTION "public"."update_activity_engagement_counts"();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if all tables exist
SELECT 
    expected_tables.table_name,
    CASE 
        WHEN t.table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    VALUES 
        ('engagement_likes'),
        ('engagement_comments'),
        ('engagement_shares'),
        ('engagement_bookmarks'),
        ('engagement_views')
) AS expected_tables(table_name)
LEFT JOIN information_schema.tables t 
    ON t.table_name = expected_tables.table_name 
    AND t.table_schema = 'public';

-- Check if reaction_type column exists in engagement_likes
SELECT 
    column_name,
    CASE 
        WHEN column_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.columns 
WHERE table_name = 'engagement_likes' 
    AND column_name = 'reaction_type'
    AND table_schema = 'public';

-- Check if triggers exist
SELECT 
    expected_triggers.trigger_name,
    CASE 
        WHEN t.trigger_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    VALUES 
        ('trigger_update_activity_engagement_counts_likes'),
        ('trigger_update_activity_engagement_counts_comments'),
        ('trigger_update_activity_engagement_counts_shares'),
        ('trigger_update_activity_engagement_counts_bookmarks'),
        ('trigger_update_activity_engagement_counts_views')
) AS expected_triggers(trigger_name)
LEFT JOIN information_schema.triggers t 
    ON t.trigger_name = expected_triggers.trigger_name 
    AND t.table_schema = 'public';
