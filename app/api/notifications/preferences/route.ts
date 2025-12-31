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

    const { data, error } = await supabase
      .from('notification_preferences')
      .update(payload)
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

