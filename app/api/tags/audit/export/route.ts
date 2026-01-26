import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { unauthorizedError, nextErrorResponse } from '@/lib/error-handler'

/**
 * GET /api/tags/audit/export
 * Export audit log as CSV
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(unauthorizedError(), { status: 401 })
    }

    // TODO: Check if user is admin
    // const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
    // if (profile?.role !== 'admin') {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    // }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const action = searchParams.get('action')
    const tagId = searchParams.get('tagId')
    const format = searchParams.get('format') || 'csv'

    // Build query
    let query = supabase
      .from('tag_audit_log')
      .select(
        `
        id,
        action,
        created_at,
        actor_id,
        tag_id,
        tagging_id,
        entity_type,
        entity_id,
        reason,
        old_value,
        new_value,
        tags (name),
        users!tag_audit_log_actor_id_fkey (name, email)
      `
      )
      .order('created_at', { ascending: false })
      .limit(10000) // Max 10k records

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    if (action) {
      query = query.eq('action', action)
    }

    if (tagId) {
      query = query.eq('tag_id', tagId)
    }

    const { data: auditLogs, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 })
    }

    if (format === 'json') {
      return NextResponse.json({ auditLogs: auditLogs || [] })
    }

    // Generate CSV
    const headers = [
      'ID',
      'Action',
      'Created At',
      'Actor',
      'Actor Email',
      'Tag ID',
      'Tag Name',
      'Tagging ID',
      'Entity Type',
      'Entity ID',
      'Reason',
      'Old Value',
      'New Value',
    ]

    const rows = (auditLogs || []).map((log: any) => [
      log.id,
      log.action,
      log.created_at,
      log.users?.name || 'Unknown',
      log.users?.email || '',
      log.tag_id || '',
      log.tags?.name || '',
      log.tagging_id || '',
      log.entity_type || '',
      log.entity_id || '',
      log.reason || '',
      JSON.stringify(log.old_value || {}),
      JSON.stringify(log.new_value || {}),
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="tag-audit-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to export audit log')
  }
}
