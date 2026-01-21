-- Migration: Add analytics columns to comments table
-- Date: 2026-01-19

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_name = 'comments' AND column_name = 'view_count'
	) THEN
		EXECUTE 'ALTER TABLE comments ADD COLUMN view_count INTEGER DEFAULT 0';
	END IF;
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_name = 'comments' AND column_name = 'reply_count'
	) THEN
		EXECUTE 'ALTER TABLE comments ADD COLUMN reply_count INTEGER DEFAULT 0';
	END IF;
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_name = 'comments' AND column_name = 'engagement_score'
	) THEN
		EXECUTE 'ALTER TABLE comments ADD COLUMN engagement_score REAL DEFAULT 0';
	END IF;
END $$;
