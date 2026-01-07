-- Fix badge trigger function to use correct table for current_streak
-- This fixes the error: column "current_streak" does not exist
-- The trigger was trying to query reading_sessions but current_streak is in reading_streaks

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

  -- Current reading streak (FIXED: use reading_streaks table instead of reading_sessions)
  SELECT COALESCE(current_streak, 0) INTO v_current_streak
  FROM reading_streaks
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

