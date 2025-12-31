-- Verification script to check if reading_challenges and reading_sessions tables exist
-- Run this in Supabase SQL Editor to check current state

-- Check if reading_challenges table exists and has correct columns
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reading_challenges') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as reading_challenges_table,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'reading_challenges' AND column_name = 'challenge_year'
    ) 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as challenge_year_column,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'reading_challenges' AND column_name = 'start_date'
    ) 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as start_date_column,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'reading_challenges' AND column_name = 'end_date'
    ) 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as end_date_column;

-- Check if reading_sessions table exists and has correct columns
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reading_sessions') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as reading_sessions_table,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'reading_sessions' AND column_name = 'session_date'
    ) 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as session_date_column,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'reading_sessions' AND column_name = 'duration_minutes'
    ) 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as duration_minutes_column;

-- List all columns in reading_challenges if it exists
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'reading_challenges' 
ORDER BY ordinal_position;

-- List all columns in reading_sessions if it exists
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'reading_sessions' 
ORDER BY ordinal_position;

