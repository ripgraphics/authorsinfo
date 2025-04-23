-- SQL script to create a book_publishers join table
-- This allows books to have multiple publishers

-- Create book_publishers join table
CREATE TABLE IF NOT EXISTS book_publishers (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  publisher_id INTEGER NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, publisher_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_book_publishers_book_id ON book_publishers(book_id);
CREATE INDEX IF NOT EXISTS idx_book_publishers_publisher_id ON book_publishers(publisher_id);

-- Migrate existing publisher relationships to the join table
INSERT INTO book_publishers (book_id, publisher_id)
SELECT id, publisher_id FROM books
WHERE publisher_id IS NOT NULL
ON CONFLICT (book_id, publisher_id) DO NOTHING;

-- Create a function to count publishers per book
CREATE OR REPLACE FUNCTION count_publishers_per_book()
RETURNS TABLE (book_id integer, publisher_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT bp.book_id, COUNT(bp.publisher_id) as publisher_count
  FROM book_publishers bp
  GROUP BY bp.book_id
  ORDER BY publisher_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Output the number of relationships migrated
SELECT COUNT(*) AS relationships_migrated FROM book_publishers; 