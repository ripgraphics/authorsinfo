import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { Notification } from '@/types/sprint11';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * PATCH /api/notifications/[id]/read
 * Mark a notification as read/unread
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{}> }
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
    const { data: notification, error: checkError } = await supabase
      .from('notifications')
      .select('recipient_id, is_read')
      .eq('id', params.id)
      .single();

    if (checkError || !notification || notification.recipient_id !== user.id) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const isRead = body.is_read ?? true;

    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: isRead,
        read_at: isRead ? new Date() : null,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating notification:', error);
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      );
    }

    return NextResponse.json(data as Notification);
  } catch (error) {
    console.error('PATCH /api/notifications/[id]/read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
