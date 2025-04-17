-- Create a function to count books with multiple authors
CREATE OR REPLACE FUNCTION count_books_with_multiple_authors()
RETURNS TABLE (book_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(DISTINCT book_id)
  FROM book_authors
  GROUP BY book_id
  HAVING COUNT(author_id) > 1;
END;
$$ LANGUAGE plpgsql;
