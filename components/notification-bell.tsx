'use client';

import React, { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '@/lib/stores/notification-store';

interface NotificationBellProps {
  showCount?: boolean;
  onClick?: () => void;
  className?: string;
}

export function NotificationBell({
  showCount = true,
  onClick,
  className = '',
}: NotificationBellProps) {
  const { unreadCount, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Set up interval to periodically check for new notifications
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}
      aria-label="Notifications"
    >
      <Bell className="w-6 h-6" />
      {showCount && unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
