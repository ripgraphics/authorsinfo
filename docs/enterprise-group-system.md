# Enterprise Group System Documentation

## Overview

This document provides comprehensive documentation for the enterprise-grade group management system implemented using Supabase as the single source of truth. The system includes RBAC, membership management, content management, events, analytics, and settings.

## Database Schema

### Core Tables

#### `groups`
Enhanced groups table with enterprise features:
- Basic info: `id`, `name`, `description`
- Settings: `is_private`, `is_discoverable`, `join_method`
- Metadata: `tags`, `category`, `location`
- Images: `cover_image_url`, `avatar_url`, `group_image_id`, `cover_image_id`
- Statistics: `member_count`, `post_count`, `event_count`
- Status: `status` (active, archived, suspended)
- Settings: `settings` (JSONB)

#### `group_members`
Membership relationships:
- `id`, `group_id`, `user_id`
- `role_id` (references `group_roles`)
- `status` (active, inactive, banned, pending, invited)
- `joined_at`, `last_active_at`
- `invited_by`
- `notification_preferences` (JSONB)
- `metadata` (JSONB)

#### `group_roles`
Role definitions with permissions:
- `id`, `group_id`, `name`, `description`
- `permissions` (JSONB array of permission strings)
- `is_default`, `is_system_role`
- `display_order`

Default system roles:
- **Owner**: Full control (`*` permission)
- **Admin**: Manage group, members, content, roles
- **Moderator**: Moderate content and members
- **Member**: View and create content

#### `group_invitations`
Invitation system:
- `id`, `group_id`, `inviter_id`
- `invitee_email` or `invitee_user_id`
- `role_id`
- `status` (pending, accepted, declined, expired, cancelled)
- `message`, `expires_at`, `accepted_at`

#### `group_content`
Group posts, announcements, discussions, polls:
- `id`, `group_id`, `user_id`
- `content_type` (post, announcement, discussion, poll)
- `title`, `content`, `content_html`
- `is_pinned`, `is_featured`, `is_locked`
- `visibility` (group, members_only, public)
- Engagement: `like_count`, `comment_count`, `share_count`, `view_count`
- Moderation: `moderation_status`, `moderated_by`, `moderated_at`

#### Additional Tables
- `group_events`: Event management
- `group_event_rsvps`: RSVP tracking
- `group_rules`: Group rules and guidelines
- `group_settings`: Group configuration
- `group_analytics`: Activity tracking
- `group_custom_fields`: Custom data fields
- `group_followers`: Public followers
- `group_moderation_log`: Moderation audit log
- `group_notifications`: Group-specific notifications

## API Endpoints

### Groups

#### `GET /api/groups`
List groups with filters:
- Query params: `limit`, `is_private`, `created_by`, `search`, `sort_by`, `sort_order`

#### `POST /api/groups`
Create a new group using `createGroupWithValidation`

#### `GET /api/groups/[id]`
Get group details

#### `PATCH /api/groups/[id]`
Update group using `updateGroupWithValidation`

### Members

#### `GET /api/groups/[id]/members`
List group members

#### `POST /api/groups/[id]/members`
Add member using `addGroupMember`

#### `PATCH /api/groups/[id]/members`
Update member using `updateGroupMember`

#### `DELETE /api/groups/[id]/members`
Remove member using `removeGroupMember`

### Roles

#### `GET /api/groups/[id]/roles`
List group roles

#### `POST /api/groups/[id]/roles`
Create role using `createGroupRole`

#### `PATCH /api/groups/[id]/roles`
Update role using `updateGroupRole`

#### `DELETE /api/groups/[id]/roles`
Delete role using `deleteGroupRole`

### Invitations

#### `GET /api/groups/[id]/invitations`
List invitations (with status filter)

#### `POST /api/groups/[id]/invitations`
Create invitation using `createGroupInvitation`

#### `PATCH /api/groups/[id]/invitations`
Accept/decline invitation

#### `DELETE /api/groups/[id]/invitations`
Cancel invitation

### Content

#### `GET /api/groups/[id]/content`
List group content with filters

#### `POST /api/groups/[id]/content`
Create content using `createGroupContent`

