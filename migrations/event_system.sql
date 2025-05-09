-- Advanced Event System for Book Platform
-- This script creates a comprehensive event system with support for physical and virtual events,
-- recurring events, event categories, registration, sessions, and analytics.

-- =====================
-- CORE EVENT TABLES
-- =====================

-- Event Categories
CREATE TABLE event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES event_categories(id),
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_categories_parent_id ON event_categories(parent_id);

-- Event Types (different from categories - represents format like webinar, workshop, signing, etc.)
CREATE TABLE event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Main Events Table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  summary TEXT,
  category_id UUID REFERENCES event_categories(id),
  type_id UUID REFERENCES event_types(id),
  format TEXT CHECK (format IN ('physical', 'virtual', 'hybrid')),
  status TEXT CHECK (status IN ('draft', 'published', 'cancelled', 'completed', 'postponed')),
  visibility TEXT CHECK (visibility IN ('public', 'private', 'invite_only', 'group_only')),
  featured BOOLEAN DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL, 
  timezone TEXT,
  all_day BOOLEAN DEFAULT false,
  max_attendees INTEGER,
  cover_image_id INTEGER REFERENCES images(id),
  event_image_id INTEGER REFERENCES images(id),
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB, -- Stores recurrence rules (daily, weekly, monthly, etc.)
  parent_event_id UUID REFERENCES events(id), -- For recurring event instances
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), 
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Event-specific metadata
  requires_registration BOOLEAN DEFAULT false,
  registration_opens_at TIMESTAMP WITH TIME ZONE,
  registration_closes_at TIMESTAMP WITH TIME ZONE,
  is_free BOOLEAN DEFAULT true,
  price NUMERIC,
  currency TEXT,
  
  -- Integration with books
  book_id INTEGER REFERENCES books(id), -- If event is related to a specific book
  author_id INTEGER REFERENCES authors(id), -- If event is related to a specific author
  publisher_id INTEGER REFERENCES publishers(id), -- If event is related to a specific publisher
  
  -- Integration with groups
  group_id UUID REFERENCES groups(id), -- If event is organized by a group
  
  -- Virtual event details
  virtual_meeting_url TEXT,
  virtual_meeting_id TEXT,
  virtual_meeting_password TEXT,
  virtual_platform TEXT, -- Zoom, Google Meet, Teams, etc.
  
  -- SEO and sharing
  slug TEXT UNIQUE,
  seo_title TEXT,
  seo_description TEXT,
  canonical_url TEXT,
  
  -- Rich content
  content_blocks JSONB -- For storing rich content sections of the event page
);

CREATE INDEX idx_events_category_id ON events(category_id);
CREATE INDEX idx_events_type_id ON events(type_id);
CREATE INDEX idx_events_book_id ON events(book_id);
CREATE INDEX idx_events_author_id ON events(author_id);
CREATE INDEX idx_events_publisher_id ON events(publisher_id);
CREATE INDEX idx_events_group_id ON events(group_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_parent_event_id ON events(parent_event_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_visibility ON events(visibility);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_featured ON events(featured) WHERE featured = true;

-- Event Locations (for physical and hybrid events)
CREATE TABLE event_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  google_place_id TEXT,
  is_primary BOOLEAN DEFAULT true,
  venue_notes TEXT,
  accessibility_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_locations_event_id ON event_locations(event_id);

-- Event Sessions (for multi-session events like conferences)
CREATE TABLE event_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  speaker_ids UUID[] DEFAULT '{}'::UUID[], -- Array of speaker IDs
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location_id UUID REFERENCES event_locations(id),
  virtual_meeting_url TEXT,
  max_attendees INTEGER,
  requires_separate_registration BOOLEAN DEFAULT false,
  session_materials JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_sessions_event_id ON event_sessions(event_id);
CREATE INDEX idx_event_sessions_location_id ON event_sessions(location_id);

-- Event Speakers/Presenters
CREATE TABLE event_speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id), -- If speaker is a registered user
  name TEXT NOT NULL, -- Required even if user_id exists (display name might differ)
  bio TEXT,
  headshot_url TEXT,
  website TEXT,
  social_links JSONB,
  presentation_title TEXT,
  presentation_description TEXT,
  speaker_order INTEGER,
  author_id INTEGER REFERENCES authors(id), -- If speaker is an author in our system
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- The same speaker might appear in multiple sessions
  session_ids UUID[] DEFAULT '{}'::UUID[] -- Array of session IDs
);

