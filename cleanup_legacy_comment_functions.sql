-- Cleanup Legacy Comment Functions and Triggers
-- This migration removes all the old comment system functions that reference non-existent tables

-- Drop legacy functions that reference old comment tables
DROP FUNCTION IF EXISTS public.add_activity_comment(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.add_entity_comment(uuid, character varying, uuid, text, uuid);
DROP FUNCTION IF EXISTS public.calculate_comment_depth();
DROP FUNCTION IF EXISTS public.update_comment_reply_count();
DROP FUNCTION IF EXISTS public.update_comment_thread_id();

-- Drop any legacy triggers that might still exist
DROP TRIGGER IF EXISTS trigger_calculate_comment_depth ON public.engagement_comments;
DROP TRIGGER IF EXISTS trigger_update_comment_reply_count ON public.engagement_comments;
DROP TRIGGER IF EXISTS trigger_update_comment_thread_id ON public.engagement_comments;

-- Create a clean, simplified function for adding comments
CREATE OR REPLACE FUNCTION public.add_engagement_comment(
  p_user_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_comment_text text,
  p_parent_comment_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_comment_id uuid;
  parent_depth integer := 0;
  thread_id uuid;
BEGIN
  -- Generate new comment ID
  new_comment_id := gen_random_uuid();
  
  -- Handle parent comment logic
  IF p_parent_comment_id IS NOT NULL THEN
    -- Get parent comment depth and thread_id
    SELECT comment_depth + 1, thread_id
    INTO parent_depth, thread_id
    FROM public.engagement_comments
    WHERE id = p_parent_comment_id;
    
    -- Increment reply count on parent comment
    UPDATE public.engagement_comments
    SET reply_count = reply_count + 1
    WHERE id = p_parent_comment_id;
  ELSE
    -- Top-level comment
    parent_depth := 0;
    thread_id := new_comment_id;
  END IF;
  
  -- Insert the comment
  INSERT INTO public.engagement_comments (
    id, user_id, entity_type, entity_id, comment_text,
    parent_comment_id, comment_depth, thread_id
  ) VALUES (
    new_comment_id, p_user_id, p_entity_type, p_entity_id, p_comment_text,
    p_parent_comment_id, parent_depth, thread_id
  );
  
  RETURN new_comment_id;
END;
$$;

-- Grant permissions
ALTER FUNCTION public.add_engagement_comment(uuid, text, uuid, text, uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.add_engagement_comment(uuid, text, uuid, text, uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.add_engagement_comment(uuid, text, uuid, text, uuid) IS 'Clean function to add comments to the engagement system';

-- Create a simple trigger to update reply counts automatically
CREATE OR REPLACE FUNCTION public.update_engagement_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
    -- Increment reply count on parent comment
    UPDATE public.engagement_comments 
    SET reply_count = reply_count + 1 
    WHERE id = NEW.parent_comment_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
    -- Decrement reply count on parent comment
    UPDATE public.engagement_comments 
    SET reply_count = GREATEST(reply_count - 1, 0) 
    WHERE id = OLD.parent_comment_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trigger_update_engagement_reply_count
  AFTER INSERT OR DELETE ON public.engagement_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_engagement_reply_count();

-- Grant permissions
ALTER FUNCTION public.update_engagement_reply_count() OWNER TO postgres;

-- Add comment
COMMENT ON FUNCTION public.update_engagement_reply_count() IS 'Automatically updates reply counts for engagement comments';

-- Verify cleanup
SELECT 'Legacy comment functions cleaned up successfully' as status;
