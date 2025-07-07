-- Check what follow-related functions exist in the database
SELECT 
    proname as function_name,
    proargnames as argument_names,
    proargtypes::regtype[] as argument_types,
    prosrc as function_body
FROM pg_proc 
WHERE proname ILIKE '%follow%' 
ORDER BY proname;

-- Also check the follow_target_types table structure
SELECT * FROM follow_target_types LIMIT 10;

-- Check actual follows table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'follows' 
ORDER BY ordinal_position; 