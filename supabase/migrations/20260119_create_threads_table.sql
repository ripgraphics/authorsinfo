-- 20260119_create_threads_table.sql
-- Create threads table for enterprise-grade comment threading
CREATE TABLE IF NOT EXISTS public.threads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraint to comments.thread_id
ALTER TABLE public.comments
    ADD CONSTRAINT fk_comments_thread_id FOREIGN KEY (thread_id) REFERENCES public.threads(id) ON DELETE CASCADE;
