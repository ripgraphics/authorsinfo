-- Sprint 11: Engagement System - Multi-Channel Notifications (CLEAN VERSION)
-- Created: December 28, 2025
-- Scope: Complete notification infrastructure with in-app, email, and push support
-- Single Source of Truth: Supabase PostgreSQL
-- NOTE: This is a clean deployment after dropping existing partial tables

-- ============================================================================
-- DROP EXISTING TABLES (if any from previous incomplete attempts)
-- ============================================================================
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;
DROP TABLE IF EXISTS public.email_notification_logs CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.mv_push_device_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.mv_email_delivery_status CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.mv_notification_summary CASCADE;

-- ============================================================================
-- TABLE: notifications
-- Purpose: Core notification records for all channels
-- ============================================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'friend_request', 'message', 'comment', 'mention', 'achievement', 'challenge', 'streak', 'event', 'admin'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT NULL, -- Flexible payload for different notification types
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- ============================================================================
-- TABLE: notification_preferences
-- Purpose: User-level granular notification control
-- ============================================================================
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Per-type toggles
  friend_request_enabled BOOLEAN DEFAULT TRUE,
  message_enabled BOOLEAN DEFAULT TRUE,
  comment_enabled BOOLEAN DEFAULT TRUE,
  mention_enabled BOOLEAN DEFAULT TRUE,
  achievement_enabled BOOLEAN DEFAULT TRUE,
  challenge_enabled BOOLEAN DEFAULT TRUE,
  streak_enabled BOOLEAN DEFAULT TRUE,
  event_enabled BOOLEAN DEFAULT TRUE,
  admin_enabled BOOLEAN DEFAULT TRUE,
  
  -- Channel preferences
  in_app_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  
  -- Frequency preferences (immediate, daily, weekly, monthly, never)
  email_frequency VARCHAR(20) DEFAULT 'immediate',
  push_frequency VARCHAR(20) DEFAULT 'immediate',
  
  -- Quiet hours (do not disturb)
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '22:00:00', -- 10 PM
  quiet_hours_end TIME DEFAULT '08:00:00', -- 8 AM
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Global mute
  all_notifications_muted BOOLEAN DEFAULT FALSE,
  muted_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE: email_notification_logs
-- Purpose: Track email delivery for compliance and debugging
-- ============================================================================
CREATE TABLE public.email_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sending', 'sent', 'failed', 'bounced', 'unsubscribed'
  error_message TEXT DEFAULT NULL,
  attempt_count INTEGER DEFAULT 1,
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  bounced_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  unsubscribe_token VARCHAR(255) UNIQUE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE: push_subscriptions
-- Purpose: Device registration for web and native push notifications
-- ============================================================================
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_type VARCHAR(50) NOT NULL, -- 'web', 'ios', 'android'
  endpoint VARCHAR(500) NOT NULL, -- Firebase/FCM endpoint
  auth_key VARCHAR(500) DEFAULT NULL,
  p256dh_key VARCHAR(500) DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- ============================================================================
-- MATERIALIZED VIEW: mv_notification_summary
-- Purpose: Aggregate notification metrics per user
-- ============================================================================
CREATE MATERIALIZED VIEW public.mv_notification_summary AS
SELECT
  n.recipient_id AS user_id,
  COUNT(*) AS total_notifications,
  COUNT(*) FILTER (WHERE n.is_read = FALSE) AS unread_count,
  COUNT(*) FILTER (WHERE n.type = 'friend_request') AS friend_request_count,
  COUNT(*) FILTER (WHERE n.type = 'message') AS message_count,
  COUNT(*) FILTER (WHERE n.type = 'comment') AS comment_count,
  COUNT(*) FILTER (WHERE n.type = 'mention') AS mention_count,
  COUNT(*) FILTER (WHERE n.type = 'achievement') AS achievement_count,
  COUNT(*) FILTER (WHERE n.type = 'challenge') AS challenge_count,
  COUNT(*) FILTER (WHERE n.type = 'streak') AS streak_count,
  COUNT(*) FILTER (WHERE n.type = 'event') AS event_count,
  COUNT(*) FILTER (WHERE n.type = 'admin') AS admin_count,
  MAX(n.created_at) AS last_notification_time
