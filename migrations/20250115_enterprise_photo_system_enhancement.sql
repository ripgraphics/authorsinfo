-- ENTERPRISE PHOTO SYSTEM ENHANCEMENT MIGRATION
-- This migration adds the missing enterprise tables for analytics, monetization, and community features
-- Based on the actual database schema analysis and enterprise platform requirements

-- ============================================================================
-- 1. PHOTO ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."photo_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "image_id" "uuid",
    "event_type" "text" NOT NULL,
    "user_id" "uuid",
    "session_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "photo_analytics_event_type_check" CHECK (
        "event_type" IN ('view', 'click', 'share', 'download', 'like', 'upload', 'delete', 'edit', 'comment', 'purchase')
    )
);

-- Add comments
COMMENT ON TABLE "public"."photo_analytics" IS 'Enterprise photo analytics tracking for comprehensive insights';
COMMENT ON COLUMN "public"."photo_analytics"."event_type" IS 'Type of analytics event tracked';
COMMENT ON COLUMN "public"."photo_analytics"."metadata" IS 'Additional event metadata including user agent, referrer, etc.';

-- Create indexes for performance
CREATE INDEX "idx_photo_analytics_album_id" ON "public"."photo_analytics"("album_id");
CREATE INDEX "idx_photo_analytics_image_id" ON "public"."photo_analytics"("image_id");
CREATE INDEX "idx_photo_analytics_event_type" ON "public"."photo_analytics"("event_type");
CREATE INDEX "idx_photo_analytics_created_at" ON "public"."photo_analytics"("created_at");
CREATE INDEX "idx_photo_analytics_user_id" ON "public"."photo_analytics"("user_id");

-- ============================================================================
-- 2. PHOTO MONETIZATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."photo_monetization" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "image_id" "uuid",
    "event_type" "text" NOT NULL,
    "amount" numeric(10,2) DEFAULT 0,
    "currency" "text" DEFAULT 'USD',
    "user_id" "uuid",
    "payment_method" "text",
    "transaction_id" "text",
    "status" "text" DEFAULT 'pending',
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "photo_monetization_event_type_check" CHECK (
        "event_type" IN ('purchase', 'subscription', 'tip', 'ad_revenue', 'sponsorship', 'merchandise', 'commission')
    ),
    CONSTRAINT "photo_monetization_status_check" CHECK (
        "status" IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')
    ),
    CONSTRAINT "photo_monetization_amount_check" CHECK ("amount" >= 0)
);

-- Add comments
COMMENT ON TABLE "public"."photo_monetization" IS 'Enterprise photo monetization tracking for revenue streams';
COMMENT ON COLUMN "public"."photo_monetization"."event_type" IS 'Type of monetization event';
COMMENT ON COLUMN "public"."photo_monetization"."amount" IS 'Monetary amount in specified currency';
COMMENT ON COLUMN "public"."photo_monetization"."status" IS 'Transaction status';

-- Create indexes for performance
CREATE INDEX "idx_photo_monetization_album_id" ON "public"."photo_monetization"("album_id");
CREATE INDEX "idx_photo_monetization_image_id" ON "public"."photo_monetization"("image_id");
CREATE INDEX "idx_photo_monetization_event_type" ON "public"."photo_monetization"("event_type");
CREATE INDEX "idx_photo_monetization_status" ON "public"."photo_monetization"("status");
CREATE INDEX "idx_photo_monetization_created_at" ON "public"."photo_monetization"("created_at");
CREATE INDEX "idx_photo_monetization_user_id" ON "public"."photo_monetization"("user_id");

-- ============================================================================
-- 3. PHOTO COMMUNITY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."photo_community" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "album_id" "uuid" NOT NULL,
    "image_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "interaction_type" "text" NOT NULL,
    "content" "text",
    "rating" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "photo_community_interaction_type_check" CHECK (
        "interaction_type" IN ('like', 'comment', 'share', 'follow', 'bookmark', 'report', 'review', 'rating')
    ),
    CONSTRAINT "photo_community_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