CREATE INDEX idx_event_speakers_event_id ON event_speakers(event_id);
CREATE INDEX idx_event_speakers_user_id ON event_speakers(user_id);
CREATE INDEX idx_event_speakers_author_id ON event_speakers(author_id);

-- Event Tags
CREATE TABLE event_tags (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (event_id, tag_id)
);

-- =====================
-- EVENT PARTICIPATION
-- =====================

-- Event Registrations
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  registration_status TEXT CHECK (registration_status IN ('registered', 'waitlisted', 'cancelled', 'attended', 'no_show')),
  registration_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  check_in_time TIMESTAMP WITH TIME ZONE,
  ticket_id TEXT UNIQUE,
  registration_source TEXT, -- How they registered: 'website', 'api', 'admin', etc.
  additional_guests INTEGER DEFAULT 0,
  guest_names JSONB,
  answers JSONB, -- Answers to registration questions
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- If they registered for specific sessions
  session_ids UUID[] DEFAULT '{}'::UUID[]
);

CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX idx_event_registrations_status ON event_registrations(registration_status);
CREATE UNIQUE INDEX idx_unique_event_registration ON event_registrations(event_id, user_id);

-- Session Registrations
CREATE TABLE session_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES event_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  registration_status TEXT CHECK (registration_status IN ('registered', 'waitlisted', 'cancelled', 'attended', 'no_show')),
  registration_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  check_in_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_session_registrations_session_id ON session_registrations(session_id);
CREATE INDEX idx_session_registrations_user_id ON session_registrations(user_id);
CREATE UNIQUE INDEX idx_unique_session_registration ON session_registrations(session_id, user_id);

-- Event Interest (for users who are interested but not registered)
CREATE TABLE event_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  interest_level TEXT CHECK (interest_level IN ('interested', 'maybe')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_interests_event_id ON event_interests(event_id);
CREATE INDEX idx_event_interests_user_id ON event_interests(user_id);
CREATE UNIQUE INDEX idx_unique_event_interest ON event_interests(event_id, user_id);

-- =====================
-- EVENT CONTENT
-- =====================

-- Event Media
CREATE TABLE event_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'document', 'audio')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  file_size INTEGER,
  file_type TEXT,
  duration INTEGER, -- For video/audio in seconds
  width INTEGER, -- For images/videos
  height INTEGER, -- For images/videos
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_media_event_id ON event_media(event_id);

-- Event Questions (for Q&A or registration forms)
CREATE TABLE event_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('text', 'multiple_choice', 'checkbox', 'dropdown', 'date', 'file')),
  is_required BOOLEAN DEFAULT false,
  options JSONB, -- For multiple choice questions
  display_order INTEGER,
  help_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_questions_event_id ON event_questions(event_id);

-- Event Comments
CREATE TABLE event_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  parent_id UUID REFERENCES event_comments(id), -- For threaded comments
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_comments_event_id ON event_comments(event_id);
CREATE INDEX idx_event_comments_user_id ON event_comments(user_id);
CREATE INDEX idx_event_comments_parent_id ON event_comments(parent_id);

-- =====================
-- EVENT INTEGRATIONS
-- =====================

-- Event Book Highlights (featured books for the event)
CREATE TABLE event_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL REFERENCES books(id),
  feature_type TEXT CHECK (feature_type IN ('primary', 'related', 'recommendation')),
  display_order INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_books_event_id ON event_books(event_id);
CREATE INDEX idx_event_books_book_id ON event_books(book_id);
CREATE UNIQUE INDEX idx_unique_event_book ON event_books(event_id, book_id);

-- =====================
-- EVENT INTERACTIONS
-- =====================

-- Event Likes (similar to other like tables)
CREATE TABLE event_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_likes_event_id ON event_likes(event_id);
CREATE INDEX idx_event_likes_user_id ON event_likes(user_id);
CREATE UNIQUE INDEX idx_unique_event_like ON event_likes(event_id, user_id);

