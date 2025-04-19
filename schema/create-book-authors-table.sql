-- SQL script to create a book_authors join table
-- This allows books to have multiple authors

-- Create book_authors join table
CREATE TABLE IF NOT EXISTS book_authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, author_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_book_authors_book_id ON book_authors(book_id);
CREATE INDEX IF NOT EXISTS idx_book_authors_author_id ON book_authors(author_id);

-- Migrate existing author relationships to the join table
INSERT INTO book_authors (book_id, author_id)
SELECT id, author_id FROM books
WHERE author_id IS NOT NULL
ON CONFLICT (book_id, author_id) DO NOTHING;

-- Create a function to count authors per book
CREATE OR REPLACE FUNCTION count_authors_per_book()
RETURNS TABLE (book_id uuid, author_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT ba.book_id, COUNT(ba.author_id) as author_count
  FROM book_authors ba
  GROUP BY ba.book_id
  ORDER BY author_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Output the number of relationships migrated
SELECT COUNT(*) AS relationships_migrated FROM book_authors;
