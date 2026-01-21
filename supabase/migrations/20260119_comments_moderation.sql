-- Migration: Add moderation features to comments table
-- Date: 2026-01-19

ALTER TABLE comments
ADD COLUMN is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN moderation_flag TEXT DEFAULT NULL;

-- Optionally, add audit trail for moderation actions in comment_audits or a new table.
