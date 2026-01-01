/**
 * Sprint 11: Engagement System - Notification Types
 * Comprehensive TypeScript definitions for multi-channel notifications
 * Single Source of Truth: Supabase PostgreSQL
 */

// ============================================================================
// ENUMS: Notification Types & Preferences
// ============================================================================

export enum NotificationType {
  FRIEND_REQUEST = 'friend_request',
  MESSAGE = 'message',
  COMMENT = 'comment',
  MENTION = 'mention',
  ACHIEVEMENT = 'achievement',
  CHALLENGE = 'challenge',
  STREAK = 'streak',
  EVENT = 'event',
  ADMIN = 'admin',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
}

export enum EmailFrequency {
  IMMEDIATE = 'immediate',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  NEVER = 'never',
}

export enum PushFrequency {
  IMMEDIATE = 'immediate',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  NEVER = 'never',
}

export enum EmailDeliveryStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  UNSUBSCRIBED = 'unsubscribed',
}

export enum DeviceType {
  WEB = 'web',
  IOS = 'ios',
  ANDROID = 'android',
}

// ============================================================================
// INTERFACES: Database Tables
// ============================================================================

/**
 * Core notification record
 */
export interface Notification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

/**
 * User notification preferences with granular control
 */
export interface NotificationPreferences {
  id: string;
  user_id: string;

  // Per-type toggles
  friend_request_enabled: boolean;
  message_enabled: boolean;
  comment_enabled: boolean;
  mention_enabled: boolean;
  achievement_enabled: boolean;
  challenge_enabled: boolean;
  streak_enabled: boolean;
  event_enabled: boolean;
  admin_enabled: boolean;

  // Channel toggles
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;

  // Frequency preferences
  email_frequency: EmailFrequency;
  push_frequency: PushFrequency;

  // Quiet hours (do not disturb)
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // HH:MM:SS format
  quiet_hours_end: string; // HH:MM:SS format
  timezone: string;

  // Global mute
  all_notifications_muted: boolean;
  muted_until: string | null;

  created_at: string;
  updated_at: string;
}

/**
 * Email delivery tracking and compliance
 */
