/**
 * Link Analytics API
 * Track and retrieve link engagement analytics
 * Phase 4: Enterprise Link Post Component
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  trackLinkView,
  trackLinkClick,
  trackLinkShare,
  trackLinkBookmark,
  getLinkAnalytics,
  getPopularLinks,
} from '@/lib/link-preview/link-analytics'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { link_preview_id, post_id, user_id, event_type } = body

    if (!link_preview_id || !event_type) {
      return NextResponse.json(
        { success: false, error: 'link_preview_id and event_type are required' },
        { status: 400 }
      )
    }

    const userAgent = request.headers.get('user-agent') || undefined
    const referrer = request.headers.get('referer') || undefined
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || undefined

    switch (event_type) {
      case 'view':
        await trackLinkView(link_preview_id, post_id, user_id, userAgent, referrer)
        break
      case 'click':
        await trackLinkClick(link_preview_id, post_id, user_id, userAgent, referrer, ipAddress)
        break
      case 'share':
        await trackLinkShare(link_preview_id, post_id, user_id)
        break
      case 'bookmark':
        await trackLinkBookmark(link_preview_id, post_id, user_id)
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid event_type' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in link analytics API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const linkPreviewId = searchParams.get('link_preview_id')
    const popular = searchParams.get('popular') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const days = parseInt(searchParams.get('days') || '7', 10)

    if (popular) {
      const popularLinks = await getPopularLinks(limit, days)
      return NextResponse.json({ success: true, data: popularLinks })
    }

    if (linkPreviewId) {
      const analytics = await getLinkAnalytics(linkPreviewId)
      return NextResponse.json({ success: true, data: analytics })
    }

    return NextResponse.json(
      { success: false, error: 'link_preview_id or popular parameter required' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error in link analytics GET API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
