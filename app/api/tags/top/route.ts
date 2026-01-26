import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { getCached, setCached, getTopTagsCacheKey } from '@/lib/tags/tag-cache'

/**
 * GET /api/tags/top
 * Get top tags (cached)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Check cache
    const cacheKey = getTopTagsCacheKey(type || undefined, limit)
    const cached = getCached<any[]>(cacheKey)
    if (cached) {
      return NextResponse.json({ tags: cached })
    }

    // Query materialized view for performance
    let query = supabase
      .from('mv_tag_analytics_top_tags')
      .select('*')
      .order('usage_count', { ascending: false })
      .order('taggings_count', { ascending: false })
      .limit(limit)

    if (type) {
      query = query.eq('type', type)
    }

    const { data: tags, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch top tags' }, { status: 500 })
    }

    // Cache for 10 minutes (top tags change less frequently)
    setCached(cacheKey, tags || [], 10 * 60 * 1000)

    return NextResponse.json({ tags: tags || [] })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch top tags', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
