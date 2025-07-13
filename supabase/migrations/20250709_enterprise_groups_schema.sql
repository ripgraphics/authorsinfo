-- Enterprise Groups Schema Migration
-- This migration adds enterprise-grade functionality to groups including:
-- - Role-based access control
-- - Audit logging
-- - Content moderation
-- - Member management
-- - Group settings
-- - Analytics tracking

-- 1. Group Roles
CREATE TABLE IF NOT EXISTS public.group_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    is_custom boolean DEFAULT false,
    permissions jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (group_id, name)
);

ALTER TABLE public.group_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group roles are viewable by group members"
    ON public.group_roles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = group_roles.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- 2. Group Members (Extend existing table)
ALTER TABLE public.group_members 
    ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.group_roles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('active', 'suspended', 'banned')) DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS last_active timestamptz DEFAULT now();

-- 3. Group Settings
CREATE TABLE IF NOT EXISTS public.group_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE UNIQUE,
    name text NOT NULL,
    description text,
    privacy text CHECK (privacy IN ('public', 'private', 'hidden')) DEFAULT 'public',
    join_type text CHECK (join_type IN ('open', 'request', 'invite')) DEFAULT 'open',
    moderation_settings jsonb NOT NULL DEFAULT '{
        "auto_moderation": false,
        "toxicity_threshold": 80,
        "require_approval": false,
        "allowed_content_types": ["text", "image", "link"],
        "banned_keywords": [],
        "notification_settings": {
            "email": true,
            "push": false,
            "slack": false,
            "discord": false
        }
    }',
    branding jsonb DEFAULT '{
        "logo_url": null,
        "banner_url": null,
        "primary_color": null,
        "secondary_color": null
    }',
    integrations jsonb DEFAULT '{
        "slack_webhook": null,
        "discord_webhook": null,
        "api_key": null
    }',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.group_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group settings are viewable by group members"
    ON public.group_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = group_settings.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- 4. Group Invitations
CREATE TABLE IF NOT EXISTS public.group_invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    email text NOT NULL,
    role_id uuid REFERENCES public.group_roles(id) ON DELETE SET NULL,
    status text CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group invitations are viewable by group members with manage_members permission"
    ON public.group_invitations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            JOIN public.group_roles gr ON gm.role_id = gr.id
            WHERE gm.group_id = group_invitations.group_id
            AND gm.user_id = auth.uid()
            AND (gr.permissions->>'manageMembers')::boolean = true
        )
    );

-- 5. Group Audit Log
CREATE TABLE IF NOT EXISTS public.group_audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    old_values jsonb,
    new_values jsonb,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.group_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs are viewable by group members with audit permission"
    ON public.group_audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            JOIN public.group_roles gr ON gm.role_id = gr.id
            WHERE gm.group_id = group_audit_log.group_id
            AND gm.user_id = auth.uid()
            AND (gr.permissions->>'viewAudit')::boolean = true
        )
    );

-- 6. Group Content Moderation
CREATE TABLE IF NOT EXISTS public.group_moderation_queue (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    content_type text NOT NULL,
    content_id uuid NOT NULL,
    reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reason text,
    status text CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    toxicity_score float,
    moderated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    moderated_at timestamptz,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.group_moderation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderation queue is viewable by group moderators"
    ON public.group_moderation_queue FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            JOIN public.group_roles gr ON gm.role_id = gr.id
            WHERE gm.group_id = group_moderation_queue.group_id
            AND gm.user_id = auth.uid()
            AND (gr.permissions->>'moderateContent')::boolean = true
        )
    );

-- 7. Group Analytics
CREATE TABLE IF NOT EXISTS public.group_analytics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    date date NOT NULL,
    metrics jsonb NOT NULL DEFAULT '{
        "total_members": 0,
        "active_members": 0,
        "new_members": 0,
        "content_created": 0,
        "content_engagement": 0,
        "reported_content": 0
    }',
    UNIQUE (group_id, date)
);

ALTER TABLE public.group_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analytics are viewable by group members with analytics permission"
    ON public.group_analytics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            JOIN public.group_roles gr ON gm.role_id = gr.id
            WHERE gm.group_id = group_analytics.group_id
            AND gm.user_id = auth.uid()
            AND (gr.permissions->>'viewAnalytics')::boolean = true
        )
    );

-- Create default roles function
CREATE OR REPLACE FUNCTION public.create_default_group_roles(group_id uuid)
RETURNS void AS $$
BEGIN
    -- Owner role
    INSERT INTO public.group_roles (group_id, name, description, is_custom, permissions)
    VALUES (
        group_id,
        'Owner',
        'Full control over the group',
        false,
        '{
            "manageRoles": true,
            "manageMembers": true,
            "manageSettings": true,
            "manageContent": true,
            "viewAnalytics": true,
            "moderateContent": true,
            "createContent": true,
            "editContent": true,
            "deleteContent": true,
            "inviteMembers": true,
            "removeMembers": true,
            "viewAudit": true
        }'::jsonb
    );

    -- Admin role
    INSERT INTO public.group_roles (group_id, name, description, is_custom, permissions)
    VALUES (
        group_id,
        'Admin',
        'Administrative control with some restrictions',
        false,
        '{
            "manageMembers": true,
            "manageContent": true,
            "viewAnalytics": true,
            "moderateContent": true,
            "createContent": true,
            "editContent": true,
            "deleteContent": true,
            "inviteMembers": true,
            "removeMembers": true,
            "viewAudit": true
        }'::jsonb
    );

    -- Moderator role
    INSERT INTO public.group_roles (group_id, name, description, is_custom, permissions)
    VALUES (
        group_id,
        'Moderator',
        'Content moderation and member management',
        false,
        '{
            "moderateContent": true,
            "createContent": true,
            "editContent": true,
            "deleteContent": true,
            "inviteMembers": true
        }'::jsonb
    );

    -- Member role
    INSERT INTO public.group_roles (group_id, name, description, is_custom, permissions)
    VALUES (
        group_id,
        'Member',
        'Standard member access',
        false,
        '{
            "createContent": true,
            "editContent": true
        }'::jsonb
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default roles when a new group is created
CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default roles
    PERFORM public.create_default_group_roles(NEW.id);
    
    -- Create default settings
    INSERT INTO public.group_settings (group_id, name, description)
    VALUES (NEW.id, NEW.name, NEW.description);
    
    -- Assign owner role to creator
    INSERT INTO public.group_members (group_id, user_id, role_id)
    VALUES (
        NEW.id,
        NEW.created_by,
        (SELECT id FROM public.group_roles WHERE group_id = NEW.id AND name = 'Owner' LIMIT 1)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_group_created
    AFTER INSERT ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_group();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role_id ON public.group_members(role_id);
CREATE INDEX IF NOT EXISTS idx_group_roles_group_id ON public.group_roles(group_id);
CREATE INDEX IF NOT EXISTS idx_group_audit_log_group_id ON public.group_audit_log(group_id);
CREATE INDEX IF NOT EXISTS idx_group_audit_log_created_at ON public.group_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_group_moderation_queue_group_id ON public.group_moderation_queue(group_id);
CREATE INDEX IF NOT EXISTS idx_group_moderation_queue_status ON public.group_moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_group_analytics_group_id_date ON public.group_analytics(group_id, date); 