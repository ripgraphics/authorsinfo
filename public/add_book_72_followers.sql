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
    
    -- Insert followers for book ID 72
    INSERT INTO public.follows (follower_id, following_id, target_type_id, created_at, updated_at)
    VALUES
        ('14b745e4-bf9c-4f3e-bd7d-1eb005cfbd8c', 72, book_type_id, NOW(), NOW()), -- James Rodriguez
        ('17a41d5b-81ba-4206-b717-499566ae080a', 72, book_type_id, NOW(), NOW()), -- Jennifer Garcia
        ('1ecbee4d-1edf-4c47-8763-3470a61ce1c8', 72, book_type_id, NOW(), NOW()), -- Robert Jones
        ('29f24065-9899-4a80-83f4-82acb45d1c7c', 72, book_type_id, NOW(), NOW()), -- James Wilson
        ('33303e51-3a14-4766-a68d-57986263cb92', 72, book_type_id, NOW(), NOW()), -- Michael Miller
        ('36ee0e21-6c56-46e2-b296-ae69b8fc8626', 72, book_type_id, NOW(), NOW()), -- James Moore
        ('3c2c53c5-ea85-44a8-88fa-71bb04780e72', 72, book_type_id, NOW(), NOW()), -- James Smith
        ('3c97695e-bad9-457f-bdbd-88d433f8186d', 72, book_type_id, NOW(), NOW()), -- Test User
        ('4211673d-f5d6-43a1-87cd-6caffc01b866', 72, book_type_id, NOW(), NOW()), -- James Anderson
        ('538b2444-15b8-41a7-bea6-7509e3180f3b', 72, book_type_id, NOW(), NOW()), -- James Lee
        ('5ba5a105-c82e-4f73-b038-c088ffbde767', 72, book_type_id, NOW(), NOW()), -- Mary Johnson
        ('6c59d79d-a9fd-4eff-b38c-1f40bc5342e9', 72, book_type_id, NOW(), NOW()), -- James Johnson
        ('6d3d40f2-eb7b-4b36-bd68-38061ef336ee', 72, book_type_id, NOW(), NOW()), -- James Davis
        ('751dbc76-b23d-4d4d-961e-fcf198a2cd08', 72, book_type_id, NOW(), NOW()), -- James Williams
        ('8748d399-822b-4b68-b010-d420da5d6b14', 72, book_type_id, NOW(), NOW()), -- James Martinez
        ('8770a125-fa8c-43fa-b4d0-16fe188459e0', 72, book_type_id, NOW(), NOW()), -- James Gonzalez
        ('8b8ad76f-6455-49f3-9fde-dc0a707c428c', 72, book_type_id, NOW(), NOW()), -- Test User 2
        ('90e9e51b-0912-4413-a780-3b2098c8fae4', 72, book_type_id, NOW(), NOW()), -- James Jackson
        ('a1e5227d-51e1-44d2-af0e-f6b939ee349e', 72, book_type_id, NOW(), NOW()), -- James Jones
        ('a9929150-1a78-48b4-a0e1-f8faca95374f', 72, book_type_id, NOW(), NOW()), -- James Martin
        ('aa2d1307-aa9a-40d9-a9fd-2fb37aa86160', 72, book_type_id, NOW(), NOW()), -- James Garcia
        ('aef71eea-8af0-405f-9ca1-b6db58f15e79', 72, book_type_id, NOW(), NOW()), -- John Williams
        ('bdbea25b-6bea-48aa-ae90-cbb9ce25332b', 72, book_type_id, NOW(), NOW()), -- James Thomas
        ('cd550862-46b0-4b06-8d01-c4ccb8b7b285', 72, book_type_id, NOW(), NOW()), -- James Hernandez
        ('ff4e388b-e0c3-45a6-b884-5617c8bc1923', 72, book_type_id, NOW(), NOW())  -- Patricia Brown
    ON CONFLICT (follower_id, following_id, target_type_id) DO NOTHING;
    
    RAISE NOTICE 'Added 25 followers to book ID 72';
END $$;

-- Re-enable the validation trigger
ALTER TABLE public.follows ENABLE TRIGGER validate_follow_target_trigger; 