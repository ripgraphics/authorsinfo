BEGIN;

-- 1. Book Added Events (books table has created_at, but not updated_at)
INSERT INTO feed_entries (
    id, user_id, group_id, type, content, created_at, updated_at, visibility, is_hidden, is_deleted
)
SELECT
    gen_random_uuid(),
    NULL::uuid,
    NULL::uuid,
    'book_added',
    jsonb_build_object(
        'book_id', b.id,
        'title', b.title,
        'author_id', b.author_id,
        'cover_image_id', b.cover_image_id
    ),
    b.created_at,
    b.created_at,
    'public',
    false,
    false
FROM books b;

-- 2. Author Added Events
INSERT INTO feed_entries (
    id, user_id, group_id, type, content, created_at, updated_at, visibility, is_hidden, is_deleted
)
SELECT
    gen_random_uuid(),
    NULL::uuid,
    NULL::uuid,
    'author_added',
    jsonb_build_object(
        'author_id', a.id,
        'name', a.name,
        'bio', a.bio,
        'cover_image_id', a.cover_image_id
    ),
    a.created_at,
    a.updated_at,
    'public',
    false,
    false
FROM authors a;

-- 3. Book Reviews
INSERT INTO feed_entries (
    id, user_id, group_id, type, content, created_at, updated_at, visibility, is_hidden, is_deleted
)
SELECT
    gen_random_uuid(),
    br.user_id,
    NULL::uuid,
    'review',
    jsonb_build_object(
        'review_id', br.id,
        'book_id', br.book_id,
        'rating', br.rating,
        'review_text', br.review_text
    ),
    br.created_at,
    br.updated_at,
    'public',
    false,
    false
FROM book_reviews br;

-- 4. Book Clubs Created
INSERT INTO feed_entries (
    id, user_id, group_id, type, content, created_at, updated_at, visibility, is_hidden, is_deleted
)
SELECT
    gen_random_uuid(),
    bc.created_by,
    bc.id,
    'book_club_created',
    jsonb_build_object(
        'book_club_id', bc.id,
        'name', bc.name,
        'description', bc.description,
        'cover_image_url', bc.cover_image_url
    ),
    bc.created_at,
    bc.updated_at,
    CASE WHEN bc.is_private THEN 'private' ELSE 'public' END,
    false,
    false
FROM book_clubs bc;

-- 5. Book Club Memberships (book_club_members has joined_at, but not created_at/updated_at)
INSERT INTO feed_entries (
    id, user_id, group_id, type, content, created_at, updated_at, visibility, is_hidden, is_deleted
)
SELECT
    gen_random_uuid(),
    bcm.user_id,
    bcm.book_club_id,
    'book_club_joined',
    jsonb_build_object(
        'book_club_id', bcm.book_club_id,
        'role', bcm.role
    ),
    bcm.joined_at,
    bcm.joined_at,
    'public',
    false,
    false
FROM book_club_members bcm;

-- 6. Book Club Discussions
INSERT INTO feed_entries (
    id, user_id, group_id, type, content, created_at, updated_at, visibility, is_hidden, is_deleted
)
SELECT
    gen_random_uuid(),
    bcd.created_by,
    bcd.book_club_id,
    'book_club_discussion',
    jsonb_build_object(
        'discussion_id', bcd.id,
        'title', bcd.title,
        'content', bcd.content
    ),
    bcd.created_at,
    bcd.updated_at,
    'public',
    false,
    false
FROM book_club_discussions bcd;

-- 7. Book Club Discussion Comments
INSERT INTO feed_entries (
    id, user_id, group_id, type, content, created_at, updated_at, visibility, is_hidden, is_deleted
)
SELECT
    gen_random_uuid(),
    bcdc.created_by,
    (SELECT book_club_id FROM book_club_discussions WHERE id = bcdc.discussion_id),
    'book_club_comment',
    jsonb_build_object(
        'discussion_id', bcdc.discussion_id,
        'comment_id', bcdc.id,
        'content', bcdc.content
    ),
    bcdc.created_at,
    bcdc.updated_at,
    'public',
    false,
    false
FROM book_club_discussion_comments bcdc;

-- 8. Book Recommendations
INSERT INTO feed_entries (
    id, user_id, group_id, type, content, created_at, updated_at, visibility, is_hidden, is_deleted
)
SELECT
    gen_random_uuid(),
    br.user_id,
    NULL::uuid,
    'book_recommendation',
    jsonb_build_object(
        'book_id', br.book_id,
        'source_type', br.source_type,
        'score', br.score
    ),
    br.created_at,
    br.updated_at,
    'public',
    false,
    false
FROM book_recommendations br;

-- 9. User Follows (Books, Authors, Users, etc.)
INSERT INTO feed_entries (
    id, user_id, group_id, type, content, created_at, updated_at, visibility, is_hidden, is_deleted
)
SELECT
    gen_random_uuid(),
    f.follower_id,
    NULL::uuid,
    'follow',
    jsonb_build_object(
        'following_id', f.following_id,
        'target_type_id', f.target_type_id
    ),
    f.created_at,
    f.updated_at,
    'public',
    false,
    false
FROM follows f;

-- 10. Reading Progress
INSERT INTO feed_entries (
    id, user_id, group_id, type, content, created_at, updated_at, visibility, is_hidden, is_deleted
)
SELECT
    gen_random_uuid(),
    rp.user_id,
    NULL::uuid,
    'reading_progress',
    jsonb_build_object(
        'book_id', rp.book_id,
        'status', rp.status,
        'progress_percentage', rp.progress_percentage
    ),
    rp.created_at,
    rp.updated_at,
    'public',
    false,
    false
FROM reading_progress rp;

-- 11. Activities Table
INSERT INTO feed_entries (
    id, user_id, group_id, type, content, created_at, updated_at, visibility, is_hidden, is_deleted
)
SELECT
    gen_random_uuid(),
    a.user_id,
    NULL::uuid,
    a.activity_type,
    a.data,
    a.created_at,
    a.created_at,
    'public',
    false,
    false
FROM activities a;

-- 12. Posts Table
INSERT INTO feed_entries (
    id, user_id, group_id, type, content, created_at, updated_at, visibility, is_hidden, is_deleted
)
SELECT
    gen_random_uuid(),
    p.user_id,
    NULL::uuid,
    'post',
    jsonb_build_object(
        'content', p.content,
        'image_url', p.image_url,
        'link_url', p.link_url
    ),
    p.created_at,
    p.updated_at,
    p.visibility,
    p.is_hidden,
    p.is_deleted
FROM posts p;

COMMIT; 