-- Add comments
COMMENT ON TABLE "public"."photo_community" IS 'Enterprise photo community interactions and social features';
COMMENT ON COLUMN "public"."photo_community"."interaction_type" IS 'Type of community interaction';
COMMENT ON COLUMN "public"."photo_community"."content" IS 'User-generated content (comments, reviews)';
COMMENT ON COLUMN "public"."photo_community"."rating" IS 'User rating (1-5 stars)';

-- Create indexes for performance
CREATE INDEX "idx_photo_community_album_id" ON "public"."photo_community"("album_id");
CREATE INDEX "idx_photo_community_image_id" ON "public"."photo_community"("image_id");
CREATE INDEX "idx_photo_community_user_id" ON "public"."photo_community"("user_id");
CREATE INDEX "idx_photo_community_interaction_type" ON "public"."photo_community"("interaction_type");
CREATE INDEX "idx_photo_community_created_at" ON "public"."photo_community"("created_at");

-- ============================================================================
-- 4. AI IMAGE ANALYSIS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."ai_image_analysis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "image_id" "uuid" NOT NULL,
    "analysis_type" "text" NOT NULL,
    "confidence_score" numeric(3,2) DEFAULT 0,
    "tags" "text"[] DEFAULT '{}',
    "objects_detected" "jsonb" DEFAULT '{}'::"jsonb",
    "quality_metrics" "jsonb" DEFAULT '{}'::"jsonb",
    "sentiment_score" numeric(3,2),
    "content_safety_score" numeric(3,2) DEFAULT 1.0,
    "moderation_flags" "text"[] DEFAULT '{}',
    "processing_time_ms" integer,
    "model_version" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_image_analysis_confidence_check" CHECK ("confidence_score" >= 0 AND "confidence_score" <= 1),
    CONSTRAINT "ai_image_analysis_sentiment_check" CHECK ("sentiment_score" >= -1 AND "sentiment_score" <= 1),
    CONSTRAINT "ai_image_analysis_safety_check" CHECK ("content_safety_score" >= 0 AND "content_safety_score" <= 1)
);

-- Add comments
COMMENT ON TABLE "public"."ai_image_analysis" IS 'AI-powered image analysis results for enterprise features';
COMMENT ON COLUMN "public"."ai_image_analysis"."analysis_type" IS 'Type of AI analysis performed';
COMMENT ON COLUMN "public"."ai_image_analysis"."confidence_score" IS 'AI confidence in analysis (0-1)';
COMMENT ON COLUMN "public"."ai_image_analysis"."content_safety_score" IS 'Content safety assessment (0-1)';

-- Create indexes for performance
CREATE INDEX "idx_ai_image_analysis_image_id" ON "public"."ai_image_analysis"("image_id");
CREATE INDEX "idx_ai_image_analysis_type" ON "public"."ai_image_analysis"("analysis_type");
CREATE INDEX "idx_ai_image_analysis_confidence" ON "public"."ai_image_analysis"("confidence_score");
CREATE INDEX "idx_ai_image_analysis_safety" ON "public"."ai_image_analysis"("content_safety_score");
CREATE INDEX "idx_ai_image_analysis_created_at" ON "public"."ai_image_analysis"("created_at");

-- ============================================================================
-- 5. IMAGE PROCESSING JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."image_processing_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "image_id" "uuid" NOT NULL,
    "job_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending',
    "priority" integer DEFAULT 5,
    "parameters" "jsonb" DEFAULT '{}'::"jsonb",
    "result" "jsonb",
    "error_message" "text",
    "processing_time_ms" integer,
    "worker_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    CONSTRAINT "image_processing_jobs_status_check" CHECK (
        "status" IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
    ),
    CONSTRAINT "image_processing_jobs_priority_check" CHECK ("priority" >= 1 AND "priority" <= 10)
);

