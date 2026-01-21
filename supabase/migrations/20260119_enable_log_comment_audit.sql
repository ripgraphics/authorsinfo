-- 20260119_enable_log_comment_audit.sql
-- Re-enable the log_comment_audit trigger on comments
ALTER TABLE public.comments ENABLE TRIGGER log_comment_audit;
