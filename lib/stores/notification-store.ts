// lib/stores/notification-store.ts
// Sprint 11: Notification Management State Store
// Created: Dec 27, 2025

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Notification,
  NotificationPreferences,
  PushSubscription,
  NotificationFilterOptions,
  UpdatePreferencePayload,
  CreatePushSubscriptionPayload,
} from '@/types/notifications';

interface NotificationStoreState {
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  notificationsLoading: boolean;
  notificationsError: string | null;

  // Preferences
  preferences: NotificationPreferences | null;
  preferencesLoading: boolean;
  preferencesError: string | null;

  // Push Subscriptions
  pushSubscriptions: PushSubscription[];
  pushLoading: boolean;
  pushError: string | null;

  // Pagination
  currentPage: number;
  pageSize: number;
  totalNotifications: number;

  // Actions - Notifications
  fetchNotifications: (options?: NotificationFilterOptions) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;

  // Actions - Preferences
  fetchPreferences: () => Promise<void>;
  updatePreferences: (updates: UpdatePreferencePayload) => Promise<void>;

  // Actions - Push Subscriptions
  fetchPushSubscriptions: (active?: boolean) => Promise<void>;
  registerPushSubscription: (payload: CreatePushSubscriptionPayload) => Promise<void>;
  unregisterPushSubscription: (subscriptionId: string) => Promise<void>;
  unregisterDeviceSubscriptions: (deviceId: string) => Promise<void>;

  // Actions - UI
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      notificationsLoading: false,
      notificationsError: null,
      preferences: null,
      preferencesLoading: false,
      preferencesError: null,
      pushSubscriptions: [],
      pushLoading: false,
      pushError: null,
      currentPage: 0,
      pageSize: 20,
      totalNotifications: 0,

