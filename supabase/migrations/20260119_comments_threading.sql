-- Migration: Ensure hierarchical/recursive threading support for comments
-- Date: 2026-01-19

-- Ensure parent_id and thread_id are indexed for fast recursive queries
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_thread_id ON comments(thread_id);

-- Optionally, add a recursive CTE example for documentation:
-- WITH RECURSIVE comment_tree AS (
--   SELECT *, 1 as depth FROM comments WHERE id = $1
--   UNION ALL
--   SELECT c.*, ct.depth + 1 FROM comments c
--   JOIN comment_tree ct ON c.parent_id = ct.id
-- )
-- SELECT * FROM comment_tree;
