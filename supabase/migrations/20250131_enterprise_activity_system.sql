-- Enterprise Activity System Migration
-- Adds performance optimizations, constraints, and enterprise features

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_activity_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_entity_type ON activities(entity_type);
CREATE INDEX IF NOT EXISTS idx_activities_entity_id ON activities(entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_user_activity_entity ON activities(user_id, activity_type, entity_type, entity_id);

-- Composite index for duplicate checking
CREATE INDEX IF NOT EXISTS idx_activities_duplicate_check ON activities(user_id, activity_type, entity_type, entity_id, created_at);

-- Add check constraint for activity types
ALTER TABLE activities ADD CONSTRAINT IF NOT EXISTS activities_activity_type_check 
CHECK (activity_type IN (
  'user_registered', 'user_profile_updated', 'user_login', 'user_logout',
  'book_added', 'book_updated', 'book_deleted', 'book_reviewed', 'book_rated',
  'author_created', 'author_updated', 'author_deleted',
  'publisher_created', 'publisher_updated', 'publisher_deleted',
  'group_created', 'group_joined', 'group_left', 'group_updated',
  'reading_started', 'reading_finished', 'reading_paused', 'reading_resumed',
  'friend_requested', 'friend_accepted', 'friend_declined',
  'comment_added', 'comment_updated', 'comment_deleted',
  'post_created', 'post_updated', 'post_deleted'
));

-- Add check constraint for entity types
ALTER TABLE activities ADD CONSTRAINT IF NOT EXISTS activities_entity_type_check 
CHECK (entity_type IN ('user', 'book', 'author', 'publisher', 'group', 'event', 'review', 'comment', 'post'));

-- Add metadata column for enterprise features
ALTER TABLE activities ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add batch tracking column
ALTER TABLE activities ADD COLUMN IF NOT EXISTS batch_id TEXT;

-- Create activity analytics view
CREATE OR REPLACE VIEW activity_analytics AS
SELECT 
  DATE(created_at) as activity_date,
  activity_type,
  entity_type,
  COUNT(*) as activity_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT entity_id) as unique_entities
FROM activities 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), activity_type, entity_type
ORDER BY activity_date DESC, activity_count DESC;

-- Create activity performance view
CREATE OR REPLACE VIEW activity_performance AS
SELECT 
  activity_type,
  entity_type,
  COUNT(*) as total_activities,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT entity_id) as unique_entities,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) as avg_age_seconds,
  MIN(created_at) as first_activity,
  MAX(created_at) as last_activity
FROM activities
GROUP BY activity_type, entity_type
ORDER BY total_activities DESC;

-- Create function to get activity statistics
CREATE OR REPLACE FUNCTION get_activity_stats()
RETURNS TABLE(
  total_activities BIGINT,
  activities_today BIGINT,
  activities_this_week BIGINT,
  activities_this_month BIGINT,
  by_type JSONB,
  by_entity JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM activities) as total_activities,
    (SELECT COUNT(*) FROM activities WHERE created_at >= CURRENT_DATE) as activities_today,
    (SELECT COUNT(*) FROM activities WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as activities_this_week,
    (SELECT COUNT(*) FROM activities WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as activities_this_month,
    (SELECT jsonb_object_agg(activity_type, count) FROM (
      SELECT activity_type, COUNT(*) as count 
      FROM activities 
      GROUP BY activity_type
    ) t) as by_type,
    (SELECT jsonb_object_agg(entity_type, count) FROM (
      SELECT entity_type, COUNT(*) as count 
      FROM activities 
      WHERE entity_type IS NOT NULL
      GROUP BY entity_type
    ) t) as by_entity;
END;
$$ LANGUAGE plpgsql;

-- Create function to check for duplicate activities
CREATE OR REPLACE FUNCTION check_activity_duplicate(
  p_user_id UUID,
  p_activity_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_hours_back INTEGER DEFAULT 24
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM activities 
    WHERE user_id = p_user_id 
      AND activity_type = p_activity_type 
      AND entity_type = p_entity_type 
      AND entity_id = p_entity_id
      AND created_at >= NOW() - (p_hours_back || ' hours')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to clean old activities (for archiving)
CREATE OR REPLACE FUNCTION archive_old_activities(p_days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM activities 
  WHERE created_at < NOW() - (p_days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get activity trends
CREATE OR REPLACE FUNCTION get_activity_trends(p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  date DATE,
  activity_count BIGINT,
  unique_users BIGINT,
  unique_entities BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(created_at) as date,
    COUNT(*) as activity_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT entity_id) as unique_entities
  FROM activities 
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE activities IS 'Enterprise-grade activity tracking system with performance optimizations and analytics support';
COMMENT ON COLUMN activities.metadata IS 'JSON metadata for enterprise features like batch tracking, IP addresses, user agents';
COMMENT ON COLUMN activities.batch_id IS 'Batch identifier for bulk operations and audit trails';
COMMENT ON INDEX idx_activities_user_activity_entity IS 'Composite index for efficient duplicate checking and filtering';
COMMENT ON INDEX idx_activities_duplicate_check IS 'Optimized index for duplicate prevention queries';

-- Grant permissions
GRANT SELECT ON activity_analytics TO authenticated;
GRANT SELECT ON activity_performance TO authenticated;
GRANT EXECUTE ON FUNCTION get_activity_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION check_activity_duplicate(UUID, TEXT, TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_activity_trends(INTEGER) TO authenticated;

-- Create RLS policies for activities table
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own activities
CREATE POLICY "Users can view their own activities" ON activities
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to see public activities (no user_id)
CREATE POLICY "Users can view public activities" ON activities
  FOR SELECT USING (user_id IS NULL);

-- Policy for system to insert activities (admin only)
CREATE POLICY "System can insert activities" ON activities
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Policy for system to update activities (admin only)
CREATE POLICY "System can update activities" ON activities
  FOR UPDATE USING (auth.role() = 'service_role');

-- Policy for system to delete activities (admin only)
CREATE POLICY "System can delete activities" ON activities
  FOR DELETE USING (auth.role() = 'service_role'); 