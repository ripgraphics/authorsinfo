-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Group owners can update their groups" ON groups;
DROP POLICY IF EXISTS "Group roles are viewable by group members" ON group_roles;
DROP POLICY IF EXISTS "Group owners can manage roles" ON group_roles;
DROP POLICY IF EXISTS "Group members are viewable by other members" ON group_members;
DROP POLICY IF EXISTS "Users can join public groups" ON group_members;
DROP POLICY IF EXISTS "Group owners can manage members" ON group_members;
DROP POLICY IF EXISTS "Group members can see group entries" ON feed_entries;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS group_member_count_trigger ON group_members;
DROP FUNCTION IF EXISTS update_group_member_count();

-- Drop existing views if they exist
DROP VIEW IF EXISTS user_recommended_events;

-- Drop existing tables if they exist (with CASCADE)
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS group_roles CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- Create groups table
CREATE TABLE groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    cover_image_url TEXT,
    member_count INTEGER DEFAULT 0
);

-- Create group roles table
CREATE TABLE group_roles (
    id SERIAL PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    permissions TEXT[] NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(group_id, name)
);

-- Create group members table
CREATE TABLE group_members (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES group_roles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    PRIMARY KEY (group_id, user_id)
);

-- Create storage bucket for group cover images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('groups', 'groups', true)
ON CONFLICT (id) DO NOTHING;

-- Create function to update member count
CREATE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE groups 
        SET member_count = member_count + 1 
        WHERE id = NEW.group_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE groups 
        SET member_count = member_count - 1 
        WHERE id = OLD.group_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for member count
CREATE TRIGGER group_member_count_trigger
AFTER INSERT OR DELETE ON group_members
FOR EACH ROW
EXECUTE FUNCTION update_group_member_count();

-- Set up RLS (Row Level Security) policies
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "Groups are viewable by everyone" ON groups
    FOR SELECT USING (true);

CREATE POLICY "Users can create groups" ON groups
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Group owners can update their groups" ON groups
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM group_members gm
            JOIN group_roles gr ON gm.role_id = gr.id
            WHERE gm.group_id = groups.id
            AND gm.user_id = auth.uid()
            AND gm.status = 'active'
            AND gr.permissions @> ARRAY['manage_group']::text[]
        )
    );

-- Group roles policies
CREATE POLICY "Group roles are viewable by everyone" ON group_roles
    FOR SELECT USING (true);

CREATE POLICY "Group owners can manage roles" ON group_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_roles.group_id
            AND (
                g.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM group_members gm
                    JOIN group_roles gr ON gm.role_id = gr.id
                    WHERE gm.group_id = g.id
                    AND gm.user_id = auth.uid()
                    AND gm.status = 'active'
                    AND gr.permissions @> ARRAY['manage_group']::text[]
                )
            )
        )
    );

-- Group members policies
CREATE POLICY "Group members are viewable by everyone" ON group_members
    FOR SELECT USING (true);

CREATE POLICY "Users can join public groups" ON group_members
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND status = 'active'
        AND EXISTS (
            SELECT 1 FROM groups
            WHERE groups.id = group_id
            AND groups.is_private = false
        )
    );

CREATE POLICY "Group owners can manage members" ON group_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE group_members.group_id = g.id
            AND (
                g.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM group_roles gr
                    WHERE gr.group_id = g.id
                    AND gr.permissions @> ARRAY['manage_members']::text[]
                )
            )
        )
    );

-- Recreate the view user_recommended_events
CREATE OR REPLACE VIEW user_recommended_events AS
SELECT DISTINCT e.*
FROM events e
JOIN group_members gm ON e.group_id = gm.group_id
WHERE e.start_date > NOW()
AND gm.status = 'active'; 