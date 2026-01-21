-- 20260119_cleanup_comment_audits.sql
-- Delete audit records referencing comments that no longer exist
DELETE FROM public.comment_audits
WHERE comment_id IS NOT NULL
  AND comment_id NOT IN (SELECT id FROM public.comments);
