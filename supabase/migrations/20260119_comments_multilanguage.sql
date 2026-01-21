-- Migration: Add multi-language support to comments table
-- Date: 2026-01-19

ALTER TABLE comments
ADD COLUMN language_code TEXT DEFAULT 'en',
ADD COLUMN content_translations JSONB DEFAULT NULL;

-- language_code: ISO 639-1 code (e.g., 'en', 'es', 'fr')
-- content_translations: { "es": "...", "fr": "..." }
