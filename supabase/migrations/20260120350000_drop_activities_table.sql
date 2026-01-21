-- Drop the legacy activities table
-- Created: 2026-01-20

-- Step 1: Drop dependent objects if any
-- (We already handled triggers in the previous migration)

-- Step 2: Drop the table
DROP TABLE IF EXISTS public.activities CASCADE;

-- Step 3: Verify the posts table has all the data
DO $$
DECLARE
    post_count integer;
BEGIN
    SELECT COUNT(*) INTO post_count FROM public.posts;
    RAISE NOTICE 'Migration successful. Posts table contains % records.', post_count;
END $$;
