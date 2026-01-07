-- Migration: Add reading progress columns (current_page, total_pages, percentage)
-- This migration adds columns needed for reading status and progress tracking
-- when users add books to custom shelves with reading status.

-- Add current_page column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reading_progress' 
        AND column_name = 'current_page'
    ) THEN
        ALTER TABLE public.reading_progress 
        ADD COLUMN current_page INTEGER;
        
        COMMENT ON COLUMN public.reading_progress.current_page IS 
        'Current page number the user is on in the book';
    END IF;
END $$;

-- Add total_pages column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reading_progress' 
        AND column_name = 'total_pages'
    ) THEN
        ALTER TABLE public.reading_progress 
        ADD COLUMN total_pages INTEGER;
        
        COMMENT ON COLUMN public.reading_progress.total_pages IS 
        'Total number of pages in the book';
    END IF;
END $$;

-- Add percentage column if it doesn't exist
-- This is a calculated field: (current_page / total_pages) * 100
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reading_progress' 
        AND column_name = 'percentage'
    ) THEN
        ALTER TABLE public.reading_progress 
        ADD COLUMN percentage INTEGER;
        
        COMMENT ON COLUMN public.reading_progress.percentage IS 
        'Calculated reading percentage (0-100), derived from current_page and total_pages';
    END IF;
END $$;

-- Optional: Copy existing progress_percentage values to percentage if percentage is NULL
-- This helps with backward compatibility
-- Note: This update may trigger badge functions, so we wrap it in a try-catch
DO $$
BEGIN
    -- Temporarily disable triggers if needed (comment out if triggers must run)
    -- ALTER TABLE public.reading_progress DISABLE TRIGGER ALL;
    
    UPDATE public.reading_progress
    SET percentage = progress_percentage
    WHERE percentage IS NULL 
    AND progress_percentage IS NOT NULL
    AND progress_percentage >= 0 
    AND progress_percentage <= 100;
    
    -- Re-enable triggers
    -- ALTER TABLE public.reading_progress ENABLE TRIGGER ALL;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the migration
        RAISE WARNING 'Could not copy progress_percentage to percentage: %', SQLERRM;
        -- Re-enable triggers in case they were disabled
        -- ALTER TABLE public.reading_progress ENABLE TRIGGER ALL;
END $$;

-- Create index on current_page for performance (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_reading_progress_current_page 
ON public.reading_progress(current_page) 
WHERE current_page IS NOT NULL;

-- Create index on percentage for performance (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_reading_progress_percentage 
ON public.reading_progress(percentage) 
WHERE percentage IS NOT NULL;

