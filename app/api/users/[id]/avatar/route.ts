import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Enterprise-Grade User Avatar API Route
 *
 * Fetches any user's avatar from the images table
 * via profiles.avatar_image_id and proxies the image data.
 * Returns a placeholder if no avatar is found.
 *
 * This route proxies the image to work with Next.js Image optimization,
 * which doesn't handle redirects properly.
 *
 * Uses supabaseAdmin for public access since avatars are public data.
 */
async function getPlaceholderImage(): Promise<Buffer> {
  try {
    const placeholderPath = join(process.cwd(), 'public', 'placeholder.svg')
    return await readFile(placeholderPath)
  } catch (error) {
    // Fallback to a simple SVG if file read fails
    const fallbackSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e5e7eb"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="sans-serif" font-size="24">Avatar</text></svg>'
    return Buffer.from(fallbackSvg)
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    // Validate user ID
    if (!id) {
      const placeholder = await getPlaceholderImage()
      return new NextResponse(new Uint8Array(placeholder), {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    // Get profile to fetch avatar_image_id using maybeSingle() since profile might not exist
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('avatar_image_id')
      .eq('user_id', id)
      .maybeSingle()

    if (profileError || !profile || !(profile as any)?.avatar_image_id) {
      // No profile or no avatar_image_id, return placeholder
      const placeholder = await getPlaceholderImage()
      return new NextResponse(new Uint8Array(placeholder), {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    // Fetch the avatar image from images table
    const { data: image, error: imageError } = await supabaseAdmin
      .from('images')
      .select('url')
      .eq('id', (profile as any).avatar_image_id)
      .single()

    if (imageError || !image || !(image as any)?.url) {
      // Image not found or error, return placeholder
      const placeholder = await getPlaceholderImage()
      return new NextResponse(new Uint8Array(placeholder), {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    // Proxy the image data for Next.js Image optimization compatibility
    try {
      const imageResponse = await fetch((image as any).url)
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
      }

      const imageBuffer = await imageResponse.arrayBuffer()
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    } catch (fetchError) {
      console.error('Error proxying image:', fetchError)
      // Fallback to placeholder if proxy fails
      const placeholder = await getPlaceholderImage()
      return new NextResponse(new Uint8Array(placeholder), {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }
  } catch (error) {
    console.error('Error fetching user avatar:', error)
    // Return placeholder on any error
    const placeholder = await getPlaceholderImage()
    return new NextResponse(new Uint8Array(placeholder), {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }
}
