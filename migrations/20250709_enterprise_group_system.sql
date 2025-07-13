-- Enterprise Group System Migration
-- This migration adds enterprise-grade group functionality with roles, permissions,
-- audit logging, and advanced features

-- 1. Group Roles and Permissions
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

COMMENT ON TABLE public.group_roles IS 'Defines roles and their permissions within groups';

-- 2. Group Member Roles
CREATE TABLE IF NOT EXISTS public.group_member_roles (
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES public.group_roles(id) ON DELETE CASCADE,
    assigned_by uuid REFERENCES auth.users(id),
    assigned_at timestamptz DEFAULT now(),
    PRIMARY KEY (group_id, user_id, role_id)
);

COMMENT ON TABLE public.group_member_roles IS 'Associates users with their roles in groups';

-- 3. Group Audit Log
CREATE TABLE IF NOT EXISTS public.group_audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    old_values jsonb,
    new_values jsonb,
    metadata jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.group_audit_log IS 'Tracks all actions and changes within groups';

-- 4. Group Settings
CREATE TABLE IF NOT EXISTS public.group_settings (
    group_id uuid PRIMARY KEY REFERENCES public.groups(id) ON DELETE CASCADE,
    privacy_level text NOT NULL DEFAULT 'public'
        CHECK (privacy_level IN ('public', 'private', 'secret', 'invite_only')),
    join_approval_required boolean DEFAULT false,
    content_moderation_enabled boolean DEFAULT true,
    ai_moderation_enabled boolean DEFAULT false,
    analytics_enabled boolean DEFAULT true,
    notification_settings jsonb DEFAULT '{}',
    branding_settings jsonb DEFAULT '{}',
    integration_settings jsonb DEFAULT '{}',
    custom_domain text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.group_settings IS 'Stores group configuration and customization settings';

-- 5. Group Content Moderation
CREATE TABLE IF NOT EXISTS public.group_content_moderation (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    content_type text NOT NULL,
    content_id uuid NOT NULL,
    reporter_id uuid REFERENCES auth.users(id),
    moderator_id uuid REFERENCES auth.users(id),
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    reason text,
    ai_score numeric(3,2),
    ai_flags jsonb,
    resolution_notes text,
    created_at timestamptz DEFAULT now(),
    resolved_at timestamptz,
    UNIQUE (group_id, content_type, content_id)
);

COMMENT ON TABLE public.group_content_moderation IS 'Manages content moderation queue and decisions';

-- 6. Group Analytics
CREATE TABLE IF NOT EXISTS public.group_analytics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    date date NOT NULL,
    total_members integer DEFAULT 0,
    active_members integer DEFAULT 0,
    new_members integer DEFAULT 0,
    total_content integer DEFAULT 0,
    new_content integer DEFAULT 0,
    engagement_metrics jsonb DEFAULT '{}',
    content_metrics jsonb DEFAULT '{}',
    member_metrics jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    UNIQUE (group_id, date)
);

COMMENT ON TABLE public.group_analytics IS 'Stores daily group activity and engagement metrics';

-- 7. Group Invitations
CREATE TABLE IF NOT EXISTS public.group_invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    inviter_id uuid NOT NULL REFERENCES auth.users(id),
    invitee_email text NOT NULL,
    role_id uuid REFERENCES public.group_roles(id),
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    token text UNIQUE NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.group_invitations IS 'Manages group membership invitations';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_audit_log_group_id ON public.group_audit_log(group_id);
CREATE INDEX IF NOT EXISTS idx_group_audit_log_user_id ON public.group_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_group_audit_log_created_at ON public.group_audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_group_content_moderation_group_id ON public.group_content_moderation(group_id);
CREATE INDEX IF NOT EXISTS idx_group_content_moderation_status ON public.group_content_moderation(status);

CREATE INDEX IF NOT EXISTS idx_group_analytics_group_id_date ON public.group_analytics(group_id, date);

CREATE INDEX IF NOT EXISTS idx_group_invitations_group_id ON public.group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_token ON public.group_invitations(token);
CREATE INDEX IF NOT EXISTS idx_group_invitations_status ON public.group_invitations(status);

-- Add RLS policies
ALTER TABLE public.group_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_content_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- Default roles function
CREATE OR REPLACE FUNCTION public.create_default_group_roles(group_id uuid)
RETURNS void AS $$
BEGIN
    -- Owner role
    INSERT INTO public.group_roles (group_id, name, description, is_custom, permissions)
    VALUES (
        group_id,
        'owner',
        'Full control over the group',
        false,
        '{
            "manage_roles": true,
            "manage_members": true,
            "manage_settings": true,
            "manage_content": true,
            "view_analytics": true,
            "moderate_content": true,
            "invite_members": true,
            "remove_members": true,
            "delete_group": true
        }'::jsonb
    );

    -- Admin role
    INSERT INTO public.group_roles (group_id, name, description, is_custom, permissions)
    VALUES (
        group_id,
        'admin',
        'Administrative control with some restrictions',
        false,
        '{
            "manage_roles": false,
            "manage_members": true,
            "manage_settings": true,
            "manage_content": true,
            "view_analytics": true,
            "moderate_content": true,
            "invite_members": true,
            "remove_members": true,
            "delete_group": false
        }'::jsonb
    );

    -- Moderator role
    INSERT INTO public.group_roles (group_id, name, description, is_custom, permissions)
    VALUES (
        group_id,
        'moderator',
        'Content moderation and member management',
        false,
        '{
            "manage_roles": false,
            "manage_members": false,
            "manage_settings": false,
            "manage_content": true,
            "view_analytics": true,
            "moderate_content": true,
            "invite_members": true,
            "remove_members": false,
            "delete_group": false
        }'::jsonb
    );

    -- Member role
    INSERT INTO public.group_roles (group_id, name, description, is_custom, permissions)
    VALUES (
        group_id,
        'member',
        'Regular group member',
        false,
        '{
            "manage_roles": false,
            "manage_members": false,
            "manage_settings": false,
            "manage_content": false,
            "view_analytics": false,
            "moderate_content": false,
            "invite_members": false,
            "remove_members": false,
            "delete_group": false
        }'::jsonb
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default roles when a new group is created
CREATE OR REPLACE FUNCTION public.create_group_default_roles()
RETURNS trigger AS $$
BEGIN
    PERFORM public.create_default_group_roles(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_group_default_roles
    AFTER INSERT ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.create_group_default_roles();

-- Function to assign owner role to group creator
CREATE OR REPLACE FUNCTION public.assign_group_owner_role()
RETURNS trigger AS $$
DECLARE
    owner_role_id uuid;
BEGIN
    -- Get the owner role ID
    SELECT id INTO owner_role_id
    FROM public.group_roles
    WHERE group_id = NEW.id AND name = 'owner'
    LIMIT 1;

    -- Assign owner role to creator
    IF owner_role_id IS NOT NULL AND NEW.created_by IS NOT NULL THEN
        INSERT INTO public.group_member_roles (group_id, user_id, role_id)
        VALUES (NEW.id, NEW.created_by, owner_role_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_group_owner_role
    AFTER INSERT ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_group_owner_role(); 