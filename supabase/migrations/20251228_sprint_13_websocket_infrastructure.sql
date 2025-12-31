-- Sprint 13: WebSocket Real-Time Infrastructure
-- Creates database tables and infrastructure for real-time features
-- Source of Truth: Supabase PostgreSQL
-- Date: Dec 28, 2025

-- ============================================================
-- TABLE: user_presence
-- Purpose: Track real-time user presence, status, and activity
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
    is_typing BOOLEAN DEFAULT FALSE,
    typing_location TEXT, -- e.g., 'book-1-comments', 'group-5-chat'
    device_type TEXT DEFAULT 'web' CHECK (device_type IN ('web', 'mobile', 'tablet', 'desktop')),
    ip_address INET,
    user_agent TEXT,
    last_activity_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT user_presence_single_per_user UNIQUE(user_id)
);

-- Create indexes for presence queries (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_presence_status') THEN
        CREATE INDEX idx_user_presence_status ON public.user_presence(status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_presence_user_id') THEN
        CREATE INDEX idx_user_presence_user_id ON public.user_presence(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_presence_last_seen') THEN
        CREATE INDEX idx_user_presence_last_seen ON public.user_presence(last_seen_at DESC);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_presence_is_typing') THEN
        CREATE INDEX idx_user_presence_is_typing ON public.user_presence(is_typing);
    END IF;
END $$;

-- ============================================================
-- TABLE: activity_stream
-- Purpose: Log all user activities for real-time feeds
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_stream (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'book_read', 'book_reviewed', 'challenge_created', 'challenge_progress',
        'reading_session_logged', 'post_created', 'comment_added', 'user_followed',
        'book_added_to_shelf', 'achievement_unlocked', 'group_joined', 'event_rsvp',
        'qa_question_asked', 'qa_answer_provided', 'recommendation_liked'
    )),
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'book', 'challenge', 'reading_session', 'post', 'comment',
        'user', 'shelf', 'achievement', 'group', 'event', 'qa_session'
    )),
    entity_id UUID NOT NULL,
    related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB, -- Additional context: {book_title, author_name, page_count, etc.}
    is_public BOOLEAN DEFAULT TRUE,
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for activity stream queries (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_stream_user_id') THEN
        CREATE INDEX idx_activity_stream_user_id ON public.activity_stream(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_stream_created_at') THEN
        CREATE INDEX idx_activity_stream_created_at ON public.activity_stream(created_at DESC);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_stream_activity_type') THEN
        CREATE INDEX idx_activity_stream_activity_type ON public.activity_stream(activity_type);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_stream_entity') THEN
        CREATE INDEX idx_activity_stream_entity ON public.activity_stream(entity_type, entity_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_stream_visibility') THEN
        CREATE INDEX idx_activity_stream_visibility ON public.activity_stream(is_public, created_at DESC);
    END IF;
END $$;

-- ============================================================
-- TABLE: collaboration_sessions
-- Purpose: Real-time collaborative editing sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_name TEXT NOT NULL UNIQUE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('book', 'group', 'event', 'discussion')),
    entity_id UUID NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    max_participants INT DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ,
    metadata JSONB, -- {document_state, locks, change_history}
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for session queries (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_collaboration_sessions_room') THEN
        CREATE INDEX idx_collaboration_sessions_room ON public.collaboration_sessions(room_name);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_collaboration_sessions_entity') THEN
        CREATE INDEX idx_collaboration_sessions_entity ON public.collaboration_sessions(entity_type, entity_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_collaboration_sessions_active') THEN
        CREATE INDEX idx_collaboration_sessions_active ON public.collaboration_sessions(is_active);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_collaboration_sessions_creator') THEN
        CREATE INDEX idx_collaboration_sessions_creator ON public.collaboration_sessions(created_by);
    END IF;
END $$;

-- ============================================================
-- TABLE: session_participants
-- Purpose: Track active participants in collaboration sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    socket_id TEXT NOT NULL, -- Socket.io connection ID
    cursor_position JSONB, -- {line, column} for text editors
    selection_range JSONB, -- {start, end} for highlighting
    is_active BOOLEAN DEFAULT TRUE,
    device_info JSONB, -- {browser, os, resolution}
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT session_participants_unique UNIQUE(session_id, user_id, socket_id)
);

-- Create indexes for participant queries (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_session_participants_session') THEN
        CREATE INDEX idx_session_participants_session ON public.session_participants(session_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_session_participants_user') THEN
        CREATE INDEX idx_session_participants_user ON public.session_participants(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_session_participants_socket') THEN
        CREATE INDEX idx_session_participants_socket ON public.session_participants(socket_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_session_participants_active') THEN
        CREATE INDEX idx_session_participants_active ON public.session_participants(is_active);
    END IF;
END $$;

-- ============================================================
-- MATERIALIZED VIEW: mv_user_presence_summary
-- Purpose: Pre-calculated presence metrics for admin dashboards
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_user_presence_summary AS
SELECT
    (SELECT COUNT(*) FROM public.user_presence WHERE status = 'online') as online_users,
    (SELECT COUNT(*) FROM public.user_presence WHERE status = 'away') as away_users,
    (SELECT COUNT(*) FROM public.user_presence WHERE status = 'offline') as offline_users,
    (SELECT COUNT(*) FROM public.user_presence WHERE is_typing = TRUE) as typing_users,
    (SELECT COUNT(DISTINCT user_id) FROM public.activity_stream WHERE created_at > NOW() - INTERVAL '1 hour') as active_users_last_hour,
    NOW() as last_calculated;

-- ============================================================
-- MATERIALIZED VIEW: mv_activity_trends
-- Purpose: Pre-calculated activity metrics for trending features
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_activity_trends AS
SELECT
    activity_type,
    COUNT(*) as activity_count,
    COUNT(DISTINCT user_id) as unique_users,
    DATE_TRUNC('hour', created_at) as hour_bucket,
    MAX(created_at) as latest_activity
FROM public.activity_stream
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY activity_type, DATE_TRUNC('hour', created_at)
ORDER BY hour_bucket DESC, activity_count DESC;

-- ============================================================
-- AUTO-UPDATE TRIGGERS
-- ============================================================

-- Trigger: Update user_presence.updated_at on modification
CREATE OR REPLACE FUNCTION public.update_user_presence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_presence_updated ON public.user_presence;
CREATE TRIGGER trigger_user_presence_updated
BEFORE UPDATE ON public.user_presence
FOR EACH ROW
EXECUTE FUNCTION public.update_user_presence_timestamp();

-- Trigger: Update activity_stream.updated_at on modification
CREATE OR REPLACE FUNCTION public.update_activity_stream_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_activity_stream_updated ON public.activity_stream;
CREATE TRIGGER trigger_activity_stream_updated
BEFORE UPDATE ON public.activity_stream
FOR EACH ROW
EXECUTE FUNCTION public.update_activity_stream_timestamp();

-- Trigger: Update collaboration_sessions.updated_at on modification
CREATE OR REPLACE FUNCTION public.update_collaboration_sessions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_collaboration_sessions_updated ON public.collaboration_sessions;
CREATE TRIGGER trigger_collaboration_sessions_updated
BEFORE UPDATE ON public.collaboration_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_collaboration_sessions_timestamp();

-- ============================================================
-- HELPER FUNCTIONS FOR ADMIN CHECK (Must be first for RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_presence_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT COALESCE(role = 'admin' OR role = 'moderator', FALSE)
        FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function: Get online users (excluding specified user)
CREATE OR REPLACE FUNCTION public.get_online_users(exclude_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    user_id UUID,
    status TEXT,
    device_type TEXT,
    last_seen_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        up.user_id,
        up.status,
        up.device_type,
        up.last_seen_at
    FROM public.user_presence up
    WHERE up.status = 'online'
        AND (exclude_user_id IS NULL OR up.user_id != exclude_user_id)
    ORDER BY up.last_seen_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get recent activities for user's feed
CREATE OR REPLACE FUNCTION public.get_feed_activities(
    p_user_id UUID,
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    activity_type TEXT,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.user_id,
        a.activity_type,
        a.entity_type,
        a.entity_id,
        a.metadata,
        a.created_at
    FROM public.activity_stream a
    WHERE a.is_public = TRUE
        OR a.user_id = p_user_id
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function: Check active participants in a session
CREATE OR REPLACE FUNCTION public.get_session_participants(p_session_id UUID)
RETURNS TABLE (
    user_id UUID,
    socket_id TEXT,
    cursor_position JSONB,
    selection_range JSONB,
    is_active BOOLEAN,
    joined_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sp.user_id,
        sp.socket_id,
        sp.cursor_position,
        sp.selection_range,
        sp.is_active,
        sp.joined_at
    FROM public.session_participants sp
    WHERE sp.session_id = p_session_id
        AND sp.is_active = TRUE
    ORDER BY sp.joined_at;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_stream ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

-- user_presence policies
DROP POLICY IF EXISTS "Users can view their own presence" ON public.user_presence;
CREATE POLICY "Users can view their own presence"
    ON public.user_presence
    FOR SELECT
    USING (auth.uid() = user_id OR is_presence_admin());

DROP POLICY IF EXISTS "Users can update their own presence" ON public.user_presence;
CREATE POLICY "Users can update their own presence"
    ON public.user_presence
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own presence" ON public.user_presence;
CREATE POLICY "Users can insert their own presence"
    ON public.user_presence
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all presence" ON public.user_presence;
CREATE POLICY "Admins can view all presence"
    ON public.user_presence
    FOR SELECT
    USING (is_presence_admin());

-- activity_stream policies
DROP POLICY IF EXISTS "Users can view public activities" ON public.activity_stream;
CREATE POLICY "Users can view public activities"
    ON public.activity_stream
    FOR SELECT
    USING (is_public = TRUE OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own activities" ON public.activity_stream;
CREATE POLICY "Users can create their own activities"
    ON public.activity_stream
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own activities" ON public.activity_stream;
CREATE POLICY "Users can update their own activities"
    ON public.activity_stream
    FOR UPDATE
    USING (auth.uid() = user_id);

-- collaboration_sessions policies
DROP POLICY IF EXISTS "Anyone can view active sessions" ON public.collaboration_sessions;
CREATE POLICY "Anyone can view active sessions"
    ON public.collaboration_sessions
    FOR SELECT
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Users can create sessions" ON public.collaboration_sessions;
CREATE POLICY "Users can create sessions"
    ON public.collaboration_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Session creators can update" ON public.collaboration_sessions;
CREATE POLICY "Session creators can update"
    ON public.collaboration_sessions
    FOR UPDATE
    USING (auth.uid() = created_by);

-- session_participants policies
DROP POLICY IF EXISTS "Users can view their own participation" ON public.session_participants;
CREATE POLICY "Users can view their own participation"
    ON public.session_participants
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own participation" ON public.session_participants;
CREATE POLICY "Users can insert their own participation"
    ON public.session_participants
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own participation" ON public.session_participants;
CREATE POLICY "Users can update their own participation"
    ON public.session_participants
    FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================
-- MIGRATION METADATA
-- ============================================================
-- Recorded in schema_migrations if table exists
-- Name: sprint_13_websocket_infrastructure
-- Version: 1
-- Created: 2025-12-28
