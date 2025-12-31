import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type {
  UpdateDeviceRequest,
  PushSubscription,
} from '@/types/sprint11';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * PATCH /api/push-subscriptions/[id]
 * Update device status or metadata
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify ownership
    const { data: device, error: checkError } = await supabase
      .from('push_subscriptions')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (checkError || !device || device.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    const body: UpdateDeviceRequest = await request.json();
    const updates: Record<string, any> = {};

    if (typeof body.is_active === 'boolean') {
      updates.is_active = body.is_active;
    }

    const { data, error } = await supabase
      .from('push_subscriptions')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating device:', error);
      return NextResponse.json(
        { error: 'Failed to update device' },
        { status: 500 }
      );
    }

    return NextResponse.json(data as PushSubscription);
  } catch (error) {
    console.error('PATCH /api/push-subscriptions/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push-subscriptions/[id]
 * Unregister a device
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify ownership
    const { data: device, error: checkError } = await supabase
      .from('push_subscriptions')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (checkError || !device || device.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting device:', error);
      return NextResponse.json(
        { error: 'Failed to delete device' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/push-subscriptions/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
