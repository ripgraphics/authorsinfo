-- Create Sample Activities for Timeline Feed Testing
-- This script populates the activities table with realistic sample data

-- First, let's ensure we have some users to work with
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, encrypted_password_updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'alice@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Alice Anderson","avatar_url":"/placeholder.svg"}', false, now(), '', '', '', ''),
  ('550e8400-e29b-41d4-a716-446655440002', 'bob@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Bob Wilson","avatar_url":"/placeholder.svg"}', false, now(), '', '', '', ''),
  ('550e8400-e29b-41d4-a716-446655440003', 'carol@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Carol Davis","avatar_url":"/placeholder.svg"}', false, now(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Insert sample activities for Alice
INSERT INTO public.activities (id, user_id, activity_type, entity_type, entity_id, data, created_at) VALUES
  (
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001',
    'book_added',
    'book',
    gen_random_uuid(),
    '{"book_title": "The Great Gatsby", "author_name": "F. Scott Fitzgerald", "shelf": "Want to Read", "rating": 5}',
    now() - interval '2 hours'
  ),
  (
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001',
    'book_reviewed',
    'book',
    gen_random_uuid(),
    '{"book_title": "To Kill a Mockingbird", "author_name": "Harper Lee", "review_text": "A powerful story about justice and racism. Highly recommend!", "rating": 5}',
    now() - interval '1 day'
  ),
  (
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001',
    'book_finished',
    'book',
    gen_random_uuid(),
    '{"book_title": "1984", "author_name": "George Orwell", "completion_date": "2025-01-10", "thoughts": "Disturbing but important read."}',
    now() - interval '3 days'
  ),
  (
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001',
    'author_followed',
    'author',
    gen_random_uuid(),
    '{"author_name": "Jane Austen", "follow_date": "2025-01-08"}',
    now() - interval '5 days'
  ),
  (
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001',
    'group_joined',
    'group',
    gen_random_uuid(),
    '{"group_name": "Classic Literature Lovers", "join_date": "2025-01-07"}',
    now() - interval '1 week'
  ),
  (
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001',
    'book_rated',
    'book',
    gen_random_uuid(),
    '{"book_title": "Pride and Prejudice", "author_name": "Jane Austen", "rating": 4, "rating_date": "2025-01-06"}',
    now() - interval '1 week'
  ),
  (
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001',
    'reading_challenge_updated',
    'user',
    '550e8400-e29b-41d4-a716-446655440001',
    '{"challenge_type": "2025 Reading Goal", "current_count": 12, "target_count": 50, "progress_percentage": 24}',
    now() - interval '2 weeks'
  ),
  (
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001',
    'book_shelved',
    'book',
    gen_random_uuid(),
    '{"book_title": "The Catcher in the Rye", "author_name": "J.D. Salinger", "shelf": "Currently Reading", "shelf_date": "2025-01-15"}',
    now() - interval '1 hour'
  );

-- Insert sample activities for Bob
INSERT INTO public.activities (id, user_id, activity_type, entity_type, entity_id, data, created_at) VALUES
  (
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440002',
    'book_added',
    'book',
    gen_random_uuid(),
    '{"book_title": "Dune", "author_name": "Frank Herbert", "shelf": "Want to Read", "rating": 5}',
    now() - interval '4 hours'
  ),
  (
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440002',
    'book_reviewed',
    'book',
    gen_random_uuid(),
    '{"book_title": "The Hobbit", "author_name": "J.R.R. Tolkien", "review_text": "A delightful adventure story perfect for all ages.", "rating": 5}',
    now() - interval '2 days'
  );

-- Insert sample activities for Carol
INSERT INTO public.activities (id, user_id, activity_type, entity_type, entity_id, data, created_at) VALUES
  (
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440003',
    'book_added',
    'book',
    gen_random_uuid(),
    '{"book_title": "The Handmaid\'s Tale", "author_name": "Margaret Atwood", "shelf": "Want to Read", "rating": 4}',
    now() - interval '6 hours'
  ),
  (
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440003',
    'author_followed',
    'author',
    gen_random_uuid(),
    '{"author_name": "Margaret Atwood", "follow_date": "2025-01-09"}',
    now() - interval '3 days'
  );

-- Create some sample posts for the timeline
INSERT INTO public.posts (id, user_id, content, image_url, link_url, created_at, updated_at, visibility, allowed_user_ids, is_hidden, is_deleted) VALUES
  (
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001',
    'Just finished reading "The Great Gatsby" by F. Scott Fitzgerald. What a beautifully written novel about the American Dream and its illusions. The prose is absolutely stunning! 📚✨',
    NULL,
    NULL,
    now() - interval '1 day',
    now() - interval '1 day',
    'public',
    NULL,
    false,
    false
  ),
  (
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001',
    'Started my 2025 reading challenge! Goal: 50 books this year. Currently reading "1984" by George Orwell. Anyone else tackling this classic? 🤔📖',
    NULL,
    NULL,
    now() - interval '3 days',
    now() - interval '3 days',
    'public',
    NULL,
    false,
    false
  ),
  (
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001',
    'New book added to my collection: "Pride and Prejudice" by Jane Austen. Can\'t wait to dive into this classic romance! 💕📚',
    NULL,
    NULL,
    now() - interval '1 week',
    now() - interval '1 week',
    'public',
    NULL,
    false,
    false
  );

-- Verify the data was inserted
SELECT 
  'Activities' as table_name,
  COUNT(*) as record_count
FROM public.activities
UNION ALL
SELECT 
  'Posts' as table_name,
  COUNT(*) as record_count
FROM public.posts
UNION ALL
SELECT 
  'Users' as table_name,
  COUNT(*) as record_count
FROM auth.users;

-- Show sample activities
SELECT 
  a.id,
  a.activity_type,
  a.entity_type,
  a.data,
  a.created_at,
  u.raw_user_meta_data->>'name' as user_name
FROM public.activities a
JOIN auth.users u ON a.user_id = u.id
ORDER BY a.created_at DESC
LIMIT 10;