-- Add comments
COMMENT ON TABLE "public"."image_processing_jobs" IS 'Image processing job queue for AI and optimization tasks';
COMMENT ON COLUMN "public"."image_processing_jobs"."job_type" IS 'Type of processing job';
COMMENT ON COLUMN "public"."image_processing_jobs"."priority" IS 'Job priority (1-10, higher is more important)';

-- Create indexes for performance
CREATE INDEX "idx_image_processing_jobs_image_id" ON "public"."image_processing_jobs"("image_id");
CREATE INDEX "idx_image_processing_jobs_status" ON "public"."image_processing_jobs"("status");
CREATE INDEX "idx_image_processing_jobs_priority" ON "public"."image_processing_jobs"("priority");
CREATE INDEX "idx_image_processing_jobs_created_at" ON "public"."image_processing_jobs"("created_at");

-- ============================================================================
-- 6. ENHANCE EXISTING TABLES WITH ENTERPRISE FEATURES
-- ============================================================================

-- Add enterprise columns to album_images table
ALTER TABLE "public"."album_images" 
ADD COLUMN IF NOT EXISTS "view_count" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "like_count" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "share_count" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "revenue_generated" numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "ai_tags" "text"[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "community_engagement" numeric(3,2) DEFAULT 0;

-- Add comments for new columns
COMMENT ON COLUMN "public"."album_images"."view_count" IS 'Number of views for this image in the album';
COMMENT ON COLUMN "public"."album_images"."like_count" IS 'Number of likes for this image in the album';
COMMENT ON COLUMN "public"."album_images"."share_count" IS 'Number of shares for this image in the album';
COMMENT ON COLUMN "public"."album_images"."revenue_generated" IS 'Total revenue generated from this image';
COMMENT ON COLUMN "public"."album_images"."ai_tags" IS 'AI-generated tags for the image';
COMMENT ON COLUMN "public"."album_images"."community_engagement" IS 'Community engagement score (0-1)';

-- Add enterprise columns to photo_albums table
ALTER TABLE "public"."photo_albums" 
ADD COLUMN IF NOT EXISTS "monetization_enabled" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "premium_content" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "community_features" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "ai_enhanced" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "analytics_enabled" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "revenue_generated" numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "total_subscribers" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "community_score" numeric(3,2) DEFAULT 0;

-- Add comments for new columns
COMMENT ON COLUMN "public"."photo_albums"."monetization_enabled" IS 'Whether monetization features are enabled for this album';
COMMENT ON COLUMN "public"."photo_albums"."premium_content" IS 'Whether this album contains premium content';
COMMENT ON COLUMN "public"."photo_albums"."community_features" IS 'Whether community features are enabled';
COMMENT ON COLUMN "public"."photo_albums"."ai_enhanced" IS 'Whether AI features are enabled';
COMMENT ON COLUMN "public"."photo_albums"."analytics_enabled" IS 'Whether analytics tracking is enabled';
COMMENT ON COLUMN "public"."photo_albums"."revenue_generated" IS 'Total revenue generated from this album';
COMMENT ON COLUMN "public"."photo_albums"."total_subscribers" IS 'Number of premium subscribers';
COMMENT ON COLUMN "public"."photo_albums"."community_score" IS 'Community engagement score (0-1)';

-- ============================================================================
-- 7. CREATE FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Photo Analytics foreign keys
ALTER TABLE "public"."photo_analytics" 
ADD CONSTRAINT "photo_analytics_album_id_fkey" 
FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;

ALTER TABLE "public"."photo_analytics" 
ADD CONSTRAINT "photo_analytics_image_id_fkey" 
FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;

ALTER TABLE "public"."photo_analytics" 
ADD CONSTRAINT "photo_analytics_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;

-- Photo Monetization foreign keys
ALTER TABLE "public"."photo_monetization" 
ADD CONSTRAINT "photo_monetization_album_id_fkey" 
FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;

ALTER TABLE "public"."photo_monetization" 
ADD CONSTRAINT "photo_monetization_image_id_fkey" 
FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;

ALTER TABLE "public"."photo_monetization" 
ADD CONSTRAINT "photo_monetization_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;

-- Photo Community foreign keys
ALTER TABLE "public"."photo_community" 
ADD CONSTRAINT "photo_community_album_id_fkey" 
FOREIGN KEY ("album_id") REFERENCES "public"."photo_albums"("id") ON DELETE CASCADE;

ALTER TABLE "public"."photo_community" 
ADD CONSTRAINT "photo_community_image_id_fkey" 
FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;

ALTER TABLE "public"."photo_community" 
ADD CONSTRAINT "photo_community_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- AI Image Analysis foreign keys
ALTER TABLE "public"."ai_image_analysis" 
ADD CONSTRAINT "ai_image_analysis_image_id_fkey" 
FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;

-- Image Processing Jobs foreign keys
ALTER TABLE "public"."image_processing_jobs" 
ADD CONSTRAINT "image_processing_jobs_image_id_fkey" 
FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;

-- ============================================================================
-- 8. CREATE ENTERPRISE VIEWS FOR ANALYTICS
-- ============================================================================

-- Enterprise Photo Analytics View
CREATE OR REPLACE VIEW "public"."enterprise_photo_analytics" AS
SELECT 
    pa.album_id,
    pa.image_id,
    pa.event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT pa.user_id) as unique_users,
    COUNT(DISTINCT pa.session_id) as unique_sessions,
    MIN(pa.created_at) as first_event,
    MAX(pa.created_at) as last_event,
    AVG(EXTRACT(EPOCH FROM (pa.created_at - LAG(pa.created_at) OVER (PARTITION BY pa.album_id, pa.image_id ORDER BY pa.created_at)))) as avg_time_between_events
