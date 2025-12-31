// types/notifications.ts
// Sprint 11: Notification System Type Definitions
// Created: Dec 27, 2025

/**
 * Notification Types
 * Enumeration of all possible notification types in the system
 */
export type NotificationType = 
  | 'friend_request'
  | 'friend_request_accepted'
  | 'message'
  | 'comment'
  | 'mention'
  | 'achievement_unlocked'
  | 'challenge_milestone'
  | 'reading_streak'
  | 'event_reminder'
  | 'admin_announcement'
  | 'system_alert'
  | 'engagement'
  | 'achievement'
  | 'milestone';

/**
 * Notification Channel Types
 */
export type NotificationChannel = 'in_app' | 'email' | 'push';

/**
 * Notification Frequency
 */
export type NotificationFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never';

/**
 * Email Digest Frequency
 */
export type EmailDigestFrequency = 'daily' | 'weekly';

/**
 * Email Status
 */
export type EmailStatus = 'pending' | 'sent' | 'failed' | 'bounced' | 'complained';

/**
 * Device Type
 */
export type DeviceType = 'web' | 'ios' | 'android';

/**
 * Core Notification Record
 */
export interface Notification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  
  // Channel tracking
  sent_in_app: boolean;
  sent_email: boolean;
  sent_push: boolean;
  
  // Status tracking
  read_at: string | null;
  archived_at: string | null;
  dismissed_at: string | null;
  
  // Metadata
  source_user_id: string | null;
  source_type: string | null;
  source_id: string | null;
  
  created_at: string;
  updated_at: string;
}

/**
 * Notification with User Details
 */
export interface NotificationWithUser extends Notification {
  source_user?: {
    id: string;
    email: string;
    user_metadata?: {
      first_name?: string;
      last_name?: string;
      avatar_url?: string;
    };
  };
}

/**
 * Per-Type Notification Preference
 */
export interface NotificationTypePreference {
  in_app?: boolean;
  email?: boolean;
  push?: boolean;
  frequency?: NotificationFrequency;
}

/**
 * Notification Preferences for a User
 */
export interface NotificationPreferences {
  id: string;
  user_id: string;
  
  // Global preferences
  all_notifications_enabled: boolean;
  global_mute: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null; // HH:MM format
  quiet_hours_end: string | null;   // HH:MM format
  
  // Per-type settings (key: notification type, value: preferences)
  notification_settings: Record<NotificationType, NotificationTypePreference>;
  
  // Channel defaults
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  
  // Frequency preferences
  default_frequency: NotificationFrequency;
  
  // Digest preferences
  email_digest_enabled: boolean;
  email_digest_frequency: EmailDigestFrequency;
  
  created_at: string;
  updated_at: string;
}

/**
 * Email Notification Log
 */
export interface EmailNotificationLog {
  id: string;
  notification_id: string;
  recipient_email: string;
  
  // Email details
  subject: string;
  template_name: string | null;
  
  // Status tracking
  status: EmailStatus;
  sent_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  
  // Retry tracking
  retry_count: number;
  max_retries: number;
  
  // Provider tracking
  provider: string | null;
  provider_message_id: string | null;
  
  // Engagement tracking
  opened_at: string | null;
  clicked_at: string | null;
  
  created_at: string;
  updated_at: string;
}

/**
 * Push Subscription Record
 */
export interface PushSubscription {
  id: string;
  user_id: string;
  
  // Device info
  device_id: string;
  device_type: DeviceType;
  device_name: string | null;
  
  // Push endpoint
  endpoint: string | null;
  auth_key: string | null;
  p256dh: string | null;
  
  // FCM token
  fcm_token: string | null;
  
  // Status
  is_active: boolean;
  last_used_at: string | null;
  
  // Metadata
  browser_name: string | null;
  browser_version: string | null;
  os_name: string | null;
  os_version: string | null;
  
  created_at: string;
  updated_at: string;
}

