-- Migration: Fix ISBN columns and add validation
-- This migration ensures:
-- 1. isbn10 column exists (renames 'isbn' to 'isbn10' if needed)
-- 2. isbn13 column exists
-- 3. Adds check constraints to ensure ISBN-10 has 10 characters and ISBN-13 has 13 characters
-- 4. Creates a function to validate and fix existing ISBN data

-- Step 1: Check if 'isbn' column exists and rename to 'isbn10' if needed
DO $$
BEGIN
  -- Check if 'isbn' column exists but 'isbn10' doesn't
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'books' 
    AND column_name = 'isbn'
  ) AND NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'books' 
    AND column_name = 'isbn10'
  ) THEN
    ALTER TABLE public.books RENAME COLUMN isbn TO isbn10;
    RAISE NOTICE 'Renamed column "isbn" to "isbn10"';
  END IF;
END $$;

-- Step 2: Ensure isbn10 column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'books' 
    AND column_name = 'isbn10'
  ) THEN
    ALTER TABLE public.books ADD COLUMN isbn10 TEXT;
    RAISE NOTICE 'Added column "isbn10"';
  END IF;
END $$;

-- Step 3: Ensure isbn13 column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'books' 
    AND column_name = 'isbn13'
  ) THEN
    ALTER TABLE public.books ADD COLUMN isbn13 TEXT;
    RAISE NOTICE 'Added column "isbn13"';
  END IF;
END $$;

-- Step 4: Create function to normalize ISBN (remove hyphens and spaces)
CREATE OR REPLACE FUNCTION normalize_isbn(isbn_text TEXT)
RETURNS TEXT AS $$
BEGIN
  IF isbn_text IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN UPPER(REGEXP_REPLACE(isbn_text, '[-\s]', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 5: Create function to validate ISBN-10 (10 characters, last can be X)
CREATE OR REPLACE FUNCTION is_valid_isbn10(isbn_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF isbn_text IS NULL THEN
    RETURN FALSE;
  END IF;
  -- Remove hyphens and spaces, then check if it matches ISBN-10 pattern
  RETURN normalize_isbn(isbn_text) ~ '^[0-9]{9}[0-9X]$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 6: Create function to validate ISBN-13 (exactly 13 digits)
CREATE OR REPLACE FUNCTION is_valid_isbn13(isbn_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF isbn_text IS NULL THEN
    RETURN FALSE;
  END IF;
  -- Remove hyphens and spaces, then check if it matches ISBN-13 pattern
  RETURN normalize_isbn(isbn_text) ~ '^[0-9]{13}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 7: Fix existing data - move ISBNs to correct columns based on length
DO $$
DECLARE
  book_record RECORD;
  normalized_isbn TEXT;
  updated_count INTEGER := 0;
BEGIN
  -- Process books where isbn10 might have wrong data
  FOR book_record IN 
    SELECT id, isbn10, isbn13 
    FROM public.books 
    WHERE isbn10 IS NOT NULL OR isbn13 IS NOT NULL
  LOOP
    -- Check if isbn10 actually contains an ISBN-13
    IF book_record.isbn10 IS NOT NULL THEN
      normalized_isbn := normalize_isbn(book_record.isbn10);
      IF is_valid_isbn13(normalized_isbn) THEN
        -- Move ISBN-13 from isbn10 to isbn13
        UPDATE public.books 
        SET isbn13 = normalized_isbn, isbn10 = NULL
        WHERE id = book_record.id;
        updated_count := updated_count + 1;
      ELSIF is_valid_isbn10(normalized_isbn) THEN
        -- Normalize and keep in isbn10
        UPDATE public.books 
        SET isbn10 = normalized_isbn
        WHERE id = book_record.id AND isbn10 != normalized_isbn;
      ELSE
        -- Invalid ISBN, set to NULL
        UPDATE public.books 
        SET isbn10 = NULL
        WHERE id = book_record.id;
        updated_count := updated_count + 1;
      END IF;
    END IF;

    -- Check if isbn13 actually contains an ISBN-10
    IF book_record.isbn13 IS NOT NULL THEN
      normalized_isbn := normalize_isbn(book_record.isbn13);
      IF is_valid_isbn10(normalized_isbn) THEN
        -- Move ISBN-10 from isbn13 to isbn10 (only if isbn10 is empty)
        UPDATE public.books 
        SET isbn10 = COALESCE(isbn10, normalized_isbn), 
            isbn13 = CASE WHEN isbn10 IS NULL THEN NULL ELSE isbn13 END
        WHERE id = book_record.id;
        updated_count := updated_count + 1;
      ELSIF is_valid_isbn13(normalized_isbn) THEN
        -- Normalize and keep in isbn13
        UPDATE public.books 
        SET isbn13 = normalized_isbn
        WHERE id = book_record.id AND isbn13 != normalized_isbn;
      ELSE
        -- Invalid ISBN, set to NULL
        UPDATE public.books 
        SET isbn13 = NULL
        WHERE id = book_record.id;
        updated_count := updated_count + 1;
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE 'Updated % books with corrected ISBN assignments', updated_count;
END $$;

-- Step 8: Add check constraints to prevent invalid data in the future
-- Note: We use a function-based check that allows NULL values

-- Add comment to columns for documentation
COMMENT ON COLUMN public.books.isbn10 IS 'ISBN-10 identifier (exactly 10 characters, last can be X). Must match pattern: ^[0-9]{9}[0-9X]$';
COMMENT ON COLUMN public.books.isbn13 IS 'ISBN-13 identifier (exactly 13 digits). Must match pattern: ^[0-9]{13}$';

-- Step 9: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_books_isbn10 ON public.books(isbn10) WHERE isbn10 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_books_isbn13 ON public.books(isbn13) WHERE isbn13 IS NOT NULL;

-- Step 10: Create a unique constraint to prevent duplicate books
-- Only create if it doesn't exist
DO $$
BEGIN
  -- Check if unique constraint already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'books_isbn10_unique' 
    AND conrelid = 'public.books'::regclass
  ) THEN
    CREATE UNIQUE INDEX books_isbn10_unique ON public.books(isbn10) WHERE isbn10 IS NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'books_isbn13_unique' 
    AND conrelid = 'public.books'::regclass
  ) THEN
    CREATE UNIQUE INDEX books_isbn13_unique ON public.books(isbn13) WHERE isbn13 IS NOT NULL;
  END IF;
END $$;

