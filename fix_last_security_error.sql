-- Fix Last Security Error
-- This script fixes the remaining 1 security error

-- Enable RLS on the last table that needs it
ALTER TABLE public.book_id_mapping ENABLE ROW LEVEL SECURITY;

-- Add a basic policy for the book_id_mapping table
CREATE POLICY "Public read access for book_id_mapping" ON public.book_id_mapping
    FOR SELECT USING (true);

-- Verify the fix
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'book_id_mapping'; 