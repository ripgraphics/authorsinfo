-- Temporarily disable the validate_follow_target_trigger
ALTER TABLE public.follows DISABLE TRIGGER validate_follow_target_trigger;

-- First, get the target type ID for 'book'
DO $$
DECLARE
    book_type_id INTEGER;
BEGIN
    -- Get the book target type ID
    SELECT id INTO book_type_id 
    FROM public.follow_target_types 
    WHERE name = 'book';
    
    -- Insert followers for book ID 230
    INSERT INTO public.follows (follower_id, following_id, target_type_id, created_at, updated_at)
    VALUES
        ('17a41d5b-81ba-4206-b717-499566ae080a', 230, book_type_id, NOW(), NOW()), -- Jennifer Garcia
        ('1ecbee4d-1edf-4c47-8763-3470a61ce1c8', 230, book_type_id, NOW(), NOW()), -- Robert Jones
        ('33303e51-3a14-4766-a68d-57986263cb92', 230, book_type_id, NOW(), NOW()), -- Michael Miller
        ('5ba5a105-c82e-4f73-b038-c088ffbde767', 230, book_type_id, NOW(), NOW()), -- Mary Johnson
        ('aef71eea-8af0-405f-9ca1-b6db58f15e79', 230, book_type_id, NOW(), NOW()), -- John Williams
        ('ff4e388b-e0c3-45a6-b884-5617c8bc1923', 230, book_type_id, NOW(), NOW())  -- Patricia Brown
    ON CONFLICT (follower_id, following_id, target_type_id) DO NOTHING;
    
    RAISE NOTICE 'Added 6 followers to book ID 230';
END $$;

-- Re-enable the validation trigger
ALTER TABLE public.follows ENABLE TRIGGER validate_follow_target_trigger; 