-- Aggressive cleanup of comments table triggers
-- Created: 2026-01-21

DO $$
DECLARE
    trig RECORD;
BEGIN
    FOR trig IN 
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers 
        WHERE event_object_table = 'comments' 
          AND trigger_schema = 'public'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trig.trigger_name || ' ON public.comments CASCADE;';
    END LOOP;
END $$;

-- Recreate standard updated_at trigger if needed
-- Assuming we have a standard handle_updated_at function
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'updated_at') THEN
        CREATE TRIGGER handle_comments_updated_at
            BEFORE UPDATE ON public.comments
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Function might not exist, skip
END $$;
