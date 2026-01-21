-- 20260119_comments_sentiment_toxicity.sql
-- Add sentiment and toxicity scoring columns to comments table
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS sentiment_score float,
  ADD COLUMN IF NOT EXISTS toxicity_score float;

COMMENT ON COLUMN public.comments.sentiment_score IS 'Sentiment analysis score for comment';
COMMENT ON COLUMN public.comments.toxicity_score IS 'Toxicity score for comment';
