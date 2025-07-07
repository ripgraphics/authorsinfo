export type PrivacyLevel = 'private' | 'friends' | 'followers' | 'public' | 'custom'

export type PermissionType = 'reading_progress' | 'reading_history' | 'reading_stats' | 'reading_goals' | 'all'

export type PermissionLevel = 'read' | 'write' | 'admin'

export type PrivacyAction = 'view' | 'update' | 'delete' | 'permission_granted' | 'permission_revoked'

export interface UserPrivacySettings {
  id: string
  user_id: string
  default_privacy_level: PrivacyLevel
  allow_friends_to_see_reading: boolean
  allow_followers_to_see_reading: boolean
  allow_public_reading_profile: boolean
  show_reading_stats_publicly: boolean
  show_currently_reading_publicly: boolean
  show_reading_history_publicly: boolean
  show_reading_goals_publicly: boolean
  created_at: string
  updated_at: string
}

export interface CustomPermission {
  id: string
  user_id: string
  target_user_id: string
  permission_type: PermissionType
  permission_level: PermissionLevel
  created_at: string
  updated_at: string
}

export interface PrivacyAuditLog {
  id: string
  user_id: string
  action: PrivacyAction
  resource_type: string
  resource_id?: string
  privacy_level_before?: PrivacyLevel
  privacy_level_after?: PrivacyLevel
  viewed_by_user_id?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface ReadingProgressPrivacy {
  id: string
  user_id: string
  book_id: string
  status: string
  progress_percentage: number
  start_date?: string
  finish_date?: string
  privacy_level: PrivacyLevel
  is_public: boolean
  allow_friends: boolean
  allow_followers: boolean
  custom_permissions: CustomPermission[]
  created_at: string
  updated_at: string
}

export interface PrivacySettingsForm {
  default_privacy_level: PrivacyLevel
  allow_friends_to_see_reading: boolean
  allow_followers_to_see_reading: boolean
  allow_public_reading_profile: boolean
  show_reading_stats_publicly: boolean
  show_currently_reading_publicly: boolean
  show_reading_history_publicly: boolean
  show_reading_goals_publicly: boolean
}

export interface PrivacyAccessResult {
  hasAccess: boolean
  reason?: string
  privacyLevel?: PrivacyLevel
}

export interface PrivacyStats {
  total_entries: number
  public_entries: number
  friends_only_entries: number
  followers_only_entries: number
  private_entries: number
  custom_entries: number
}

export interface PrivacyAuditSummary {
  total_views: number
  total_updates: number
  total_permission_changes: number
  recent_activity: PrivacyAuditLog[]
}

export interface PrivacyPermissionRequest {
  target_user_id: string
  permission_type: PermissionType
  permission_level: PermissionLevel
  message?: string
}

export interface PrivacyPermissionResponse {
  id: string
  user_id: string
  target_user_id: string
  permission_type: PermissionType
  permission_level: PermissionLevel
  status: 'pending' | 'approved' | 'rejected'
  message?: string
  created_at: string
  updated_at: string
} 