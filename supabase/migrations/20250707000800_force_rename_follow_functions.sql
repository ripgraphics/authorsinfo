-- =====================================================
-- FORCE RENAME OLD FUNCTIONS AND CREATE NEW ONES
-- =====================================================
-- This migration will rename old functions and create new ones with unique names

-- First, rename the old functions to avoid conflicts
DO $$ 
BEGIN
    -- Rename old functions if they exist
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_existing_follow') THEN
        ALTER FUNCTION check_existing_follow(UUID, TEXT, UUID) RENAME TO check_existing_follow_old_text;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'insert_follow_record') THEN
        ALTER FUNCTION insert_follow_record(UUID, TEXT, UUID) RENAME TO insert_follow_record_old_text;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_follow_record') THEN
        ALTER FUNCTION delete_follow_record(UUID, TEXT, UUID) RENAME TO delete_follow_record_old_text;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_is_following') THEN
        ALTER FUNCTION check_is_following(UUID, TEXT, UUID) RENAME TO check_is_following_old_text;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Function doesn't exist, continue
        NULL;
END $$;

-- Now drop the renamed functions
DROP FUNCTION IF EXISTS check_existing_follow_old_text(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS insert_follow_record_old_text(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS delete_follow_record_old_text(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS check_is_following_old_text(UUID, TEXT, UUID);

-- Create new functions with UUID parameters only
CREATE OR REPLACE FUNCTION check_existing_follow(
  p_follower_id UUID,
  p_following_id UUID,
  p_target_type_id UUID
)
RETURNS TABLE(follow_exists BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT EXISTS(
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_follower_id 
    AND following_id = p_following_id
    AND target_type_id = p_target_type_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION insert_follow_record(
  p_follower_id UUID,
  p_following_id UUID,
  p_target_type_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.follows (follower_id, following_id, target_type_id)
  VALUES (p_follower_id, p_following_id, p_target_type_id)
  ON CONFLICT (follower_id, following_id, target_type_id) DO NOTHING;
  
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION delete_follow_record(
  p_follower_id UUID,
  p_following_id UUID,
  p_target_type_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.follows 
  WHERE follower_id = p_follower_id 
  AND following_id = p_following_id
  AND target_type_id = p_target_type_id;
  
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION check_is_following(
  p_follower_id UUID,
  p_following_id UUID,
  p_target_type_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_follower_id 
    AND following_id = p_following_id
    AND target_type_id = p_target_type_id
  );
END;
$$; 