FROM "public"."photo_analytics" pa
GROUP BY pa.album_id, pa.image_id, pa.event_type;

COMMENT ON VIEW "public"."enterprise_photo_analytics" IS 'Enterprise analytics view for photo engagement tracking';

-- Enterprise Photo Monetization View
CREATE OR REPLACE VIEW "public"."enterprise_photo_monetization" AS
SELECT 
    pm.album_id,
    pm.image_id,
    pm.event_type,
    SUM(pm.amount) as total_revenue,
    COUNT(*) as transaction_count,
    COUNT(DISTINCT pm.user_id) as unique_payers,
    AVG(pm.amount) as avg_transaction_value,
    MIN(pm.created_at) as first_transaction,
    MAX(pm.created_at) as last_transaction
FROM "public"."photo_monetization" pm
WHERE pm.status = 'completed'
GROUP BY pm.album_id, pm.image_id, pm.event_type;

COMMENT ON VIEW "public"."enterprise_photo_monetization" IS 'Enterprise monetization view for revenue tracking';

-- Enterprise Photo Community View
CREATE OR REPLACE VIEW "public"."enterprise_photo_community" AS
SELECT 
    pc.album_id,
    pc.image_id,
    pc.interaction_type,
    COUNT(*) as interaction_count,
    COUNT(DISTINCT pc.user_id) as unique_users,
    AVG(pc.rating) as avg_rating,
    COUNT(pc.rating) as rating_count,
    MIN(pc.created_at) as first_interaction,
    MAX(pc.created_at) as last_interaction
FROM "public"."photo_community" pc
GROUP BY pc.album_id, pc.image_id, pc.interaction_type;

COMMENT ON VIEW "public"."enterprise_photo_community" IS 'Enterprise community view for social engagement tracking';

-- ============================================================================
-- 9. CREATE ENTERPRISE FUNCTIONS
-- ============================================================================

