-- Run this script in Supabase SQL Editor to add uploader tracking to images table
-- This fixes the issue where images don't properly track who uploaded them

-- Add uploader_id column to images table
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS uploader_id uuid,
ADD COLUMN IF NOT EXISTS uploader_type text DEFAULT 'user';

-- Add comment explaining the new fields
COMMENT ON COLUMN public.images.uploader_id IS 'ID of the user who uploaded this image';
COMMENT ON COLUMN public.images.uploader_type IS 'Type of uploader (user, admin, system, etc.)';

-- Add foreign key constraint for uploader_id (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'images_uploader_id_fkey'
    ) THEN
        ALTER TABLE public.images 
        ADD CONSTRAINT images_uploader_id_fkey 
        FOREIGN KEY (uploader_id) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for performance (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_images_uploader_id ON public.images(uploader_id);
CREATE INDEX IF NOT EXISTS idx_images_uploader_type ON public.images(uploader_type);

-- Add constraint to ensure uploader consistency (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'images_uploader_consistency'
    ) THEN
        ALTER TABLE public.images 
        ADD CONSTRAINT images_uploader_consistency 
        CHECK ((uploader_id IS NULL AND uploader_type IS NULL) 
               OR (uploader_id IS NOT NULL AND uploader_type IS NOT NULL));
    END IF;
END $$;

-- Update existing images to set uploader_id based on metadata if available
UPDATE public.images 
SET uploader_id = (metadata->>'user_id')::uuid,
    uploader_type = 'user'
WHERE metadata->>'user_id' IS NOT NULL 
  AND uploader_id IS NULL;

-- Update existing images to set uploader_id based on entity_id if it's a user entity
UPDATE public.images 
SET uploader_id = entity_id,
    uploader_type = 'user'
WHERE entity_id IS NOT NULL 
  AND uploader_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.entity_types et 
    WHERE et.id = images.entity_type_id 
    AND et.entity_category = 'user'
  );

-- Create a view for easy access to image uploader information
CREATE OR REPLACE VIEW public.image_uploaders AS
SELECT 
    i.id as image_id,
    i.url,
    i.alt_text,
    i.created_at,
    i.uploader_id,
    i.uploader_type,
    u.name as uploader_name,
    u.email as uploader_email,
    u.avatar_url as uploader_avatar_url
FROM public.images i
LEFT JOIN public.users u ON i.uploader_id = u.id
WHERE i.deleted_at IS NULL;

-- Add comment to the view
COMMENT ON VIEW public.image_uploaders IS 'View for easy access to image uploader information with user details';

-- Create RLS policies for the new uploader tracking
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all images" ON public.images;
DROP POLICY IF EXISTS "Users can update own uploaded images" ON public.images;
DROP POLICY IF EXISTS "Users can delete own uploaded images" ON public.images;
DROP POLICY IF EXISTS "Users can insert images" ON public.images;

-- Users can view images uploaded by anyone
CREATE POLICY "Users can view all images" ON public.images
FOR SELECT USING (true);

-- Users can update their own uploaded images
CREATE POLICY "Users can update own uploaded images" ON public.images
FOR UPDATE USING (auth.uid() = uploader_id);

-- Users can delete their own uploaded images
CREATE POLICY "Users can delete own uploaded images" ON public.images
FOR DELETE USING (auth.uid() = uploader_id);

-- Users can insert images (they become the uploader)
CREATE POLICY "Users can insert images" ON public.images
FOR INSERT WITH CHECK (auth.uid() = uploader_id);

-- Create a function to automatically set uploader_id on insert
CREATE OR REPLACE FUNCTION public.set_image_uploader()
RETURNS TRIGGER AS $$
BEGIN
    -- Set uploader_id to current user if not provided
    IF NEW.uploader_id IS NULL THEN
        NEW.uploader_id := auth.uid();
        NEW.uploader_type := 'user';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_image_uploader_trigger ON public.images;

-- Create trigger to automatically set uploader
CREATE TRIGGER set_image_uploader_trigger
    BEFORE INSERT ON public.images
    FOR EACH ROW
    EXECUTE FUNCTION public.set_image_uploader();

-- Add comment to the function
COMMENT ON FUNCTION public.set_image_uploader() IS 'Automatically sets uploader_id to current user when inserting images';

-- Show the results
SELECT 
    'Migration completed successfully!' as status,
    COUNT(*) as total_images,
    COUNT(uploader_id) as images_with_uploader,
    COUNT(*) - COUNT(uploader_id) as images_without_uploader
FROM public.images; 