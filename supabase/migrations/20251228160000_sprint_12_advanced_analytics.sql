-- Sprint 12: Advanced Analytics System
-- Cohort Analysis, Retention Tracking, Churn Prediction, User Segmentation, Engagement Trends
-- Created: Dec 28, 2025

-- ====================================
-- 1. COHORT ANALYSIS & RETENTION TABLES
-- ====================================

-- Daily Active Users tracking
CREATE TABLE IF NOT EXISTS daily_active_users (
  id BIGSERIAL PRIMARY KEY,
  day DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'reading', 'social', 'discussion', 'admin'
  action_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(day, user_id, activity_type)
);

-- User Cohorts (grouped by signup date, feature adoption, etc.)
CREATE TABLE IF NOT EXISTS user_cohorts (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cohort_type VARCHAR(50) NOT NULL, -- 'signup_date', 'feature_adoption', 'custom'
  cohort_period VARCHAR(50), -- 'daily', 'weekly', 'monthly'
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}', -- Additional cohort metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cohort Membership (links users to cohorts)
CREATE TABLE IF NOT EXISTS cohort_members (
  id BIGSERIAL PRIMARY KEY,
  cohort_id BIGINT NOT NULL REFERENCES user_cohorts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(cohort_id, user_id)
);

-- Cohort Retention Snapshots (point-in-time retention metrics)
CREATE TABLE IF NOT EXISTS cohort_retention_snapshots (
  id BIGSERIAL PRIMARY KEY,
  cohort_id BIGINT NOT NULL REFERENCES user_cohorts(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  day_1_retention DECIMAL(5,2), -- percentage
  day_7_retention DECIMAL(5,2),
  day_30_retention DECIMAL(5,2),
  day_90_retention DECIMAL(5,2),
  year_1_retention DECIMAL(5,2),
  cohort_size INT, -- initial cohort size
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cohort_id, snapshot_date)
);

-- User Retention Milestones (track when users hit retention milestones)
CREATE TABLE IF NOT EXISTS user_retention_milestones (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type VARCHAR(50) NOT NULL, -- 'day_1', 'day_7', 'day_30', 'day_90', 'year_1'
  milestone_date DATE NOT NULL,
  days_since_signup INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, milestone_type, milestone_date)
);

-- ====================================
-- 2. CHURN PREDICTION & RISK TABLES
-- ====================================