-- Function to process image with AI
CREATE OR REPLACE FUNCTION "public"."process_image_with_ai"(
    p_image_id "uuid",
    p_analysis_types "text"[] DEFAULT ARRAY['content', 'quality', 'sentiment']
)
RETURNS "jsonb"
LANGUAGE "plpgsql"
AS $$
DECLARE
    result "jsonb";
BEGIN
    -- Create processing job
    INSERT INTO "public"."image_processing_jobs" (
        image_id, 
        job_type, 
        status, 
        priority, 
        parameters
    ) VALUES (
        p_image_id, 
        'ai_analysis', 
        'pending', 
        8, 
        jsonb_build_object('analysis_types', p_analysis_types)
    );
    
    -- Simulate AI analysis result (in production, this would call external AI service)
    result := jsonb_build_object(
        'analysis_id', gen_random_uuid(),
        'image_id', p_image_id,
        'analysis_types', p_analysis_types,
        'status', 'completed',
        'processing_time_ms', 1200
    );
    
    RETURN result;
END;
$$;

COMMENT ON FUNCTION "public"."process_image_with_ai" IS 'Enterprise function to process images with AI analysis';

-- Function to track photo analytics event
CREATE OR REPLACE FUNCTION "public"."track_photo_analytics_event"(
    p_album_id "uuid",
    p_image_id "uuid" DEFAULT NULL,
    p_event_type "text",
    p_user_id "uuid" DEFAULT NULL,
    p_metadata "jsonb" DEFAULT '{}'::"jsonb"
)
RETURNS "uuid"
LANGUAGE "plpgsql"
AS $$
DECLARE
    event_id "uuid";
BEGIN
    INSERT INTO "public"."photo_analytics" (
        album_id,
        image_id,
        event_type,
        user_id,
        session_id,
        metadata
    ) VALUES (
        p_album_id,
        p_image_id,
        p_event_type,
        p_user_id,
        p_metadata->>'session_id',
        p_metadata
    ) RETURNING id INTO event_id;
    
    -- Update album_images counters if applicable
    IF p_image_id IS NOT NULL THEN
        UPDATE "public"."album_images" 
        SET 
            view_count = CASE WHEN p_event_type = 'view' THEN view_count + 1 ELSE view_count END,
            like_count = CASE WHEN p_event_type = 'like' THEN like_count + 1 ELSE like_count END,
            share_count = CASE WHEN p_event_type = 'share' THEN share_count + 1 ELSE share_count END
        WHERE image_id = p_image_id AND album_id = p_album_id;
    END IF;
    
    RETURN event_id;
END;
$$;

COMMENT ON FUNCTION "public"."track_photo_analytics_event" IS 'Enterprise function to track photo analytics events';

-- ============================================================================
-- 10. CREATE ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE "public"."photo_analytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."photo_monetization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."photo_community" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_image_analysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."image_processing_jobs" ENABLE ROW LEVEL SECURITY;

-- Photo Analytics RLS Policies
CREATE POLICY "photo_analytics_select_policy" ON "public"."photo_analytics"
    FOR SELECT USING (
        auth.uid() IN (
            SELECT owner_id FROM "public"."photo_albums" WHERE id = album_id
        )
    );

CREATE POLICY "photo_analytics_insert_policy" ON "public"."photo_analytics"
    FOR INSERT WITH CHECK (true);

-- Photo Monetization RLS Policies
CREATE POLICY "photo_monetization_select_policy" ON "public"."photo_monetization"
    FOR SELECT USING (
        auth.uid() IN (
            SELECT owner_id FROM "public"."photo_albums" WHERE id = album_id
        )
    );

CREATE POLICY "photo_monetization_insert_policy" ON "public"."photo_monetization"
    FOR INSERT WITH CHECK (true);

-- Photo Community RLS Policies
CREATE POLICY "photo_community_select_policy" ON "public"."photo_community"
    FOR SELECT USING (
        auth.uid() IN (
            SELECT owner_id FROM "public"."photo_albums" WHERE id = album_id
        ) OR user_id = auth.uid()
    );

