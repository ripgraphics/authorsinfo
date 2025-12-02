-- Remove avatar_url and cover_image_url columns from profiles table
-- These columns are no longer used as the images table is the single source of truth for all image data
-- Images are now referenced via avatar_image_id and cover_image_id columns

-- First, drop any views that depend on these columns
DROP VIEW IF EXISTS public.enhanced_user_profiles CASCADE;

-- Drop avatar_url column if it exists
ALTER TABLE IF EXISTS public.profiles 
DROP COLUMN IF EXISTS avatar_url;

-- Drop cover_image_url column if it exists
ALTER TABLE IF EXISTS public.profiles 
DROP COLUMN IF EXISTS cover_image_url;

-- Add comment to document the change
COMMENT ON TABLE public.profiles IS 'User profiles table. All image data (avatars, covers) should be fetched from the images table via avatar_image_id and cover_image_id columns.';

