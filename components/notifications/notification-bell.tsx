// components/notifications/notification-bell.tsx
// Sprint 11: Notification Bell Component
// Shows unread notification count and opens notification center

'use client';

import React, { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useNotificationStore from '@/lib/stores/notification-store';

interface NotificationBellProps {
  onClick?: () => void;
  className?: string;
}

export function NotificationBell({ onClick, className }: NotificationBellProps) {
  const { unreadCount, fetchNotifications, notificationsLoading } =
    useNotificationStore();

  useEffect(() => {
    // Fetch unread count on mount
    fetchNotifications({ read: false });

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications({ read: false });
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={`relative ${className}`}
      disabled={notificationsLoading}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}

export default NotificationBell;
