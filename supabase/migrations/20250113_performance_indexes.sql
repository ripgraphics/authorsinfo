-- Reading Progress Queries
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id_status 
  ON reading_progress(user_id, privacy_level, status);

CREATE INDEX IF NOT EXISTS idx_reading_progress_book_id 
  ON reading_progress(book_id);

CREATE INDEX IF NOT EXISTS idx_reading_progress_updated_at 
  ON reading_progress(updated_at DESC);

-- User Relationships
CREATE INDEX IF NOT EXISTS idx_user_friends_user_id_status 
  ON user_friends(user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_friends_friend_id 
  ON user_friends(friend_id, status);

-- Group Operations
CREATE INDEX IF NOT EXISTS idx_group_members_group_id_status 
  ON group_members(group_id, status);

CREATE INDEX IF NOT EXISTS idx_group_roles_group_id_default 
  ON group_roles(group_id, is_default);

-- Author/Publisher Lookups
CREATE INDEX IF NOT EXISTS idx_authors_name 
  ON authors(name);

CREATE INDEX IF NOT EXISTS idx_publishers_name 
  ON publishers(name);

-- Books
-- CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn, isbn13); -- isbn column missing
CREATE INDEX IF NOT EXISTS idx_books_isbn13 ON books(isbn13);
-- CREATE INDEX IF NOT EXISTS idx_books_isbn10 ON books(isbn10); -- Optional if isbn10 exists

CREATE INDEX IF NOT EXISTS idx_books_author_id 
  ON books(author_id);

CREATE INDEX IF NOT EXISTS idx_books_publisher_id 
  ON books(publisher_id);

-- Composite Indexes for Complex Queries

-- Friends activity feed
CREATE INDEX IF NOT EXISTS idx_reading_progress_friends 
  ON reading_progress(user_id, privacy_level, updated_at DESC);

-- Book import deduplication
-- CREATE INDEX IF NOT EXISTS idx_books_isbn_unique ON books(isbn) WHERE isbn IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_books_isbn13_unique 
  ON books(isbn13) WHERE isbn13 IS NOT NULL;

-- Group content management
CREATE INDEX IF NOT EXISTS idx_group_content_group_status 
  ON group_members(group_id, status, user_id);
