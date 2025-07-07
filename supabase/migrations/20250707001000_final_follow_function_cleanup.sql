-- =====================================================
-- FINAL FOLLOW FUNCTION CLEANUP
-- =====================================================
-- This migration will completely clear all follow functions and recreate them
-- to ensure no function overloading conflicts exist

-- Drop ALL possible variations of follow functions
DROP FUNCTION IF EXISTS public.check_existing_follow(UUID, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_existing_follow(UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.insert_follow_record(UUID, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.insert_follow_record(UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.delete_follow_record(UUID, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.delete_follow_record(UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_is_following(UUID, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_is_following(UUID, UUID, UUID) CASCADE;

-- Clear any function cache (removed pg_reload_conf due to permissions)

-- Recreate ONLY the UUID versions with explicit schema qualification
CREATE OR REPLACE FUNCTION public.check_existing_follow(
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

CREATE OR REPLACE FUNCTION public.insert_follow_record(
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

CREATE OR REPLACE FUNCTION public.delete_follow_record(
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

CREATE OR REPLACE FUNCTION public.check_is_following(
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.check_existing_follow(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_follow_record(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_follow_record(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_following(UUID, UUID, UUID) TO authenticated;

-- Verify no TEXT versions exist
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname IN ('check_existing_follow', 'insert_follow_record', 'delete_follow_record', 'check_is_following')
    AND pg_get_function_arguments(p.oid) LIKE '%text%';
    
    IF func_count > 0 THEN
        RAISE EXCEPTION 'TEXT-based follow functions still exist: %', func_count;
    END IF;
    
    RAISE NOTICE 'All follow functions are now UUID-only. Total functions: %', (
        SELECT COUNT(*) FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname IN ('check_existing_follow', 'insert_follow_record', 'delete_follow_record', 'check_is_following')
    );
END;
$$; 