FROM public.notifications n
GROUP BY n.recipient_id;

-- ============================================================================
-- MATERIALIZED VIEW: mv_email_delivery_status
-- Purpose: Daily email delivery health metrics
-- ============================================================================
CREATE MATERIALIZED VIEW public.mv_email_delivery_status AS
SELECT
  DATE(e.created_at) AS delivery_date,
  COUNT(*) AS total_sent,
  COUNT(*) FILTER (WHERE e.status = 'sent') AS successfully_sent,
  COUNT(*) FILTER (WHERE e.status = 'failed') AS failed_count,
  COUNT(*) FILTER (WHERE e.status = 'bounced') AS bounced_count,
  COUNT(*) FILTER (WHERE e.status = 'unsubscribed') AS unsubscribed_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE e.status = 'sent') / NULLIF(COUNT(*), 0), 2) AS success_rate
FROM public.email_notification_logs e
GROUP BY DATE(e.created_at);

-- ============================================================================
-- MATERIALIZED VIEW: mv_push_device_summary
-- Purpose: Active push devices per user by type
-- ============================================================================
CREATE MATERIALIZED VIEW public.mv_push_device_summary AS
SELECT
  p.user_id,
  COUNT(*) FILTER (WHERE p.device_type = 'web' AND p.is_active) AS web_devices,
  COUNT(*) FILTER (WHERE p.device_type = 'ios' AND p.is_active) AS ios_devices,
  COUNT(*) FILTER (WHERE p.device_type = 'android' AND p.is_active) AS android_devices,
  COUNT(*) FILTER (WHERE p.is_active) AS total_active_devices,
  MAX(p.last_used_at) AS last_activity
FROM public.push_subscriptions p
GROUP BY p.user_id;

