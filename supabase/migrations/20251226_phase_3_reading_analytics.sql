-- Custom Shelves
CREATE TABLE IF NOT EXISTS custom_shelves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#000000',
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shelf Books
CREATE TABLE IF NOT EXISTS shelf_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shelf_id UUID NOT NULL REFERENCES custom_shelves(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  display_order INTEGER DEFAULT 0,
  UNIQUE(shelf_id, book_id)
);

-- Reading Challenges
CREATE TABLE IF NOT EXISTS reading_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL, -- 'books', 'pages', 'minutes', 'authors'
  goal_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  challenge_year INTEGER NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  is_public BOOLEAN DEFAULT true,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (for robustness)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reading_challenges' AND column_name = 'is_public') THEN
        ALTER TABLE reading_challenges ADD COLUMN is_public BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Challenge Tracking
CREATE TABLE IF NOT EXISTS challenge_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES reading_challenges(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  pages_read INTEGER,
  minutes_read INTEGER,
  date_added TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading Sessions
CREATE TABLE IF NOT EXISTS reading_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  session_date TIMESTAMPTZ NOT NULL,
  pages_started_at INTEGER,
  pages_ended_at INTEGER,
  pages_read INTEGER NOT NULL,
  duration_minutes INTEGER,
  reading_speed_ppm INTEGER,
  mood TEXT,
  notes TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading Streaks
CREATE TABLE IF NOT EXISTS reading_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  longest_streak_start_date TIMESTAMPTZ,
  longest_streak_end_date TIMESTAMPTZ,
  last_reading_date TIMESTAMPTZ,
  streak_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Reading Calendar Days (Summary table)
CREATE TABLE IF NOT EXISTS reading_calendar_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sessions_count INTEGER DEFAULT 0,
  pages_read INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- RLS Policies
ALTER TABLE custom_shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelf_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_calendar_days ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid errors
DROP POLICY IF EXISTS "Users can view public shelves" ON custom_shelves;
DROP POLICY IF EXISTS "Users can manage their own shelves" ON custom_shelves;
DROP POLICY IF EXISTS "Users can view books on public shelves" ON shelf_books;
DROP POLICY IF EXISTS "Users can manage books on their own shelves" ON shelf_books;
DROP POLICY IF EXISTS "Users can view public challenges" ON reading_challenges;
DROP POLICY IF EXISTS "Users can manage their own challenges" ON reading_challenges;
DROP POLICY IF EXISTS "Users can view tracking for public challenges" ON challenge_tracking;
DROP POLICY IF EXISTS "Users can manage tracking for their own challenges" ON challenge_tracking;
DROP POLICY IF EXISTS "Users can view their own sessions" ON reading_sessions;
DROP POLICY IF EXISTS "Users can manage their own sessions" ON reading_sessions;
DROP POLICY IF EXISTS "Users can view their own streaks" ON reading_streaks;
DROP POLICY IF EXISTS "Users can manage their own streaks" ON reading_streaks;
DROP POLICY IF EXISTS "Users can view their own calendar days" ON reading_calendar_days;
DROP POLICY IF EXISTS "Users can manage their own calendar days" ON reading_calendar_days;

-- Recreate Policies
CREATE POLICY "Users can view public shelves" ON custom_shelves FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage their own shelves" ON custom_shelves FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view books on public shelves" ON shelf_books FOR SELECT USING (
  EXISTS (SELECT 1 FROM custom_shelves WHERE id = shelf_books.shelf_id AND (is_public = true OR user_id = auth.uid()))
);
CREATE POLICY "Users can manage books on their own shelves" ON shelf_books FOR ALL USING (
  EXISTS (SELECT 1 FROM custom_shelves WHERE id = shelf_books.shelf_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view public challenges" ON reading_challenges FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage their own challenges" ON reading_challenges FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view tracking for public challenges" ON challenge_tracking FOR SELECT USING (
  EXISTS (SELECT 1 FROM reading_challenges WHERE id = challenge_tracking.challenge_id AND (is_public = true OR user_id = auth.uid()))
);
CREATE POLICY "Users can manage tracking for their own challenges" ON challenge_tracking FOR ALL USING (
  EXISTS (SELECT 1 FROM reading_challenges WHERE id = challenge_tracking.challenge_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view their own sessions" ON reading_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sessions" ON reading_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own streaks" ON reading_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own streaks" ON reading_streaks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own calendar days" ON reading_calendar_days FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own calendar days" ON reading_calendar_days FOR ALL USING (auth.uid() = user_id);
