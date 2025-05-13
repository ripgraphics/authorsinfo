-- Create book_discussions table
CREATE TABLE book_discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
    is_pinned BOOLEAN DEFAULT false,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create book_discussion_posts table
CREATE TABLE book_discussion_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discussion_id UUID REFERENCES book_discussions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    parent_post_id UUID REFERENCES book_discussion_posts(id) ON DELETE CASCADE,
    is_solution BOOLEAN DEFAULT false
);

-- Create book_discussion_participants table
CREATE TABLE book_discussion_participants (
    discussion_id UUID REFERENCES book_discussions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('participant', 'moderator')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (discussion_id, user_id)
);

-- Create indexes
CREATE INDEX idx_book_discussions_group_id ON book_discussions(group_id);
CREATE INDEX idx_book_discussions_book_id ON book_discussions(book_id);
CREATE INDEX idx_book_discussions_created_by ON book_discussions(created_by);
CREATE INDEX idx_book_discussions_status ON book_discussions(status);
CREATE INDEX idx_book_discussion_posts_discussion_id ON book_discussion_posts(discussion_id);
CREATE INDEX idx_book_discussion_posts_user_id ON book_discussion_posts(user_id);
CREATE INDEX idx_book_discussion_posts_parent_post_id ON book_discussion_posts(parent_post_id);
CREATE INDEX idx_book_discussion_participants_discussion_id ON book_discussion_participants(discussion_id);
CREATE INDEX idx_book_discussion_participants_user_id ON book_discussion_participants(user_id);

-- Create function to update last_activity_at
CREATE OR REPLACE FUNCTION update_discussion_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE book_discussions
    SET last_activity_at = CURRENT_TIMESTAMP
    WHERE id = NEW.discussion_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating last_activity_at
CREATE TRIGGER update_discussion_last_activity_trigger
AFTER INSERT ON book_discussion_posts
FOR EACH ROW
EXECUTE FUNCTION update_discussion_last_activity(); 