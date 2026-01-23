-- Create link_previews table for caching link metadata
-- Created: 2026-01-23
-- Phase 1: Enterprise Link Post Component

DO $$
BEGIN
    -- Create link_previews table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'link_previews') THEN
        CREATE TABLE public.link_previews (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            url TEXT UNIQUE NOT NULL,
            normalized_url TEXT NOT NULL,
            title TEXT,
            description TEXT,
            image_url TEXT,
            thumbnail_url TEXT,
            favicon_url TEXT,
            site_name TEXT,
            domain TEXT NOT NULL,
            link_type TEXT CHECK (link_type IN ('article', 'video', 'image', 'website', 'product', 'book', 'other')),
            author TEXT,
            published_at TIMESTAMPTZ,
            metadata JSONB DEFAULT '{}'::jsonb,
            extracted_at TIMESTAMPTZ DEFAULT NOW(),
            expires_at TIMESTAMPTZ,
            is_valid BOOLEAN DEFAULT true,
            security_score INTEGER CHECK (security_score >= 0 AND security_score <= 100),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create indexes for performance
        CREATE INDEX idx_link_previews_url ON public.link_previews(url);
        CREATE INDEX idx_link_previews_normalized_url ON public.link_previews(normalized_url);
        CREATE INDEX idx_link_previews_domain ON public.link_previews(domain);
        CREATE INDEX idx_link_previews_expires_at ON public.link_previews(expires_at) WHERE expires_at IS NOT NULL;
        CREATE INDEX idx_link_previews_is_valid ON public.link_previews(is_valid) WHERE is_valid = true;
        CREATE INDEX idx_link_previews_extracted_at ON public.link_previews(extracted_at DESC);

        -- Create updated_at trigger
        CREATE OR REPLACE FUNCTION update_link_previews_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER link_previews_updated_at
            BEFORE UPDATE ON public.link_previews
            FOR EACH ROW
            EXECUTE FUNCTION update_link_previews_updated_at();

        -- Add comment
        COMMENT ON TABLE public.link_previews IS 'Cached link preview metadata extracted from Open Graph, Twitter Cards, and HTML meta tags';
        COMMENT ON COLUMN public.link_previews.normalized_url IS 'Normalized URL for deduplication (lowercase, no trailing slash, etc.)';
        COMMENT ON COLUMN public.link_previews.security_score IS 'Security score from 0-100 (higher is safer)';
        COMMENT ON COLUMN public.link_previews.metadata IS 'Additional extracted metadata (JSONB)';
    END IF;
END $$;
