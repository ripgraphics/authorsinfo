// app/api/notifications/route.ts
// Sprint 11: Main Notifications API
// GET: List user's notifications with filtering
// POST: Create a new notification (admin only)

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type {
  Notification,
  NotificationFilterOptions,
  CreateNotificationPayload,
  NotificationsListResponse,
} from '@/types/notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/notifications
 * Retrieve notifications for authenticated user
 * Query params:
 *   - type: Filter by notification type (can be comma-separated for multiple)
 *   - read: Filter by read status (true/false)
 *   - archived: Include archived notifications (default: false)
 *   - limit: Pagination limit (default: 20, max: 100)
 *   - offset: Pagination offset (default: 0)
 *   - sort: Sort field (created_at|updated_at, default: created_at)
 *   - order: Sort order (asc|desc, default: desc)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract user ID from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const typeFilter = searchParams.get('type');
    const readFilter = searchParams.get('read');
    const archiveFilter = searchParams.get('archived') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortField = (searchParams.get('sort') || 'created_at') as 'created_at' | 'updated_at';
    const sortOrder = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

    // Build query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('recipient_id', user.id);

    // Apply filters
    if (typeFilter) {
      const types = typeFilter.split(',');
      if (types.length === 1) {
        query = query.eq('type', types[0]);
      } else {
        query = query.in('type', types);
      }
    }

    if (readFilter !== null) {
      const isRead = readFilter === 'true';
      if (isRead) {
        query = query.not('read_at', 'is', null);
      } else {
        query = query.is('read_at', null);
      }
    }

    if (!archiveFilter) {
      query = query.is('archived_at', null).is('dismissed_at', null);
    }

    // Apply sorting and pagination
    query = query
      .order(sortField, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    const response: NotificationsListResponse = {
      data: (data as Notification[]) || [],
      total: count || 0,
      page: Math.floor(offset / limit),
      pageSize: limit,
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
 * POST /api/notifications
 * Create a new notification (admin/system only)
 * Body:
 *   - recipient_id: UUID of recipient
 *   - type: NotificationType
 *   - title: Notification title
 *   - message: Notification message
 *   - data: Optional additional data
 *   - source_user_id: Optional user who triggered notification
 *   - source_type: Optional source type (post, comment, group, etc.)
 *   - source_id: Optional source ID
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

    // Verify admin role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminCheck || !['admin', 'super_admin'].includes(adminCheck.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const payload: CreateNotificationPayload = await request.json();

    // Validate required fields
    const { recipient_id, type, title, message } = payload;
    if (!recipient_id || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: recipient_id, type, title, message' },
        { status: 400 }
      );
    }

    // Create notification using service role
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          recipient_id: payload.recipient_id,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          data: payload.data || null,
          source_user_id: payload.source_user_id || null,
          source_type: payload.source_type || null,
          source_id: payload.source_id || null,
          sent_in_app: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data, error: null },
      { status: 201 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
