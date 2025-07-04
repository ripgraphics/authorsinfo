-- Fix Last Security Error - SAFE VERSION
-- This script fixes the remaining 1 security error without creating duplicate policies

-- Enable RLS on the last table that needs it
ALTER TABLE public.book_id_mapping ENABLE ROW LEVEL SECURITY;

-- Add a basic policy for the book_id_mapping table (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'book_id_mapping' 
        AND policyname = 'Public read access for book_id_mapping'
    ) THEN
        CREATE POLICY "Public read access for book_id_mapping" ON public.book_id_mapping
            FOR SELECT USING (true);
    END IF;
END $$;

-- Verify the fix
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'book_id_mapping';

-- Show all tables with RLS enabled
SELECT 
    COUNT(*) as total_tables_with_rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = true; 