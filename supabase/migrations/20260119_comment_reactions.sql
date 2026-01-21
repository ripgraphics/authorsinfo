-- Migration: Add reactions support to comments table
-- Date: 2026-01-19

CREATE TABLE comment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL, -- e.g., 'like', 'dislike', 'laugh', etc.
    reacted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (comment_id, user_id, reaction_type)
);

-- Optionally, add indexes for fast lookup.
CREATE INDEX idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX idx_comment_reactions_user_id ON comment_reactions(user_id);
