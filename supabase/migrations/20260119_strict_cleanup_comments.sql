-- 20260119_strict_cleanup_comments.sql
-- Delete comments with invalid entity_id references
DELETE FROM public.comments
WHERE entity_id IS NOT NULL
  AND entity_id NOT IN (SELECT id FROM public.entities);

-- Delete comments where parent_id points to a comment with a different entity_id
DELETE FROM public.comments c
USING public.comments p
WHERE c.parent_id = p.id
  AND c.entity_id IS DISTINCT FROM p.entity_id;

-- Delete comments where parent_comment_id points to a comment with a different entity_id
DELETE FROM public.comments c
USING public.comments p
WHERE c.parent_comment_id = p.id
  AND c.entity_id IS DISTINCT FROM p.entity_id;
