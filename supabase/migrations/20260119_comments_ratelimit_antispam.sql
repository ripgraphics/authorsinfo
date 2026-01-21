-- Migration: Add rate limiting and anti-spam support for comments
-- Date: 2026-01-19

-- Add anti-spam columns to comments table
ALTER TABLE comments
ADD COLUMN spam_score REAL DEFAULT 0,
ADD COLUMN is_flagged_spam BOOLEAN DEFAULT FALSE;

-- Create a table to track comment rate limits per user
CREATE TABLE IF NOT EXISTS comment_rate_limits (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    comment_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, window_start)
);

-- Optionally, add triggers or functions for rate limiting logic in the API layer.
