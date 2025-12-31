// lib/services/notification-dispatcher.ts
// Sprint 11: Notification Dispatcher Service
// Handles creation and routing of notifications across channels
// Created: Dec 27, 2025

import { createClient } from '@supabase/supabase-js';
import type { CreateNotificationPayload, Notification } from '@/types/notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Notification Dispatcher Service
 * Handles creating notifications and routing them to appropriate channels
 * based on user preferences
 */
export class NotificationDispatcher {
  /**
   * Create and dispatch a notification to a user
   * Respects user's notification preferences for each channel
   */
  static async dispatch(payload: CreateNotificationPayload): Promise<Notification | null> {
    try {
      // Create the notification
      const { data: notification, error: createError } = await supabase
        .from('notifications')
        .insert([
          {
            recipient_id: payload.recipient_id,
            type: payload.type,
            title: payload.title,
            message: payload.message,
            data: payload.data || null,
            source_user_id: payload.source_user_id || null,
            source_type: payload.source_type || null,
            source_id: payload.source_id || null,
            sent_in_app: true,
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error('Failed to create notification:', createError);
        return null;
      }

      // Get user preferences
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', payload.recipient_id)
        .single();

      // Determine which channels to use
      const shouldSendEmail = await this.shouldSendNotification(
        payload.recipient_id,
        payload.type,
        'email',
        preferences
      );

      const shouldSendPush = await this.shouldSendNotification(
        payload.recipient_id,
        payload.type,
        'push',
        preferences
      );

      // Queue email if needed
      if (shouldSendEmail) {
        await this.queueEmailNotification(notification.id, payload.recipient_id, payload);
      }

      // Queue push if needed
      if (shouldSendPush) {
        await this.queuePushNotification(notification.id, payload.recipient_id, payload);
      }

      return notification as Notification;
    } catch (error) {
      console.error('Notification dispatch error:', error);
      return null;
    }
  }

  /**
   * Check if notification should be sent for a specific channel
   */
  private static async shouldSendNotification(
    userId: string,
    type: string,
    channel: 'email' | 'push' | 'in_app',
    preferences: any
  ): Promise<boolean> {
    if (!preferences) return true; // Default to true if no preferences

    // Check global mute
    if (preferences.global_mute) return false;

    // Check channel default
    const channelKey = `${channel}_enabled`;
    if (!preferences[channelKey]) return false;

    // Check if in quiet hours
    if (preferences.quiet_hours_enabled && this.isInQuietHours(preferences)) {
      return false;
    }

    // Check type-specific preference
    const typePref = preferences.notification_settings?.[type]?.[channel];
    if (typePref === false) return false;

    return true;
  }

  /**
   * Check if current time is within quiet hours
   */
  private static isInQuietHours(preferences: any): boolean {
    if (!preferences.quiet_hours_enabled) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const start = preferences.quiet_hours_start;
    const end = preferences.quiet_hours_end;

    if (!start || !end) return false;

    // Handle case where quiet hours span midnight
    if (start < end) {
      return currentTime >= start && currentTime <= end;
    } else {
      return currentTime >= start || currentTime <= end;
    }
  }

  /**
   * Queue an email notification for sending
   */
  private static async queueEmailNotification(
    notificationId: string,
    userId: string,
    payload: CreateNotificationPayload
  ): Promise<void> {
    try {
      // Get user email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        console.error('Failed to get user email:', userError);
        return;
      }

      // Create email log entry
      const { error: logError } = await supabase
        .from('email_notification_logs')
        .insert([
          {
            notification_id: notificationId,
            recipient_email: user.email,
            subject: payload.title,
            template_name: this.getEmailTemplate(payload.type),
            status: 'pending',
          },
        ]);

      if (logError) {
        console.error('Failed to create email log:', logError);
      }
    } catch (error) {
      console.error('Error queuing email notification:', error);
    }
  }

  /**
   * Queue a push notification for sending
   */
  private static async queuePushNotification(
    notificationId: string,
    userId: string,
    payload: CreateNotificationPayload
  ): Promise<void> {
    try {
      // Get active push subscriptions for user
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (subError || !subscriptions) {
        console.error('Failed to get push subscriptions:', subError);
        return;
      }

      // For now, just log that push would be sent
      // In production, you would send to Firebase Cloud Messaging or Web Push API
      for (const subscription of subscriptions) {
        console.log(`Would send push notification to ${subscription.device_type}:`, {
          notificationId,
          deviceId: subscription.device_id,
          title: payload.title,
          message: payload.message,
        });
      }
    } catch (error) {
      console.error('Error queuing push notification:', error);
    }
  }

  /**
   * Get email template name based on notification type
   */
  private static getEmailTemplate(type: string): string {
    const templates: Record<string, string> = {
      friend_request: 'friend_request',
      friend_request_accepted: 'friend_request_accepted',
      message: 'new_message',
      comment: 'new_comment',
      mention: 'mention',
      achievement_unlocked: 'achievement',
      challenge_milestone: 'challenge_milestone',
      reading_streak: 'reading_streak',
      event_reminder: 'event_reminder',
      admin_announcement: 'admin_announcement',
    };
    return templates[type] || 'generic_notification';
  }

  /**
   * Batch create notifications
   */
  static async dispatchBatch(payloads: CreateNotificationPayload[]): Promise<Notification[]> {
    const results = await Promise.all(
      payloads.map((payload) => this.dispatch(payload))
    );
    return results.filter((n) => n !== null) as Notification[];
  }

  /**
   * Create and dispatch a system notification to all admins
   */
  static async dispatchSystemNotification(
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<Notification[]> {
    try {
      // Get all admin users
      const { data: admins, error: adminError } = await supabase
        .from('users')
        .select('id')
        .or('role.eq.admin,role.eq.super_admin');

      if (adminError || !admins) {
        console.error('Failed to get admin users:', adminError);
        return [];
      }

      // Create notifications for each admin
      const payloads: CreateNotificationPayload[] = admins.map((admin) => ({
        recipient_id: admin.id,
        type: 'admin_announcement',
        title,
        message,
        data,
      }));

      return await this.dispatchBatch(payloads);
    } catch (error) {
      console.error('Error dispatching system notification:', error);
      return [];
    }
  }

  /**
   * Create notification on user engagement
   */
  static async notifyOnEngagement(
    recipientId: string,
    engagementType:
      | 'friend_request'
      | 'message'
      | 'comment'
      | 'mention'
      | 'achievement',
    sourceUserId: string,
    sourceType: string,
    sourceId: string,
    data?: Record<string, any>
  ): Promise<Notification | null> {
    const titles: Record<string, string> = {
      friend_request: 'Friend Request',
      message: 'New Message',
      comment: 'New Comment',
      mention: 'You were mentioned',
      achievement: 'Achievement Unlocked',
    };

    return this.dispatch({
      recipient_id: recipientId,
      type: engagementType as any,
      title: titles[engagementType],
      message: `You have a new ${engagementType.replace(/_/g, ' ')}`,
      data,
      source_user_id: sourceUserId,
      source_type: sourceType,
      source_id: sourceId,
    });
  }

  /**
   * Create notification on milestone achievement
   */
  static async notifyOnMilestone(
    userId: string,
    milestoneType: 'reading_streak' | 'challenge_milestone' | 'achievement_unlocked',
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<Notification | null> {
    return this.dispatch({
      recipient_id: userId,
      type: milestoneType,
      title,
      message,
      data,
    });
  }

  /**
   * Create event reminder notification
   */
  static async notifyEventReminder(
    userId: string,
    eventName: string,
    eventId: string,
    reminderMinutes: number
  ): Promise<Notification | null> {
    const timeStr =
      reminderMinutes >= 60
        ? `${Math.floor(reminderMinutes / 60)} hour(s)`
        : `${reminderMinutes} minute(s)`;

    return this.dispatch({
      recipient_id: userId,
      type: 'event_reminder',
      title: `Event Reminder: ${eventName}`,
      message: `Your event "${eventName}" starts in ${timeStr}`,
      data: {
        eventId,
        reminderMinutes,
      },
      source_type: 'event',
      source_id: eventId,
    });
  }
}

export default NotificationDispatcher;
