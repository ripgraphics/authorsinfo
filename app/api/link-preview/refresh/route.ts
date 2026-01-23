/**
 * Link Preview Refresh API
 * Force refresh of cached link preview
 * Phase 1: Enterprise Link Post Component
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractLinkMetadata, normalizeUrl } from '@/lib/link-preview/link-metadata-extractor'
import { validateLink } from '@/lib/link-preview/link-validator'
import { invalidateCache, setCachedPreview } from '@/lib/link-preview/link-cache'
import { optimizeLinkPreviewImage } from '@/lib/link-preview/image-optimizer'
import type { LinkPreviewResponse } from '@/types/link-preview'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, validate_security = true } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      )
    }

    // Normalize URL
    const normalizedUrl = normalizeUrl(url)

    // Invalidate existing cache
    await invalidateCache(url, normalizedUrl)

    // Validate security if requested
    let securityScore = 100
    let warnings: string[] = []
    
    if (validate_security) {
      try {
        const validation = await validateLink(url)
        securityScore = validation.security_score
        warnings = validation.warnings

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
      }
    }

    // Extract fresh metadata
    let metadata
    try {
      metadata = await extractLinkMetadata(url, {
        timeout: 10000,
        max_redirects: 5,
        extract_images: true,
        extract_videos: true,
      })

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

    // Cache the refreshed result
    try {
      await setCachedPreview(metadata)
    } catch (error) {
      console.warn('Failed to cache preview, continuing:', error)
    }

    return NextResponse.json({
      success: true,
      data: metadata,
      from_cache: false,
      warnings: warnings.length > 0 ? warnings : undefined,
    } as LinkPreviewResponse)
  } catch (error: any) {
    console.error('Error in link preview refresh API:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      } as LinkPreviewResponse,
      { status: 500 }
    )
  }
}
