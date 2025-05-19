-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
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
CREATE TABLE IF NOT EXISTS group_roles (
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
CREATE TABLE IF NOT EXISTS group_members (
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

-- Set up RLS (Row Level Security) policies
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "Public groups are viewable by everyone" ON groups
    FOR SELECT USING (NOT is_private OR EXISTS (
        SELECT 1 FROM group_members 
        WHERE group_members.group_id = groups.id 
        AND group_members.user_id = auth.uid()
    ));

CREATE POLICY "Users can create groups" ON groups
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Group owners can update their groups" ON groups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM group_members gm
            JOIN group_roles gr ON gm.role_id = gr.id
            WHERE gm.group_id = groups.id
            AND gm.user_id = auth.uid()
            AND gr.permissions @> ARRAY['manage_group']::text[]
        )
    );

-- Group roles policies
CREATE POLICY "Group roles are viewable by group members" ON group_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = group_roles.group_id
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Group owners can manage roles" ON group_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM group_members gm
            JOIN group_roles gr ON gm.role_id = gr.id
            WHERE gm.group_id = group_roles.group_id
            AND gm.user_id = auth.uid()
            AND gr.permissions @> ARRAY['manage_group']::text[]
        )
    );

-- Group members policies
CREATE POLICY "Group members are viewable by other members" ON group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join public groups" ON group_members
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        NOT EXISTS (
            SELECT 1 FROM groups
            WHERE groups.id = group_id
            AND groups.is_private = true
        )
    );

CREATE POLICY "Group owners can manage members" ON group_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM group_members gm
            JOIN group_roles gr ON gm.role_id = gr.id
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
            AND gr.permissions @> ARRAY['manage_members']::text[]
        )
    );

-- Create function to update member count
CREATE OR REPLACE FUNCTION update_group_member_count()
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