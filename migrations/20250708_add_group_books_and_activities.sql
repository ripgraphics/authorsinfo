-- Migration: Add group_books and activities tables for group system

-- 1. group_books table
CREATE TABLE IF NOT EXISTS public.group_books (
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    added_by UUID REFERENCES public.users(id),
    added_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    PRIMARY KEY (group_id, book_id)
);

COMMENT ON TABLE public.group_books IS 'Associates books with groups for group reading, recommendations, or tracking.';
COMMENT ON COLUMN public.group_books.group_id IS 'The group to which the book is linked.';
COMMENT ON COLUMN public.group_books.book_id IS 'The book being linked to the group.';
COMMENT ON COLUMN public.group_books.added_by IS 'User who added the book to the group.';
COMMENT ON COLUMN public.group_books.added_at IS 'Timestamp when the book was added to the group.';

-- 2. activities table
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    activity_type TEXT NOT NULL, -- e.g., 'member_joined', 'book_added', 'discussion_created'
    data JSONB,                  -- Additional context (e.g., book_id, discussion_id, etc.)
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

COMMENT ON TABLE public.activities IS 'Tracks all activities within groups for audit and timeline features.';
COMMENT ON COLUMN public.activities.group_id IS 'The group where the activity occurred.';
COMMENT ON COLUMN public.activities.user_id IS 'The user who performed the activity (if applicable).';
COMMENT ON COLUMN public.activities.activity_type IS 'Type of activity (e.g., member_joined, book_added, etc.).';
COMMENT ON COLUMN public.activities.data IS 'Additional context for the activity (book_id, discussion_id, etc.).';
COMMENT ON COLUMN public.activities.created_at IS 'Timestamp when the activity occurred.'; 