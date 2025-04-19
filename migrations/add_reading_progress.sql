-- Create reading_progress table
CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('want_to_read', 'currently_reading', 'read', 'on_hold', 'abandoned')),
  current_page INTEGER,
  total_pages INTEGER,
  percentage_complete NUMERIC,
  start_date TIMESTAMP WITH TIME ZONE,
  finish_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- Add RLS policies
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own reading progress
CREATE POLICY "Users can view their own reading progress"
  ON reading_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to view public reading progress
CREATE POLICY "Users can view public reading progress"
  ON reading_progress
  FOR SELECT
  USING (is_public = TRUE);

-- Policy for users to insert their own reading progress
CREATE POLICY "Users can insert their own reading progress"
  ON reading_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own reading progress
CREATE POLICY "Users can update their own reading progress"
  ON reading_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for users to delete their own reading progress
CREATE POLICY "Users can delete their own reading progress"
  ON reading_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX reading_progress_user_id_idx ON reading_progress(user_id);
CREATE INDEX reading_progress_book_id_idx ON reading_progress(book_id);
CREATE INDEX reading_progress_status_idx ON reading_progress(status);
