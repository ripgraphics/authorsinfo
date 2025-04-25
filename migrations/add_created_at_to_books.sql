-- Migration: Add created_at column to books table
-- Adds a timestamp for when each book record was created

ALTER TABLE books
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(); 