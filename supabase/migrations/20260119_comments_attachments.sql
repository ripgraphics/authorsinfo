-- Migration: Add attachments/media support to comments table
-- Date: 2026-01-19

ALTER TABLE comments
ADD COLUMN attachment_urls TEXT[] DEFAULT NULL;

-- Optionally, add a separate table for file metadata if needed in future steps.
-- Example:
-- CREATE TABLE comment_attachments (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
--     url TEXT NOT NULL,
--     file_type TEXT,
--     uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
-- );
