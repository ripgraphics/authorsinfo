# Phase 3: Missing Core Features - Implementation Planning
**Date:** December 25, 2025  
**Status:** Starting Analysis Phase  
**Target Duration:** Weeks 9-14 (3 sprints, ~6 weeks)

---

## 📋 Phase 3 Overview

**Goal:** Implement missing features to increase user engagement and core platform functionality.

**Scope:** 3 Sprints across 3 distinct feature areas:
- **Sprint 6:** Advanced Book Management (Custom Bookshelves, Reading Challenges, Enhanced Progress)
- **Sprint 7:** Social Gamification (Badges, Leaderboards, Reading Streaks)
- **Sprint 8:** Community & Events (Virtual Events, Book Clubs, Q&A)

**Expected Outcomes:**
- 9 new major features
- 10-15 new database tables/views
- 20-30 new React components
- Comprehensive engagement system
- 90%+ user engagement improvement estimate

---

## 🔍 Phase 3 Analysis Framework

This document will guide the systematic analysis of what exists and what needs to be built.

### Analysis Questions for Each Sprint:

1. **What exists today?** (Current implementation status)
2. **What's missing?** (Gaps vs. requirements)
3. **Data model changes needed?** (Database schema updates)
4. **Component structure?** (UI components to build)
5. **API endpoints needed?** (Backend logic)
6. **Integration points?** (How it connects to existing features)
7. **Estimated effort?** (Hours to implement)

---

## 📊 SPRINT 6: Advanced Book Management

### Current State Analysis

**What Exists Today:**
- Basic book library/shelves system (app/books)
- Reading progress tracking (partial)
- Book metadata (title, author, cover, etc.)
- User book ownership/tracking

**What's Missing:**
- [ ] Custom user-created bookshelves
- [ ] Editable shelf names and descriptions
- [ ] Flexible shelf categorization
- [ ] Reading challenges/goals
- [ ] Challenge progress tracking
- [ ] Yearly challenge system
- [ ] Enhanced reading progress (detailed metrics)

### Feature 1: Custom Bookshelves

**Requirements:**
- Users can create custom shelves (e.g., "Summer Reads", "Wishlist", "Currently Reading")
- Default shelves: "Read", "Reading", "Want to Read"
- Shelf management: Rename, reorder, delete
- Drag-and-drop book organization
- Shelf sharing (optional: with groups/friends)

**Data Model:**

```sql
-- New table: custom_shelves
CREATE TABLE custom_shelves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7),
  is_default BOOLEAN DEFAULT FALSE,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- New table: shelf_books
CREATE TABLE shelf_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shelf_id UUID NOT NULL REFERENCES custom_shelves(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  display_order INTEGER,
  UNIQUE(shelf_id, book_id)
);

-- New indexes
CREATE INDEX idx_custom_shelves_user_id ON custom_shelves(user_id);
CREATE INDEX idx_shelf_books_shelf_id ON shelf_books(shelf_id);
CREATE INDEX idx_shelf_books_book_id ON shelf_books(book_id);
```

**Components to Build:**
- `ShelfManager.tsx` - Shelf CRUD operations
- `ShelfSelector.tsx` - Dropdown for selecting shelf
- `ShelfView.tsx` - Display books in a shelf
- `ShelfReorder.tsx` - Drag-and-drop reordering
- `ShelfSettings.tsx` - Edit shelf name/description

**API Endpoints:**
- `POST /api/shelves` - Create shelf
- `GET /api/shelves` - List user's shelves
- `PATCH /api/shelves/:id` - Update shelf
- `DELETE /api/shelves/:id` - Delete shelf
- `POST /api/shelves/:id/books` - Add book to shelf
- `DELETE /api/shelves/:id/books/:bookId` - Remove book from shelf

**Estimated Effort:** 8-10 hours

---

### Feature 2: Reading Challenges

**Requirements:**
- Users set yearly/custom reading goals
- Track progress toward goals
- Visible progress bars
- Challenge templates ("Read 12 books", "Read 5,000 pages", etc.)
- Custom challenges with custom goals

**Data Model:**

