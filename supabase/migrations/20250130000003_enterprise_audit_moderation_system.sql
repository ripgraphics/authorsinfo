-- =====================================================================================
-- ENTERPRISE AUDIT & MODERATION SYSTEM
-- Comprehensive logging and content moderation for social features
-- =====================================================================================

-- =====================================================================================
-- 1. AUDIT SYSTEM
-- =====================================================================================

-- Social Audit Log Table
CREATE TABLE IF NOT EXISTS "public"."social_audit_log" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "action_type" VARCHAR(50) NOT NULL, -- comment_added, comment_deleted, like_toggled, share_added, bookmark_toggled, content_flagged, content_moderated
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "target_id" UUID, -- ID of the specific item being acted upon (comment_id, like_id, etc.)
    "action_details" JSONB DEFAULT '{}',
    "ip_address" INET,
    "user_agent" TEXT,
    "session_id" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Indexes for performance
    CONSTRAINT "social_audit_action_type_check" CHECK (
        action_type IN ('comment_added', 'comment_deleted', 'comment_updated', 'like_toggled', 'share_added', 'bookmark_toggled', 'content_flagged', 'content_moderated', 'reaction_added', 'reaction_removed')
    )
);

-- =====================================================================================
-- 2. MODERATION SYSTEM
-- =====================================================================================

-- Content Flags Table
CREATE TABLE IF NOT EXISTS "public"."content_flags" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "flagged_by" UUID NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "content_type" VARCHAR(50) NOT NULL, -- comment, entity_tag, user_profile
    "content_id" UUID NOT NULL,
    "flag_reason" VARCHAR(100) NOT NULL, -- spam, inappropriate, harassment, copyright, other
    "flag_details" TEXT,
    "moderation_status" VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'reviewed', 'approved', 'rejected', 'action_taken')),
    "moderated_by" UUID REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "moderation_notes" TEXT,
    "moderated_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Ensure unique flags per user per content
    UNIQUE("flagged_by", "content_type", "content_id")
);

-- Moderation Queue Table
CREATE TABLE IF NOT EXISTS "public"."moderation_queue" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "content_type" VARCHAR(50) NOT NULL,
    "content_id" UUID NOT NULL,
    "priority" VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    "flag_count" INTEGER DEFAULT 1,
    "first_flagged_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "last_flagged_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "status" VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'dismissed')),
    "assigned_to" UUID REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "assigned_at" TIMESTAMP WITH TIME ZONE,
    "resolved_at" TIMESTAMP WITH TIME ZONE,
    "resolution_action" VARCHAR(50), -- delete_content, warn_user, suspend_user, ban_user, dismiss
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Ensure unique entries per content
    UNIQUE("content_type", "content_id")
);

-- =====================================================================================
-- 3. PERFORMANCE INDEXES
-- =====================================================================================

-- Audit log indexes
CREATE INDEX IF NOT EXISTS "idx_social_audit_user_action" ON "public"."social_audit_log"("user_id", "action_type");
CREATE INDEX IF NOT EXISTS "idx_social_audit_entity" ON "public"."social_audit_log"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_social_audit_created" ON "public"."social_audit_log"("created_at");
CREATE INDEX IF NOT EXISTS "idx_social_audit_action_type" ON "public"."social_audit_log"("action_type");

-- Content flags indexes
CREATE INDEX IF NOT EXISTS "idx_content_flags_content" ON "public"."content_flags"("content_type", "content_id");
CREATE INDEX IF NOT EXISTS "idx_content_flags_status" ON "public"."content_flags"("moderation_status");
CREATE INDEX IF NOT EXISTS "idx_content_flags_flagged_by" ON "public"."content_flags"("flagged_by");
CREATE INDEX IF NOT EXISTS "idx_content_flags_created" ON "public"."content_flags"("created_at");

-- Moderation queue indexes
CREATE INDEX IF NOT EXISTS "idx_moderation_queue_status" ON "public"."moderation_queue"("status");
CREATE INDEX IF NOT EXISTS "idx_moderation_queue_priority" ON "public"."moderation_queue"("priority");
CREATE INDEX IF NOT EXISTS "idx_moderation_queue_assigned" ON "public"."moderation_queue"("assigned_to");
CREATE INDEX IF NOT EXISTS "idx_moderation_queue_content" ON "public"."moderation_queue"("content_type", "content_id");

-- =====================================================================================
-- 4. ENTERPRISE HELPER FUNCTIONS
-- =====================================================================================

