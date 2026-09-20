// app/api/notifications/preferences/route.ts
// Sprint 11: Notification Preferences API
// GET: Get user's notification preferences
// PATCH: Update notification preferences

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type {
  NotificationPreferences,
  UpdatePreferencePayload,
  PreferenceResponse,
} from '@/types/notifications';

const livePreferenceColumns = new Set([
  'friend_request_enabled',
  'message_enabled',
  'comment_enabled',
  'mention_enabled',
  'achievement_enabled',
  'challenge_enabled',
  'streak_enabled',
  'event_enabled',
  'admin_enabled',
  'in_app_enabled',
  'email_enabled',
  'push_enabled',
  'email_frequency',
  'push_frequency',
  'quiet_hours_enabled',
  'quiet_hours_start',
  'quiet_hours_end',
  'timezone',
  'all_notifications_muted',
  'muted_until',
]);

function toLivePreferencePatch(payload: UpdatePreferencePayload): Record<string, unknown> {
  const source = payload as unknown as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(source)) {
    if (livePreferenceColumns.has(key) && value !== undefined) patch[key] = value;
  }

  if (typeof source.all_notifications_enabled === 'boolean') {
    patch.all_notifications_muted = !source.all_notifications_enabled;
  }
  if (typeof source.global_mute === 'boolean') {
    patch.all_notifications_muted = source.global_mute;
  }
  if (typeof source.default_frequency === 'string') {
    patch.email_frequency = source.default_frequency;
    patch.push_frequency = source.default_frequency;
  }

  const settings = source.notification_settings;
  if (settings && typeof settings === 'object' && !Array.isArray(settings)) {
    for (const [type, setting] of Object.entries(settings as Record<string, unknown>)) {
      if (!setting || typeof setting !== 'object' || Array.isArray(setting)) continue;
      const enabled = (setting as Record<string, unknown>).in_app;
      if (typeof enabled === 'boolean' && livePreferenceColumns.has(`${type}_enabled`)) {
        patch[`${type}_enabled`] = enabled;
      }
    }
  }

  return patch;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/notifications/preferences
 * Get notification preferences for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Create default preferences if they don't exist
        const { data: newPrefs, error: createError } = await supabase
          .from('notification_preferences')
          .insert([{ user_id: user.id }])
          .select()
          .single();

        if (createError) {
          console.error('Supabase error:', createError);
          return NextResponse.json(
            { error: 'Failed to fetch or create preferences' },
            { status: 500 }
          );
        }

        const response: PreferenceResponse = {
          data: newPrefs as NotificationPreferences,
          error: null,
        };
        return NextResponse.json(response);
      }

      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    const response: PreferenceResponse = {
      data: data as NotificationPreferences,
      error: null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/preferences
 * Update notification preferences
 * Body:
 *   - all_notifications_enabled: Enable/disable all notifications
 *   - global_mute: Mute all notifications
 *   - quiet_hours_enabled: Enable quiet hours
 *   - quiet_hours_start: Quiet hours start time (HH:MM)
 *   - quiet_hours_end: Quiet hours end time (HH:MM)
 *   - email_enabled: Enable email notifications by default
 *   - push_enabled: Enable push notifications by default
 *   - in_app_enabled: Enable in-app notifications by default
 *   - default_frequency: Default frequency (immediate, hourly, daily, weekly, never)
 *   - email_digest_enabled: Enable email digest
 *   - email_digest_frequency: Email digest frequency (daily, weekly)
 *   - notification_settings: Per-type settings (JSON)
 *     Example: {
 *       "friend_request": { "in_app": true, "email": true, "push": false, "frequency": "immediate" },
 *       "message": { "in_app": true, "email": false, "push": true, "frequency": "immediate" }
 *     }
 */
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload: UpdatePreferencePayload = await request.json();

    // Validate time format if quiet hours are being set
    if (payload.quiet_hours_start || payload.quiet_hours_end) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (payload.quiet_hours_start && !timeRegex.test(payload.quiet_hours_start)) {
        return NextResponse.json(
          { error: 'Invalid quiet_hours_start format. Use HH:MM' },
          { status: 400 }
        );
      }
      if (payload.quiet_hours_end && !timeRegex.test(payload.quiet_hours_end)) {
        return NextResponse.json(
          { error: 'Invalid quiet_hours_end format. Use HH:MM' },
          { status: 400 }
        );
      }
    }

    const livePatch = toLivePreferencePatch(payload);
    if (Object.keys(livePatch).length === 0) {
      return NextResponse.json({ error: 'No supported preference changes supplied' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .update(livePatch)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    const response: PreferenceResponse = {
      data: data as NotificationPreferences,
      error: null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

