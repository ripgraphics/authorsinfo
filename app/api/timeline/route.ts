import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityType = (searchParams.get('entityType') || '').trim()
    let entityId = (searchParams.get('entityId') || '').trim()
    const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '20', 10), 100))
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10))

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Resolve permalink to UUID when necessary
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(entityId)) {
      const table = entityType === 'user' ? 'users' : `${entityType}s`
      const { data: entityRow } = await supabase
        .from(table)
        .select('id, permalink')
        .or(`id.eq.${entityId},permalink.eq.${entityId}`)
        .maybeSingle()
      if (entityRow?.id) {
        entityId = entityRow.id
      }
    }

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Project only fields used by the UI to minimize payload
    const activities = (data || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      user_name: row.user_name ?? null,
      user_avatar_url: row.user_avatar_url ?? null,
      activity_type: row.activity_type,
      data: row.data,
      created_at: row.created_at,
      is_public: row.is_public ?? null,
      like_count: row.like_count ?? 0,
      comment_count: row.comment_count ?? 0,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      content_type: row.content_type,
      image_url: row.image_url,
      text: row.text,
      visibility: row.visibility,
      content_summary: row.content_summary,
      link_url: row.link_url,
      hashtags: row.hashtags,
      share_count: row.share_count ?? 0,
      view_count: row.view_count ?? 0,
      engagement_score: row.engagement_score ?? 0,
      metadata: row.metadata ?? {}
    }))

    return NextResponse.json({ activities, pagination: { limit, offset, count: activities.length } })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


