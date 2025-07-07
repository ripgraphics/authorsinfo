-- Check user role in auth.users table
SELECT 
    id,
    email,
    role,
    is_super_admin,
    created_at
FROM auth.users 
WHERE id = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3';

-- Check user role in public.profiles table
SELECT 
    id,
    user_id,
    email,
    role,
    created_at
FROM public.profiles 
WHERE user_id = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3';

-- Check user in public.users table
SELECT 
    id,
    email,
    name,
    role_id,
    created_at
FROM public.users 
WHERE id = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3';

-- Check if there's a role record in the roles table
SELECT 
    r.id,
    r.name,
    r.description
FROM public.users u
JOIN public.roles r ON u.role_id = r.id
WHERE u.id = 'e06cdf85-b449-4dcb-b943-068aaad8cfa3'; 