#### `PATCH /api/groups/[id]/content`
Update content using `updateGroupContent`

#### `DELETE /api/groups/[id]/content`
Delete content using `deleteGroupContent`

### Settings

#### `GET /api/groups/[id]/settings`
Get group settings

#### `PATCH /api/groups/[id]/settings`
Update group settings

### Analytics

#### `GET /api/groups/[id]/analytics`
Get group analytics

#### `POST /api/groups/[id]/analytics`
Log analytics event

## Server Actions

All server actions are located in `app/actions/groups/`:

- `create-group-with-validation.ts`: Create groups with schema validation
- `update-group-with-validation.ts`: Update groups with validation
- `manage-members.ts`: Add, update, remove members
- `manage-roles.ts`: Create, update, delete roles
- `manage-invitations.ts`: Create, accept, decline, cancel invitations
- `manage-content.ts`: Create, update, delete content
- `group-analytics.ts`: Get analytics and log events

## Permission System

### Permissions

Available permissions:
- `manage_group`: Manage group settings
- `manage_members`: Manage group membership
- `manage_content`: Moderate content
- `view_content`: View group content
- `create_content`: Create content
- `delete_content`: Delete content
- `manage_roles`: Manage roles
- `invite_members`: Invite new members
- `remove_members`: Remove members
- `create_events`: Create events
- `manage_events`: Manage events
- `*`: All permissions (wildcard)

### Permission Checking

Use utilities in `lib/groups/permissions.ts`:
- `isGroupOwner(groupId, userId)`: Check if user is owner
- `isGroupAdminOrOwner(groupId, userId)`: Check if admin/owner
- `hasGroupPermission(groupId, userId, permission)`: Check specific permission
- `isGroupMember(groupId, userId)`: Check membership
- `getUserGroupRole(groupId, userId)`: Get user's role
- `canViewGroup(groupId, userId?)`: Check visibility

## Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Allow public groups to be viewed by anyone
- Restrict private groups to members
- Enforce role-based permissions
- Protect owner privileges
- Allow members to manage their own data

## Usage Examples

### Create a Group

```typescript
import { createGroupWithValidation } from '@/app/actions/groups/create-group-with-validation'

const result = await createGroupWithValidation({
  name: 'My Group',
  description: 'Group description',
  is_private: false,
  join_method: 'open',
  tags: ['bookclub', 'reading']
})

if (result.success) {
  console.log('Group created:', result.group)
}
```

### Add a Member

```typescript
import { addGroupMember } from '@/app/actions/groups/manage-members'

const result = await addGroupMember({
  groupId: 'group-id',
  userId: 'user-id',
  roleId: null // Uses default role
})
```

### Check Permissions

```typescript
import { hasGroupPermission } from '@/lib/groups/permissions'

const canManage = await hasGroupPermission(
  groupId,
  userId,
  'manage_members'
)
```

### Create Content

```typescript
import { createGroupContent } from '@/app/actions/groups/manage-content'

const result = await createGroupContent({
  groupId: 'group-id',
  contentType: 'post',
  title: 'Hello World',
  content: 'Content here',
  visibility: 'group'
})
```

## Migration

The migration file `supabase/migrations/20251221133353_create_enterprise_groups_schema.sql` contains:
- Table definitions
- Indexes for performance
- Triggers for auto-updating counts
- RLS policies
- Helper functions

To apply the migration:
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run the migration file
4. Verify tables and policies are created

## Best Practices

1. **Always use server actions** instead of direct database queries
2. **Validate inputs** using the validation utilities
3. **Check permissions** before allowing operations
4. **Use schema validation** to ensure data integrity
5. **Handle errors gracefully** with proper error messages
6. **Use transactions** for multi-step operations (when needed)
7. **Respect RLS policies** - don't bypass them

## Security Considerations

- All tables have RLS enabled
- Permission checks are enforced server-side
- Input validation prevents malicious data
- Audit logging tracks important actions
- Owner privileges are protected
- Private groups are properly restricted

## Future Enhancements

Potential additions:
- Advanced analytics and reporting
- Group templates
- Bulk operations
- Advanced search and filtering
- Group merging
- Export capabilities
- Integration with external services

