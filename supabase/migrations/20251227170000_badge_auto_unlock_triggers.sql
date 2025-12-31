-- Sprint 7: Badge Auto-Unlock Triggers and Functions
-- Automatically award badges when users reach milestones

-- Function to check and award badges based on user activity
CREATE OR REPLACE FUNCTION check_and_award_badges()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_books_read INT;
  v_current_streak INT;
  v_reviews_count INT;
  v_lists_created INT;
  v_discussions_count INT;
BEGIN
  -- Get user_id from the triggering table
  IF TG_TABLE_NAME = 'reading_progress' THEN
    v_user_id := NEW.user_id;
  ELSIF TG_TABLE_NAME = 'reading_sessions' THEN
    v_user_id := NEW.user_id;
  ELSIF TG_TABLE_NAME = 'book_reviews' THEN
    v_user_id := NEW.user_id;
  ELSIF TG_TABLE_NAME = 'reading_lists' THEN
    v_user_id := NEW.user_id;
  ELSIF TG_TABLE_NAME = 'posts' THEN
    v_user_id := NEW.user_id;
  ELSE
    RETURN NEW;
  END IF;

  -- Calculate user statistics
  -- Books completed
  SELECT COUNT(*) INTO v_books_read
  FROM reading_progress
  WHERE user_id = v_user_id AND status = 'completed';

  -- Current reading streak
  SELECT COALESCE(MAX(current_streak), 0) INTO v_current_streak
  FROM reading_sessions
  WHERE user_id = v_user_id;

  -- Reviews posted
  SELECT COUNT(*) INTO v_reviews_count
  FROM book_reviews
  WHERE user_id = v_user_id;

  -- Lists created
  SELECT COUNT(*) INTO v_lists_created
  FROM reading_lists
  WHERE user_id = v_user_id;

  -- Discussion posts
  SELECT COUNT(*) INTO v_discussions_count
  FROM posts
  WHERE user_id = v_user_id;

  -- Award badges based on milestones
  -- Books Read Badges
  IF v_books_read >= 1 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'First Book' AND tier = 'bronze'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_books_read >= 5 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Bookworm' AND tier = 'bronze'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_books_read >= 10 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Bookworm' AND tier = 'silver'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_books_read >= 25 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Bookworm' AND tier = 'gold'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_books_read >= 50 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Bookworm' AND tier = 'platinum'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_books_read >= 100 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Bookworm' AND tier = 'diamond'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  -- Reading Streak Badges
  IF v_current_streak >= 3 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Streak Master' AND tier = 'bronze'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_current_streak >= 7 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Streak Master' AND tier = 'silver'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_current_streak >= 14 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Streak Master' AND tier = 'gold'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_current_streak >= 30 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Streak Master' AND tier = 'platinum'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_current_streak >= 100 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Streak Master' AND tier = 'diamond'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  -- Reviewer Badges
  IF v_reviews_count >= 1 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Critic' AND tier = 'bronze'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_reviews_count >= 10 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Critic' AND tier = 'silver'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_reviews_count >= 25 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Critic' AND tier = 'gold'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_reviews_count >= 50 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Critic' AND tier = 'platinum'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_reviews_count >= 100 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Critic' AND tier = 'diamond'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  -- Curator Badges (for creating lists)
  IF v_lists_created >= 1 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Curator' AND tier = 'bronze'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_lists_created >= 5 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Curator' AND tier = 'silver'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_lists_created >= 10 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Curator' AND tier = 'gold'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  -- Community Badges (for discussions)
  IF v_discussions_count >= 10 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Community Builder' AND tier = 'bronze'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_discussions_count >= 50 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Community Builder' AND tier = 'silver'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_discussions_count >= 100 THEN
    INSERT INTO user_badges (user_id, badge_id, progress, earned_at)
    SELECT v_user_id, id, 100, NOW()
    FROM badges
    WHERE name = 'Community Builder' AND tier = 'gold'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for badge auto-unlock

-- Trigger on reading_progress for reading completion
DROP TRIGGER IF EXISTS award_badges_on_book_completion ON reading_progress;
CREATE TRIGGER award_badges_on_book_completion
  AFTER INSERT OR UPDATE ON reading_progress
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION check_and_award_badges();

-- Trigger on reading_sessions for streak tracking
DROP TRIGGER IF EXISTS award_badges_on_reading_session ON reading_sessions;
CREATE TRIGGER award_badges_on_reading_session
  AFTER INSERT OR UPDATE ON reading_sessions
  FOR EACH ROW
  EXECUTE FUNCTION check_and_award_badges();

-- Trigger on book_reviews for review milestones
DROP TRIGGER IF EXISTS award_badges_on_review ON book_reviews;
CREATE TRIGGER award_badges_on_review
  AFTER INSERT ON book_reviews
  FOR EACH ROW
  EXECUTE FUNCTION check_and_award_badges();

-- Trigger on reading_lists for curator badges
DROP TRIGGER IF EXISTS award_badges_on_list_creation ON reading_lists;
CREATE TRIGGER award_badges_on_list_creation
  AFTER INSERT ON reading_lists
  FOR EACH ROW
  EXECUTE FUNCTION check_and_award_badges();

-- Trigger on posts for community badges
DROP TRIGGER IF EXISTS award_badges_on_discussion ON posts;
CREATE TRIGGER award_badges_on_discussion
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION check_and_award_badges();

-- Function to manually recalculate badges for a user
CREATE OR REPLACE FUNCTION recalculate_user_badges(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_dummy record;
BEGIN
  -- Create a dummy record to trigger badge calculation
  SELECT * INTO v_dummy FROM users WHERE id = p_user_id LIMIT 1;
  
  -- Trigger the badge check function manually
  PERFORM check_and_award_badges() FROM users WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Add index for better performance on badge queries
CREATE INDEX IF NOT EXISTS idx_user_badges_user_earned ON user_badges(user_id, earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_badges_name_tier ON badges(name, tier);

-- Comments
COMMENT ON FUNCTION check_and_award_badges() IS 'Automatically awards badges when users reach milestones';
COMMENT ON FUNCTION recalculate_user_badges(UUID) IS 'Manually recalculate and award badges for a specific user';
COMMENT ON TRIGGER award_badges_on_book_completion ON reading_progress IS 'Awards badges when books are completed';
COMMENT ON TRIGGER award_badges_on_reading_session ON reading_sessions IS 'Awards streak badges based on reading activity';
COMMENT ON TRIGGER award_badges_on_review ON book_reviews IS 'Awards critic badges when reviews are posted';
COMMENT ON TRIGGER award_badges_on_list_creation ON reading_lists IS 'Awards curator badges when lists are created';
COMMENT ON TRIGGER award_badges_on_discussion ON posts IS 'Awards community badges for discussions';
