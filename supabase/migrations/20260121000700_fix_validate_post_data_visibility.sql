-- Fix validate_post_data function to include 'followers' in valid visibility values
-- The trigger validate_post_data_trigger uses this function, not validate_activity_data

CREATE OR REPLACE FUNCTION public.validate_post_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate visibility values (now includes 'followers')
    IF NEW.visibility IS NOT NULL AND NEW.visibility NOT IN ('public', 'private', 'friends', 'followers', 'group') THEN
        RAISE EXCEPTION 'Invalid visibility value: %', NEW.visibility;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.validate_post_data() IS 'Validates post data before insert/update - includes followers visibility option';
