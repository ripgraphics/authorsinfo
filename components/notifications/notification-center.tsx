// components/notifications/notification-center.tsx
// Sprint 11: Notification Center Component
// Full notification interface with filtering and management

'use client';

import React, { useEffect } from 'react';
import { Trash2, Check, Archive } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useNotificationStore from '@/lib/stores/notification-store';
import { LoadingSpinner } from '@/components/skeleton-loaders';
import type { Notification, NotificationType } from '@/types/notifications';

interface NotificationCenterProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export function NotificationCenter({
  isOpen = true,
  onClose,
  className,
}: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    notificationsLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
  } = useNotificationStore();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const unreadNotifications = notifications.filter((n) => !n.read_at);
  const readNotifications = notifications.filter((n) => n.read_at);

  const getNotificationIcon = (type: NotificationType) => {
    const iconMap: Record<NotificationType, string> = {
      friend_request: '👥',
      friend_request_accepted: '✅',
      message: '💬',
      comment: '💭',
      mention: '@',
      achievement_unlocked: '🏆',
      challenge_milestone: '🎯',
      reading_streak: '🔥',
      event_reminder: '📅',
      admin_announcement: '📢',
      system_alert: '⚠️',
      engagement: '👍',
      achievement: '⭐',
      milestone: '🎖️',
    };
    return iconMap[type] || '📬';
  };

  const getNotificationColor = (type: NotificationType) => {
    const colorMap: Record<NotificationType, string> = {
      friend_request: 'bg-blue-100 text-blue-800',
      friend_request_accepted: 'bg-green-100 text-green-800',
      message: 'bg-purple-100 text-purple-800',
      comment: 'bg-orange-100 text-orange-800',
      mention: 'bg-yellow-100 text-yellow-800',
      achievement_unlocked: 'bg-emerald-100 text-emerald-800',
      challenge_milestone: 'bg-cyan-100 text-cyan-800',
      reading_streak: 'bg-red-100 text-red-800',
      event_reminder: 'bg-pink-100 text-pink-800',
      admin_announcement: 'bg-indigo-100 text-indigo-800',
      system_alert: 'bg-amber-100 text-amber-800',
      engagement: 'bg-teal-100 text-teal-800',
      achievement: 'bg-lime-100 text-lime-800',
      milestone: 'bg-violet-100 text-violet-800',
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleArchive = async (id: string) => {
    await archiveNotification(id);
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <div
      className={`
        p-4 border rounded-lg transition-all hover:shadow-md
        ${notification.read_at ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-200'}
      `}
    >
      <div className="flex gap-3">
        <div className="text-2xl flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <h4 className="font-semibold text-sm text-gray-900 truncate">
              {notification.title}
            </h4>
            <Badge
              variant="outline"
              className={`text-xs flex-shrink-0 ${getNotificationColor(notification.type)}`}
            >
              {notification.type.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(notification.created_at).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
        {!notification.read_at && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleMarkAsRead(notification.id)}
            className="text-xs"
          >
            <Check className="h-3 w-3 mr-1" />
            Mark Read
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleArchive(notification.id)}
          className="text-xs"
        >
          <Archive className="h-3 w-3 mr-1" />
          Archive
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDelete(notification.id)}
          className="text-xs text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl max-h-[80vh] ${className || ''}`}>
        <DialogHeader>
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>
            Manage your notifications and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {unreadCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
              <p className="text-sm text-blue-900">
                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
              >
                Mark All as Read
              </Button>
            </div>
          )}

          <Tabs defaultValue="unread" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="unread">
                Unread ({unreadNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="read">
                Read ({readNotifications.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unread" className="space-y-3 max-h-[50vh] overflow-y-auto">
              {notificationsLoading ? (
                <LoadingSpinner />
              ) : unreadNotifications.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No unread notifications
                </p>
              ) : (
                unreadNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="read" className="space-y-3 max-h-[50vh] overflow-y-auto">
              {readNotifications.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No read notifications
                </p>
              ) : (
                readNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NotificationCenter;
