// components/notifications/notification-toast.tsx
// Sprint 11: Toast Notification Component
// Displays real-time notifications as toast messages

'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Notification, NotificationType } from '@/types/notifications';

interface NotificationToastProps {
  notification: Notification;
  onClose?: () => void;
  autoDismissMs?: number;
  className?: string;
}

export function NotificationToast({
  notification,
  onClose,
  autoDismissMs = 5000,
  className,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoDismissMs > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [autoDismissMs, onClose]);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  // Determine icon and color based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'achievement_unlocked':
      case 'challenge_milestone':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'admin_announcement':
      case 'system_alert':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'friend_request':
      case 'friend_request_accepted':
      case 'message':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getColor = () => {
    switch (notification.type) {
      case 'achievement_unlocked':
      case 'challenge_milestone':
        return 'bg-green-50 border-green-200';
      case 'admin_announcement':
      case 'system_alert':
        return 'bg-amber-50 border-amber-200';
      case 'friend_request':
      case 'friend_request_accepted':
      case 'message':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div
      className={`
        fixed bottom-4 right-4 max-w-md bg-white rounded-lg shadow-lg
        border ${getColor()} p-4 flex gap-3 animate-in slide-in-from-bottom-2
        fade-in duration-300 ${className}
      `}
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-gray-900 truncate">
          {notification.title}
        </h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {notification.message}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="h-6 w-6 p-0 flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default NotificationToast;
