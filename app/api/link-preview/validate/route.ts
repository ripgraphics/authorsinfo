/**
 * Link Validation API
 * Validate link security without extracting metadata
 * Phase 1: Enterprise Link Post Component
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateLink } from '@/lib/link-preview/link-validator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, title, description } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      )
    }

    const validation = await validateLink(url, title, description)

    return NextResponse.json({
      success: true,
      ...validation,
    })
  } catch (error: any) {
    console.error('Error in link validation API:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
