-- Enhance posts table to replace activities table
-- Created: 2026-01-20

DO $$
BEGIN
    -- 1. Add activity_type column to posts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'activity_type') THEN
        ALTER TABLE public.posts ADD COLUMN activity_type text;
    END IF;

    -- 2. Add entity reference columns if missing (to match activities table)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'group_id') THEN
        ALTER TABLE public.posts ADD COLUMN group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'book_id') THEN
        ALTER TABLE public.posts ADD COLUMN book_id uuid REFERENCES public.books(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'author_id') THEN
        ALTER TABLE public.posts ADD COLUMN author_id uuid REFERENCES public.authors(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'event_id') THEN
        ALTER TABLE public.posts ADD COLUMN event_id uuid REFERENCES public.events(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'publisher_id') THEN
        ALTER TABLE public.posts ADD COLUMN publisher_id uuid REFERENCES public.publishers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Backfill activity_type from metadata if it was migrated
UPDATE public.posts 
SET activity_type = COALESCE(metadata->>'legacy_activity_type', 'post_created')
WHERE activity_type IS NULL;