```sql
-- New table: reading_challenges
CREATE TABLE reading_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  goal_type VARCHAR(50) NOT NULL, -- 'books', 'pages', 'minutes', 'authors'
  goal_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  challenge_year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, challenge_year, title)
);

-- New table: challenge_tracking
CREATE TABLE challenge_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES reading_challenges(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  pages_read INTEGER,
  date_added DATE DEFAULT TODAY(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reading_challenges_user_id ON reading_challenges(user_id);
CREATE INDEX idx_challenge_tracking_challenge_id ON challenge_tracking(challenge_id);
```

**Components to Build:**
- `ChallengeCreator.tsx` - Create new challenge
- `ChallengeProgressBar.tsx` - Visual progress display
- `ChallengeLeaderboard.tsx` - Public challenge leaderboard
- `ChallengeHistory.tsx` - Past challenges
- `YearlyChallengeDashboard.tsx` - Overview for current year

**API Endpoints:**
- `POST /api/challenges` - Create challenge
- `GET /api/challenges` - List user challenges
- `PATCH /api/challenges/:id` - Update challenge
- `POST /api/challenges/:id/progress` - Log progress
- `GET /api/challenges/leaderboard` - Public leaderboard

**Estimated Effort:** 10-12 hours

---

### Feature 3: Enhanced Reading Progress

**Requirements:**
- Page-by-page progress tracking
- Reading sessions (date started, date completed)
- Reading rate calculation
- Completion percentage
- Detailed progress history
- Reading time tracking

**Data Model:**

```sql
-- Extend reading_progress table with new columns
ALTER TABLE reading_progress ADD COLUMN IF NOT EXISTS (
  reading_sessions JSONB DEFAULT '[]', -- [{date, pages, minutes}]
  date_started DATE,
  date_completed DATE,
  pages_read INTEGER DEFAULT 0,
  total_pages INTEGER,
  reading_rate_pages_per_day DECIMAL(5,2),
  estimated_completion_date DATE,
  reading_time_minutes INTEGER DEFAULT 0
);

-- New table: reading_sessions
CREATE TABLE reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_progress_id UUID NOT NULL REFERENCES reading_progress(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  pages_read INTEGER NOT NULL,
  time_spent_minutes INTEGER,
  notes TEXT,
  mood VARCHAR(50), -- 'loved', 'liked', 'okay', 'dnf'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reading_sessions_progress_id ON reading_sessions(reading_progress_id);
```

**Components to Build:**
- `ReadingSessionLogger.tsx` - Log reading session
- `ProgressTimeline.tsx` - Visual timeline of progress
- `ReadingStats.tsx` - Statistics and rates
- `ReadingCalendar.tsx` - Heat map of reading activity
- `CompletionPredictor.tsx` - Estimated completion date

**API Endpoints:**
- `POST /api/reading/:id/sessions` - Log reading session
- `GET /api/reading/:id/sessions` - Get reading history
- `GET /api/reading/:id/stats` - Get reading statistics
- `PATCH /api/reading/:id` - Update progress

**Estimated Effort:** 8-10 hours

---

## 📊 SPRINT 7: Social Gamification

### Feature 1: Badges & Achievements System

**Requirements:**
- Automatic badge awarding based on actions
- 20-30 badge types (milestone-based, action-based)
- Badge display on profiles
- Badge tooltips with descriptions
- Achievement history

**Badge Types Example:**
- "Bookworm" - Read 5+ books
- "Page Turner" - Read 1000+ pages
- "Social Butterfly" - Make 10+ friends
- "Group Leader" - Create a group
- "Challenge Master" - Complete 3 reading challenges
- "Streak King" - 30-day reading streak
- "Critic" - Write 10+ reviews
- "Early Adopter" - Account age > 1 year

**Data Model:**

```sql
-- New table: badge_definitions
CREATE TABLE badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key VARCHAR(100) UNIQUE NOT NULL, -- 'bookworm', 'page_turner', etc.
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  rarity VARCHAR(50), -- 'common', 'uncommon', 'rare', 'legendary'
  requirement_type VARCHAR(50), -- 'books_read', 'pages_read', 'friends', etc.
  requirement_value INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- New table: user_badges
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  progress INTEGER DEFAULT 0, -- For progress tracking
  UNIQUE(user_id, badge_id)
);

-- New table: badge_progress
CREATE TABLE badge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key VARCHAR(100) NOT NULL,
  current_count INTEGER DEFAULT 0,
  requirement_value INTEGER,
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_badge_progress_user_id ON badge_progress(user_id);
```