      // Fetch notifications
      fetchNotifications: async (options?: NotificationFilterOptions) => {
        const state = get();
        set({ notificationsLoading: true, notificationsError: null });

        try {
          const { currentPage, pageSize } = state;
          const offset = (options?.offset ?? currentPage * pageSize) || 0;
          const limit = options?.limit ?? pageSize;

          const queryParams = new URLSearchParams();
          if (options?.type) {
            if (Array.isArray(options.type)) {
              queryParams.set('type', options.type.join(','));
            } else {
              queryParams.set('type', options.type);
            }
          }
          if (options?.read !== undefined) {
            queryParams.set('read', String(options.read));
          }
          if (options?.archived !== undefined) {
            queryParams.set('archived', String(options.archived));
          }
          queryParams.set('limit', String(limit));
          queryParams.set('offset', String(offset));
          if (options?.orderBy) {
            queryParams.set('sort', options.orderBy);
          }
          if (options?.orderDirection) {
            queryParams.set('order', options.orderDirection);
          }

          const response = await fetch(`/api/notifications?${queryParams.toString()}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch notifications');
          }

          const data = await response.json();
          set({
            notifications: data.data || [],
            totalNotifications: data.total || 0,
            unreadCount: data.data?.filter((n: Notification) => !n.read_at).length || 0,
            notificationsLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          set({
            notificationsError: message,
            notificationsLoading: false,
          });
        }
      },

      // Mark single notification as read
      markAsRead: async (id: string) => {
        try {
          const response = await fetch(`/api/notifications/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`,
            },
            body: JSON.stringify({ read_at: new Date().toISOString() }),
          });

          if (!response.ok) {
            throw new Error('Failed to mark notification as read');
          }

          const data = await response.json();
          const state = get();
          set({
            notifications: state.notifications.map((n) =>
              n.id === id ? data.data : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          });
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      },

      // Mark all notifications as read
      markAllAsRead: async () => {
        try {
          const state = get();
          const updates = state.notifications.map((n) =>
            fetch(`/api/notifications/${n.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`,
              },
              body: JSON.stringify({ read_at: new Date().toISOString() }),
            })
          );

          await Promise.all(updates);
          set({
            notifications: state.notifications.map((n) => ({
              ...n,
              read_at: new Date().toISOString(),
            })),
            unreadCount: 0,
          });
        } catch (error) {
          console.error('Error marking all notifications as read:', error);
        }
      },

      // Archive notification
      archiveNotification: async (id: string) => {
        try {
          const response = await fetch(`/api/notifications/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`,
            },
            body: JSON.stringify({ archived_at: new Date().toISOString() }),
          });

          if (!response.ok) {
            throw new Error('Failed to archive notification');
          }

          const state = get();
          set({
            notifications: state.notifications.filter((n) => n.id !== id),
          });
        } catch (error) {
          console.error('Error archiving notification:', error);
        }
      },

      // Dismiss notification
      dismissNotification: async (id: string) => {
        try {
          const response = await fetch(`/api/notifications/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`,
            },
            body: JSON.stringify({ dismissed_at: new Date().toISOString() }),
          });

          if (!response.ok) {
            throw new Error('Failed to dismiss notification');
          }

          const state = get();
          set({
            notifications: state.notifications.filter((n) => n.id !== id),
          });
        } catch (error) {
          console.error('Error dismissing notification:', error);
        }
      },

      // Delete notification
      deleteNotification: async (id: string) => {
        try {
          const response = await fetch(`/api/notifications/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to delete notification');
          }

          const state = get();
          set({
            notifications: state.notifications.filter((n) => n.id !== id),
          });
        } catch (error) {
          console.error('Error deleting notification:', error);
        }
      },

      // Fetch user preferences
      fetchPreferences: async () => {
        set({ preferencesLoading: true, preferencesError: null });

        try {
          const response = await fetch('/api/notifications/preferences', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch preferences');
          }

          const data = await response.json();
          set({
            preferences: data.data,
            preferencesLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          set({
            preferencesError: message,
            preferencesLoading: false,
          });
        }
      },

      // Update preferences
      updatePreferences: async (updates: UpdatePreferencePayload) => {
        set({ preferencesLoading: true, preferencesError: null });

        try {
          const response = await fetch('/api/notifications/preferences', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`,
            },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            throw new Error('Failed to update preferences');
          }

          const data = await response.json();
          set({
            preferences: data.data,
            preferencesLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          set({
            preferencesError: message,
            preferencesLoading: false,
          });
        }
      },

      // Fetch push subscriptions
      fetchPushSubscriptions: async (active?: boolean) => {
        set({ pushLoading: true, pushError: null });

        try {
          const params = new URLSearchParams();
          if (active !== undefined) {
            params.set('active', String(active));
          }

          const response = await fetch(`/api/notifications/push?${params.toString()}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch push subscriptions');
          }

          const data = await response.json();
          set({
            pushSubscriptions: data.data || [],
            pushLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          set({
            pushError: message,
            pushLoading: false,
          });
        }
      },

      // Register push subscription
      registerPushSubscription: async (payload: CreatePushSubscriptionPayload) => {
        set({ pushLoading: true, pushError: null });

        try {
          const response = await fetch('/api/notifications/push', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error('Failed to register push subscription');
          }

          const data = await response.json();
          const state = get();
          const existingIndex = state.pushSubscriptions.findIndex(
            (s) => s.device_id === payload.device_id
          );

          if (existingIndex > -1) {
            const updated = [...state.pushSubscriptions];
            updated[existingIndex] = data.data;
            set({ pushSubscriptions: updated, pushLoading: false });
          } else {
            set({
              pushSubscriptions: [...state.pushSubscriptions, data.data],
              pushLoading: false,
            });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          set({
            pushError: message,
            pushLoading: false,
          });
        }
      },

      // Unregister specific subscription
      unregisterPushSubscription: async (subscriptionId: string) => {
        try {
          const response = await fetch(
            `/api/notifications/push?subscriptionId=${subscriptionId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error('Failed to unregister push subscription');
          }

          const state = get();
          set({
            pushSubscriptions: state.pushSubscriptions.filter(
              (s) => s.id !== subscriptionId
            ),
          });
        } catch (error) {
          console.error('Error unregistering push subscription:', error);
        }
      },

      // Unregister all subscriptions for device
      unregisterDeviceSubscriptions: async (deviceId: string) => {
        try {
          const response = await fetch(
            `/api/notifications/push?deviceId=${deviceId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error('Failed to unregister device subscriptions');
          }

          const state = get();
          set({
            pushSubscriptions: state.pushSubscriptions.filter(
              (s) => s.device_id !== deviceId
            ),
          });
        } catch (error) {
          console.error('Error unregistering device subscriptions:', error);
        }
      },

      // UI Actions
      setPage: (page: number) => set({ currentPage: page }),
      setPageSize: (size: number) => set({ pageSize: size }),
      clearError: () =>
        set({
          notificationsError: null,
          preferencesError: null,
          pushError: null,
        }),
    }),
    {
      name: 'notification-store',
      partialize: (state) => ({
        preferences: state.preferences,
        pushSubscriptions: state.pushSubscriptions,
      }),
    }
  )
);

export default useNotificationStore;
