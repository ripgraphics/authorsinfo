'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Check,
  Trash2,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { useNotificationStore } from '@/lib/stores/notification-store';
import type { Notification } from '@/types/notifications';

interface NotificationCenterProps {
  onClose?: () => void;
  className?: string;
}

export function NotificationCenter({
  onClose,
  className = '',
}: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    notificationsLoading: loading,
    notificationsError: error,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    clearError,
  } = useNotificationStore();

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>(
    'all'
  );

  useEffect(() => {
    fetchNotifications({
      type: typeFilter === 'all' ? undefined : (typeFilter as any),
      read:
        readFilter === 'all' ? undefined : readFilter === 'read',
    });
  }, [typeFilter, readFilter, fetchNotifications]);

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
  };

  const handleMarkAllAsRead = () => {
    const unread = notifications.filter((n) => !n.read_at);
    unread.forEach((n) => markAsRead(n.id));
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      friend_request: '👥',
      message: '💬',
      comment: '💭',
      mention: '@',
      achievement: '🏆',
      challenge: '🎯',
      streak: '🔥',
      event: '📅',
      admin: '⚙️',
    };
    return iconMap[type] || '📢';
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-lg max-w-md w-full max-h-96 flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600">{unreadCount} unread</p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 p-3 border-b bg-gray-50">
        <div className="flex-1">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded bg-white"
          >
            <option value="all">All Types</option>
            <option value="friend_request">Friend Request</option>
            <option value="message">Message</option>
            <option value="comment">Comment</option>
            <option value="mention">Mention</option>
            <option value="achievement">Achievement</option>
            <option value="challenge">Challenge</option>
            <option value="streak">Streak</option>
            <option value="event">Event</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="flex-1">
          <select
            value={readFilter}
            onChange={(e) =>
              setReadFilter(e.target.value as 'all' | 'read' | 'unread')
            }
            className="w-full px-2 py-1 text-sm border rounded bg-white"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={clearError}
              className="text-red-700 hover:text-red-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500">Loading...</p>
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500">No notifications</p>
          </div>
        )}

        {!loading &&
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              icon={getNotificationIcon(notification.type)}
              onMarkAsRead={() => handleMarkAsRead(notification.id)}
              onDelete={() => handleDelete(notification.id)}
            />
          ))}
      </div>

      {/* Footer Actions */}
      {notifications.length > 0 && (
        <div className="p-3 border-t bg-gray-50 flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  icon: string;
  onMarkAsRead: () => void;
  onDelete: () => void;
}

function NotificationItem({
  notification,
  icon,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  return (
    <div
      className={`p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
        !notification.read_at ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex gap-3">
        <div className="text-xl flex-shrink-0">{icon}</div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm line-clamp-1">
            {notification.title}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatTime(new Date(notification.created_at))}
          </p>
        </div>

        <div className="flex gap-1 flex-shrink-0">
          {!notification.read_at && (
            <button
              onClick={onMarkAsRead}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Mark as read"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}
