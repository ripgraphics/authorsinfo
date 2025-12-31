export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role_id: number | null
  status: 'active' | 'inactive' | 'banned' | 'pending' | 'invited'
  joined_at: string
  last_active_at: string | null
  invited_by: string | null
  notification_preferences: {
    email?: boolean
    push?: boolean
    digest?: boolean
  }
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  // Expanded fields
  user?: {
    id: string
    name: string
    email: string
  }
  role?: {
    id: number
    name: string
    description: string | null
    permissions: string[]
  }
}

export interface GroupMemberInput {
  userId: string
  roleId?: number | null
  status?: 'active' | 'pending' | 'invited'
}

export interface GroupMemberUpdate {
  roleId?: number | null
  status?: 'active' | 'inactive' | 'banned'
  notificationPreferences?: Record<string, any>
}
