export interface GroupRole {
  id: number
  group_id: string
  name: string
  description: string | null
  permissions: string[]
  is_default: boolean
  is_system_role: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface GroupRoleInput {
  name: string
  description?: string | null
  permissions: string[]
  isDefault?: boolean
  displayOrder?: number
}

export interface GroupRoleUpdate {
  name?: string
  description?: string | null
  permissions?: string[]
  isDefault?: boolean
  displayOrder?: number
}

// Standard permission types
export type GroupPermission =
  | 'manage_group'
  | 'manage_members'
  | 'manage_content'
  | 'view_content'
  | 'create_content'
  | 'delete_content'
  | 'manage_roles'
  | 'invite_members'
  | 'remove_members'
  | 'create_events'
  | 'manage_events'
  | '*'