-- Event Shares
CREATE TABLE event_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  share_platform TEXT CHECK (share_platform IN ('facebook', 'twitter', 'linkedin', 'email', 'whatsapp', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_shares_event_id ON event_shares(event_id);
CREATE INDEX idx_event_shares_user_id ON event_shares(user_id);

-- Event Reminders
CREATE TABLE event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
  notification_sent BOOLEAN DEFAULT false,
  notification_time TIMESTAMP WITH TIME ZONE,
  reminder_type TEXT CHECK (reminder_type IN ('email', 'push', 'sms', 'in_app')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_reminders_event_id ON event_reminders(event_id);
CREATE INDEX idx_event_reminders_user_id ON event_reminders(user_id);
CREATE INDEX idx_event_reminders_reminder_time ON event_reminders(reminder_time);

-- =====================
-- EVENT ANALYTICS
-- =====================

-- Event Analytics
CREATE TABLE event_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  registrations INTEGER DEFAULT 0,
  cancellations INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_analytics_event_id ON event_analytics(event_id);
CREATE INDEX idx_event_analytics_date ON event_analytics(date);
CREATE UNIQUE INDEX idx_unique_event_analytics ON event_analytics(event_id, date);

-- =====================
-- TRIGGERS AND FUNCTIONS
-- =====================

-- Event Activity Tracking
CREATE OR REPLACE FUNCTION create_event_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert event created activity
  INSERT INTO activities (
    user_id,
    activity_type,
    event_id,
    data,
    created_at
  ) VALUES (
    NEW.created_by,
    'event_created',
    NEW.id,
    jsonb_build_object(
      'event_id', NEW.id,
      'event_title', NEW.title,
      'event_start_date', NEW.start_date,
      'event_format', NEW.format
    ),
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_created_trigger
AFTER INSERT ON events
FOR EACH ROW
EXECUTE FUNCTION create_event_activity();

-- Function for event registration
CREATE OR REPLACE FUNCTION create_event_registration_activity()
RETURNS TRIGGER AS $$
DECLARE
  event_title TEXT;
  event_start_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get event details
  SELECT title, start_date INTO event_title, event_start_date 
  FROM events WHERE id = NEW.event_id;
  
  -- Insert registration activity
  INSERT INTO activities (
    user_id,
    activity_type,
    event_id,
    data,
    created_at
  ) VALUES (
    NEW.user_id,
    'event_registration',
    NEW.event_id,
    jsonb_build_object(
      'event_id', NEW.event_id,
      'event_title', event_title,
      'event_start_date', event_start_date,
      'registration_status', NEW.registration_status
    ),
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_registration_trigger
AFTER INSERT ON event_registrations
FOR EACH ROW
EXECUTE FUNCTION create_event_registration_activity();

-- Function for creating notification when an event is created
CREATE OR REPLACE FUNCTION create_event_notification()
RETURNS TRIGGER AS $$
DECLARE
  follower_id UUID;
  author_followers UUID[];
BEGIN
  -- If event is for an author, notify author's followers
  IF NEW.author_id IS NOT NULL THEN
    -- Get all users following this author
    SELECT ARRAY_AGG(follower_id) INTO author_followers
    FROM follows 
    WHERE following_id = NEW.author_id::TEXT
    AND target_type_id = (SELECT id FROM follow_target_types WHERE name = 'author');
    
    -- Create notifications for each follower
    IF author_followers IS NOT NULL THEN
      FOREACH follower_id IN ARRAY author_followers
      LOOP
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          link,
          data,
          is_read,
          created_at
        ) VALUES (
          follower_id,
          'event_created',
          'New Event',
          'An author you follow has a new event: ' || NEW.title,
          '/events/' || NEW.id,
          jsonb_build_object(
            'event_id', NEW.id,
            'author_id', NEW.author_id,
            'event_title', NEW.title,
            'event_start_date', NEW.start_date
          ),
          false,
          NOW()
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_notification_trigger
AFTER INSERT ON events
FOR EACH ROW
EXECUTE FUNCTION create_event_notification();

-- Event Status Update Trigger
CREATE OR REPLACE FUNCTION update_event_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If event is updated to published status
  IF OLD.status != 'published' AND NEW.status = 'published' THEN
    -- Update published_at timestamp
    NEW.published_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_status_update_trigger
BEFORE UPDATE ON events
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_event_status();

-- Function to track event views
CREATE OR REPLACE FUNCTION track_event_view()
RETURNS TRIGGER AS $$
DECLARE
  current_date DATE := CURRENT_DATE;
  analytics_record UUID;
BEGIN
  -- Check if we have a record for this event/date combination
  SELECT id INTO analytics_record
  FROM event_analytics
  WHERE event_id = NEW.event_id AND date = current_date;
  
  IF analytics_record IS NULL THEN
    -- Create new analytics record
    INSERT INTO event_analytics (event_id, date, views, unique_visitors)
    VALUES (NEW.event_id, current_date, 1, 1);
  ELSE
    -- Update existing record
    UPDATE event_analytics
    SET views = views + 1
    WHERE id = analytics_record;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create event_views table
CREATE TABLE event_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  ip_address TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  referrer TEXT
);

CREATE INDEX idx_event_views_event_id ON event_views(event_id);
CREATE INDEX idx_event_views_user_id ON event_views(user_id);
CREATE INDEX idx_event_views_viewed_at ON event_views(viewed_at);

-- Add the view tracking trigger
CREATE TRIGGER event_view_tracking_trigger
AFTER INSERT ON event_views
FOR EACH ROW
EXECUTE FUNCTION track_event_view();

-- =====================
-- VIEWS
-- =====================

-- Popular Events View (for discovering trending events)
CREATE VIEW popular_events AS
SELECT 
  e.id,
  e.title,
  e.start_date,
  e.end_date,
  e.format,
  e.status,
  e.visibility,
  e.author_id,
  e.book_id,
  e.publisher_id,
  e.group_id,
  COUNT(DISTINCT er.id) AS registration_count,
  COUNT(DISTINCT el.id) AS like_count,
  COUNT(DISTINCT ec.id) AS comment_count,
  COUNT(DISTINCT ev.id) AS view_count
FROM events e
LEFT JOIN event_registrations er ON e.id = er.event_id
LEFT JOIN event_likes el ON e.id = el.event_id
LEFT JOIN event_comments ec ON e.id = ec.event_id
LEFT JOIN event_views ev ON e.id = ev.event_id
WHERE e.status = 'published' 
AND e.start_date >= CURRENT_DATE
GROUP BY e.id
ORDER BY (
  COUNT(DISTINCT er.id) * 5 + -- Registrations weighted highest
  COUNT(DISTINCT el.id) * 2 + -- Likes weighted medium
  COUNT(DISTINCT ec.id) * 3 + -- Comments weighted higher
  COUNT(DISTINCT ev.id) -- Views weighted lowest
) DESC;

-- Upcoming Events By User Interest
CREATE VIEW user_recommended_events AS
SELECT 
  u.id AS user_id,
  e.id AS event_id,
  e.title,
  e.start_date,
  e.category_id,
  'author_follow' AS recommendation_reason
FROM users u
JOIN follows f ON u.id = f.follower_id
JOIN events e ON f.following_id = e.author_id::TEXT
WHERE f.target_type_id = (SELECT id FROM follow_target_types WHERE name = 'author')
AND e.status = 'published'
AND e.start_date >= CURRENT_DATE

UNION

SELECT 
  u.id AS user_id,
  e.id AS event_id,
  e.title,
  e.start_date,
  e.category_id,
  'publisher_follow' AS recommendation_reason
FROM users u
JOIN follows f ON u.id = f.follower_id
JOIN events e ON f.following_id = e.publisher_id::TEXT
WHERE f.target_type_id = (SELECT id FROM follow_target_types WHERE name = 'publisher')
AND e.status = 'published'
AND e.start_date >= CURRENT_DATE

UNION

SELECT 
  u.id AS user_id,
  e.id AS event_id,
  e.title,
  e.start_date,
  e.category_id,
  'group_member' AS recommendation_reason
FROM users u
JOIN group_members gm ON u.id = gm.user_id
JOIN events e ON gm.group_id = e.group_id
WHERE e.status = 'published'
AND e.start_date >= CURRENT_DATE

UNION

SELECT 
  ubi.user_id,
  e.id AS event_id,
  e.title,
  e.start_date,
  e.category_id,
  'book_interest' AS recommendation_reason
FROM user_book_interactions ubi
JOIN event_books eb ON ubi.book_id = eb.book_id
JOIN events e ON eb.event_id = e.id
WHERE ubi.interaction_type IN ('read', 'want_to_read', 'liked')
AND e.status = 'published'
AND e.start_date >= CURRENT_DATE; 