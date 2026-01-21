-- 20260119_add_comments_foreign_keys.sql
-- Add foreign key constraints to comments table

ALTER TABLE public.comments
    ADD CONSTRAINT fk_comments_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_comments_feed_entry_id FOREIGN KEY (feed_entry_id) REFERENCES public.feed_entries(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_comments_entity_id FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_comments_parent_id FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_comments_parent_comment_id FOREIGN KEY (parent_comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;
