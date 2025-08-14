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
    'Alice Anderson',
    'alice@authorsinfo.com',
    'alice.anderson',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    permalink = EXCLUDED.permalink,
    updated_at = NOW();

-- Check if user was added
SELECT id, name, email, permalink FROM users WHERE id = 'b474d5f5-cbf2-49af-8d03-2ca4aea11081';

-- Add sample activities for the test user
INSERT INTO activities (
    id,
    user_id,
    activity_type,
    entity_type,
    entity_id,
    data,
    created_at
) VALUES 
    (
        gen_random_uuid(),
        'b474d5f5-cbf2-49af-8d03-2ca4aea11081',
        'book_added',
        'book',
        gen_random_uuid(),
        '{"book_title": "The Great Gatsby", "author": "F. Scott Fitzgerald"}',
        NOW() - INTERVAL '2 days'
    ),
    (
        gen_random_uuid(),
        'b474d5f5-cbf2-49af-8d03-2ca4aea11081',
        'review_posted',
        'book',
        gen_random_uuid(),
        '{"book_title": "To Kill a Mockingbird", "rating": 5, "review": "Excellent book!"}',
        NOW() - INTERVAL '1 day'
    ),
    (
        gen_random_uuid(),
        'b474d5f5-cbf2-49af-8d03-2ca4aea11081',
        'author_followed',
        'author',
        gen_random_uuid(),
        '{"author_name": "Jane Austen"}',
        NOW() - INTERVAL '3 hours'
    )
ON CONFLICT (id) DO NOTHING;

-- Check if activities were added
SELECT 
    a.id,
    a.activity_type,
    a.entity_type,
    a.data,
    a.created_at,
    u.name as user_name
FROM activities a
JOIN users u ON a.user_id = u.id
WHERE u.permalink = 'alice.anderson'
ORDER BY a.created_at DESC; 