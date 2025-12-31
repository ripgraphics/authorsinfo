'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import type { Notification } from '@/types/notifications';

interface NotificationToastProps {
  notification: Notification;
  onDismiss?: () => void;
  autoClose?: number;
}

export function NotificationToast({
  notification,
  onDismiss,
  autoClose = 5000,
}: NotificationToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, autoClose);

      return () => clearTimeout(timer);
    }
  }, [autoClose, onDismiss]);

  if (!visible) return null;

  const getIcon = () => {
    const type = notification.type as string;
    switch (type) {
      case 'achievement':
      case 'challenge':
      case 'streak':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'friend_request':
      case 'message':
      case 'comment':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'mention':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'admin':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBackgroundColor = () => {
    const type = notification.type as string;
    switch (type) {
      case 'achievement':
      case 'challenge':
      case 'streak':
        return 'bg-green-50 border-green-200';
      case 'friend_request':
      case 'message':
      case 'comment':
        return 'bg-blue-50 border-blue-200';
      case 'mention':
        return 'bg-yellow-50 border-yellow-200';
      case 'admin':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div
      className={`rounded-lg border shadow-lg p-4 flex items-start gap-3 max-w-sm ${getBackgroundColor()}`}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm line-clamp-1">
          {notification.title}
        </h3>
        <p className="text-sm text-gray-700 line-clamp-2 mt-1">
          {notification.message}
        </p>
      </div>

      {onDismiss && (
        <button
          onClick={() => {
            setVisible(false);
            onDismiss();
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

interface NotificationToastContainerProps {
  notifications: Notification[];
  onDismiss?: (id: string) => void;
  autoClose?: number;
}

export function NotificationToastContainer({
  notifications,
  onDismiss,
  autoClose = 5000,
}: NotificationToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={() => onDismiss?.(notification.id)}
          autoClose={autoClose}
        />
      ))}
    </div>
  );
}