-- ============================================================================
-- FUNCTION: create_default_notification_preferences
-- Purpose: Auto-create default notification preferences for new users
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: is_quiet_hours
-- Purpose: Check if current time (in user's timezone) is within quiet hours
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_quiet_hours(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  prefs RECORD;
  user_time TIME;
BEGIN
  SELECT * INTO prefs FROM public.notification_preferences WHERE user_id = $1;
  
  IF prefs IS NULL OR prefs.quiet_hours_enabled = FALSE THEN
    RETURN FALSE;
  END IF;
  
  -- Get current time in user's timezone
  user_time := (NOW() AT TIME ZONE prefs.timezone)::TIME;
  
  -- Check if current time falls within quiet hours
  IF prefs.quiet_hours_start < prefs.quiet_hours_end THEN
    -- Normal case (e.g., 22:00 to 08:00 is split across midnight)
    RETURN user_time >= prefs.quiet_hours_start OR user_time < prefs.quiet_hours_end;
  ELSE
    -- Range wraps around midnight (e.g., 22:00 to 08:00)
    RETURN user_time >= prefs.quiet_hours_start OR user_time < prefs.quiet_hours_end;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: should_send_notification
-- Purpose: Determine if notification should be sent based on user preferences
-- ============================================================================
CREATE OR REPLACE FUNCTION public.should_send_notification(
  user_id UUID,
  notification_type VARCHAR(50),
  channel VARCHAR(20)
)
RETURNS BOOLEAN AS $$
DECLARE
  prefs RECORD;
  type_enabled BOOLEAN;
  channel_enabled BOOLEAN;
BEGIN
  SELECT * INTO prefs FROM public.notification_preferences WHERE user_id = $1;
  
  IF prefs IS NULL THEN
    RETURN TRUE; -- Default to true if no preferences
  END IF;
  
  -- Check global mute
  IF prefs.all_notifications_muted = TRUE THEN
    IF prefs.muted_until > NOW() THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check quiet hours for push and email (not in-app)
  IF channel IN ('email', 'push') AND public.is_quiet_hours(user_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Check per-type enablement
  type_enabled := CASE notification_type
    WHEN 'friend_request' THEN prefs.friend_request_enabled
    WHEN 'message' THEN prefs.message_enabled
    WHEN 'comment' THEN prefs.comment_enabled
    WHEN 'mention' THEN prefs.mention_enabled
    WHEN 'achievement' THEN prefs.achievement_enabled
    WHEN 'challenge' THEN prefs.challenge_enabled
    WHEN 'streak' THEN prefs.streak_enabled
    WHEN 'event' THEN prefs.event_enabled
    WHEN 'admin' THEN prefs.admin_enabled
    ELSE TRUE
  END;
  
  IF type_enabled = FALSE THEN
    RETURN FALSE;
  END IF;
  
  -- Check channel enablement
  channel_enabled := CASE channel
    WHEN 'in_app' THEN prefs.in_app_enabled
    WHEN 'email' THEN prefs.email_enabled
    WHEN 'push' THEN prefs.push_enabled
    ELSE FALSE
  END;
  
  RETURN channel_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: update_email_log_status
-- Purpose: Update email delivery status with retry tracking
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_email_log_status(
  log_id UUID,
  new_status VARCHAR(20),
  error_msg TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.email_notification_logs
  SET
    status = new_status,
    error_message = error_msg,
    attempt_count = attempt_count + 1,
    last_attempt_at = NOW(),
    sent_at = CASE WHEN new_status = 'sent' THEN NOW() ELSE sent_at END,
    bounced_at = CASE WHEN new_status = 'bounced' THEN NOW() ELSE bounced_at END,
    updated_at = NOW()
  WHERE id = log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Auto-update notifications.updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.notify_on_notifications_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at_trigger
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_notifications_update();

-- ============================================================================
-- TRIGGER: Auto-update notification_preferences.updated_at
-- ============================================================================
CREATE TRIGGER notification_preferences_updated_at_trigger
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_notifications_update();

-- ============================================================================
-- TRIGGER: Auto-update email_notification_logs.updated_at
-- ============================================================================
CREATE TRIGGER email_notification_logs_updated_at_trigger
BEFORE UPDATE ON public.email_notification_logs
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_notifications_update();

-- ============================================================================
-- TRIGGER: Auto-update push_subscriptions.updated_at
-- ============================================================================
CREATE TRIGGER push_subscriptions_updated_at_trigger
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_notifications_update();

-- ============================================================================
-- TRIGGER: Auto-create default preferences on user signup
-- ============================================================================
CREATE TRIGGER create_preferences_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_default_notification_preferences();

-- ============================================================================
-- INDEXES: Performance optimization
-- ============================================================================
CREATE INDEX idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_recipient_created ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX idx_email_notification_logs_notification_id ON public.email_notification_logs(notification_id);
CREATE INDEX idx_email_notification_logs_status ON public.email_notification_logs(status);
CREATE INDEX idx_email_notification_logs_created_at ON public.email_notification_logs(created_at DESC);
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_device_id ON public.push_subscriptions(device_id);
CREATE INDEX idx_push_subscriptions_is_active ON public.push_subscriptions(is_active);

-- ============================================================================
-- ROW-LEVEL SECURITY POLICIES
-- ============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Notifications: Users can read their own
CREATE POLICY notifications_read_own ON public.notifications
  FOR SELECT USING (
    recipient_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- Notifications: Users can mark their own as read
CREATE POLICY notifications_mark_read_own ON public.notifications
  FOR UPDATE USING (
    recipient_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  )
  WITH CHECK (
    recipient_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- Notifications: System can create/update
CREATE POLICY notifications_system_write ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY notifications_system_update ON public.notifications
  FOR UPDATE WITH CHECK (true);

-- Notification Preferences: Users can manage their own
CREATE POLICY notification_preferences_own ON public.notification_preferences
  FOR ALL USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- Notification Preferences: System can create
CREATE POLICY notification_preferences_system ON public.notification_preferences
  FOR INSERT WITH CHECK (true);

-- Email Logs: Admins only
CREATE POLICY email_logs_admin ON public.email_notification_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY email_logs_system ON public.email_notification_logs
  FOR INSERT WITH CHECK (true);

-- Push Subscriptions: Users can manage their own
CREATE POLICY push_subscriptions_own ON public.push_subscriptions
  FOR ALL USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- Push Subscriptions: System can create
CREATE POLICY push_subscriptions_system ON public.push_subscriptions
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- INITIALIZATION: Create default preferences for existing users
-- ============================================================================
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
