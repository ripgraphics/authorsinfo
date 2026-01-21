-- 20260119_disable_log_comment_audit.sql
-- Disable the log_comment_audit trigger on comments
ALTER TABLE public.comments DISABLE TRIGGER log_comment_audit;
