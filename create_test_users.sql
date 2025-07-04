-- Create 30 Test Users for AuthorsInfo
-- Script based EXCLUSIVELY on actual database schema

-- Create roles if they don't exist (using actual roles table schema)
INSERT INTO public.roles (name, created_at, updated_at) 
SELECT 'super-admin', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'super-admin');

INSERT INTO public.roles (name, created_at, updated_at) 
SELECT 'admin', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'admin');

INSERT INTO public.roles (name, created_at, updated_at) 
SELECT 'user', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'user');

-- Create 30 test users
DO $$
DECLARE
    i INTEGER;
    first_names TEXT[] := ARRAY[
        'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack',
        'Kate', 'Liam', 'Maya', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Ruby', 'Sam', 'Tara',
        'Uma', 'Victor', 'Wendy', 'Xander', 'Yara', 'Zoe', 'Alex', 'Blake', 'Casey', 'Drew'
    ];
    last_names TEXT[] := ARRAY[
        'Anderson', 'Brown', 'Clark', 'Davis', 'Evans', 'Fisher', 'Garcia', 'Harris', 'Ivanov', 'Johnson',
        'King', 'Lee', 'Miller', 'Nelson', 'O''Connor', 'Parker', 'Quinn', 'Roberts', 'Smith', 'Taylor',
        'Upton', 'Vargas', 'Wilson', 'Xavier', 'Young', 'Zimmerman', 'Adams', 'Baker', 'Cooper', 'Dixon'
    ];
    user_id UUID;
    role_name TEXT;
    role_id UUID;
    user_name TEXT;
BEGIN
    FOR i IN 1..30 LOOP
        -- Assign roles: first user = super-admin, second user = admin, rest = user
        IF i = 1 THEN
            role_name := 'super-admin';
        ELSIF i = 2 THEN
            role_name := 'admin';
        ELSE
            role_name := 'user';
        END IF;
        
        -- Generate user name
        user_name := first_names[i] || ' ' || last_names[i];
        
        -- Get role_id
        SELECT id INTO role_id FROM public.roles WHERE name = role_name;
        
        -- Create auth user (using actual auth.users schema)
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            invited_at,
            confirmation_token,
            confirmation_sent_at,
            recovery_token,
            recovery_sent_at,
            email_change_token_new,
            email_change,
            email_change_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at,
            phone,
            phone_confirmed_at,
            phone_change,
            phone_change_token,
            phone_change_sent_at,
            email_change_token_current,
            email_change_confirm_status,
            banned_until,
            reauthentication_token,
            reauthentication_sent_at,
            is_sso_user,
            deleted_at,
            is_anonymous
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', -- instance_id
            gen_random_uuid(), -- id
            'authenticated', -- aud
            'authenticated', -- role
            lower(first_names[i]) || '.' || lower(last_names[i]) || '@authorsinfo.com', -- email
            crypt('password123', gen_salt('bf')), -- encrypted_password
            NOW(), -- email_confirmed_at
            NOW(), -- invited_at
            '', -- confirmation_token
            NOW(), -- confirmation_sent_at
            '', -- recovery_token
            NULL, -- recovery_sent_at
            '', -- email_change_token_new
            '', -- email_change
            NULL, -- email_change_sent_at
            NOW(), -- last_sign_in_at
            '{"provider": "email", "providers": ["email"]}'::jsonb, -- raw_app_meta_data
            ('{"name": "' || user_name || '"}')::jsonb, -- raw_user_meta_data
            CASE WHEN role_name = 'super-admin' THEN true ELSE false END, -- is_super_admin
            NOW(), -- created_at
            NOW(), -- updated_at
            NULL, -- phone
            NULL, -- phone_confirmed_at
            '', -- phone_change
            '', -- phone_change_token
            NULL, -- phone_change_sent_at
            '', -- email_change_token_current
            0, -- email_change_confirm_status
            NULL, -- banned_until
            '', -- reauthentication_token
            NULL, -- reauthentication_sent_at
            false, -- is_sso_user
            NULL, -- deleted_at
            false -- is_anonymous
        ) RETURNING id INTO user_id;
        
        -- Create public user record (using actual public.users schema)
        INSERT INTO public.users (
            id,
            email,
            name,
            created_at,
            updated_at,
            role_id
        ) VALUES (
            user_id, -- id (same as auth.users.id)
            lower(first_names[i]) || '.' || lower(last_names[i]) || '@authorsinfo.com', -- email
            user_name, -- name
            NOW(), -- created_at
            NOW(), -- updated_at
            role_id -- role_id
        );
        
        -- Create profile record (using actual public.profiles schema)
        INSERT INTO public.profiles (
            id,
            user_id,
            bio,
            created_at,
            updated_at,
            role
        ) VALUES (
            user_id, -- id (same as user_id)
            user_id, -- user_id
            'Test user bio for ' || user_name, -- bio
            NOW(), -- created_at
            NOW(), -- updated_at
            role_name -- role
        );
        
        RAISE NOTICE 'Created user %: % (role: %)', i, lower(first_names[i]) || '.' || lower(last_names[i]) || '@authorsinfo.com', role_name;
    END LOOP;
END $$;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully created 30 test users with proper authentication setup!';
    RAISE NOTICE 'Super Admin: alice.anderson@authorsinfo.com (password: password123)';
    RAISE NOTICE 'Admin: bob.brown@authorsinfo.com (password: password123)';
    RAISE NOTICE 'All users have password: password123';
END $$;

-- Verification queries
SELECT 'User Creation Complete' as status;

-- Show summary of created users
SELECT 
    'Auth Users' as table_name,
    COUNT(*) as count
FROM auth.users 
WHERE email LIKE '%@authorsinfo.com'

UNION ALL

SELECT 
    'Public Users' as table_name,
    COUNT(*) as count
FROM public.users 
WHERE email LIKE '%@authorsinfo.com'

UNION ALL

SELECT 
    'Public Profiles' as table_name,
    COUNT(*) as count
FROM public.profiles 
WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@authorsinfo.com');

-- Show role distribution
SELECT 
    role,
    COUNT(*) as user_count
FROM auth.users 
WHERE email LIKE '%@authorsinfo.com'
GROUP BY role
ORDER BY 
    CASE role 
        WHEN 'super_admin' THEN 1 
        WHEN 'admin' THEN 2 
        ELSE 3 
    END; 