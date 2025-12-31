-- Seed initial badges
INSERT INTO badges (badge_key, name, description, icon_url, rarity, category, tier, points, requirement_type, requirement_value)
VALUES
  ('bookworm_bronze', 'Bookworm I', 'Read 5 books', 'book', 'common', 'reading', 'bronze', 50, 'books_read', 5),
  ('bookworm_silver', 'Bookworm II', 'Read 20 books', 'book', 'uncommon', 'reading', 'silver', 100, 'books_read', 20),
  ('bookworm_gold', 'Bookworm III', 'Read 50 books', 'book', 'rare', 'reading', 'gold', 250, 'books_read', 50),
  ('page_turner_bronze', 'Page Turner I', 'Read 1,000 pages', 'file-text', 'common', 'reading', 'bronze', 50, 'pages_read', 1000),
  ('page_turner_silver', 'Page Turner II', 'Read 5,000 pages', 'file-text', 'uncommon', 'reading', 'silver', 100, 'pages_read', 5000),
  ('streak_week', 'Dedicated Reader', 'Read for 7 days in a row', 'flame', 'common', 'streak', 'bronze', 50, 'streak_days', 7),
  ('streak_month', 'Habitual Reader', 'Read for 30 days in a row', 'flame', 'rare', 'streak', 'silver', 200, 'streak_days', 30),
  ('social_butterfly', 'Social Butterfly', 'Add 5 friends', 'users', 'common', 'social', 'bronze', 50, 'friends_added', 5),
  ('challenge_accepted', 'Challenge Accepted', 'Join a reading challenge', 'target', 'common', 'challenge', 'bronze', 25, 'challenges_joined', 1),
  ('challenge_master', 'Challenge Master', 'Complete a reading challenge', 'trophy', 'uncommon', 'challenge', 'silver', 150, 'challenges_completed', 1)
ON CONFLICT (badge_key) DO NOTHING;