-- User Churn Risk Scoring
CREATE TABLE IF NOT EXISTS user_churn_risk (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_score DECIMAL(5,2) NOT NULL DEFAULT 0, -- 0-100 scale
  risk_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  activity_trend DECIMAL(5,2), -- activity change percentage (positive = improving)
  engagement_trend DECIMAL(5,2), -- engagement change percentage
  feature_adoption_trend DECIMAL(5,2), -- feature adoption change percentage
  last_active_date DATE,
  days_since_last_activity INT,
  predicted_churn_date DATE, -- predicted date of churn
  confidence_score DECIMAL(5,2), -- 0-100, confidence in prediction
  contributing_factors JSONB DEFAULT '{}', -- reasons for risk score
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Churn Interventions (actions taken to prevent churn)
CREATE TABLE IF NOT EXISTS churn_interventions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intervention_type VARCHAR(50) NOT NULL, -- 'email', 'in_app_message', 'special_offer', 'personal_outreach'
  intervention_name VARCHAR(255),
  intervention_date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'engaged'
  engagement_status VARCHAR(50), -- 'no_response', 'opened', 'clicked', 'converted'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Intervention Effectiveness Tracking
CREATE TABLE IF NOT EXISTS intervention_effectiveness (
  id BIGSERIAL PRIMARY KEY,
  intervention_id BIGINT NOT NULL REFERENCES churn_interventions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pre_churn_risk_score DECIMAL(5,2),
  post_churn_risk_score DECIMAL(5,2),
  risk_reduction DECIMAL(5,2), -- percentage
  user_retention BOOLEAN DEFAULT FALSE, -- whether user was retained
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 3. USER SEGMENTATION TABLES
-- ====================================

-- User Segments (dynamic segments based on criteria)
CREATE TABLE IF NOT EXISTS user_segments (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  segment_type VARCHAR(50) NOT NULL, -- 'behavioral', 'demographic', 'engagement', 'activity'
  criteria JSONB NOT NULL, -- segment criteria definition
  is_active BOOLEAN DEFAULT TRUE,
  segment_size INT DEFAULT 0,
  last_calculated TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Segment Membership (links users to segments)
CREATE TABLE IF NOT EXISTS segment_members (
  id BIGSERIAL PRIMARY KEY,
  segment_id BIGINT NOT NULL REFERENCES user_segments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(segment_id, user_id)
);

-- Segment History (track membership changes)
CREATE TABLE IF NOT EXISTS segment_events (
  id BIGSERIAL PRIMARY KEY,
  segment_id BIGINT NOT NULL REFERENCES user_segments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'joined', 'left', 'criteria_change'
  event_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

-- ====================================
-- 4. ENGAGEMENT TRENDS & ANALYTICS TABLES
-- ====================================

-- Daily Engagement Metrics
CREATE TABLE IF NOT EXISTS daily_engagement_metrics (
  id BIGSERIAL PRIMARY KEY,
  day DATE NOT NULL,
  total_actions INT DEFAULT 0,
  unique_users INT DEFAULT 0,
  reading_actions INT DEFAULT 0,
  social_actions INT DEFAULT 0,
  discussion_actions INT DEFAULT 0,
  admin_actions INT DEFAULT 0,
  avg_session_duration_minutes DECIMAL(10,2),
  bounce_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(day)
);

-- Trending Topics (trending content across platform)
CREATE TABLE IF NOT EXISTS trending_topics (
  id BIGSERIAL PRIMARY KEY,
  topic_name VARCHAR(255) NOT NULL,
  topic_type VARCHAR(50) NOT NULL, -- 'book', 'author', 'genre', 'hashtag'
  trend_score DECIMAL(10,2) NOT NULL DEFAULT 0, -- computed trend strength
  mention_count INT DEFAULT 0,
  unique_users INT DEFAULT 0,
  trend_direction VARCHAR(20), -- 'rising', 'falling', 'stable'
  trend_date DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(topic_name, topic_type, trend_date)
);

-- Engagement Heatmap (hour-of-day × day-of-week patterns)
CREATE TABLE IF NOT EXISTS engagement_heatmap (
  id BIGSERIAL PRIMARY KEY,
  day_of_week INT NOT NULL, -- 0-6 (Sunday-Saturday)
  hour_of_day INT NOT NULL, -- 0-23
  engagement_score DECIMAL(10,2) NOT NULL DEFAULT 0,
  action_count INT DEFAULT 0,
  unique_users INT DEFAULT 0,
  trend_data JSONB DEFAULT '{}',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(day_of_week, hour_of_day)
);

-- ====================================
-- 5. INDEXES FOR PERFORMANCE
-- ====================================

CREATE INDEX idx_daily_active_users_user_id ON daily_active_users(user_id);
CREATE INDEX idx_daily_active_users_day ON daily_active_users(day);
CREATE INDEX idx_daily_active_users_activity_type ON daily_active_users(activity_type);

CREATE INDEX idx_user_cohorts_cohort_type ON user_cohorts(cohort_type);
CREATE INDEX idx_user_cohorts_is_active ON user_cohorts(is_active);

CREATE INDEX idx_cohort_members_cohort_id ON cohort_members(cohort_id);
CREATE INDEX idx_cohort_members_user_id ON cohort_members(user_id);
CREATE INDEX idx_cohort_members_is_active ON cohort_members(is_active);

CREATE INDEX idx_cohort_retention_cohort_id ON cohort_retention_snapshots(cohort_id);
CREATE INDEX idx_cohort_retention_snapshot_date ON cohort_retention_snapshots(snapshot_date);

CREATE INDEX idx_user_retention_milestones_user_id ON user_retention_milestones(user_id);
CREATE INDEX idx_user_retention_milestones_type ON user_retention_milestones(milestone_type);

CREATE INDEX idx_user_churn_risk_user_id ON user_churn_risk(user_id);
CREATE INDEX idx_user_churn_risk_level ON user_churn_risk(risk_level);
CREATE INDEX idx_user_churn_risk_score ON user_churn_risk(risk_score DESC);

CREATE INDEX idx_churn_interventions_user_id ON churn_interventions(user_id);
CREATE INDEX idx_churn_interventions_type ON churn_interventions(intervention_type);
CREATE INDEX idx_churn_interventions_status ON churn_interventions(status);

CREATE INDEX idx_segment_members_segment_id ON segment_members(segment_id);
CREATE INDEX idx_segment_members_user_id ON segment_members(user_id);
CREATE INDEX idx_segment_members_is_active ON segment_members(is_active);

CREATE INDEX idx_segment_events_segment_id ON segment_events(segment_id);
CREATE INDEX idx_segment_events_user_id ON segment_events(user_id);
CREATE INDEX idx_segment_events_type ON segment_events(event_type);

CREATE INDEX idx_daily_engagement_day ON daily_engagement_metrics(day);
CREATE INDEX idx_trending_topics_date ON trending_topics(trend_date);
CREATE INDEX idx_engagement_heatmap_day_hour ON engagement_heatmap(day_of_week, hour_of_day);

-- ====================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================

ALTER TABLE daily_active_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_retention_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_retention_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_churn_risk ENABLE ROW LEVEL SECURITY;
ALTER TABLE churn_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_effectiveness ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_heatmap ENABLE ROW LEVEL SECURITY;

-- Daily Active Users RLS
CREATE POLICY dau_select_own ON daily_active_users
  FOR SELECT
  USING (auth.uid() = user_id OR EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

CREATE POLICY dau_insert_service ON daily_active_users
  FOR INSERT
  WITH CHECK (TRUE);

-- User Cohorts RLS (analytics read-only for regular users, admin write)
CREATE POLICY cohorts_select_all ON user_cohorts
  FOR SELECT
  USING (TRUE);

CREATE POLICY cohorts_insert_admin ON user_cohorts
  FOR INSERT
  WITH CHECK (EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

CREATE POLICY cohorts_update_admin ON user_cohorts
  FOR UPDATE
  USING (EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- Cohort Members RLS
CREATE POLICY cohort_members_select ON cohort_members
  FOR SELECT
  USING (TRUE);

CREATE POLICY cohort_members_insert_admin ON cohort_members
  FOR INSERT
  WITH CHECK (EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- Cohort Retention RLS
CREATE POLICY cohort_retention_select ON cohort_retention_snapshots
  FOR SELECT
  USING (TRUE);

CREATE POLICY cohort_retention_insert_admin ON cohort_retention_snapshots
  FOR INSERT
  WITH CHECK (EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- User Retention Milestones RLS
CREATE POLICY retention_milestones_select ON user_retention_milestones
  FOR SELECT
  USING (auth.uid() = user_id OR EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- User Churn Risk RLS (admin only)
CREATE POLICY churn_risk_select ON user_churn_risk
  FOR SELECT
  USING (EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

CREATE POLICY churn_risk_insert_admin ON user_churn_risk
  FOR INSERT
  WITH CHECK (EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

CREATE POLICY churn_risk_update_admin ON user_churn_risk
  FOR UPDATE
  USING (EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- Churn Interventions RLS (admin only)
CREATE POLICY interventions_select ON churn_interventions
  FOR SELECT
  USING (auth.uid() = user_id OR EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

CREATE POLICY interventions_insert_admin ON churn_interventions
  FOR INSERT
  WITH CHECK (EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

CREATE POLICY interventions_update_admin ON churn_interventions
  FOR UPDATE
  USING (EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- User Segments RLS (everyone can view, admin write)
CREATE POLICY segments_select ON user_segments
  FOR SELECT
  USING (TRUE);

CREATE POLICY segments_insert_admin ON user_segments
  FOR INSERT
  WITH CHECK (EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

CREATE POLICY segments_update_admin ON user_segments
  FOR UPDATE
  USING (EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- Segment Members RLS
CREATE POLICY segment_members_select ON segment_members
  FOR SELECT
  USING (auth.uid() = user_id OR EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

CREATE POLICY segment_members_insert_admin ON segment_members
  FOR INSERT
  WITH CHECK (EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- Daily Engagement Metrics RLS (everyone can view)
CREATE POLICY daily_engagement_select ON daily_engagement_metrics
  FOR SELECT
  USING (TRUE);

CREATE POLICY daily_engagement_insert_admin ON daily_engagement_metrics
  FOR INSERT
  WITH CHECK (EXISTS(SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- Trending Topics RLS (everyone can view)
CREATE POLICY trending_topics_select ON trending_topics
  FOR SELECT
  USING (TRUE);

-- Engagement Heatmap RLS (everyone can view)
CREATE POLICY engagement_heatmap_select ON engagement_heatmap
  FOR SELECT
  USING (TRUE);

-- ====================================
-- 7. MATERIALIZED VIEWS
-- ====================================

-- Cohort Retention Summary (pre-calculated retention curves)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_cohort_retention AS
SELECT 
  cr.cohort_id,
  uc.name as cohort_name,
  cr.snapshot_date,
  cr.cohort_size,
  cr.day_1_retention,
  cr.day_7_retention,
  cr.day_30_retention,
  cr.day_90_retention,
  cr.year_1_retention,
  ROUND(COALESCE(cr.day_1_retention, 0), 2) as retention_d1,
  ROUND(COALESCE(cr.day_7_retention, 0), 2) as retention_d7,
  ROUND(COALESCE(cr.day_30_retention, 0), 2) as retention_d30,
  ROUND(COALESCE(cr.day_90_retention, 0), 2) as retention_d90,
  ROUND(COALESCE(cr.year_1_retention, 0), 2) as retention_y1
FROM cohort_retention_snapshots cr
JOIN user_cohorts uc ON cr.cohort_id = uc.id
ORDER BY cr.snapshot_date DESC, cr.cohort_id;

-- Engagement Trends Summary (pre-calculated trend data)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_engagement_trends AS
SELECT 
  day,
  total_actions,
  unique_users,
  reading_actions,
  social_actions,
  discussion_actions,
  admin_actions,
  ROUND(CAST(total_actions AS DECIMAL) / NULLIF(unique_users, 0), 2) as avg_actions_per_user,
  ROUND(avg_session_duration_minutes, 2) as avg_session_mins,
  ROUND(bounce_rate, 2) as bounce_pct,
  LAG(total_actions) OVER (ORDER BY day) as prev_day_actions,
  ROUND(CAST(total_actions - LAG(total_actions) OVER (ORDER BY day) AS DECIMAL) / NULLIF(LAG(total_actions) OVER (ORDER BY day), 0) * 100, 2) as daily_change_pct
FROM daily_engagement_metrics
ORDER BY day DESC;

-- ====================================
-- 8. TRIGGER FUNCTIONS & TRIGGERS
-- ====================================

-- Update timestamps on table modifications
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_cohorts_timestamp BEFORE UPDATE ON user_cohorts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_churn_risk_timestamp BEFORE UPDATE ON user_churn_risk
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_segments_timestamp BEFORE UPDATE ON user_segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_churn_interventions_timestamp BEFORE UPDATE ON churn_interventions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calculate retention milestones when users hit them
CREATE OR REPLACE FUNCTION calculate_retention_milestones()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.day = CURRENT_DATE THEN
    -- Check for retention milestones (simplified - production would need more logic)
    INSERT INTO user_retention_milestones (user_id, milestone_type, milestone_date, days_since_signup)
    SELECT 
      NEW.user_id,
      'day_1',
      CURRENT_DATE,
      1
    WHERE NOT EXISTS (
      SELECT 1 FROM user_retention_milestones 
      WHERE user_id = NEW.user_id AND milestone_type = 'day_1'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_retention_milestones AFTER INSERT ON daily_active_users
  FOR EACH ROW EXECUTE FUNCTION calculate_retention_milestones();

-- Update segment membership count
CREATE OR REPLACE FUNCTION update_segment_size()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_segments 
  SET segment_size = (SELECT COUNT(*) FROM segment_members WHERE segment_id = NEW.segment_id AND is_active = TRUE)
  WHERE id = NEW.segment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_segment_size AFTER INSERT OR DELETE ON segment_members
  FOR EACH ROW EXECUTE FUNCTION update_segment_size();

-- ====================================
-- 9. HELPER FUNCTIONS
-- ====================================

-- Calculate cohort retention rate
CREATE OR REPLACE FUNCTION get_cohort_retention_rate(
  p_cohort_id BIGINT,
  p_reference_day DATE,
  p_retention_day INT
) RETURNS DECIMAL AS $$
DECLARE
  v_users_at_reference INT;
  v_users_at_retention INT;
  v_retention_rate DECIMAL;
BEGIN
  -- Count users active in reference day
  SELECT COUNT(DISTINCT user_id) INTO v_users_at_reference
  FROM daily_active_users
  WHERE user_id IN (SELECT user_id FROM cohort_members WHERE cohort_id = p_cohort_id)
  AND day = p_reference_day;
  
  -- Count users active in retention day
  SELECT COUNT(DISTINCT user_id) INTO v_users_at_retention
  FROM daily_active_users
  WHERE user_id IN (SELECT user_id FROM cohort_members WHERE cohort_id = p_cohort_id)
  AND day = p_reference_day + (p_retention_day || ' days')::INTERVAL;
  
  IF v_users_at_reference = 0 THEN
    RETURN 0;
  END IF;
  
  v_retention_rate = ROUND(CAST(v_users_at_retention AS DECIMAL) / v_users_at_reference * 100, 2);
  RETURN v_retention_rate;
END;
$$ LANGUAGE plpgsql;

-- Calculate churn risk score
CREATE OR REPLACE FUNCTION calculate_churn_risk_score(
  p_activity_trend DECIMAL,
  p_engagement_trend DECIMAL,
  p_feature_adoption_trend DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  v_risk_score DECIMAL;
BEGIN
  -- Weighted calculation: activity (40%), engagement (35%), feature adoption (25%)
  v_risk_score = (
    (COALESCE(p_activity_trend, 0) * -0.4) +
    (COALESCE(p_engagement_trend, 0) * -0.35) +
    (COALESCE(p_feature_adoption_trend, 0) * -0.25)
  ) * 100;
  
  -- Clamp between 0 and 100
  v_risk_score = GREATEST(0, LEAST(100, v_risk_score));
  
  RETURN ROUND(v_risk_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Get risk level from score
CREATE OR REPLACE FUNCTION get_risk_level(p_risk_score DECIMAL) RETURNS VARCHAR AS $$
BEGIN
  IF p_risk_score < 25 THEN
    RETURN 'low';
  ELSIF p_risk_score < 50 THEN
    RETURN 'medium';
  ELSIF p_risk_score < 75 THEN
    RETURN 'high';
  ELSE
    RETURN 'critical';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_user_id UUID,
  p_days_lookback INT DEFAULT 30
) RETURNS DECIMAL AS $$
DECLARE
  v_actions_count INT;
  v_days_active INT;
  v_engagement_score DECIMAL;
  v_max_possible_actions INT;
BEGIN
  -- Count actions in lookback period
  SELECT COUNT(*) INTO v_actions_count
  FROM daily_active_users
  WHERE user_id = p_user_id
  AND day >= CURRENT_DATE - (p_days_lookback || ' days')::INTERVAL;
  
  -- Count days active
  SELECT COUNT(DISTINCT day) INTO v_days_active
  FROM daily_active_users
  WHERE user_id = p_user_id
  AND day >= CURRENT_DATE - (p_days_lookback || ' days')::INTERVAL;
  
  -- Max possible is 20 actions per day
  v_max_possible_actions = p_days_lookback * 20;
  
  IF v_max_possible_actions = 0 THEN
    RETURN 0;
  END IF;
  
  v_engagement_score = (
    (CAST(v_actions_count AS DECIMAL) / v_max_possible_actions) *
    (CAST(v_days_active AS DECIMAL) / p_days_lookback) * 100
  );
  
  RETURN ROUND(v_engagement_score, 2);
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- 10. GRANTS (for service role)
-- ====================================

GRANT ALL ON daily_active_users TO service_role;
GRANT ALL ON user_cohorts TO service_role;
GRANT ALL ON cohort_members TO service_role;
GRANT ALL ON cohort_retention_snapshots TO service_role;
GRANT ALL ON user_retention_milestones TO service_role;
GRANT ALL ON user_churn_risk TO service_role;
GRANT ALL ON churn_interventions TO service_role;
GRANT ALL ON intervention_effectiveness TO service_role;
GRANT ALL ON user_segments TO service_role;
GRANT ALL ON segment_members TO service_role;
GRANT ALL ON segment_events TO service_role;
GRANT ALL ON daily_engagement_metrics TO service_role;
GRANT ALL ON trending_topics TO service_role;
GRANT ALL ON engagement_heatmap TO service_role;

GRANT ALL ON mv_cohort_retention TO service_role;
GRANT ALL ON mv_engagement_trends TO service_role;