**Components to Build:**
- `BadgeDisplay.tsx` - Show badge on profile
- `BadgeShowcase.tsx` - Grid of earned badges
- `BadgeTooltip.tsx` - Detailed badge information
- `AchievementNotification.tsx` - Toast notification
- `BadgeProgress.tsx` - Progress toward earning badge

**API Endpoints:**
- `GET /api/badges` - List all badge definitions
- `GET /api/users/:id/badges` - Get user's earned badges
- `GET /api/users/:id/badge-progress` - Get progress on upcoming badges
- `POST /api/admin/badges/check` - Check for badge eligibility (admin)

**Estimated Effort:** 10-12 hours

---

### Feature 2: Leaderboards

**Requirements:**
- Global leaderboard (books read, pages read, etc.)
- Friend group leaderboards
- Group-specific leaderboards
- Monthly/yearly/all-time rankings
- User ranking position

**Data Model:**

```sql
-- New table: leaderboard_snapshots (daily snapshots)
CREATE TABLE leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_type VARCHAR(50), -- 'global', 'friends', 'group'
  leaderboard_context_id UUID, -- group_id for group leaderboards, NULL for global
  metric_type VARCHAR(50), -- 'books_read', 'pages_read', 'badges_earned'
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_value INTEGER NOT NULL,
  rank INTEGER,
  snapshot_date DATE DEFAULT TODAY(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Views for current rankings (updated daily)
CREATE VIEW global_leaderboard_books AS
SELECT 
  user_id,
  COUNT(DISTINCT book_id) as books_read,
  ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT book_id) DESC) as rank
FROM reading_progress
WHERE status = 'completed'
GROUP BY user_id;

CREATE INDEX idx_leaderboard_snapshots_type ON leaderboard_snapshots(leaderboard_type, metric_type);
```

**Components to Build:**
- `GlobalLeaderboard.tsx` - Global rankings
- `FriendsLeaderboard.tsx` - Friend group rankings
- `GroupLeaderboard.tsx` - Group-specific rankings
- `LeaderboardCard.tsx` - Individual ranking card
- `RankingChart.tsx` - Visual ranking progress

**API Endpoints:**
- `GET /api/leaderboards/global` - Global rankings (paginated)
- `GET /api/leaderboards/friends` - Friend leaderboard
- `GET /api/leaderboards/groups/:id` - Group leaderboard
- `GET /api/users/:id/rank` - Get user's position

**Estimated Effort:** 8-10 hours

---

### Feature 3: Reading Streaks

**Requirements:**
- Track consecutive days of reading activity
- Display current streak and longest streak
- Streak notifications/badges
- Visual streak calendar
- Streak milestones (7 days, 30 days, 100 days)

**Data Model:**

```sql
-- New table: reading_streaks
CREATE TABLE reading_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  streak_start_date DATE,
  last_activity_date DATE,
  milestone_notifications JSONB DEFAULT '[]', -- {milestone: 7, notified: true}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- New table: streak_activity
CREATE TABLE streak_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streak_id UUID NOT NULL REFERENCES reading_streaks(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  activity_type VARCHAR(50), -- 'reading_logged', 'book_completed', 'review_written'
  is_counting BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(streak_id, activity_date)
);

CREATE INDEX idx_reading_streaks_user_id ON reading_streaks(user_id);
```

**Components to Build:**
- `StreakDisplay.tsx` - Show current/longest streak
- `StreakCalendar.tsx` - Heat map calendar of activity
- `StreakMilestone.tsx` - Milestone celebration
- `StreakNotification.tsx` - Streak reminders
- `StreakHistory.tsx` - Historical streak data

**API Endpoints:**
- `GET /api/streaks/user/:id` - Get streak data
- `POST /api/streaks/user/:id/activity` - Log activity
- `GET /api/streaks/user/:id/calendar` - Get activity calendar
- `GET /api/streaks/user/:id/milestones` - Get milestone progress

