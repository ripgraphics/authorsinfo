-- Advanced Event System Features
-- This script adds enterprise-grade enhancements to the event management system

-- =====================
-- LIVESTREAMING INTEGRATION
-- =====================

CREATE TABLE event_livestreams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  provider TEXT CHECK (provider IN ('youtube', 'vimeo', 'twitch', 'facebook', 'custom')),
  stream_key TEXT,
  stream_url TEXT NOT NULL,
  embed_code TEXT,
  is_active BOOLEAN DEFAULT false,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  recording_url TEXT,
  viewer_count INTEGER DEFAULT 0,
  max_concurrent_viewers INTEGER DEFAULT 0,
  requires_ticket BOOLEAN DEFAULT true,
  ticket_types UUID[] DEFAULT '{}'::UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_livestreams_event_id ON event_livestreams(event_id);
CREATE INDEX idx_event_livestreams_is_active ON event_livestreams(is_active);

-- Function to validate livestream activation
CREATE OR REPLACE FUNCTION validate_livestream_activation()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's already an active livestream for this event
  IF NEW.is_active AND EXISTS (
    SELECT 1 FROM event_livestreams 
    WHERE event_id = NEW.event_id 
    AND is_active = true 
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'There is already an active livestream for this event';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_livestream_activation_trigger
BEFORE INSERT OR UPDATE ON event_livestreams
FOR EACH ROW
EXECUTE FUNCTION validate_livestream_activation();

-- =====================
-- WAITLIST MANAGEMENT
-- =====================

CREATE TABLE event_waitlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id UUID REFERENCES ticket_types(id),
  user_id UUID NOT NULL REFERENCES users(id),
  position INTEGER NOT NULL,
  status TEXT CHECK (status IN ('waiting', 'notified', 'converted', 'expired')),
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  expiration_time TIMESTAMP WITH TIME ZONE,
  converted_to_registration_id UUID REFERENCES event_registrations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_waitlists_event_id ON event_waitlists(event_id);
CREATE INDEX idx_event_waitlists_user_id ON event_waitlists(user_id);
CREATE INDEX idx_event_waitlists_ticket_type_id ON event_waitlists(ticket_type_id);
CREATE INDEX idx_event_waitlists_status ON event_waitlists(status);

-- Function to handle waitlist positions
CREATE OR REPLACE FUNCTION manage_waitlist_position()
RETURNS TRIGGER AS $$
DECLARE
  next_position INTEGER;
BEGIN
  -- For new waitlist entries, calculate the next position
  IF TG_OP = 'INSERT' THEN
    SELECT COALESCE(MAX(position), 0) + 1 INTO next_position
    FROM event_waitlists
    WHERE event_id = NEW.event_id
    AND (ticket_type_id = NEW.ticket_type_id OR (ticket_type_id IS NULL AND NEW.ticket_type_id IS NULL));
    
    NEW.position := next_position;
  -- For waitlist removal, reorder positions
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE event_waitlists
    SET position = position - 1
    WHERE event_id = OLD.event_id
    AND (ticket_type_id = OLD.ticket_type_id OR (ticket_type_id IS NULL AND OLD.ticket_type_id IS NULL))
    AND position > OLD.position;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manage_waitlist_position_trigger
BEFORE INSERT ON event_waitlists
FOR EACH ROW
EXECUTE FUNCTION manage_waitlist_position();

CREATE TRIGGER reorder_waitlist_trigger
AFTER DELETE ON event_waitlists
FOR EACH ROW
EXECUTE FUNCTION manage_waitlist_position();

-- Function to notify waitlist when tickets become available
CREATE OR REPLACE FUNCTION notify_waitlist_when_ticket_available()
RETURNS TRIGGER AS $$
DECLARE
  waitlist_entry RECORD;
BEGIN
  -- When a ticket becomes available (refunded, canceled), notify waitlist
  IF OLD.status = 'purchased' AND NEW.status IN ('refunded', 'cancelled') THEN
    -- Find the first person on the waitlist for this ticket type
    SELECT * INTO waitlist_entry
    FROM event_waitlists
    WHERE event_id = NEW.event_id
    AND ticket_type_id = NEW.ticket_type_id
    AND status = 'waiting'
    ORDER BY position
    LIMIT 1;
    
    -- If there's someone on the waitlist, update their status to notified
    IF waitlist_entry.id IS NOT NULL THEN
      UPDATE event_waitlists
      SET status = 'notified',
          notification_sent_at = NOW(),
          expiration_time = NOW() + INTERVAL '24 hours',
          updated_at = NOW()
      WHERE id = waitlist_entry.id;
      
      -- Here you would trigger a notification to the user
      -- This is just schema, we'd handle the actual notification in application code
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_waitlist_trigger
AFTER UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION notify_waitlist_when_ticket_available();

-- =====================
-- EVENT FEEDBACK SYSTEM
-- =====================

CREATE TABLE event_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_anonymous BOOLEAN DEFAULT false,
  requires_ticket BOOLEAN DEFAULT true,
  available_from TIMESTAMP WITH TIME ZONE,
  available_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_surveys_event_id ON event_surveys(event_id);
CREATE INDEX idx_event_surveys_is_active ON event_surveys(is_active);

CREATE TABLE survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES event_surveys(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('rating', 'text', 'multiple_choice', 'checkbox')),
  options JSONB,
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_survey_questions_survey_id ON survey_questions(survey_id);

CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES event_surveys(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id), -- Nullable for anonymous responses
  registration_id UUID REFERENCES event_registrations(id),
  response_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX idx_survey_responses_registration_id ON survey_responses(registration_id);

-- Function to validate survey responses against required questions
CREATE OR REPLACE FUNCTION validate_survey_response()
RETURNS TRIGGER AS $$
DECLARE
  required_question_ids UUID[];
  provided_question_ids TEXT[];
BEGIN
  -- Get all required question IDs for this survey
  SELECT ARRAY_AGG(id) INTO required_question_ids
  FROM survey_questions
  WHERE survey_id = NEW.survey_id
  AND is_required = true;
  
  -- Check if response data is missing any required questions
  IF required_question_ids IS NOT NULL THEN
    SELECT ARRAY_AGG(key) INTO provided_question_ids
    FROM jsonb_object_keys(NEW.response_data) AS key;
    
    FOR i IN 1..array_length(required_question_ids, 1) LOOP
      IF NOT required_question_ids[i]::TEXT = ANY(provided_question_ids) THEN
        RAISE EXCEPTION 'Missing response for required question: %', required_question_ids[i];
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_survey_response_trigger
BEFORE INSERT ON survey_responses
FOR EACH ROW
EXECUTE FUNCTION validate_survey_response();

-- =====================
-- CALENDAR INTEGRATION
-- =====================

CREATE TABLE event_calendar_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  calendar_type TEXT CHECK (calendar_type IN ('google', 'apple', 'outlook', 'ical')),
  calendar_event_id TEXT,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_calendar_exports_event_id ON event_calendar_exports(event_id);
CREATE INDEX idx_event_calendar_exports_user_id ON event_calendar_exports(user_id);
CREATE UNIQUE INDEX idx_unique_calendar_export ON event_calendar_exports(event_id, user_id, calendar_type);

-- =====================
-- AUTHOR READING SERIES
-- =====================

CREATE TABLE reading_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  author_id INTEGER REFERENCES authors(id),
  publisher_id INTEGER REFERENCES publishers(id),
  organizer_id UUID NOT NULL REFERENCES users(id),
  cover_image_id INTEGER REFERENCES images(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reading_series_author_id ON reading_series(author_id);
CREATE INDEX idx_reading_series_publisher_id ON reading_series(publisher_id);
CREATE INDEX idx_reading_series_organizer_id ON reading_series(organizer_id);

CREATE TABLE series_events (
  series_id UUID NOT NULL REFERENCES reading_series(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (series_id, event_id)
);

CREATE INDEX idx_series_events_series_id ON series_events(series_id);
CREATE INDEX idx_series_events_event_id ON series_events(event_id);

-- Function to manage event numbers within a series
CREATE OR REPLACE FUNCTION manage_series_event_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- If event_number wasn't provided, auto-assign the next number
  IF NEW.event_number IS NULL THEN
    SELECT COALESCE(MAX(event_number), 0) + 1 INTO next_number
    FROM series_events
    WHERE series_id = NEW.series_id;
    
    NEW.event_number := next_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manage_series_event_number_trigger
BEFORE INSERT ON series_events
FOR EACH ROW
EXECUTE FUNCTION manage_series_event_number();

-- =====================
-- SPONSORSHIP MANAGEMENT
-- =====================

CREATE TABLE event_sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  sponsor_level TEXT CHECK (sponsor_level IN ('platinum', 'gold', 'silver', 'bronze', 'partner', 'media')),
  display_order INTEGER,
  contribution_amount NUMERIC,
  currency TEXT DEFAULT 'USD',
  is_featured BOOLEAN DEFAULT false,
  benefits_description TEXT,
  contact_name TEXT,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_sponsors_event_id ON event_sponsors(event_id);
CREATE INDEX idx_event_sponsors_sponsor_level ON event_sponsors(sponsor_level);
CREATE INDEX idx_event_sponsors_is_featured ON event_sponsors(is_featured);

-- =====================
-- ADVANCED ANALYTICS
-- =====================

-- View for comprehensive event performance metrics
CREATE OR REPLACE VIEW event_performance_metrics AS
SELECT 
  e.id,
  e.title,
  e.start_date,
  e.is_free,
  e.max_attendees,
  COUNT(DISTINCT er.id) AS registration_count,
  COALESCE(SUM(pt.amount) FILTER (WHERE pt.transaction_type = 'purchase' AND pt.status = 'completed'), 0) AS total_revenue,
  COALESCE(ef.net_revenue, 0) AS net_revenue,
  COUNT(DISTINCT el.id) AS likes_count,
  COUNT(DISTINCT ec.id) AS comments_count,
  COUNT(DISTINCT es.id) AS shares_count,
  COUNT(DISTINCT ev.id) AS views_count,
  COUNT(DISTINCT er.id) FILTER (WHERE er.registration_status = 'attended') AS attendance_count,
  CASE WHEN e.max_attendees > 0 THEN 
    ROUND((COUNT(DISTINCT er.id)::numeric / e.max_attendees) * 100, 2)
  ELSE NULL END AS capacity_percentage,
  CASE WHEN COUNT(DISTINCT er.id) > 0 THEN
    ROUND((COUNT(DISTINCT er.id) FILTER (WHERE er.registration_status = 'attended')::numeric / 
          COUNT(DISTINCT er.id)) * 100, 2)
  ELSE 0 END AS attendance_rate,
  COUNT(DISTINCT ew.id) AS waitlist_count,
  COALESCE(
    (SELECT AVG((response_data->>'satisfaction')::numeric)
     FROM survey_responses sr
     JOIN event_surveys es ON sr.survey_id = es.id
     WHERE es.event_id = e.id
     AND response_data ? 'satisfaction'), 
    NULL
  ) AS avg_satisfaction
FROM events e
LEFT JOIN event_registrations er ON e.id = er.event_id
LEFT JOIN payment_transactions pt ON er.id = pt.registration_id
LEFT JOIN event_financials ef ON e.id = ef.event_id
LEFT JOIN event_likes el ON e.id = el.event_id
LEFT JOIN event_comments ec ON e.id = ec.event_id
LEFT JOIN event_shares es ON e.id = es.event_id
LEFT JOIN event_views ev ON e.id = ev.event_id
LEFT JOIN event_waitlists ew ON e.id = ew.event_id
GROUP BY e.id, ef.net_revenue;

-- View for series performance tracking
CREATE OR REPLACE VIEW series_performance_metrics AS
SELECT 
  rs.id AS series_id,
  rs.title AS series_title,
  COUNT(se.event_id) AS total_events,
  AVG(epm.registration_count) AS avg_registrations_per_event,
  SUM(epm.total_revenue) AS total_series_revenue,
  SUM(epm.attendance_count) AS total_attendance,
  AVG(epm.attendance_rate) AS avg_attendance_rate
FROM reading_series rs
LEFT JOIN series_events se ON rs.id = se.series_id
LEFT JOIN event_performance_metrics epm ON se.event_id = epm.id
GROUP BY rs.id, rs.title;

-- View for author event performance
CREATE OR REPLACE VIEW author_event_metrics AS
SELECT 
  a.id AS author_id,
  a.name AS author_name,
  COUNT(DISTINCT e.id) AS total_events,
  SUM(epm.registration_count) AS total_registrations,
  SUM(epm.total_revenue) AS total_revenue,
  AVG(epm.attendance_rate) AS avg_attendance_rate,
  COUNT(DISTINCT rs.id) AS total_series
FROM authors a
LEFT JOIN events e ON a.id = e.author_id
LEFT JOIN event_performance_metrics epm ON e.id = epm.id
LEFT JOIN reading_series rs ON a.id = rs.author_id
GROUP BY a.id, a.name;

-- =====================
-- REAL-TIME CHAT FOR EVENTS
-- =====================

CREATE TABLE event_chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_moderated BOOLEAN DEFAULT true,
  moderator_ids UUID[] DEFAULT '{}'::UUID[],
  requires_ticket BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_chat_rooms_event_id ON event_chat_rooms(event_id);
CREATE INDEX idx_event_chat_rooms_is_active ON event_chat_rooms(is_active);

CREATE TABLE event_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID NOT NULL REFERENCES event_chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  hidden_by UUID REFERENCES users(id),
  hidden_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_chat_messages_chat_room_id ON event_chat_messages(chat_room_id);
CREATE INDEX idx_event_chat_messages_user_id ON event_chat_messages(user_id);
CREATE INDEX idx_event_chat_messages_created_at ON event_chat_messages(created_at);

-- Function to check if user is allowed to post in chat
CREATE OR REPLACE FUNCTION validate_chat_message()
RETURNS TRIGGER AS $$
DECLARE
  chat_room RECORD;
  has_ticket BOOLEAN;
BEGIN
  -- Get chat room details
  SELECT * INTO chat_room FROM event_chat_rooms WHERE id = NEW.chat_room_id;
  
  -- If chat room requires ticket, check if user has one
  IF chat_room.requires_ticket THEN
    SELECT EXISTS (
      SELECT 1 FROM tickets t
      JOIN event_registrations er ON t.registration_id = er.id
      WHERE t.event_id = chat_room.event_id
      AND t.user_id = NEW.user_id
      AND t.status IN ('purchased', 'checked_in')
    ) INTO has_ticket;
    
    IF NOT has_ticket THEN
      RAISE EXCEPTION 'User must have a valid ticket to post in this chat room';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_chat_message_trigger
BEFORE INSERT ON event_chat_messages
FOR EACH ROW
EXECUTE FUNCTION validate_chat_message(); 