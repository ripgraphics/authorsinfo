-- Database Fixes Script - MINIMAL VERSION
-- This script addresses basic issues using ONLY existing columns

-- =====================================================
-- 1. ADD BASIC INDEXES FOR PERFORMANCE
-- =====================================================

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Book-related indexes (using ACTUAL columns)
CREATE INDEX IF NOT EXISTS idx_books_title ON public.books(title);
CREATE INDEX IF NOT EXISTS idx_books_isbn10 ON public.books(isbn10);
CREATE INDEX IF NOT EXISTS idx_books_isbn13 ON public.books(isbn13);
CREATE INDEX IF NOT EXISTS idx_books_publication_date ON public.books(publication_date);
CREATE INDEX IF NOT EXISTS idx_books_author_id ON public.books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_publisher_id ON public.books(publisher_id);

-- Author and publisher indexes
CREATE INDEX IF NOT EXISTS idx_authors_name ON public.authors(name);
CREATE INDEX IF NOT EXISTS idx_authors_featured ON public.authors(featured);
CREATE INDEX IF NOT EXISTS idx_publishers_name ON public.publishers(name);
CREATE INDEX IF NOT EXISTS idx_publishers_featured ON public.publishers(featured);

-- Photo album indexes
CREATE INDEX IF NOT EXISTS idx_photo_albums_owner_id ON public.photo_albums(owner_id);
CREATE INDEX IF NOT EXISTS idx_photo_albums_is_public ON public.photo_albums(is_public);
CREATE INDEX IF NOT EXISTS idx_photo_albums_created_at ON public.photo_albums(created_at);

-- Feed and activity indexes
CREATE INDEX IF NOT EXISTS idx_feed_entries_user_id ON public.feed_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_entries_created_at ON public.feed_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_feed_entries_visibility ON public.feed_entries(visibility);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at);

-- Comment and like indexes (using ACTUAL columns)
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_feed_entry_id ON public.comments(feed_entry_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_feed_entry_id ON public.likes(feed_entry_id);

-- Reading-related indexes
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON public.reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_book_id ON public.reading_progress(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_challenges_user_id ON public.reading_challenges(user_id);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- =====================================================
-- 2. ADD BASIC DOCUMENTATION COMMENTS
-- =====================================================

-- Table documentation
COMMENT ON TABLE public.users IS 'User accounts and basic information';
COMMENT ON TABLE public.profiles IS 'Extended user profile information';
COMMENT ON TABLE public.books IS 'Book catalog with metadata';
COMMENT ON TABLE public.authors IS 'Book authors information';
COMMENT ON TABLE public.publishers IS 'Book publishers information';
COMMENT ON TABLE public.photo_albums IS 'Photo albums with privacy controls';
COMMENT ON TABLE public.feed_entries IS 'User activity feed entries';
COMMENT ON TABLE public.activities IS 'User activities for tracking engagement';
COMMENT ON TABLE public.comments IS 'Comments on feed entries';
COMMENT ON TABLE public.likes IS 'User likes on feed entries';
COMMENT ON TABLE public.reading_progress IS 'User reading progress tracking';
COMMENT ON TABLE public.reading_challenges IS 'Reading challenge participation';
COMMENT ON TABLE public.notifications IS 'User notifications';

-- Column documentation
COMMENT ON COLUMN public.users.email IS 'User email address for authentication';
COMMENT ON COLUMN public.users.name IS 'User display name';
COMMENT ON COLUMN public.users.role_id IS 'Reference to user role for permissions';
COMMENT ON COLUMN public.profiles.user_id IS 'Reference to user account';
COMMENT ON COLUMN public.profiles.bio IS 'User biography text';
COMMENT ON COLUMN public.profiles.role IS 'User role (user, admin, moderator)';
COMMENT ON COLUMN public.books.isbn10 IS 'ISBN-10 identifier';
COMMENT ON COLUMN public.books.isbn13 IS 'ISBN-13 identifier';
COMMENT ON COLUMN public.books.title IS 'Book title';
COMMENT ON COLUMN public.books.publication_date IS 'Book publication date';
COMMENT ON COLUMN public.photo_albums.owner_id IS 'Album owner user ID';
COMMENT ON COLUMN public.photo_albums.is_public IS 'Whether album is public';
COMMENT ON COLUMN public.comments.user_id IS 'User who made the comment';
COMMENT ON COLUMN public.comments.feed_entry_id IS 'Feed entry being commented on';
COMMENT ON COLUMN public.likes.user_id IS 'User who liked the feed entry';
COMMENT ON COLUMN public.likes.feed_entry_id IS 'Feed entry being liked';

-- =====================================================
-- 3. VERIFICATION QUERIES
-- =====================================================

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'profiles', 'books', 'comments', 'likes')
ORDER BY tablename, indexname;

-- =====================================================
-- SCRIPT COMPLETED
-- =====================================================

-- Summary of changes:
-- 1. Added basic performance indexes for common query patterns
-- 2. Added comprehensive documentation comments
-- 3. Included verification queries to confirm changes

-- All changes use ONLY existing columns from the actual database schema
-- No RLS policies or complex constraints that might cause errors 