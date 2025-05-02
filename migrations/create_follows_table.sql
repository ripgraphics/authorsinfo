-- Drop existing tables if they exist (in correct order)
DROP TABLE IF EXISTS public.follows;
DROP TABLE IF EXISTS public.follow_target_types;

-- Create follow_target_types table with integer ID
CREATE TABLE public.follow_target_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger to update updated_at column
CREATE TRIGGER update_follow_target_types_updated_at
    BEFORE UPDATE ON public.follow_target_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default target types (without specifying IDs)
INSERT INTO public.follow_target_types (name, description) VALUES
    ('user', 'Follow another user'),
    ('book', 'Follow a book'),
    ('author', 'Follow an author'),
    ('publisher', 'Follow a publisher');

-- Create follows table
CREATE TABLE public.follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL,
    target_type_id INTEGER NOT NULL REFERENCES public.follow_target_types(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id, target_type_id)
);

-- Create index for better query performance
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);
CREATE INDEX idx_follows_target_type_id ON public.follows(target_type_id);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_follows_updated_at
    BEFORE UPDATE ON public.follows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to validate the following_id based on target_type
CREATE OR REPLACE FUNCTION validate_follow_target()
RETURNS TRIGGER AS $$
DECLARE
    target_type_name TEXT;
BEGIN
    -- Get the target type name
    SELECT name INTO target_type_name
    FROM public.follow_target_types
    WHERE id = NEW.target_type_id;

    -- Validate based on target type
    IF target_type_name = 'user' AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.following_id) THEN
        RAISE EXCEPTION 'Invalid user ID';
    ELSIF target_type_name = 'book' AND NOT EXISTS (SELECT 1 FROM public.books WHERE id = NEW.following_id) THEN
        RAISE EXCEPTION 'Invalid book ID';
    ELSIF target_type_name = 'author' AND NOT EXISTS (SELECT 1 FROM public.authors WHERE id = NEW.following_id) THEN
        RAISE EXCEPTION 'Invalid author ID';
    ELSIF target_type_name = 'publisher' AND NOT EXISTS (SELECT 1 FROM public.publishers WHERE id = NEW.following_id) THEN
        RAISE EXCEPTION 'Invalid publisher ID';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to validate the following_id
CREATE TRIGGER validate_follow_target_trigger
    BEFORE INSERT OR UPDATE ON public.follows
    FOR EACH ROW
    EXECUTE FUNCTION validate_follow_target(); 