export interface EmailNotificationLog {
  id: string;
  notification_id: string;
  recipient_email: string;
  subject: string;
  status: EmailDeliveryStatus;
  error_message: string | null;
  attempt_count: number;
  last_attempt_at: string;
  sent_at: string | null;
  bounced_at: string | null;
  unsubscribe_token: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Push device registration
 */
export interface PushSubscription {
  id: string;
  user_id: string;
  device_id: string;
  device_type: DeviceType;
  endpoint: string;
  auth_key: string | null;
  p256dh_key: string | null;
  is_active: boolean;
  last_used_at: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INTERFACES: Materialized Views
// ============================================================================

/**
 * Per-user notification summary (materialized view)
 */
export interface NotificationSummary {
  user_id: string;
  total_notifications: number;
  unread_count: number;
  friend_request_count: number;
  message_count: number;
  comment_count: number;
  mention_count: number;
  achievement_count: number;
  challenge_count: number;
  streak_count: number;
  event_count: number;
  admin_count: number;
  last_notification_time: string | null;
}

/**
 * Daily email delivery health (materialized view)
 */
export interface EmailDeliveryHealth {
  delivery_date: string;
  total_sent: number;
  successfully_sent: number;
  failed_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  success_rate: number;
}

/**
 * Active push devices per user (materialized view)
 */
export interface PushDeviceSummary {
  user_id: string;
  web_devices: number;
  ios_devices: number;
  android_devices: number;
  total_active_devices: number;
  last_activity: string | null;
}

// ============================================================================
// INTERFACES: API Request/Response Types
// ============================================================================

/**
 * Create notification request
 */
export interface CreateNotificationRequest {
  recipient_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

/**
 * Update notification request
 */
export interface UpdateNotificationRequest {
  title?: string;
  message?: string;
  is_read?: boolean;
  data?: Record<string, any>;
}

/**
 * Update preferences request
 */
export interface UpdatePreferencesRequest {
  friend_request_enabled?: boolean;
  message_enabled?: boolean;
  comment_enabled?: boolean;
  mention_enabled?: boolean;
  achievement_enabled?: boolean;
  challenge_enabled?: boolean;
  streak_enabled?: boolean;
  event_enabled?: boolean;
  admin_enabled?: boolean;
  in_app_enabled?: boolean;
  email_enabled?: boolean;
  push_enabled?: boolean;
  email_frequency?: EmailFrequency;
  push_frequency?: PushFrequency;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone?: string;
  all_notifications_muted?: boolean;
  muted_until?: string | null;
}

/**
 * Register push device request
 */
export interface RegisterDeviceRequest {
  device_id: string;
  device_type: DeviceType;
  endpoint: string;
  auth_key?: string;
  p256dh_key?: string;
}

/**
 * Update device request
 */
export interface UpdateDeviceRequest {
  endpoint?: string;
  auth_key?: string;
  p256dh_key?: string;
  is_active?: boolean;
}

/**
 * Mark notification as read request
 */
export interface MarkAsReadRequest {
  is_read: boolean;
}

/**
 * Batch mark as read request
 */
export interface BatchMarkAsReadRequest {
  notification_ids: string[];
  is_read: boolean;
}

/**
 * Get notifications query parameters
 */
export interface GetNotificationsQuery {
  limit?: number;
  offset?: number;
  type?: NotificationType;
  is_read?: boolean;
  sort?: 'asc' | 'desc';
}

// ============================================================================
// INTERFACES: Response Types
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Notification list response
 */
export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Preferences response
 */
export interface PreferencesResponse {
  preferences: NotificationPreferences;
}

/**
 * Device registration response
 */
export interface DeviceRegistrationResponse {
  subscription: PushSubscription;
}

/**
 * Delivery status response
 */
export interface DeliveryStatusResponse {
  status: EmailDeliveryStatus;
  notification_id: string;
  recipient_email: string;
  updated_at: string;
}

// ============================================================================
// INTERFACES: Store State & Actions
// ============================================================================

/**
 * Notification store state
 */
export interface NotificationStoreState {
  // Data
  notifications: Notification[];
  preferences: NotificationPreferences | null;
  devices: PushSubscription[];
  summary: NotificationSummary | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  selectedNotification: Notification | null;
  filter: {
    type?: NotificationType;
    isRead?: boolean;
  };

  // Pagination
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/**
 * Notification store actions
 */
export interface NotificationStoreActions {
  // Notification CRUD
  fetchNotifications: (query?: GetNotificationsQuery) => Promise<void>;
  createNotification: (data: CreateNotificationRequest) => Promise<Notification>;
  updateNotification: (id: string, data: UpdateNotificationRequest) => Promise<Notification>;
  deleteNotification: (id: string) => Promise<void>;
  markAsRead: (id: string, isRead: boolean) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  batchMarkAsRead: (ids: string[], isRead: boolean) => Promise<void>;

  // Preferences
  fetchPreferences: () => Promise<void>;
  updatePreferences: (data: UpdatePreferencesRequest) => Promise<NotificationPreferences>;

  // Device Management
  fetchDevices: () => Promise<void>;
  registerDevice: (data: RegisterDeviceRequest) => Promise<PushSubscription>;
  updateDevice: (id: string, data: UpdateDeviceRequest) => Promise<PushSubscription>;
  unregisterDevice: (id: string) => Promise<void>;
  updateDeviceActivity: (id: string) => Promise<void>;

  // Summary
  fetchSummary: () => Promise<void>;

  // UI Actions
  setSelectedNotification: (notification: Notification | null) => void;
  setFilter: (filter: { type?: NotificationType; isRead?: boolean }) => void;
  setPagination: (offset: number, limit: number) => void;
  setError: (error: string | null) => void;
}

// ============================================================================
// INTERFACES: Service/Dispatcher
// ============================================================================

/**
 * Notification dispatcher service
 */
export interface NotificationDispatcher {
  shouldSendNotification: (
    userId: string,
    type: NotificationType,
    channel: NotificationChannel
  ) => Promise<boolean>;

