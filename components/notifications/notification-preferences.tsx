// components/notifications/notification-preferences.tsx
// Sprint 11: Notification Preferences Management Component
// User settings for notification channels and frequencies

'use client';

import React, { useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/skeleton-loaders';
import useNotificationStore from '@/lib/stores/notification-store';
import type {
  NotificationPreferences,
  UpdatePreferencePayload,
  NotificationType,
} from '@/types/notifications';

interface NotificationPreferencesProps {
  className?: string;
  onSave?: () => void;
}

const NOTIFICATION_TYPES: NotificationType[] = [
  'friend_request',
  'friend_request_accepted',
  'message',
  'comment',
  'mention',
  'achievement_unlocked',
  'challenge_milestone',
  'reading_streak',
  'event_reminder',
  'admin_announcement',
];

export function NotificationPreferences({
  className,
  onSave,
}: NotificationPreferencesProps) {
  const {
    preferences,
    preferencesLoading,
    preferencesError,
    fetchPreferences,
    updatePreferences,
  } = useNotificationStore();

  const [isSaving, setIsSaving] = React.useState(false);
  const [localPrefs, setLocalPrefs] = React.useState<UpdatePreferencePayload>({});

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        all_notifications_enabled: preferences.all_notifications_enabled,
        global_mute: preferences.global_mute,
        quiet_hours_enabled: preferences.quiet_hours_enabled,
        quiet_hours_start: preferences.quiet_hours_start,
        quiet_hours_end: preferences.quiet_hours_end,
        email_enabled: preferences.email_enabled,
        push_enabled: preferences.push_enabled,
        in_app_enabled: preferences.in_app_enabled,
        default_frequency: preferences.default_frequency,
        email_digest_enabled: preferences.email_digest_enabled,
        email_digest_frequency: preferences.email_digest_frequency,
        notification_settings: preferences.notification_settings,
      });
    }
  }, [preferences]);

  const handleGlobalToggle = (key: string, value: any) => {
    setLocalPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const handleChannelToggle = (
    type: NotificationType,
    channel: 'in_app' | 'email' | 'push',
    enabled: boolean
  ) => {
    setLocalPrefs((prev) => {
      const settings = prev.notification_settings || {} as Record<NotificationType, any>;
      return {
        ...prev,
        notification_settings: {
          ...settings,
          [type]: {
            ...(settings[type] || {}),
            [channel]: enabled,
          },
        },
      };
    });
  };

  const handleFrequencyChange = (
    type: NotificationType,
    frequency: string
  ) => {
    setLocalPrefs((prev) => {
      const settings = prev.notification_settings || {} as Record<NotificationType, any>;
      return {
        ...prev,
        notification_settings: {
          ...settings,
          [type]: {
            ...(settings[type] || {}),
            frequency: frequency as any,
          },
        },
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePreferences(localPrefs);
      onSave?.();
    } finally {
      setIsSaving(false);
    }
  };

  if (preferencesLoading) {
    return <LoadingSpinner />;
  }

  if (!preferences) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <p className="text-sm text-red-600">Failed to load preferences</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Manage how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {preferencesError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{preferencesError}</p>
          </div>
        )}

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="types">Notification Types</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="all-notifications" className="cursor-pointer">
                  <div>
                    <p className="font-medium">All Notifications</p>
                    <p className="text-sm text-gray-600">
                      Enable/disable all notifications at once
                    </p>
                  </div>
                </Label>
                <Switch
                  id="all-notifications"
                  checked={localPrefs.all_notifications_enabled ?? true}
                  onCheckedChange={(value) =>
                    handleGlobalToggle('all_notifications_enabled', value)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="global-mute" className="cursor-pointer">
                  <div>
                    <p className="font-medium">Global Mute</p>
                    <p className="text-sm text-gray-600">
                      Temporarily silence all notifications
                    </p>
                  </div>
                </Label>
                <Switch
                  id="global-mute"
                  checked={localPrefs.global_mute ?? false}
                  onCheckedChange={(value) =>
                    handleGlobalToggle('global_mute', value)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="quiet-hours" className="cursor-pointer">
                  <div>
                    <p className="font-medium">Quiet Hours</p>
                    <p className="text-sm text-gray-600">
                      Set a time window to mute notifications
                    </p>
                  </div>
                </Label>
                <Switch
                  id="quiet-hours"
                  checked={localPrefs.quiet_hours_enabled ?? false}
                  onCheckedChange={(value) =>
                    handleGlobalToggle('quiet_hours_enabled', value)
                  }
                />
              </div>

              {localPrefs.quiet_hours_enabled && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="quiet-start" className="text-sm">
                      Start Time
                    </Label>
                    <input
                      id="quiet-start"
                      type="time"
                      value={localPrefs.quiet_hours_start ?? ''}
                      onChange={(e) =>
                        handleGlobalToggle('quiet_hours_start', e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-md mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quiet-end" className="text-sm">
                      End Time
                    </Label>
                    <input
                      id="quiet-end"
                      type="time"
                      value={localPrefs.quiet_hours_end ?? ''}
                      onChange={(e) =>
                        handleGlobalToggle('quiet_hours_end', e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-md mt-1"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="default-frequency" className="text-sm font-medium">
                  Default Frequency
                </Label>
                <Select
                  value={localPrefs.default_frequency ?? 'immediate'}
                  onValueChange={(value) =>
                    handleGlobalToggle('default_frequency', value)
                  }
                >
                  <SelectTrigger id="default-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="hourly">Hourly Digest</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Digest</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Channel Settings */}
          <TabsContent value="channels" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="in-app-enabled" className="cursor-pointer">
                  <div>
                    <p className="font-medium">In-App Notifications</p>
                    <p className="text-sm text-gray-600">
                      Show notifications in the app
                    </p>
                  </div>
                </Label>
                <Switch
                  id="in-app-enabled"
                  checked={localPrefs.in_app_enabled ?? true}
                  onCheckedChange={(value) =>
                    handleGlobalToggle('in_app_enabled', value)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="email-enabled" className="cursor-pointer">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-600">
                      Receive notifications via email
                    </p>
                  </div>
                </Label>
                <Switch
                  id="email-enabled"
                  checked={localPrefs.email_enabled ?? true}
                  onCheckedChange={(value) =>
                    handleGlobalToggle('email_enabled', value)
                  }
                />
              </div>

              {localPrefs.email_enabled && (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                  <Label htmlFor="email-digest" className="cursor-pointer">
                    <div>
                      <p className="font-medium">Email Digest</p>
                      <p className="text-sm text-gray-600">
                        Receive batched email notifications
                      </p>
                    </div>
                  </Label>
                  <Switch
                    id="email-digest"
                    checked={localPrefs.email_digest_enabled ?? true}
                    onCheckedChange={(value) =>
                      handleGlobalToggle('email_digest_enabled', value)
                    }
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="push-enabled" className="cursor-pointer">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-600">
                      Receive push notifications on your devices
                    </p>
                  </div>
                </Label>
                <Switch
                  id="push-enabled"
                  checked={localPrefs.push_enabled ?? true}
                  onCheckedChange={(value) =>
                    handleGlobalToggle('push_enabled', value)
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* Per-Type Settings */}
          <TabsContent value="types" className="space-y-4">
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {NOTIFICATION_TYPES.map((type) => (
                <Card key={type} className="p-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm capitalize">
                      {type.replace(/_/g, ' ')}
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {(['in_app', 'email', 'push'] as const).map((channel) => (
                        <div key={channel} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`${type}-${channel}`}
                            checked={
                              localPrefs.notification_settings?.[type]?.[channel] ??
                              true
                            }
                            onChange={(e) =>
                              handleChannelToggle(
                                type,
                                channel,
                                e.target.checked
                              )
                            }
                            className="rounded"
                          />
                          <Label
                            htmlFor={`${type}-${channel}`}
                            className="text-xs capitalize cursor-pointer"
                          >
                            {channel.replace('_', ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t">
                      <Label
                        htmlFor={`${type}-freq`}
                        className="text-xs font-medium"
                      >
                        Frequency
                      </Label>
                      <Select
                        value={
                          localPrefs.notification_settings?.[type]
                            ?.frequency ?? 'immediate'
                        }
                        onValueChange={(value) =>
                          handleFrequencyChange(type, value)
                        }
                      >
                        <SelectTrigger id={`${type}-freq`} className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default NotificationPreferences;
