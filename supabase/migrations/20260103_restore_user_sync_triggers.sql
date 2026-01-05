-- ============================================================================
-- RESTORE USER SYNC TRIGGERS
-- These triggers were deleted in commit e9e4703 on July 31, 2025
-- They sync auth.users → public.users → public.profiles
-- ============================================================================

-- 1. Create or replace the function to sync auth.users → public.users
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = ''
    AS $$
BEGIN
  INSERT INTO public.users (id, email, name, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.created_at,
    NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Grant permissions on the function
GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "service_role";

-- 2. Create or replace the trigger on auth.users
DROP TRIGGER IF EXISTS "on_auth_user_created" ON "auth"."users";
CREATE TRIGGER "on_auth_user_created" 
  AFTER INSERT ON "auth"."users" 
  FOR EACH ROW 
  EXECUTE FUNCTION "public"."handle_new_user"();

-- 3. Create or replace the function to sync public.users → public.profiles
CREATE OR REPLACE FUNCTION "public"."handle_new_user_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = ''
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Grant permissions on the function
GRANT EXECUTE ON FUNCTION "public"."handle_new_user_profile"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."handle_new_user_profile"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."handle_new_user_profile"() TO "service_role";

-- 4. Create or replace the trigger on public.users
DROP TRIGGER IF EXISTS "on_public_user_created_profile" ON "public"."users";
CREATE TRIGGER "on_public_user_created_profile" 
  AFTER INSERT ON "public"."users" 
  FOR EACH ROW 
  EXECUTE FUNCTION "public"."handle_new_user_profile"();

-- 5. Sync existing auth.users that are missing from public.users
INSERT INTO public.users (id, email, name, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  au.created_at,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 6. Sync existing public.users that are missing from public.profiles
INSERT INTO public.profiles (user_id, created_at, updated_at)
SELECT 
  pu.id,
  NOW(),
  NOW()
FROM public.users pu
LEFT JOIN public.profiles pp ON pu.id = pp.user_id
WHERE pp.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'User sync triggers restored successfully';
END $$;