**Estimated Effort:** 8-10 hours

---

## 📊 SPRINT 8: Community & Events

### Feature 1: Virtual Events Integration

**Requirements:**
- Schedule virtual book club meetings
- Video call integration (Zoom, Google Meet)
- Event discussion threads
- RSVP and attendance tracking
- Event chat/messaging
- Event recordings/notes

**Data Model:**

```sql
-- Extend events table with virtual meeting details
ALTER TABLE events ADD COLUMN IF NOT EXISTS (
  is_virtual BOOLEAN DEFAULT FALSE,
  meeting_platform VARCHAR(50), -- 'zoom', 'google_meet', 'discord'
  meeting_link VARCHAR(500),
  meeting_password VARCHAR(100),
  expected_attendees INTEGER,
  actual_attendees INTEGER,
  recording_url VARCHAR(500),
  event_notes TEXT
);

-- New table: event_attendance
CREATE TABLE event_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rsvp_status VARCHAR(50), -- 'attending', 'maybe', 'not_attending'
  check_in_time TIMESTAMP,
  checked_out_time TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- New table: event_discussion
CREATE TABLE event_discussion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_event_attendance_event_id ON event_attendance(event_id);
CREATE INDEX idx_event_discussion_event_id ON event_discussion(event_id);
```

**Components to Build:**
- `VirtualEventCreator.tsx` - Create virtual event
- `EventRSVP.tsx` - RSVP management
- `EventAttendanceTracker.tsx` - Check-in system
- `EventDiscussionThread.tsx` - Event chat
- `EventRecording.tsx` - View recording/notes

**API Endpoints:**
- `POST /api/events/virtual` - Create virtual event
- `PATCH /api/events/:id/attendance` - Update RSVP
- `POST /api/events/:id/checkin` - Check in to event
- `POST /api/events/:id/discussion` - Post discussion message
- `GET /api/events/:id/discussion` - Get discussion thread

**Estimated Effort:** 10-12 hours

---

### Feature 2: Book Clubs (Sub-groups)

**Requirements:**
- Sub-groups within groups for book clubs
- Book club books (reading list)
- Book club schedule/timeline
- Discussion threads per book
- Meeting notes and summaries
- Book club member roles

**Data Model:**

```sql
-- New table: book_clubs (specialized groups)
CREATE TABLE book_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'classic', 'sci-fi', 'mystery', 'romance'
  max_members INTEGER,
  current_book_id UUID REFERENCES books(id),
  reading_start_date DATE,
  reading_end_date DATE,
  discussion_meeting_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- New table: book_club_books
CREATE TABLE book_club_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  order_in_list INTEGER,
  reading_start_date DATE,
  reading_end_date DATE,
  discussion_date DATE,
  status VARCHAR(50), -- 'upcoming', 'reading', 'completed'
  created_at TIMESTAMP DEFAULT NOW()
);

-- New table: book_club_discussions
CREATE TABLE book_club_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_club_book_id UUID NOT NULL REFERENCES book_club_books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  thread_id UUID REFERENCES book_club_discussions(id), -- For nested comments
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_book_clubs_group_id ON book_clubs(group_id);
CREATE INDEX idx_book_club_books_book_club_id ON book_club_books(book_club_id);
```

**Components to Build:**
- `BookClubCreator.tsx` - Create book club
- `BookClubReadingList.tsx` - Display club's books
- `BookClubDiscussion.tsx` - Discussion threads
- `BookClubMeetingScheduler.tsx` - Schedule meetings
- `BookClubNotes.tsx` - Meeting notes/summary

**API Endpoints:**
- `POST /api/groups/:groupId/book-clubs` - Create book club
- `GET /api/book-clubs/:id` - Get book club details
- `POST /api/book-clubs/:id/books` - Add book to club reading list
- `POST /api/book-clubs/:id/discussions` - Post discussion
- `GET /api/book-clubs/:id/discussions` - Get all discussions

**Estimated Effort:** 12-15 hours

---

### Feature 3: Q&A Sessions (Ask the Author)

**Requirements:**
- Schedule Q&A sessions with authors
- Submit questions in advance
- Live Q&A during events
- Question voting/ranking
- Q&A recordings/transcripts

