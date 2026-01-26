import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { getTagHeatmapData } from '@/lib/tags/tag-analytics'
import { nextErrorResponse } from '@/lib/error-handler'

/**
 * GET /api/tags/analytics/heatmap
 * Get tag heatmap data by entity type
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    const heatmap = await getTagHeatmapData()

    return NextResponse.json({ heatmap })
  } catch (error) {
    return nextErrorResponse(error, 'Failed to fetch heatmap data')
  }
}
