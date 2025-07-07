-- =====================================================
-- COMPLETE FIX: CONTACT_INFO + FOREIGN KEY CONSTRAINTS
-- =====================================================
-- This script fixes the contact_info RLS policies AND adds foreign key constraints
-- for public.profiles.user_id to public.users.id

-- =====================================================
-- 1. FIX CONTACT_INFO RLS POLICIES
-- =====================================================

-- Enable RLS on contact_info table
ALTER TABLE public.contact_info ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read" ON public.contact_info;
DROP POLICY IF EXISTS "Authenticated users can delete contact info" ON public.contact_info;
DROP POLICY IF EXISTS "Authenticated users can insert contact info" ON public.contact_info;
DROP POLICY IF EXISTS "Authenticated users can update contact info" ON public.contact_info;
DROP POLICY IF EXISTS "Contact info can be deleted by authenticated users" ON public.contact_info;
DROP POLICY IF EXISTS "Contact info can be inserted by authenticated users" ON public.contact_info;
DROP POLICY IF EXISTS "Contact info can be updated by authenticated users" ON public.contact_info;
DROP POLICY IF EXISTS "entity_owner_can_modify" ON public.contact_info;
DROP POLICY IF EXISTS "entity_owner_can_select" ON public.contact_info;

-- Create new policies
CREATE POLICY "Allow public read" ON public.contact_info
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert contact info" ON public.contact_info
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update contact info" ON public.contact_info
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete contact info" ON public.contact_info
FOR DELETE TO authenticated
USING (true);

-- Add unique constraint on (entity_type, entity_id) if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.contact_info'::regclass 
        AND contype = 'u' 
        AND pg_get_constraintdef(oid) LIKE '%entity_type%entity_id%'
    ) THEN
        ALTER TABLE public.contact_info 
        ADD CONSTRAINT contact_info_entity_type_id_unique 
        UNIQUE (entity_type, entity_id);
        
        RAISE NOTICE 'Added unique constraint on (entity_type, entity_id)';
    ELSE
        RAISE NOTICE 'Unique constraint on (entity_type, entity_id) already exists';
    END IF;
END $$;

-- =====================================================
-- 2. ADD FOREIGN KEY CONSTRAINTS FOR PROFILES.USER_ID
-- =====================================================

-- Check if the foreign key constraint already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.profiles'::regclass 
        AND contype = 'f' 
        AND conname LIKE '%user_id%'
    ) THEN
        -- Add foreign key constraint for profiles.user_id -> users.id
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint: profiles.user_id -> users.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint for profiles.user_id already exists';
    END IF;
END $$;

-- =====================================================
-- 3. VERIFY ALL FIXES
-- =====================================================

-- Check contact_info policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'contact_info'
ORDER BY policyname;

-- Check contact_info constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.contact_info'::regclass
ORDER BY contype, conname;

-- Check profiles foreign key constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass
AND contype = 'f'
ORDER BY conname;

-- =====================================================
-- 4. TEST THE FIXES
-- =====================================================

-- Test contact_info upsert (this will be rolled back)
BEGIN;
INSERT INTO public.contact_info (entity_type, entity_id, email, phone, website, address_line1, city, state, postal_code, country, updated_at)
VALUES ('author', '9953a3e0-4982-4ae5-8093-829c4320ef8d', 'test@example.com', '+1234567890', 'https://example.com', '123 Test St', 'Test City', 'TS', '12345', 'Test Country', NOW())
ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    address_line1 = EXCLUDED.address_line1,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    postal_code = EXCLUDED.postal_code,
    country = EXCLUDED.country,
    updated_at = NOW();

-- Verify the operation worked
SELECT * FROM public.contact_info WHERE entity_type = 'author' AND entity_id = '9953a3e0-4982-4ae5-8093-829c4320ef8d';

-- Clean up test data
DELETE FROM public.contact_info WHERE entity_type = 'author' AND entity_id = '9953a3e0-4982-4ae5-8093-829c4320ef8d';
ROLLBACK;

-- =====================================================
-- 5. SUMMARY
-- =====================================================

SELECT '✅ ALL FIXES COMPLETED SUCCESSFULLY!' as status;
SELECT 'Contact info RLS policies and unique constraint added' as contact_fix;
SELECT 'Foreign key constraint added: profiles.user_id -> users.id' as foreign_key_fix;
SELECT 'Upsert operations should now work properly' as note; 