**Data Model:**

```sql
-- New table: qa_sessions
CREATE TABLE qa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP NOT NULL,
  duration_minutes INTEGER,
  meeting_link VARCHAR(500),
  max_attendees INTEGER,
  status VARCHAR(50), -- 'scheduled', 'live', 'completed'
  recording_url VARCHAR(500),
  transcript TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- New table: qa_questions
CREATE TABLE qa_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qa_session_id UUID NOT NULL REFERENCES qa_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  answer_text TEXT,
  answered_at TIMESTAMP,
  status VARCHAR(50), -- 'submitted', 'selected', 'answered'
  created_at TIMESTAMP DEFAULT NOW()
);

-- New table: qa_votes
CREATE TABLE qa_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES qa_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10), -- 'upvote', 'downvote'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(question_id, user_id)
);

CREATE INDEX idx_qa_sessions_author_id ON qa_sessions(author_id);
CREATE INDEX idx_qa_questions_session_id ON qa_questions(qa_session_id);
```

**Components to Build:**
- `QASessionCreator.tsx` - Create Q&A session (author only)
- `QuestionSubmitter.tsx` - Submit questions
- `QuestionVoting.tsx` - Upvote/downvote questions
- `QALiveChat.tsx` - Live Q&A interface
- `QARecording.tsx` - View recording/transcript

**API Endpoints:**
- `POST /api/authors/:id/qa-sessions` - Create Q&A session
- `GET /api/qa-sessions/:id` - Get session details
- `POST /api/qa-sessions/:id/questions` - Submit question
- `PATCH /api/qa-questions/:id/vote` - Vote on question
- `GET /api/qa-sessions/:id/questions` - Get questions for session

**Estimated Effort:** 10-12 hours

---

## 📊 Phase 3 Implementation Summary

### Deliverables

| Sprint | Feature | Components | API Endpoints | DB Tables | Est. Hours |
|--------|---------|------------|---------------|-----------|-----------|
| 6 | Custom Shelves | 5 | 6 | 2 | 8-10 |
| 6 | Reading Challenges | 5 | 5 | 2 | 10-12 |
| 6 | Enhanced Progress | 5 | 4 | 2 | 8-10 |
| **Sprint 6 Total** | — | **15** | **15** | **6** | **26-32** |
| 7 | Badges & Achievements | 5 | 4 | 3 | 10-12 |
| 7 | Leaderboards | 5 | 4 | 2 | 8-10 |
| 7 | Reading Streaks | 5 | 4 | 2 | 8-10 |
| **Sprint 7 Total** | — | **15** | **12** | **7** | **26-32** |
| 8 | Virtual Events | 5 | 5 | 3 | 10-12 |
| 8 | Book Clubs | 5 | 5 | 3 | 12-15 |
| 8 | Q&A Sessions | 5 | 5 | 3 | 10-12 |
| **Sprint 8 Total** | — | **15** | **15** | **9** | **32-39** |
| **PHASE 3 TOTAL** | **9 Features** | **45** | **42** | **22** | **84-103** |

### Estimated Timeline

- **Sprint 6 (Advanced Book Management):** 26-32 hours (3-4 days)
- **Sprint 7 (Social Gamification):** 26-32 hours (3-4 days)
- **Sprint 8 (Community & Events):** 32-39 hours (4-5 days)
- **Total Phase 3:** 84-103 hours (10-13 days of full-time development)

---

## 🎯 Next Action

**Current Status:** Phase 3 Planning Complete

**Recommended Next Step:** Begin with **Sprint 6: Advanced Book Management**

This sprint provides foundational features that other phases will build upon:
1. Custom bookshelves provide organization (needed for book clubs)
2. Reading challenges enable gamification
3. Enhanced progress tracking enables leaderboards and streaks

**Ready to start Sprint 6 Analysis and Implementation?**

---

## 📚 Reference Files

- Main Roadmap: `docs/ROADMAP.md`
- Phase 3 Details: This document
- Phase 2 Completion: `docs/ENTERPRISE_OPTIMIZATION_COMPLETE.md`

---

*Phase 3 Implementation Planning Complete - December 25, 2025*
