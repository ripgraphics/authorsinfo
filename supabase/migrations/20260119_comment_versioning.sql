-- Migration: Add versioning/history for comment edits
-- Date: 2026-01-19

CREATE TABLE comment_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    edited_by UUID REFERENCES users(id),
    sentiment_score REAL,
    toxicity_score REAL
);

-- Optionally, add triggers to insert into comment_versions on comment edit.
