import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/audit-logs
 * Retrieve audit logs from multiple audit tables
 * 
 * Query params:
 * - source: 'enterprise' | 'social' | 'privacy' | 'group' | 'moderation' | 'all' (default: 'all')
 * - user_id: filter by user
 * - action: filter by action type
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - limit: number (default: 50, max: 200)
 * - offset: number (default: 0)
 * - table_name: filter by table (enterprise audit only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated and is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you should have admin role check here)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get('source') || 'all';
    const userId = searchParams.get('user_id');
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tableName = searchParams.get('table_name');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    let logs: any[] = [];
    let totalCount = 0;

    // Fetch from different audit tables based on source
    if (source === 'enterprise' || source === 'all') {
      let query = supabase
        .from('enterprise_audit_trail')
        .select('*', { count: 'exact' })
        .order('changed_at', { ascending: false });

      if (userId) query = query.eq('changed_by', userId);
      if (action) query = query.eq('operation', action);
      if (tableName) query = query.eq('table_name', tableName);
      if (startDate) query = query.gte('changed_at', startDate);
      if (endDate) query = query.lte('changed_at', endDate);

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (!error && data) {
        logs.push(
          ...data.map((log) => ({
            ...log,
            source: 'enterprise',
            timestamp: log.changed_at,
            user_id: log.changed_by,
          }))
        );
        totalCount += count || 0;
      }
    }

    if (source === 'social' || source === 'all') {
      let query = supabase
        .from('social_audit_log')
        .select('*, users!social_audit_log_user_id_fkey(name, avatar_url)', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (userId) query = query.eq('user_id', userId);
      if (action) query = query.eq('action_type', action);
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (!error && data) {
        logs.push(
          ...data.map((log: any) => ({
            ...log,
            source: 'social',
            timestamp: log.created_at,
            action: log.action_type,
            username: log.users?.name || 'Unknown',
            avatar_url: log.users?.avatar_url,
          }))
        );
        totalCount += count || 0;
      }
    }

    if (source === 'privacy' || source === 'all') {
      let query = supabase
        .from('privacy_audit_log')
        .select('*, users!privacy_audit_log_user_id_fkey(name, avatar_url)', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (userId) query = query.eq('user_id', userId);
      if (action) query = query.eq('action', action);
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (!error && data) {
        logs.push(
          ...data.map((log: any) => ({
            ...log,
            source: 'privacy',
            timestamp: log.created_at,
            username: log.users?.name || 'Unknown',
            avatar_url: log.users?.avatar_url,
          }))
        );
        totalCount += count || 0;
      }
    }

    if (source === 'group' || source === 'all') {
      let query = supabase
        .from('group_audit_log')
        .select('*, users!group_audit_log_performed_by_fkey(name, avatar_url), groups(name)', {
          count: 'exact',
        })
        .order('created_at', { ascending: false });

      if (userId) query = query.eq('performed_by', userId);
      if (action) query = query.eq('action', action);
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (!error && data) {
        logs.push(
          ...data.map((log: any) => ({
            ...log,
            source: 'group',
            timestamp: log.created_at,
            user_id: log.performed_by,
            username: log.users?.name || 'Unknown',
            avatar_url: log.users?.avatar_url,
            group_name: log.groups?.name || 'Unknown Group',
          }))
        );
        totalCount += count || 0;
      }
    }

    if (source === 'moderation' || source === 'all') {
      let query = supabase
        .from('group_moderation_logs')
        .select('*, users!group_moderation_logs_performed_by_fkey(name, avatar_url), groups(name)', {
          count: 'exact',
        })
        .order('created_at', { ascending: false });

      if (userId) query = query.eq('performed_by', userId);
      if (action) query = query.eq('action', action);
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (!error && data) {
        logs.push(
          ...data.map((log: any) => ({
            ...log,
            source: 'moderation',
            timestamp: log.created_at,
            user_id: log.performed_by,
            username: log.users?.name || 'Unknown',
            avatar_url: log.users?.avatar_url,
            group_name: log.groups?.name || 'Unknown Group',
          }))
        );
        totalCount += count || 0;
      }
    }

    // Sort all logs by timestamp
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit if fetching from multiple sources
    if (source === 'all') {
      logs = logs.slice(0, limit);
    }

    return NextResponse.json({
      logs,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      filters: {
        source,
        userId,
        action,
        startDate,
        endDate,
        tableName,
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

/**
 * POST /api/admin/audit-logs/export
 * Export audit logs to CSV
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { source, userId, action, startDate, endDate, tableName } = body;

    // Fetch logs (reuse GET logic but without pagination)
    let logs: any[] = [];

    // Similar fetching logic as GET but without limits
    // ... (implementation would mirror GET but fetch all matching records)

    // Convert to CSV
    const csvHeader = 'Timestamp,Source,Action,User,Details\n';
    const csvRows = logs
      .map(
        (log) =>
          `"${log.timestamp}","${log.source}","${log.action || log.operation}","${log.username || 'System'}","${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`
      )
      .join('\n');

    const csv = csvHeader + csvRows;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return NextResponse.json({ error: 'Failed to export audit logs' }, { status: 500 });
  }
}
