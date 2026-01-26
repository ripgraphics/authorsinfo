import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { getTagImpactMetrics } from '@/lib/tags/tag-analytics'
import { unauthorizedError, nextErrorResponse } from '@/lib/error-handler'

/**
 * GET /api/tags/analytics/impact
 * Get impact metrics for a tag
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const searchParams = request.nextUrl.searchParams
    const tagId = searchParams.get('tagId')
    const daysBack = parseInt(searchParams.get('daysBack') || '30', 10)

    if (!tagId) {
      return NextResponse.json({ error: 'tagId is required' }, { status: 400 })
    }

    const metrics = await getTagImpactMetrics(tagId, daysBack)

    if (!metrics) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    return NextResponse.json({ metrics })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to fetch impact metrics')
  }
}
