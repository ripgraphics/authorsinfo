-- =====================================================
-- Phase 3: Community & Events - ALTER Migration
-- Sprint 9: Alter existing tables to match phase3.ts types
-- Created: December 27, 2025
-- =====================================================

-- =====================================================
-- ALTER book_clubs table
-- Current: id, name, description, cover_image_url, created_by, member_count, current_book_id
-- Need to add: group_id, owner_id (rename created_by), reading_pace, meeting_frequency, 
--              preferred_genres, max_members, is_public, requires_approval, status, timestamps
-- =====================================================

-- Add new columns to book_clubs
ALTER TABLE book_clubs
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reading_pace VARCHAR(50) DEFAULT 'moderate',
  ADD COLUMN IF NOT EXISTS meeting_frequency VARCHAR(50) DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS preferred_genres TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Rename created_by to owner_id for consistency
ALTER TABLE book_clubs RENAME COLUMN created_by TO owner_id;

-- Create index for group_id
CREATE INDEX IF NOT EXISTS idx_book_clubs_group_id ON book_clubs(group_id);
CREATE INDEX IF NOT EXISTS idx_book_clubs_owner_id ON book_clubs(owner_id);
CREATE INDEX IF NOT EXISTS idx_book_clubs_status ON book_clubs(status);

-- =====================================================
-- ALTER book_club_members table
-- Add role, status, activity tracking columns
-- =====================================================

ALTER TABLE book_club_members
  ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS books_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discussions_participated INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_book_club_members_status ON book_club_members(status);
CREATE INDEX IF NOT EXISTS idx_book_club_members_role ON book_club_members(role);

-- =====================================================
-- CREATE club_reading_schedules table
-- =====================================================

CREATE TABLE IF NOT EXISTS club_reading_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'upcoming',
  discussion_date TIMESTAMPTZ,
  milestones JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_schedule_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_club_reading_schedules_club_id ON club_reading_schedules(club_id);
CREATE INDEX IF NOT EXISTS idx_club_reading_schedules_book_id ON club_reading_schedules(book_id);
CREATE INDEX IF NOT EXISTS idx_club_reading_schedules_status ON club_reading_schedules(status);

-- =====================================================
-- CREATE club_discussions table (enhanced version)
-- =====================================================