  sendNotification: (data: CreateNotificationRequest) => Promise<Notification>;

  sendMultiChannel: (
    notification: Notification,
    channels: NotificationChannel[]
  ) => Promise<{ [key in NotificationChannel]: boolean }>;

  isQuietHours: (userId: string) => Promise<boolean>;
}

// ============================================================================
// TYPE UTILITIES
// ============================================================================

/**
 * Extract notification data type based on notification type
 */
export type NotificationData<T extends NotificationType> = T extends NotificationType.FRIEND_REQUEST
  ? { fromUserId: string; userName: string }
  : T extends NotificationType.MESSAGE
    ? { fromUserId: string; userName: string; conversationId: string }
    : T extends NotificationType.COMMENT
      ? { postId: string; commentId: string; userId: string; userName: string }
      : T extends NotificationType.MENTION
        ? { postId: string; userId: string; userName: string; context: string }
        : T extends NotificationType.ACHIEVEMENT
          ? { achievementId: string; achievementName: string; badgeUrl: string }
          : T extends NotificationType.CHALLENGE
            ? { challengeId: string; challengeName: string; progress: number; target: number }
            : T extends NotificationType.STREAK
              ? { streakCount: number; category: string; daysActive: number }
              : T extends NotificationType.EVENT
                ? { eventId: string; eventName: string; startTime: string; location?: string }
                : T extends NotificationType.ADMIN
                  ? { announcementId: string; priority: 'low' | 'medium' | 'high' }
                  : Record<string, any>;

/**
 * Partial notification for updates
 */
export type PartialNotification = Partial<Omit<Notification, 'id' | 'created_at' | 'updated_at'>>;

/**
 * Notification filter type
 */
export type NotificationFilter = {
  type?: NotificationType | NotificationType[];
  isRead?: boolean;
  startDate?: string;
  endDate?: string;
  userId?: string;
};

/**
 * Device type label map
 */
export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  [DeviceType.WEB]: 'Web Browser',
  [DeviceType.IOS]: 'iPhone/iPad',
  [DeviceType.ANDROID]: 'Android Device',
};

/**
 * Notification type labels
 */
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.FRIEND_REQUEST]: 'Friend Request',
  [NotificationType.MESSAGE]: 'New Message',
  [NotificationType.COMMENT]: 'New Comment',
  [NotificationType.MENTION]: 'You Were Mentioned',
  [NotificationType.ACHIEVEMENT]: 'Achievement Unlocked',
  [NotificationType.CHALLENGE]: 'Challenge Update',
  [NotificationType.STREAK]: 'Streak Milestone',
  [NotificationType.EVENT]: 'Event Reminder',
  [NotificationType.ADMIN]: 'Admin Announcement',
};

/**
 * Email frequency labels
 */
export const EMAIL_FREQUENCY_LABELS: Record<EmailFrequency, string> = {
  [EmailFrequency.IMMEDIATE]: 'Immediately',
  [EmailFrequency.DAILY]: 'Once Daily',
  [EmailFrequency.WEEKLY]: 'Once Weekly',
  [EmailFrequency.MONTHLY]: 'Once Monthly',
  [EmailFrequency.NEVER]: 'Never',
};

/**
 * Delivery status labels
 */
export const DELIVERY_STATUS_LABELS: Record<EmailDeliveryStatus, string> = {
  [EmailDeliveryStatus.PENDING]: 'Pending',
  [EmailDeliveryStatus.SENDING]: 'Sending',
  [EmailDeliveryStatus.SENT]: 'Sent',
  [EmailDeliveryStatus.FAILED]: 'Failed',
  [EmailDeliveryStatus.BOUNCED]: 'Bounced',
  [EmailDeliveryStatus.UNSUBSCRIBED]: 'Unsubscribed',
};
