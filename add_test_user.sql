-- Add test user for profile page testing
INSERT INTO users (
    id,
    name,
    email,
    permalink,
    created_at,
    updated_at
) VALUES (
    'b474d5f5-cbf2-49af-8d03-2ca4aea11081',
    'Test User',
    'test@authorsinfo.com',
    'test-user',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Check if user was added
SELECT id, name, email, permalink FROM users WHERE id = 'b474d5f5-cbf2-49af-8d03-2ca4aea11081'; 