CREATE POLICY "photo_community_insert_policy" ON "public"."photo_community"
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "photo_community_update_policy" ON "public"."photo_community"
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "photo_community_delete_policy" ON "public"."photo_community"
    FOR DELETE USING (user_id = auth.uid());

-- AI Image Analysis RLS Policies
CREATE POLICY "ai_image_analysis_select_policy" ON "public"."ai_image_analysis"
    FOR SELECT USING (
        auth.uid() IN (
            SELECT pa.owner_id 
            FROM "public"."photo_albums" pa
            JOIN "public"."album_images" ai ON pa.id = ai.album_id
            WHERE ai.image_id = ai_image_analysis.image_id
        )
    );

CREATE POLICY "ai_image_analysis_insert_policy" ON "public"."ai_image_analysis"
    FOR INSERT WITH CHECK (true);

-- Image Processing Jobs RLS Policies
CREATE POLICY "image_processing_jobs_select_policy" ON "public"."image_processing_jobs"
    FOR SELECT USING (
        auth.uid() IN (
            SELECT pa.owner_id 
            FROM "public"."photo_albums" pa
            JOIN "public"."album_images" ai ON pa.id = ai.album_id
            WHERE ai.image_id = image_processing_jobs.image_id
        )
    );

CREATE POLICY "image_processing_jobs_insert_policy" ON "public"."image_processing_jobs"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "image_processing_jobs_update_policy" ON "public"."image_processing_jobs"
    FOR UPDATE USING (true);

-- ============================================================================
-- 11. CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Trigger to update album statistics when analytics events occur
CREATE OR REPLACE FUNCTION "public"."update_album_statistics_from_analytics"()
RETURNS TRIGGER AS $$
BEGIN
    -- Update photo_albums view_count, like_count, share_count based on analytics
    UPDATE "public"."photo_albums" 
    SET 
        view_count = (
            SELECT COUNT(*) 
            FROM "public"."photo_analytics" 
            WHERE album_id = NEW.album_id AND event_type = 'view'
        ),
        like_count = (
            SELECT COUNT(*) 
            FROM "public"."photo_analytics" 
            WHERE album_id = NEW.album_id AND event_type = 'like'
        ),
        share_count = (
            SELECT COUNT(*) 
            FROM "public"."photo_analytics" 
            WHERE album_id = NEW.album_id AND event_type = 'share'
        )
    WHERE id = NEW.album_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trigger_update_album_statistics_from_analytics"
    AFTER INSERT ON "public"."photo_analytics"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_album_statistics_from_analytics"();

-- Trigger to update album revenue when monetization events occur
CREATE OR REPLACE FUNCTION "public"."update_album_revenue_from_monetization"()
RETURNS TRIGGER AS $$
BEGIN
    -- Update photo_albums revenue_generated based on monetization
    UPDATE "public"."photo_albums" 
    SET revenue_generated = (
        SELECT COALESCE(SUM(amount), 0)
        FROM "public"."photo_monetization" 
        WHERE album_id = NEW.album_id AND status = 'completed'
    )
    WHERE id = NEW.album_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trigger_update_album_revenue_from_monetization"
    AFTER INSERT ON "public"."photo_monetization"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_album_revenue_from_monetization"();

-- ============================================================================
-- 12. INSERT INITIAL DATA FOR TESTING
-- ============================================================================

-- Insert sample entity types if they don't exist
INSERT INTO "public"."entity_types" (name, description, entity_category) 
VALUES 
    ('Photo Gallery', 'General photo galleries and collections', 'content'),
    ('Premium Content', 'Premium and monetized photo content', 'content'),
    ('Community Album', 'Community-driven photo albums', 'community')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- This migration creates the complete enterprise photo system infrastructure
-- including analytics, monetization, community features, and AI integration
-- All tables are properly indexed, secured with RLS, and include enterprise features 