CREATE TABLE IF NOT EXISTS club_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES club_reading_schedules(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  discussion_type VARCHAR(50) DEFAULT 'general',
  is_pinned BOOLEAN DEFAULT false,
  is_spoiler BOOLEAN DEFAULT false,
  spoiler_chapter INTEGER,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_club_discussions_club_id ON club_discussions(club_id);
CREATE INDEX IF NOT EXISTS idx_club_discussions_schedule_id ON club_discussions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_club_discussions_user_id ON club_discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_club_discussions_type ON club_discussions(discussion_type);

-- =====================================================
-- ALTER events table - add virtual meeting fields
-- =====================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS meeting_platform VARCHAR(50),
  ADD COLUMN IF NOT EXISTS meeting_url TEXT,
  ADD COLUMN IF NOT EXISTS meeting_password VARCHAR(255),
  ADD COLUMN IF NOT EXISTS max_participants INTEGER,
  ADD COLUMN IF NOT EXISTS recording_url TEXT,
  ADD COLUMN IF NOT EXISTS event_notes TEXT,
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

CREATE INDEX IF NOT EXISTS idx_events_is_virtual ON events(is_virtual);

-- =====================================================
-- ALTER event_sessions table - add missing columns
-- =====================================================

ALTER TABLE event_sessions
  ADD COLUMN IF NOT EXISTS session_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'scheduled';

CREATE INDEX IF NOT EXISTS idx_event_sessions_status ON event_sessions(status);

-- =====================================================
-- CREATE event_participants table
-- =====================================================

CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rsvp_status VARCHAR(50) DEFAULT 'attending',
  attended BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  role VARCHAR(50) DEFAULT 'attendee',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_event_participant UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_rsvp_status ON event_participants(rsvp_status);

-- =====================================================
-- CREATE event_comments table
-- =====================================================

CREATE TABLE IF NOT EXISTS event_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  session_id UUID REFERENCES event_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_announcement BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_comments_event_id ON event_comments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_session_id ON event_comments(session_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_user_id ON event_comments(user_id);

-- =====================================================
-- CREATE qa_sessions table
-- =====================================================

CREATE TABLE IF NOT EXISTS qa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id UUID REFERENCES authors(id) ON DELETE SET NULL,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  session_type VARCHAR(50) NOT NULL,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'scheduled',
  max_questions INTEGER,
  is_public BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  allow_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_scheduled_times CHECK (scheduled_end > scheduled_start)
);

CREATE INDEX IF NOT EXISTS idx_qa_sessions_host_id ON qa_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_qa_sessions_author_id ON qa_sessions(author_id);
CREATE INDEX IF NOT EXISTS idx_qa_sessions_book_id ON qa_sessions(book_id);
CREATE INDEX IF NOT EXISTS idx_qa_sessions_status ON qa_sessions(status);
CREATE INDEX IF NOT EXISTS idx_qa_sessions_session_type ON qa_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_qa_sessions_scheduled_start ON qa_sessions(scheduled_start);

-- =====================================================
-- CREATE qa_questions table
-- =====================================================

CREATE TABLE IF NOT EXISTS qa_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES qa_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'pending',
  upvotes INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qa_questions_session_id ON qa_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_qa_questions_user_id ON qa_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_qa_questions_status ON qa_questions(status);
CREATE INDEX IF NOT EXISTS idx_qa_questions_upvotes ON qa_questions(upvotes DESC);

-- =====================================================
-- CREATE qa_answers table
-- =====================================================

CREATE TABLE IF NOT EXISTS qa_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES qa_questions(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_official BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qa_answers_question_id ON qa_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_qa_answers_responder_id ON qa_answers(responder_id);

-- =====================================================
-- CREATE qa_question_votes table
-- =====================================================

CREATE TABLE IF NOT EXISTS qa_question_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES qa_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type VARCHAR(20) DEFAULT 'upvote',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_question_vote UNIQUE(question_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_qa_question_votes_question_id ON qa_question_votes(question_id);
CREATE INDEX IF NOT EXISTS idx_qa_question_votes_user_id ON qa_question_votes(user_id);

-- =====================================================
-- TRIGGERS for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER update_book_clubs_updated_at BEFORE UPDATE ON book_clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_club_members_updated_at BEFORE UPDATE ON book_club_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_club_reading_schedules_updated_at BEFORE UPDATE ON club_reading_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_club_discussions_updated_at BEFORE UPDATE ON club_discussions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_participants_updated_at BEFORE UPDATE ON event_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_comments_updated_at BEFORE UPDATE ON event_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qa_sessions_updated_at BEFORE UPDATE ON qa_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qa_questions_updated_at BEFORE UPDATE ON qa_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qa_answers_updated_at BEFORE UPDATE ON qa_answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Book Clubs policies (already have basic "Allow public read", add more)
DROP POLICY IF EXISTS "Users can create book clubs" ON book_clubs;
CREATE POLICY "Users can create book clubs" ON book_clubs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Club owners can update their clubs" ON book_clubs;
CREATE POLICY "Club owners can update their clubs" ON book_clubs
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Club owners can delete their clubs" ON book_clubs;
CREATE POLICY "Club owners can delete their clubs" ON book_clubs
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- Book Club Members policies
DROP POLICY IF EXISTS "Users can join book clubs" ON book_club_members;
CREATE POLICY "Users can join book clubs" ON book_club_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own membership" ON book_club_members;
CREATE POLICY "Users can update their own membership" ON book_club_members
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Club Reading Schedules policies
ALTER TABLE club_reading_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reading schedules" ON club_reading_schedules
  FOR SELECT USING (true);

CREATE POLICY "Club members can create schedules" ON club_reading_schedules
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM book_club_members
      WHERE book_club_members.book_club_id = club_reading_schedules.club_id
        AND book_club_members.user_id = auth.uid()
        AND book_club_members.role IN ('owner', 'moderator')
    )
  );

-- Club Discussions policies
ALTER TABLE club_discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view discussions" ON club_discussions
  FOR SELECT USING (true);

CREATE POLICY "Club members can create discussions" ON club_discussions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM book_club_members
      WHERE book_club_members.book_club_id = club_discussions.club_id
        AND book_club_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own discussions" ON club_discussions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Event Participants policies
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event participants" ON event_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can RSVP to events" ON event_participants
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RSVP" ON event_participants
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Event Comments policies
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event comments" ON event_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment on events" ON event_comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON event_comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- QA Sessions policies
ALTER TABLE qa_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public QA sessions" ON qa_sessions
  FOR SELECT USING (is_public = true OR auth.uid() = host_id);

CREATE POLICY "Hosts can create QA sessions" ON qa_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their sessions" ON qa_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their sessions" ON qa_sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = host_id);

-- QA Questions policies
ALTER TABLE qa_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions in public sessions" ON qa_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM qa_sessions
      WHERE qa_sessions.id = qa_questions.session_id
        AND qa_sessions.is_public = true
    )
  );

CREATE POLICY "Authenticated users can ask questions" ON qa_questions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR is_anonymous = true
  );

CREATE POLICY "Users can update their own questions" ON qa_questions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- QA Answers policies
ALTER TABLE qa_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view answers" ON qa_answers
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can answer questions" ON qa_answers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = responder_id);

-- QA Question Votes policies
ALTER TABLE qa_question_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes" ON qa_question_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can vote on questions" ON qa_question_votes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their votes" ON qa_question_votes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their votes" ON qa_question_votes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- GRANTS
-- =====================================================

GRANT ALL ON TABLE club_reading_schedules TO anon, authenticated, service_role;
GRANT ALL ON TABLE club_discussions TO anon, authenticated, service_role;
GRANT ALL ON TABLE event_participants TO anon, authenticated, service_role;
GRANT ALL ON TABLE event_comments TO anon, authenticated, service_role;
GRANT ALL ON TABLE qa_sessions TO anon, authenticated, service_role;
GRANT ALL ON TABLE qa_questions TO anon, authenticated, service_role;
GRANT ALL ON TABLE qa_answers TO anon, authenticated, service_role;
GRANT ALL ON TABLE qa_question_votes TO anon, authenticated, service_role;
