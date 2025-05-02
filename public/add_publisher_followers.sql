-- Temporarily disable the validate_follow_target_trigger
ALTER TABLE public.follows DISABLE TRIGGER validate_follow_target_trigger;

-- First, get the target type ID for 'publisher'
DO $$
DECLARE
    publisher_type_id INTEGER;
BEGIN
    -- Get the publisher target type ID
    SELECT id INTO publisher_type_id 
    FROM public.follow_target_types 
    WHERE name = 'publisher';
    
    -- Insert followers for publisher ID 291
    INSERT INTO public.follows (follower_id, following_id, target_type_id, created_at, updated_at)
    VALUES
        ('14b745e4-bf9c-4f3e-bd7d-1eb005cfbd8c', 291, publisher_type_id, NOW(), NOW()), -- James Rodriguez
        ('17a41d5b-81ba-4206-b717-499566ae080a', 291, publisher_type_id, NOW(), NOW()), -- Jennifer Garcia
        ('1ecbee4d-1edf-4c47-8763-3470a61ce1c8', 291, publisher_type_id, NOW(), NOW()), -- Robert Jones
        ('29f24065-9899-4a80-83f4-82acb45d1c7c', 291, publisher_type_id, NOW(), NOW()), -- James Wilson
        ('33303e51-3a14-4766-a68d-57986263cb92', 291, publisher_type_id, NOW(), NOW()), -- Michael Miller
        ('36ee0e21-6c56-46e2-b296-ae69b8fc8626', 291, publisher_type_id, NOW(), NOW()), -- James Moore
        ('3c2c53c5-ea85-44a8-88fa-71bb04780e72', 291, publisher_type_id, NOW(), NOW()), -- James Smith
        ('3c97695e-bad9-457f-bdbd-88d433f8186d', 291, publisher_type_id, NOW(), NOW()), -- Test User
        ('4211673d-f5d6-43a1-87cd-6caffc01b866', 291, publisher_type_id, NOW(), NOW()), -- James Anderson
        ('538b2444-15b8-41a7-bea6-7509e3180f3b', 291, publisher_type_id, NOW(), NOW()), -- James Lee
        ('5ba5a105-c82e-4f73-b038-c088ffbde767', 291, publisher_type_id, NOW(), NOW()), -- Mary Johnson
        ('6c59d79d-a9fd-4eff-b38c-1f40bc5342e9', 291, publisher_type_id, NOW(), NOW()), -- James Johnson
        ('6d3d40f2-eb7b-4b36-bd68-38061ef336ee', 291, publisher_type_id, NOW(), NOW()), -- James Davis
        ('751dbc76-b23d-4d4d-961e-fcf198a2cd08', 291, publisher_type_id, NOW(), NOW()), -- James Williams
        ('8748d399-822b-4b68-b010-d420da5d6b14', 291, publisher_type_id, NOW(), NOW())  -- James Martinez
    ON CONFLICT (follower_id, following_id, target_type_id) DO NOTHING;
    
    RAISE NOTICE 'Added followers to publisher ID 291';
END $$;

-- Re-enable the validation trigger
ALTER TABLE public.follows ENABLE TRIGGER validate_follow_target_trigger; 