-- Log social action
CREATE OR REPLACE FUNCTION "public"."log_social_action"(
    p_user_id UUID,
    p_action_type VARCHAR(50),
    p_entity_type VARCHAR(50),
    p_entity_id UUID,
    p_target_id UUID DEFAULT NULL,
    p_action_details JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO "public"."social_audit_log" (
        user_id,
        action_type,
        entity_type,
        entity_id,
        target_id,
        action_details,
        ip_address,
        user_agent,
        session_id
    ) VALUES (
        p_user_id,
        p_action_type,
        p_entity_type,
        p_entity_id,
        p_target_id,
        p_action_details,
        p_ip_address,
        p_user_agent,
        p_session_id
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$;

-- Flag content
CREATE OR REPLACE FUNCTION "public"."flag_content"(
    p_flagged_by UUID,
    p_content_type VARCHAR(50),
    p_content_id UUID,
    p_flag_reason VARCHAR(100),
    p_flag_details TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_flag_id UUID;
    v_queue_id UUID;
BEGIN
    -- Insert flag
    INSERT INTO "public"."content_flags" (
        flagged_by,
        content_type,
        content_id,
        flag_reason,
        flag_details
    ) VALUES (
        p_flagged_by,
        p_content_type,
        p_content_id,
        p_flag_reason,
        p_flag_details
    ) RETURNING id INTO v_flag_id;
    
    -- Update or create moderation queue entry
    INSERT INTO "public"."moderation_queue" (
        content_type,
        content_id,
        flag_count,
        last_flagged_at
    ) VALUES (
        p_content_type,
        p_content_id,
        1,
        now()
    )
    ON CONFLICT (content_type, content_id) DO UPDATE SET
        flag_count = moderation_queue.flag_count + 1,
        last_flagged_at = now(),
        updated_at = now();
    
    RETURN v_flag_id;
END;
$$;

-- Get moderation statistics
CREATE OR REPLACE FUNCTION "public"."get_moderation_stats"(
    p_days_back INTEGER DEFAULT 30
) RETURNS TABLE(
    total_flags BIGINT,
    pending_flags BIGINT,
    resolved_flags BIGINT,
    avg_resolution_time_hours NUMERIC,
    top_flag_reasons JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_flags,
        COUNT(CASE WHEN moderation_status = 'pending' THEN 1 END)::BIGINT as pending_flags,
        COUNT(CASE WHEN moderation_status IN ('approved', 'rejected', 'action_taken') THEN 1 END)::BIGINT as resolved_flags,
        AVG(EXTRACT(EPOCH FROM (moderated_at - created_at)) / 3600)::NUMERIC as avg_resolution_time_hours,
        jsonb_object_agg(flag_reason, flag_count) as top_flag_reasons
    FROM (
        SELECT 
            flag_reason,
            COUNT(*) as flag_count
        FROM "public"."content_flags"
        WHERE created_at >= now() - INTERVAL '1 day' * p_days_back
        GROUP BY flag_reason
        ORDER BY flag_count DESC
        LIMIT 5
    ) reasons
    CROSS JOIN (
        SELECT 
            COUNT(*) as total_count,
            COUNT(CASE WHEN moderation_status = 'pending' THEN 1 END) as pending_count,
            COUNT(CASE WHEN moderation_status IN ('approved', 'rejected', 'action_taken') THEN 1 END) as resolved_count,
            AVG(EXTRACT(EPOCH FROM (moderated_at - created_at)) / 3600) as avg_time
        FROM "public"."content_flags"
        WHERE created_at >= now() - INTERVAL '1 day' * p_days_back
    ) stats;
END;
$$;

-- =====================================================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =====================================================================================

-- Enable RLS on audit and moderation tables
ALTER TABLE "public"."social_audit_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."content_flags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."moderation_queue" ENABLE ROW LEVEL SECURITY;

-- Audit log policies (read-only for admins, insert for all authenticated users)
CREATE POLICY "social_audit_select_policy" ON "public"."social_audit_log"
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "social_audit_insert_policy" ON "public"."social_audit_log"
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Content flags policies
CREATE POLICY "content_flags_select_policy" ON "public"."content_flags"
    FOR SELECT USING (
        auth.uid() = flagged_by
    );

CREATE POLICY "content_flags_insert_policy" ON "public"."content_flags"
    FOR INSERT WITH CHECK (auth.uid() = flagged_by);

CREATE POLICY "content_flags_update_policy" ON "public"."content_flags"
    FOR UPDATE USING (auth.uid() = flagged_by);

-- Moderation queue policies (admin only - simplified for now)
CREATE POLICY "moderation_queue_select_policy" ON "public"."moderation_queue"
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "moderation_queue_insert_policy" ON "public"."moderation_queue"
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "moderation_queue_update_policy" ON "public"."moderation_queue"
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- =====================================================================================
-- 6. TRIGGERS FOR AUTOMATIC AUDITING
-- =====================================================================================

-- Trigger function for automatic audit logging
CREATE OR REPLACE FUNCTION "public"."trigger_social_audit_log"()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the action based on the operation
    IF TG_OP = 'INSERT' THEN
        PERFORM "public"."log_social_action"(
            NEW.user_id,
            CASE 
                WHEN TG_TABLE_NAME = 'comments' THEN 'comment_added'
                WHEN TG_TABLE_NAME = 'likes' THEN 'like_toggled'
                WHEN TG_TABLE_NAME = 'shares' THEN 'share_added'
                WHEN TG_TABLE_NAME = 'bookmarks' THEN 'bookmark_toggled'
                WHEN TG_TABLE_NAME = 'comment_reactions' THEN 'reaction_added'
                ELSE 'unknown_action'
            END,
            NEW.entity_type,
            NEW.entity_id,
            NEW.id,
            jsonb_build_object('content', CASE WHEN TG_TABLE_NAME = 'comments' THEN NEW.content ELSE NULL END)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM "public"."log_social_action"(
            OLD.user_id,
            CASE 
                WHEN TG_TABLE_NAME = 'comments' THEN 'comment_deleted'
                WHEN TG_TABLE_NAME = 'likes' THEN 'like_toggled'
                WHEN TG_TABLE_NAME = 'shares' THEN 'share_removed'
                WHEN TG_TABLE_NAME = 'bookmarks' THEN 'bookmark_toggled'
                WHEN TG_TABLE_NAME = 'comment_reactions' THEN 'reaction_removed'
                ELSE 'unknown_action'
            END,
            OLD.entity_type,
            OLD.entity_id,
            OLD.id
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM "public"."log_social_action"(
            NEW.user_id,
            CASE 
                WHEN TG_TABLE_NAME = 'comments' THEN 'comment_updated'
                ELSE 'unknown_action'
            END,
            NEW.entity_type,
            NEW.entity_id,
            NEW.id,
            jsonb_build_object('old_content', OLD.content, 'new_content', NEW.content)
        );
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to social tables
CREATE TRIGGER "trigger_comments_audit"
    AFTER INSERT OR UPDATE OR DELETE ON "public"."comments"
    FOR EACH ROW EXECUTE FUNCTION "public"."trigger_social_audit_log"();

CREATE TRIGGER "trigger_likes_audit"
    AFTER INSERT OR DELETE ON "public"."likes"
    FOR EACH ROW EXECUTE FUNCTION "public"."trigger_social_audit_log"();

CREATE TRIGGER "trigger_shares_audit"
    AFTER INSERT OR DELETE ON "public"."shares"
    FOR EACH ROW EXECUTE FUNCTION "public"."trigger_social_audit_log"();

CREATE TRIGGER "trigger_bookmarks_audit"
    AFTER INSERT OR DELETE ON "public"."bookmarks"
    FOR EACH ROW EXECUTE FUNCTION "public"."trigger_social_audit_log"();

CREATE TRIGGER "trigger_comment_reactions_audit"
    AFTER INSERT OR DELETE ON "public"."comment_reactions"
    FOR EACH ROW EXECUTE FUNCTION "public"."trigger_social_audit_log"();

-- =====================================================================================
-- 7. ANALYTICS VIEWS
-- =====================================================================================

-- Social activity analytics view
CREATE OR REPLACE VIEW "public"."social_activity_analytics" AS
SELECT 
    DATE(created_at) as activity_date,
    action_type,
    entity_type,
    COUNT(*) as action_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT entity_id) as unique_entities
FROM "public"."social_audit_log"
WHERE created_at >= now() - INTERVAL '30 days'
GROUP BY DATE(created_at), action_type, entity_type
ORDER BY activity_date DESC, action_count DESC;

-- Moderation analytics view
CREATE OR REPLACE VIEW "public"."moderation_analytics" AS
SELECT 
    DATE(cf.created_at) as flag_date,
    cf.flag_reason,
    cf.content_type,
    mq.priority,
    mq.status,
    COUNT(*) as flag_count,
    AVG(EXTRACT(EPOCH FROM (mq.resolved_at - cf.created_at)) / 3600) as avg_resolution_time_hours
FROM "public"."content_flags" cf
LEFT JOIN "public"."moderation_queue" mq ON cf.content_type = mq.content_type AND cf.content_id = mq.content_id
WHERE cf.created_at >= now() - INTERVAL '30 days'
GROUP BY DATE(cf.created_at), cf.flag_reason, cf.content_type, mq.priority, mq.status
ORDER BY flag_date DESC, flag_count DESC;

-- =====================================================================================
-- 8. MIGRATION COMPLETION
-- =====================================================================================

COMMENT ON TABLE "public"."social_audit_log" IS 'Enterprise audit trail for all social actions';
COMMENT ON TABLE "public"."content_flags" IS 'Content moderation flags system';
COMMENT ON TABLE "public"."moderation_queue" IS 'Moderation queue for flagged content';

COMMENT ON FUNCTION "public"."log_social_action" IS 'Log social actions for audit trail';
COMMENT ON FUNCTION "public"."flag_content" IS 'Flag content for moderation';
COMMENT ON FUNCTION "public"."get_moderation_stats" IS 'Get moderation statistics and analytics'; 