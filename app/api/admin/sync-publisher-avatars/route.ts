import { NextRequest, NextResponse } from 'next/server'
import { syncPublisherAvatars } from '@/app/actions/sync-publisher-avatars'

/**
 * API endpoint to sync publisher_image_id for all publishers
 * This is a one-time migration script
 * 
 * Usage: POST /api/admin/sync-publisher-avatars
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting publisher avatar sync via API...')
    
    const result = await syncPublisherAvatars()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Publisher avatar sync completed',
        ...result
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Publisher avatar sync completed with errors',
        ...result
      }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ Error in sync API:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to sync publisher avatars'
    }, { status: 500 })
  }
}

