/**
 * Enterprise Link Preview API
 * Main endpoint for extracting and caching link previews
 * Phase 1: Enterprise Link Post Component
 */

import { NextRequest, NextResponse } from 'next/server'

// Security headers for link preview API
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; script-src 'self'"
  )
  return response
}
import { extractLinkMetadata, normalizeUrl } from '@/lib/link-preview/link-metadata-extractor'
import { validateLink } from '@/lib/link-preview/link-validator'
import { getCachedPreview, setCachedPreview, invalidateCache } from '@/lib/link-preview/link-cache'
import { optimizeLinkPreviewImage } from '@/lib/link-preview/image-optimizer'
import type { LinkPreviewRequest, LinkPreviewResponse } from '@/types/link-preview'

export async function POST(request: NextRequest) {
  try {
    const body: LinkPreviewRequest = await request.json()
    const { url, refresh = false, validate_security = true } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      )
    }

    // Normalize URL
    const normalizedUrl = normalizeUrl(url)

    // Check cache first (unless refresh is requested)
    if (!refresh) {
      const cached = await getCachedPreview(url, normalizedUrl)
      if (cached) {
        return NextResponse.json({
          success: true,
          data: cached,
          from_cache: true,
        } as LinkPreviewResponse)
      }
    } else {
      // Invalidate cache if refresh is requested
      await invalidateCache(url, normalizedUrl)
    }

    // Validate security if requested
    let securityScore = 100
    let warnings: string[] = []
    
    if (validate_security) {
      try {
        const validation = await validateLink(url)
        securityScore = validation.security_score
        warnings = validation.warnings

        // If link is invalid, return error
        if (!validation.is_valid) {
          return NextResponse.json(
            {
              success: false,
              error: 'Link failed security validation',
              warnings: validation.warnings,
              errors: validation.errors,
            } as LinkPreviewResponse,
            { status: 400 }
          )
        }
      } catch (error) {
        console.warn('Security validation failed, continuing:', error)
        // Continue with extraction even if validation fails
      }
    }

    // Extract metadata
    let metadata
    try {
      metadata = await extractLinkMetadata(url, {
        timeout: 10000,
        max_redirects: 5,
        extract_images: true,
        extract_videos: true,
      })

      // Add security score
      metadata.security_score = securityScore

      // Optimize image if present
      if (metadata.image_url) {
        try {
          const optimized = await optimizeLinkPreviewImage(
            metadata.image_url,
            metadata.id
          )
          metadata.image_url = optimized.optimized_url
          metadata.thumbnail_url = optimized.thumbnail_url
        } catch (error) {
          console.warn('Image optimization failed, using original:', error)
          // Continue with original image URL
        }
      }
    } catch (error: any) {
      console.error('Error extracting link metadata:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to extract link metadata',
        } as LinkPreviewResponse,
        { status: 500 }
      )
    }

    // Cache the result
    try {
      await setCachedPreview(metadata)
    } catch (error) {
      console.warn('Failed to cache preview, continuing:', error)
      // Continue even if caching fails
    }

    const response = NextResponse.json({
      success: true,
      data: metadata,
      from_cache: false,
      warnings: warnings.length > 0 ? warnings : undefined,
    } as LinkPreviewResponse)
    
    return addSecurityHeaders(response)
  } catch (error: any) {
    console.error('Error in link preview API:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      } as LinkPreviewResponse,
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const refresh = searchParams.get('refresh') === 'true'

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    // Normalize URL
    const normalizedUrl = normalizeUrl(url)

    // Check cache first (unless refresh is requested)
    if (!refresh) {
      const cached = await getCachedPreview(url, normalizedUrl)
      if (cached) {
        return NextResponse.json({
          success: true,
          data: cached,
          from_cache: true,
        } as LinkPreviewResponse)
      }
    }

    // For GET requests, return cached data only
    // Use POST for extraction
    return NextResponse.json(
      {
        success: false,
        error: 'No cached preview found. Use POST to extract metadata.',
      } as LinkPreviewResponse,
      { status: 404 }
    )
  } catch (error: any) {
    console.error('Error in link preview GET API:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      } as LinkPreviewResponse,
      { status: 500 }
    )
  }
}
