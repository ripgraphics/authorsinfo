import { createServerActionClientAsync } from '@/lib/supabase/client-helper'

import type {
  PrivacyLevel,
  PermissionType,
  PrivacySettingsForm,
  PrivacyAccessResult,
  PrivacyStats,
  PrivacyAuditSummary,
  PrivacyPermissionRequest,
} from '@/types/privacy'
import type { Database } from '@/types/database'

import { cookies } from 'next/headers'

export class PrivacyService {
  private static async getSupabase() {
    await cookies()
    return await createServerActionClientAsync()
  }

  /**
   * Check if a user has access to another user's reading progress
   */
  static async checkReadingAccess(targetUserId: string): Promise<PrivacyAccessResult> {
    try {
      const supabase = await this.getSupabase()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        return { hasAccess: false, reason: 'Not authenticated' }
      }

      // User can always access their own data
      if (user.id === targetUserId) {
        return { hasAccess: true, reason: 'Own data' }
      }

      // Check using the database function
      const { data, error } = await (supabase as any).rpc('check_reading_privacy_access', {
        target_user_id: targetUserId,
        requesting_user_id: user.id,
      })

      if (error) {
        console.error('Error checking privacy access:', error)
        return { hasAccess: false, reason: 'Database error' }
      }

      return { hasAccess: data || false, reason: data ? 'Access granted' : 'Access denied' }
    } catch (error) {
      console.error('Error in checkReadingAccess:', error)
      return { hasAccess: false, reason: 'Service error' }
    }
  }

  /**
   * Get user's privacy settings
   */
  static async getUserPrivacySettings(userId?: string): Promise<PrivacySettingsForm | null> {
    try {
      const supabase = await this.getSupabase()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return null

      const targetUserId = userId || user.id

      const { data, error } = await supabase
        .from('user_privacy_settings')
        .select('id, user_id, profile_visibility, show_activity, allow_friend_requests, allow_messages, block_list, created_at, updated_at')
        .eq('user_id', targetUserId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching privacy settings:', error)
        return null
      }

      if (!data) {
        // Create default privacy settings
        return this.createDefaultPrivacySettings(targetUserId)
      }

      const privacyData = data as Database['public']['Tables']['user_privacy_settings']['Row']
      return {
        default_privacy_level: privacyData.default_privacy_level as any,
        allow_friends_to_see_reading: privacyData.allow_friends_to_see_reading,
        allow_followers_to_see_reading: privacyData.allow_followers_to_see_reading,
        allow_public_reading_profile: privacyData.allow_public_reading_profile,
        show_reading_stats_publicly: privacyData.show_reading_stats_publicly,
        show_currently_reading_publicly: privacyData.show_currently_reading_publicly,
        show_reading_history_publicly: privacyData.show_reading_history_publicly,
        show_reading_goals_publicly: privacyData.show_reading_goals_publicly,
      }
    } catch (error) {
      console.error('Error in getUserPrivacySettings:', error)
      return null
    }
  }

  /**
   * Update user's privacy settings
   */
  static async updatePrivacySettings(settings: PrivacySettingsForm): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await (supabase as any).from('user_privacy_settings').upsert({
        user_id: user.id,
        default_privacy_level: settings.default_privacy_level,
        allow_friends_to_see_reading: settings.allow_friends_to_see_reading,
        allow_followers_to_see_reading: settings.allow_followers_to_see_reading,
        allow_public_reading_profile: settings.allow_public_reading_profile,
        show_reading_stats_publicly: settings.show_reading_stats_publicly,
        show_currently_reading_publicly: settings.show_currently_reading_publicly,
        show_reading_history_publicly: settings.show_reading_history_publicly,
        show_reading_goals_publicly: settings.show_reading_goals_publicly,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error('Error updating privacy settings:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updatePrivacySettings:', error)
      return false
    }
  }

  /**
   * Grant custom permission to another user
   */
  static async grantCustomPermission(request: PrivacyPermissionRequest): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await (supabase as any).from('custom_permissions').upsert({
        user_id: user.id,
        target_user_id: request.target_user_id,
        permission_type: request.permission_type,
        permission_level: request.permission_level,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error('Error granting custom permission:', error)
        return false
      }

      // Log the permission grant
      await (supabase as any).rpc('log_privacy_event', {
        action: 'permission_granted',
        resource_type: 'custom_permission',
        privacy_level_after: 'custom',
      })

      return true
    } catch (error) {
      console.error('Error in grantCustomPermission:', error)
      return false
    }
  }

  /**
   * Revoke custom permission from another user
   */
  static async revokeCustomPermission(
    targetUserId: string,
    permissionType: PermissionType
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await supabase
        .from('custom_permissions')
        .delete()
        .eq('user_id', user.id)
        .eq('target_user_id', targetUserId)
        .eq('permission_type', permissionType)

      if (error) {
        console.error('Error revoking custom permission:', error)
        return false
      }

      // Log the permission revocation
      await (supabase as any).rpc('log_privacy_event', {
        action: 'permission_revoked',
        resource_type: 'custom_permission',
      })

      return true
    } catch (error) {
      console.error('Error in revokeCustomPermission:', error)
      return false
    }
  }

  /**
   * Get privacy statistics for a user
   */
  static async getPrivacyStats(userId?: string): Promise<PrivacyStats | null> {
    try {
      const supabase = await this.getSupabase()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return null

      const targetUserId = userId || user.id

      const { data, error } = await (supabase as any)
        .from('reading_progress')
        .select('privacy_level')
        .eq('user_id', targetUserId)

      if (error) {
        console.error('Error fetching privacy stats:', error)
        return null
      }

      const stats = {
        total_entries: data.length,
        public_entries: data.filter((item: any) => item.privacy_level === 'public').length,
        friends_only_entries: data.filter((item: any) => item.privacy_level === 'friends')
          .length,
        followers_only_entries: data.filter(
          (item: any) => item.privacy_level === 'followers'
        ).length,
        private_entries: data.filter((item: any) => item.privacy_level === 'private')
          .length,
        custom_entries: data.filter((item: any) => item.privacy_level === 'custom').length,
      }

      return stats
    } catch (error) {
      console.error('Error in getPrivacyStats:', error)
      return null
    }
  }

  /**
   * Get privacy audit summary
   */
  static async getPrivacyAuditSummary(userId?: string): Promise<PrivacyAuditSummary | null> {
    try {
      const supabase = await this.getSupabase()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return null

      const targetUserId = userId || user.id

      const { data, error } = await (supabase as any)
        .from('privacy_audit_log')
        .select('id, user_id, action, resource_type, resource_id, timestamp, ip_address, user_agent')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching privacy audit:', error)
        return null
      }

      const summary = {
        total_views: data.filter((item: { action: string }) => item.action === 'view').length,
        total_updates: data.filter((item: { action: string }) => item.action === 'update').length,
        total_permission_changes: data.filter(
          (item: { action: string }) =>
            item.action === 'permission_granted' ||
            item.action === 'permission_revoked'
        ).length,
        recent_activity: data.slice(0, 10),
      }

      return summary
    } catch (error) {
      console.error('Error in getPrivacyAuditSummary:', error)
      return null
    }
  }

  /**
   * Update reading progress privacy level
   */
  static async updateReadingProgressPrivacy(
    bookId: string,
    privacyLevel: PrivacyLevel,
    allowFriends: boolean = false,
    allowFollowers: boolean = false
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await (supabase as any).from('reading_progress')
        .update({
          privacy_level: privacyLevel,
          allow_friends: allowFriends,
          allow_followers: allowFollowers,
          updated_at: new Date().toISOString(),
        })
        .eq('book_id', bookId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating reading progress privacy:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateReadingProgressPrivacy:', error)
      return false
    }
  }

  /**
   * Get users who have access to your reading progress
   */
  static async getUsersWithAccess(): Promise<any[]> {
    try {
      const supabase = await this.getSupabase()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return []

      // Get friends
      const { data: friends } = await supabase
        .from('user_friends')
        .select(
          `
          friend_id,
          users!user_friends_friend_id_fkey(id, username, full_name, avatar_url)
        `
        )
        .eq('user_id', user.id)

      // Get followers
      const { data: followers } = await supabase
        .from('follows')
        .select(
          `
          follower_id,
          users!follows_follower_id_fkey(id, username, full_name, avatar_url)
        `
        )
        .eq('following_id', user.id)

      // Get custom permissions
      const { data: customPermissions } = await supabase
        .from('custom_permissions')
        .select(
          `
          target_user_id,
          permission_type,
          permission_level,
          users!custom_permissions_target_user_id_fkey(id, username, full_name, avatar_url)
        `
        )
        .eq('user_id', user.id)

      return [
        ...(friends?.map((f: { users: any }) => ({ ...f.users, access_type: 'friend' })) || []),
        ...(followers?.map((f: { users: any }) => ({ ...f.users, access_type: 'follower' })) || []),
        ...(customPermissions?.map((cp: { users: any; permission_type: string; permission_level?: string }) => ({
          ...cp.users,
          access_type: 'custom',
          permission_type: cp.permission_type,
          permission_level: cp.permission_level,
        })) || []),
      ]
    } catch (error) {
      console.error('Error in getUsersWithAccess:', error)
      return []
    }
  }

  /**
   * Create default privacy settings for a user
   */
  private static async createDefaultPrivacySettings(userId: string): Promise<PrivacySettingsForm> {
    const defaultSettings: PrivacySettingsForm = {
      default_privacy_level: 'private',
      allow_friends_to_see_reading: false,
      allow_followers_to_see_reading: false,
      allow_public_reading_profile: false,
      show_reading_stats_publicly: false,
      show_currently_reading_publicly: false,
      show_reading_history_publicly: false,
      show_reading_goals_publicly: false,
    }

    // Try to create the settings in the database
    try {
      const supabase = await this.getSupabase()

      await (supabase as any).from('user_privacy_settings').insert({
        user_id: userId,
        ...defaultSettings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error creating default privacy settings:', error)
    }

    return defaultSettings
  }

  /**
   * Get privacy level display name
   */
  static getPrivacyLevelDisplayName(level: PrivacyLevel): string {
    const displayNames = {
      private: 'Private',
      friends: 'Friends Only',
      followers: 'Followers Only',
      public: 'Public',
      custom: 'Custom',
    }
    return displayNames[level] || level
  }

  /**
   * Get privacy level description
   */
  static getPrivacyLevelDescription(level: PrivacyLevel): string {
    const descriptions = {
      private: 'Only you can see this content',
      friends: 'Only your friends can see this content',
      followers: 'Only your followers can see this content',
      public: 'Anyone can see this content',
      custom: 'Custom permissions applied',
    }
    return descriptions[level] || ''
  }

  /**
   * Get privacy level icon
   */
  static getPrivacyLevelIcon(level: PrivacyLevel): string {
    const icons = {
      private: '🔒',
      friends: '👥',
      followers: '👤',
      public: '🌍',
      custom: '⚙️',
    }
    return icons[level] || '🔒'
  }
}
