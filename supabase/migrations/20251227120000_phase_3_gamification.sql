-- Badges (Definitions)
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_key VARCHAR(100) UNIQUE NOT NULL, -- 'bookworm', 'page_turner', etc.
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  rarity VARCHAR(50), -- 'common', 'uncommon', 'rare', 'legendary'
  category VARCHAR(50), -- 'reading', 'challenge', 'streak', 'social', 'genre', 'special'
  tier VARCHAR(50), -- 'bronze', 'silver', 'gold', 'platinum', 'diamond'
  points INTEGER DEFAULT 0,
  requirement_type VARCHAR(50), -- 'books_read', 'pages_read', 'friends', etc.
  requirement_value INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Badges (Earned)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT false,
  UNIQUE(user_id, badge_id)
);

-- Badge Progress (Achievements)
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key VARCHAR(100) NOT NULL,
  current_value INTEGER DEFAULT 0,
  target_value INTEGER,
  progress_percentage INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_key)
);

-- Leaderboard Cache
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leaderboard_type VARCHAR(50), -- 'global', 'friends', 'group'
  leaderboard_context_id UUID, -- group_id for group leaderboards, NULL for global
  metric_type VARCHAR(50), -- 'books_read', 'pages_read', 'points'
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(255),
  avatar_url TEXT,
  metric_value INTEGER NOT NULL,
  rank INTEGER,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- Badges: Public read, Admin write (simulated)
DROP POLICY IF EXISTS "Badges are viewable by everyone" ON badges;
CREATE POLICY "Badges are viewable by everyone" ON badges FOR SELECT USING (true);

-- User Badges: Public read, User manage own (or system manage)
DROP POLICY IF EXISTS "User badges are viewable by everyone" ON user_badges;
CREATE POLICY "User badges are viewable by everyone" ON user_badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own badges" ON user_badges;
CREATE POLICY "Users can manage their own badges" ON user_badges FOR ALL USING (auth.uid() = user_id);

-- Achievements: User read own, User manage own
DROP POLICY IF EXISTS "Users can view their own achievements" ON achievements;
CREATE POLICY "Users can view their own achievements" ON achievements FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own achievements" ON achievements;
CREATE POLICY "Users can manage their own achievements" ON achievements FOR ALL USING (auth.uid() = user_id);

-- Leaderboard: Public read
DROP POLICY IF EXISTS "Leaderboard is viewable by everyone" ON leaderboard_cache;
CREATE POLICY "Leaderboard is viewable by everyone" ON leaderboard_cache FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_type_metric ON leaderboard_cache(leaderboard_type, metric_type, snapshot_date);
