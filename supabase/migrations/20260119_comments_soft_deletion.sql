-- 20260119_comments_soft_deletion.sql
-- Add soft-deletion columns to comments table
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.comments.deleted_at IS 'Timestamp when comment was soft-deleted';
COMMENT ON COLUMN public.comments.deleted_by IS 'User who performed the soft-delete';
