-- Migration: Create statuses table and add status_id to books

-- 1. Create lookup table for book statuses
CREATE TABLE statuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Link books to statuses
ALTER TABLE books
ADD COLUMN status_id INTEGER REFERENCES statuses(id);

-- 3. Seed book statuses
INSERT INTO statuses (name) VALUES
  ('Published'),
  ('Unpublished'),
  ('Draft'),
  ('Archived'); 