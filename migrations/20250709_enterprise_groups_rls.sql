-- Enterprise-Grade Groups RLS Policies
-- This file implements comprehensive Row Level Security policies for the groups system

-- Helper function to check if user has specific permission in a group
CREATE OR REPLACE FUNCTION public.has_group_permission(group_id UUID, permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_permissions JSONB;
BEGIN
    -- Get the user's role permissions for this group
    SELECT r.permissions INTO user_role_permissions
    FROM public.group_memberships m
    JOIN public.group_roles r ON r.id = m.role_id
    WHERE m.group_id = $1
    AND m.user_id = auth.uid()
    AND m.status = 'active';

    -- Check if user has the specific permission
    RETURN (user_role_permissions->$2)::boolean OR 
           (user_role_permissions->'admin')::boolean;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can view group
CREATE OR REPLACE FUNCTION public.can_view_group(group_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    group_visibility group_visibility;
    is_member BOOLEAN;
BEGIN
    -- Get group visibility and check membership
    SELECT g.visibility, EXISTS (
        SELECT 1 FROM public.group_memberships m
        WHERE m.group_id = $1
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    ) INTO group_visibility, is_member
    FROM public.groups g
    WHERE g.id = $1;

    -- Return true if:
    -- 1. Group is public
    -- 2. User is a member
    -- 3. User is an admin (checked via separate policy)
    RETURN group_visibility = 'public' OR is_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Groups Table Policies

-- View groups
CREATE POLICY groups_view_policy ON public.groups
    FOR SELECT
    USING (
        visibility = 'public' OR
        EXISTS (
            SELECT 1 FROM public.group_memberships
            WHERE group_id = id
            AND user_id = auth.uid()
            AND status = 'active'
        ) OR
        has_group_permission(id, 'admin')
    );

-- Create groups
CREATE POLICY groups_create_policy ON public.groups
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
    );

-- Update groups
CREATE POLICY groups_update_policy ON public.groups
    FOR UPDATE
    USING (has_group_permission(id, 'manage_group'));

-- Delete groups
CREATE POLICY groups_delete_policy ON public.groups
    FOR DELETE
    USING (has_group_permission(id, 'admin'));

-- 2. Group Roles Policies

-- View roles
CREATE POLICY roles_view_policy ON public.group_roles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_memberships
            WHERE group_id = group_roles.group_id
            AND user_id = auth.uid()
            AND status = 'active'
        )
    );

-- Manage roles
CREATE POLICY roles_manage_policy ON public.group_roles
    FOR ALL
    USING (has_group_permission(group_id, 'manage_roles'));

-- 3. Group Memberships Policies

-- View memberships
CREATE POLICY memberships_view_policy ON public.group_memberships
    FOR SELECT
    USING (
        group_id IN (
            SELECT id FROM public.groups
            WHERE visibility = 'public'
        ) OR
        EXISTS (
            SELECT 1 FROM public.group_memberships m2
            WHERE m2.group_id = group_memberships.group_id
            AND m2.user_id = auth.uid()
            AND m2.status = 'active'
        )
    );

-- Join groups
CREATE POLICY memberships_insert_policy ON public.group_memberships
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        NOT EXISTS (
            SELECT 1 FROM public.group_memberships
            WHERE group_id = NEW.group_id
            AND user_id = NEW.user_id
        )
    );

-- Manage memberships
CREATE POLICY memberships_manage_policy ON public.group_memberships
    FOR UPDATE OR DELETE
    USING (
        has_group_permission(group_id, 'manage_members') OR
        user_id = auth.uid()
    );

-- 4. Content Moderation Policies

-- View moderation
CREATE POLICY moderation_view_policy ON public.group_content_moderation
    FOR SELECT
    USING (has_group_permission(group_id, 'moderate_content'));

-- Manage moderation
CREATE POLICY moderation_manage_policy ON public.group_content_moderation
    FOR ALL
    USING (has_group_permission(group_id, 'moderate_content'));

-- 5. Analytics Policies

-- View analytics
CREATE POLICY analytics_view_policy ON public.group_analytics
    FOR SELECT
    USING (has_group_permission(group_id, 'view_analytics'));

-- Record analytics
CREATE POLICY analytics_insert_policy ON public.group_analytics
    FOR INSERT
    WITH CHECK (has_group_permission(group_id, 'manage_analytics'));

-- 6. Audit Log Policies

-- View audit logs
CREATE POLICY audit_view_policy ON public.group_audit_log
    FOR SELECT
    USING (has_group_permission(group_id, 'view_audit_logs'));

-- Default roles and permissions
INSERT INTO public.group_roles (name, description, is_custom, permissions)
VALUES
    ('owner', 'Group owner with full permissions', false, '{
        "admin": true,
        "manage_group": true,
        "manage_roles": true,
        "manage_members": true,
        "moderate_content": true,
        "manage_analytics": true,
        "view_analytics": true,
        "view_audit_logs": true
    }'::jsonb),
    ('admin', 'Group administrator', false, '{
        "manage_group": true,
        "manage_roles": true,
        "manage_members": true,
        "moderate_content": true,
        "manage_analytics": true,
        "view_analytics": true,
        "view_audit_logs": true
    }'::jsonb),
    ('moderator', 'Content moderator', false, '{
        "moderate_content": true,
        "view_analytics": true
    }'::jsonb),
    ('member', 'Regular group member', false, '{
        "view_analytics": true
    }'::jsonb);

-- Comments
COMMENT ON FUNCTION public.has_group_permission IS 'Helper function to check if a user has a specific permission in a group';
COMMENT ON FUNCTION public.can_view_group IS 'Helper function to check if a user can view a group based on visibility and membership'; 