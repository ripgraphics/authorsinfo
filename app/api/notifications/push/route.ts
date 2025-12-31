// app/api/notifications/push/route.ts
// Sprint 11: Push Subscription Management API
// GET: Get user's push subscriptions
// POST: Register new push subscription
// DELETE: Unregister push subscription

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type {
  PushSubscription,
  CreatePushSubscriptionPayload,
  PushSubscriptionResponse,
  PushSubscriptionsListResponse,
} from '@/types/notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/notifications/push
 * Get all push subscriptions for the authenticated user
 * Query params:
 *   - active: Filter by active status (true/false)
 *   - deviceType: Filter by device type (web, ios, android)
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

    const searchParams = request.nextUrl.searchParams;
    const activeFilter = searchParams.get('active');
    const deviceTypeFilter = searchParams.get('deviceType');

    let query = supabase
      .from('push_subscriptions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    if (activeFilter === 'true') {
      query = query.eq('is_active', true);
    } else if (activeFilter === 'false') {
      query = query.eq('is_active', false);
    }

    if (deviceTypeFilter) {
      query = query.eq('device_type', deviceTypeFilter);
    }

    const { data, count, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    const response: PushSubscriptionsListResponse = {
      data: (data as PushSubscription[]) || [],
      total: count || 0,
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
 * POST /api/notifications/push
 * Register a new push subscription
 * Body:
 *   - device_id: Unique device identifier (required)
 *   - device_type: 'web' | 'ios' | 'android' (required)
 *   - device_name: Optional device name/model
 *   - endpoint: Web Push endpoint URL (required for web)
 *   - auth_key: Web Push auth key (required for web)
 *   - p256dh: Web Push public key (required for web)
 *   - fcm_token: Firebase token (required for ios/android)
 *   - browser_name: Optional browser name
 *   - browser_version: Optional browser version
 *   - os_name: Optional OS name
 *   - os_version: Optional OS version
 */
export async function POST(request: NextRequest) {
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

    const payload: CreatePushSubscriptionPayload = await request.json();

    // Validate required fields
    const { device_id, device_type } = payload;
    if (!device_id || !device_type) {
      return NextResponse.json(
        { error: 'Missing required fields: device_id, device_type' },
        { status: 400 }
      );
    }

    // Validate device type
    if (!['web', 'ios', 'android'].includes(device_type)) {
      return NextResponse.json(
        { error: 'Invalid device_type. Must be web, ios, or android' },
        { status: 400 }
      );
    }

    // Validate endpoint/fcm requirements
    if (device_type === 'web' && !payload.endpoint) {
      return NextResponse.json(
        { error: 'Web subscriptions require endpoint, auth_key, and p256dh' },
        { status: 400 }
      );
    }

    if (['ios', 'android'].includes(device_type) && !payload.fcm_token) {
      return NextResponse.json(
        { error: 'iOS/Android subscriptions require fcm_token' },
        { status: 400 }
      );
    }

    // Check if device already subscribed
    const { data: existingSubscription } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('device_id', device_id)
      .single();

    if (existingSubscription) {
      // Update existing subscription
      const { data, error } = await supabase
        .from('push_subscriptions')
        .update({
          endpoint: payload.endpoint,
          auth_key: payload.auth_key,
          p256dh: payload.p256dh,
          fcm_token: payload.fcm_token,
          is_active: true,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        );
      }

      const response: PushSubscriptionResponse = {
        data: data as PushSubscription,
        error: null,
      };
      return NextResponse.json(response, { status: 200 });
    }

    // Create new subscription
    const { data, error } = await supabase
      .from('push_subscriptions')
      .insert([
        {
          user_id: user.id,
          device_id: payload.device_id,
          device_type: payload.device_type,
          device_name: payload.device_name || null,
          endpoint: payload.endpoint || null,
          auth_key: payload.auth_key || null,
          p256dh: payload.p256dh || null,
          fcm_token: payload.fcm_token || null,
          browser_name: payload.browser_name || null,
          browser_version: payload.browser_version || null,
          os_name: payload.os_name || null,
          os_version: payload.os_version || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    const response: PushSubscriptionResponse = {
      data: data as PushSubscription,
      error: null,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/push
 * Unregister a push subscription
 * Query params:
 *   - subscriptionId: ID of subscription to delete
 *   OR
 *   - deviceId: Device ID (deletes all subscriptions for device)
 */
export async function DELETE(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const subscriptionId = searchParams.get('subscriptionId');
    const deviceId = searchParams.get('deviceId');

    if (!subscriptionId && !deviceId) {
      return NextResponse.json(
        { error: 'Provide either subscriptionId or deviceId' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id);

    if (subscriptionId) {
      query = query.eq('id', subscriptionId);
    } else if (deviceId) {
      query = query.eq('device_id', deviceId);
    }

    const { error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Subscription(s) deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
