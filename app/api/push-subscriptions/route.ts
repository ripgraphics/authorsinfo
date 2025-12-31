import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type {
  RegisterDeviceRequest,
  PushSubscription,
} from '@/types/sprint11';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/push-subscriptions
 * Register a new push notification device
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RegisterDeviceRequest = await request.json();

    // Validate required fields
    if (!body.device_type || !body.endpoint) {
      return NextResponse.json(
        { error: 'Missing required fields: device_type, endpoint' },
        { status: 400 }
      );
    }

    // Check if device already registered
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('endpoint', body.endpoint)
      .single();

    if (existing) {
      // Update last_used_at
      const { data, error } = await supabase
        .from('push_subscriptions')
        .update({ last_used_at: new Date() })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to update device' },
          { status: 500 }
        );
      }

      return NextResponse.json(data as PushSubscription);
    }

    // Insert new device
    const { data, error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: user.id,
        device_type: body.device_type,
        endpoint: body.endpoint,
        auth_key: (body as any).auth_key || null,
        p256dh: (body as any).p256dh || null,
        is_active: true,
        last_used_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error registering device:', error);
      return NextResponse.json(
        { error: 'Failed to register device' },
        { status: 500 }
      );
    }

    return NextResponse.json(data as PushSubscription, { status: 201 });
  } catch (error) {
    console.error('POST /api/push-subscriptions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/push-subscriptions
 * List user's registered devices
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    const { data, error, count } = await supabase
      .from('push_subscriptions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('last_used_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching devices:', error);
      return NextResponse.json(
        { error: 'Failed to fetch devices' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data as PushSubscription[],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: offset + limit < (count || 0),
      },
    });
  } catch (error) {
    console.error('GET /api/push-subscriptions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

