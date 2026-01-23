-- Create link_analytics table for tracking link engagement
-- Created: 2026-01-23
-- Phase 1: Enterprise Link Post Component

DO $$
BEGIN
    -- Create link_analytics table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'link_analytics') THEN
        CREATE TABLE public.link_analytics (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            link_preview_id UUID REFERENCES public.link_previews(id) ON DELETE CASCADE,
            post_id UUID, -- References posts table (no FK to avoid circular dependencies)
            user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
            event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'share', 'bookmark')),
            clicked_at TIMESTAMPTZ DEFAULT NOW(),
            user_agent TEXT,
            referrer TEXT,
            ip_address INET,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create indexes for performance
        CREATE INDEX idx_link_analytics_link_preview_id ON public.link_analytics(link_preview_id);
        CREATE INDEX idx_link_analytics_post_id ON public.link_analytics(post_id) WHERE post_id IS NOT NULL;
        CREATE INDEX idx_link_analytics_user_id ON public.link_analytics(user_id) WHERE user_id IS NOT NULL;
        CREATE INDEX idx_link_analytics_clicked_at ON public.link_analytics(clicked_at DESC);
        CREATE INDEX idx_link_analytics_event_type ON public.link_analytics(event_type);
        CREATE INDEX idx_link_analytics_composite ON public.link_analytics(link_preview_id, event_type, clicked_at DESC);

        -- Add comment
        COMMENT ON TABLE public.link_analytics IS 'Tracks user engagement with link previews (views, clicks, shares, bookmarks)';
        COMMENT ON COLUMN public.link_analytics.post_id IS 'Reference to posts table (flexible reference to avoid FK constraints)';
    END IF;
END $$;
