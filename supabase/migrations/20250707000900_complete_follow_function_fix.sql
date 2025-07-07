-- =====================================================
-- COMPLETE FOLLOW FUNCTION FIX
-- =====================================================
-- This migration will completely remove ALL follow functions and recreate only UUID versions

-- Drop ALL existing follow functions (both old and new)
DROP FUNCTION IF EXISTS check_existing_follow(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS check_existing_follow(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS check_existing_follow_old_text(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS check_existing_follow_new_uuid(UUID, UUID, UUID);

DROP FUNCTION IF EXISTS insert_follow_record(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS insert_follow_record(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS insert_follow_record_old_text(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS insert_follow_record_new_uuid(UUID, UUID, UUID);

DROP FUNCTION IF EXISTS delete_follow_record(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS delete_follow_record(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS delete_follow_record_old_text(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS delete_follow_record_new_uuid(UUID, UUID, UUID);

DROP FUNCTION IF EXISTS check_is_following(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS check_is_following(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS check_is_following_old_text(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS check_is_following_new_uuid(UUID, UUID, UUID);

-- Now create ONLY the UUID versions
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
RETURNS TABLE(success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if follow already exists
  IF EXISTS (
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_follower_id 
    AND following_id = p_following_id
    AND target_type_id = p_target_type_id
  ) THEN
    RETURN QUERY SELECT FALSE, 'Already following this entity';
    RETURN;
  END IF;

  -- Insert new follow record
  INSERT INTO public.follows (follower_id, following_id, target_type_id)
  VALUES (p_follower_id, p_following_id, p_target_type_id);

  RETURN QUERY SELECT TRUE, '';
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION delete_follow_record(
  p_follower_id UUID,
  p_following_id UUID,
  p_target_type_id UUID
)
RETURNS TABLE(success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete follow record
  DELETE FROM public.follows 
  WHERE follower_id = p_follower_id 
  AND following_id = p_following_id
  AND target_type_id = p_target_type_id;

  -- Check if any rows were affected
  IF FOUND THEN
    RETURN QUERY SELECT TRUE, '';
  ELSE
    RETURN QUERY SELECT FALSE, 'Follow record not found';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION check_is_following(
  p_follower_id UUID,
  p_following_id UUID,
  p_target_type_id UUID
)
RETURNS TABLE(is_following BOOLEAN)
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_existing_follow(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_follow_record(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_follow_record(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_is_following(UUID, UUID, UUID) TO authenticated; 