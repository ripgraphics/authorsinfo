-- Update posts visibility constraint to allow followers
-- Created: 2026-01-21

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'posts'
          AND column_name = 'visibility'
    ) THEN
        ALTER TABLE public.posts
            DROP CONSTRAINT IF EXISTS check_visibility_values;

        ALTER TABLE public.posts
            ADD CONSTRAINT check_visibility_values
            CHECK (visibility = ANY (ARRAY['public', 'private', 'friends', 'followers', 'group']));
    END IF;
END $$;
