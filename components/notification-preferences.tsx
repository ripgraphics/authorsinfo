'use client';

import React, { useEffect, useState } from 'react';
import { useNotificationStore } from '@/lib/stores/notification-store';
import type {
  NotificationPreferences,
  NotificationType,
} from '@/types/sprint11';

export function NotificationPreferences() {
  const { preferences, fetchPreferences, updatePreferences } =
    useNotificationStore();

  const [localPrefs, setLocalPrefs] = useState<Partial<NotificationPreferences> | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  useEffect(() => {
    if (preferences) {
      setLocalPrefs({ ...preferences } as any);
    }
  }, [preferences]);

  const handleToggle = (key: string, value: any) => {
    setLocalPrefs((prev) => prev ? {
      ...prev,
      [key]: value,
    } : null);
    setSuccess(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (localPrefs) {
        await updatePreferences(localPrefs as any);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (!localPrefs) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Loading preferences...</p>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="p-4">
        <p className="text-gray-500">No preferences found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Notification Preferences</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded text-green-700">
          Preferences saved successfully!
        </div>
      )}

      {/* Global Controls */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Global Settings</h2>
        <div className="space-y-4 bg-gray-50 p-4 rounded">
          <PreferenceToggle
            label="All Notifications Muted"
            value={localPrefs.all_notifications_muted ?? false}
            onChange={(value) =>
              handleToggle('all_notifications_muted', value)
            }
            description="Temporarily disable all notifications"
          />
        </div>
      </section>

      {/* Notification Type Toggles */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Notification Types</h2>
        <div className="space-y-2 bg-gray-50 p-4 rounded">
          <PreferenceToggle
            label="Friend Requests"
            value={localPrefs.friend_request_enabled ?? true}
            onChange={(value) =>
              handleToggle('friend_request_enabled', value)
            }
          />
          <PreferenceToggle
            label="Messages"
            value={localPrefs.message_enabled ?? true}
            onChange={(value) => handleToggle('message_enabled', value)}
          />
          <PreferenceToggle
            label="Comments"
            value={localPrefs.comment_enabled ?? true}
            onChange={(value) => handleToggle('comment_enabled', value)}
          />
          <PreferenceToggle
            label="Mentions"
            value={localPrefs.mention_enabled ?? true}
            onChange={(value) => handleToggle('mention_enabled', value)}
          />
          <PreferenceToggle
            label="Achievements"
            value={localPrefs.achievement_enabled ?? true}
            onChange={(value) =>
              handleToggle('achievement_enabled', value)
            }
          />
          <PreferenceToggle
            label="Challenges"
            value={localPrefs.challenge_enabled ?? true}
            onChange={(value) => handleToggle('challenge_enabled', value)}
          />
          <PreferenceToggle
            label="Streaks"
            value={localPrefs.streak_enabled ?? true}
            onChange={(value) => handleToggle('streak_enabled', value)}
          />
          <PreferenceToggle
            label="Events"
            value={localPrefs.event_enabled ?? true}
            onChange={(value) => handleToggle('event_enabled', value)}
          />
          <PreferenceToggle
            label="Admin Announcements"
            value={localPrefs.admin_enabled ?? true}
            onChange={(value) => handleToggle('admin_enabled', value)}
          />
        </div>
      </section>

      {/* Channel Preferences */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Notification Channels</h2>
        <div className="space-y-2 bg-gray-50 p-4 rounded">
          <PreferenceToggle
            label="In-App Notifications"
            value={localPrefs.in_app_enabled ?? true}
            onChange={(value) => handleToggle('in_app_enabled', value)}
          />
          <PreferenceToggle
            label="Email Notifications"
            value={localPrefs.email_enabled ?? true}
            onChange={(value) => handleToggle('email_enabled', value)}
          />
          <PreferenceToggle
            label="Push Notifications"
            value={localPrefs.push_enabled ?? true}
            onChange={(value) => handleToggle('push_enabled', value)}
          />
        </div>
      </section>

      {/* Frequency Settings */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Email Frequency</h2>
        <div className="space-y-4 bg-gray-50 p-4 rounded">
          <div>
            <label className="block text-sm font-medium mb-2">
              Email Frequency
            </label>
            <select
              value={localPrefs.email_frequency || 'immediate'}
              onChange={(e) =>
                handleToggle('email_frequency', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="immediate">Immediate</option>
              <option value="daily">Daily Digest</option>
              <option value="weekly">Weekly Digest</option>
              <option value="monthly">Monthly Digest</option>
              <option value="never">Never</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Push Frequency
            </label>
            <select
              value={localPrefs.push_frequency || 'immediate'}
              onChange={(e) =>
                handleToggle('push_frequency', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="immediate">Immediate</option>
              <option value="daily">Daily Digest</option>
              <option value="weekly">Weekly Digest</option>
              <option value="monthly">Monthly Digest</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>
      </section>

      {/* Quiet Hours */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Quiet Hours</h2>
        <div className="bg-gray-50 p-4 rounded space-y-4">
          <PreferenceToggle
            label="Enable Quiet Hours"
            value={localPrefs.quiet_hours_enabled ?? false}
            onChange={(value) =>
              handleToggle('quiet_hours_enabled', value)
            }
            description="Do not send notifications during specified hours"
          />

          {localPrefs.quiet_hours_enabled && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={localPrefs.quiet_hours_start || '22:00'}
                  onChange={(e) =>
                    handleToggle('quiet_hours_start', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={localPrefs.quiet_hours_end || '08:00'}
                  onChange={(e) =>
                    handleToggle('quiet_hours_end', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </>
          )}
        </div>
      </section>

      {/* Save Button */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}

interface PreferenceToggleProps {
  label: string;
  value: boolean | string;
  onChange: (value: any) => void;
  description?: string;
}

function PreferenceToggle({
  label,
  value,
  onChange,
  description,
}: PreferenceToggleProps) {
  const isBoolean = typeof value === 'boolean';

  return (
    <div className="flex items-start justify-between py-2">
      <div>
        <label className="block text-sm font-medium">{label}</label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
      {isBoolean && (
        <button
          onClick={() => onChange(!value)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            value ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              value ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      )}
    </div>
  );
}
