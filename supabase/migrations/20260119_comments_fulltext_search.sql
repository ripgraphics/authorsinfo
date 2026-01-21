-- 20260119_comments_fulltext_search.sql
-- Add full-text search index for content
CREATE INDEX IF NOT EXISTS idx_comments_content_fts ON public.comments USING GIN (to_tsvector('english', content));
