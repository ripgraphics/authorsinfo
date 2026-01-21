-- 20260119_cleanup_invalid_comment_entity_ids.sql
-- Set entity_id to NULL for comments where entity_id does not exist in entities
-- If entity_id is required for your app, you can also choose to delete these rows instead

UPDATE public.comments
SET entity_id = NULL
WHERE entity_id IS NOT NULL
  AND entity_id NOT IN (SELECT id FROM public.entities);

-- Optionally, delete comments with invalid entity_id instead of setting to NULL
-- DELETE FROM public.comments
-- WHERE entity_id IS NOT NULL
--   AND entity_id NOT IN (SELECT id FROM public.entities);