/**
 * Web Push Subscription Details
 * Standard Web Push API subscription format
 */
export interface WebPushSubscription {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

/**
 * Notification Creation Payload
 */
export interface CreateNotificationPayload {
  recipient_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  source_user_id?: string;
  source_type?: string;
  source_id?: string;
}

/**
 * Notification Update Payload
 */
export interface UpdateNotificationPayload {
  read_at?: string | null;
  archived_at?: string | null;
  dismissed_at?: string | null;
  sent_in_app?: boolean;
  sent_email?: boolean;
  sent_push?: boolean;
}

/**
 * Notification Filter Options
 */
export interface NotificationFilterOptions {
  type?: NotificationType | NotificationType[];
  read?: boolean;
  archived?: boolean;
  dismissed?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Preference Update Payload
 */
export interface UpdatePreferencePayload {
  all_notifications_enabled?: boolean;
  global_mute?: boolean;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  email_enabled?: boolean;
  push_enabled?: boolean;
  in_app_enabled?: boolean;
  default_frequency?: NotificationFrequency;
  email_digest_enabled?: boolean;
  email_digest_frequency?: EmailDigestFrequency;
  notification_settings?: Record<NotificationType, NotificationTypePreference>;
}

/**
 * Push Subscription Payload
 */
export interface CreatePushSubscriptionPayload {
  device_id: string;
  device_type: DeviceType;
  device_name?: string;
  endpoint?: string;
  auth_key?: string;
  p256dh?: string;
  fcm_token?: string;
  browser_name?: string;
  browser_version?: string;
  os_name?: string;
  os_version?: string;
}

/**
 * API Response Types
 */

export interface NotificationResponse {
  data: Notification | null;
  error: string | null;
}

export interface NotificationsListResponse {
  data: Notification[];
  total: number;
  page: number;
  pageSize: number;
  error: string | null;
}

export interface PreferenceResponse {
  data: NotificationPreferences | null;
  error: string | null;
}

export interface PushSubscriptionResponse {
  data: PushSubscription | null;
  error: string | null;
}

export interface PushSubscriptionsListResponse {
  data: PushSubscription[];
  total: number;
  error: string | null;
}

/**
 * Notification Context Type (for React Context)
 */
export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  preferences: NotificationPreferences | null;
  
  // Actions
  fetchNotifications: (options?: NotificationFilterOptions) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (updates: UpdatePreferencePayload) => Promise<void>;
}

/**
 * Notification Event Type (for real-time subscriptions)
 */
export interface NotificationEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  record: Notification;
  old_record: Notification | null;
}

/**
 * Email Template Data
 */
export interface EmailTemplateData {
  recipientName: string;
  recipientEmail: string;
  subject: string;
  preheader: string;
  content: string;
  actionUrl?: string;
  actionText?: string;
  unsubscribeUrl: string;
}

/**
 * SendGrid Email Configuration
 */
export interface SendGridEmailPayload {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  categories?: string[];
  customArgs?: Record<string, string>;
}

/**
 * Firebase Cloud Messaging Payload
 */
export interface FCMPayload {
  notification: {
    title: string;
    body: string;
    icon?: string;
    image?: string;
    sound?: string;
  };
  data?: Record<string, string>;
  webpush?: {
    fcmOptions: {
      link: string;
    };
    notification?: {
      icon?: string;
      badge?: string;
      tag?: string;
    };
  };
}

/**
 * Unread Notification Count Summary
 */
export interface UnreadNotificationsSummary {
  total: number;
  byType: Record<NotificationType, number>;
}

/**
 * Notification Statistics
 */
export interface NotificationStatistics {
  totalNotifications: number;
  unreadCount: number;
  byType: Record<NotificationType, number>;
  byChannel: {
    in_app: number;
    email: number;
    push: number;
  };
  createdToday: number;
  createdThisWeek: number;
  createdThisMonth: number;
}
