import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { supabaseAdmin } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * DELETE /api/photos/[id]?albumId=xxx
 *
 * Performs a FULL delete of a photo:
 * 1. Removes from album_images (unlinks from album)
 * 2. Deletes from images table (removes database record)
 * 3. Deletes from Cloudinary (removes actual file)
 *
 * This ensures no orphaned records or files remain.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: imageId } = await params
    const { searchParams } = new URL(request.url)
    const albumId = searchParams.get('albumId')

    // Validate required parameters
    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 })
    }

    // Authenticate user
    const supabase = await createRouteHandlerClientAsync()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[API] DELETE /api/photos/${imageId}`, { albumId, userId: user.id })

    // Step 1: Get the image record to extract Cloudinary public_id from URL
    const { data: image, error: imageError } = await supabaseAdmin
      .from('images')
      .select('id, url, storage_path, storage_provider, metadata')
      .eq('id', imageId)
      .single()

    if (imageError || !image) {
      console.error('[API] Image not found:', imageId, imageError?.message)
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    console.log('[API] Found image:', { id: image.id, url: image.url?.substring(0, 50) })

    // Step 2: Delete from album_images (if albumId provided)
    if (albumId) {
      const { error: albumImageError } = await supabaseAdmin
        .from('album_images')
        .delete()
        .eq('album_id', albumId)
        .eq('image_id', imageId)

      if (albumImageError) {
        console.error('[API] Failed to delete from album_images:', albumImageError.message)
        // Continue - we still want to delete the image record and cloud file
      } else {
        console.log('[API] Deleted from album_images')
      }
    } else {
      // No albumId - delete ALL album_images entries for this image
      const { error: albumImageError } = await supabaseAdmin
        .from('album_images')
        .delete()
        .eq('image_id', imageId)

      if (albumImageError) {
        console.error('[API] Failed to delete all album_images entries:', albumImageError.message)
      } else {
        console.log('[API] Deleted all album_images entries for image')
      }
    }

    // Step 3: Delete from images table
    const { error: deleteImageError } = await supabaseAdmin
      .from('images')
      .delete()
      .eq('id', imageId)

    if (deleteImageError) {
      console.error('[API] Failed to delete from images table:', deleteImageError.message)
      return NextResponse.json({ error: 'Failed to delete image record' }, { status: 500 })
    }

    console.log('[API] Deleted from images table')

    // Step 4: Delete from Cloudinary (if it's a Cloudinary URL)
    if (image.url && image.url.includes('cloudinary.com')) {
      try {
        const publicId = extractCloudinaryPublicId(image.url)

        if (publicId) {
          const cloudinaryResult = await deleteFromCloudinary(publicId)
          console.log('[API] Cloudinary delete result:', cloudinaryResult)
        } else {
          console.warn('[API] Could not extract Cloudinary public_id from URL:', image.url)
        }
      } catch (cloudinaryError) {
        // Log but don't fail - the DB records are already deleted
        console.error('[API] Cloudinary delete failed (non-critical):', cloudinaryError)
      }
    }

    console.log(`[API] Photo ${imageId} fully deleted`)

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
      deletedId: imageId,
    })
  } catch (error) {
    console.error('[API] Error in DELETE /api/photos/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Extract Cloudinary public_id from a Cloudinary URL
 *
 * URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{ext}
 * Example: https://res.cloudinary.com/demo/image/upload/v1234567890/authorsinfo/book_photos/abc123.webp
 *
 * The public_id includes the folder path: authorsinfo/book_photos/abc123
 */
function extractCloudinaryPublicId(url: string): string | null {
  try {
    // Match Cloudinary URL pattern
    const match = url.match(/\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i)

    if (match && match[1]) {
      // Remove file extension if present
      const publicId = match[1].replace(/\.[a-z]+$/i, '')
      return publicId
    }

    // Alternative pattern for transformed images
    const altMatch = url.match(/cloudinary\.com\/[^/]+\/image\/upload\/[^/]+\/(.+?)(?:\.[a-z]+)?$/i)
    if (altMatch && altMatch[1]) {
      return altMatch[1].replace(/\.[a-z]+$/i, '')
    }

    return null
  } catch (error) {
    console.error('[API] Error extracting Cloudinary public_id:', error)
    return null
  }
}

/**
 * Delete an image from Cloudinary using their API
 */
async function deleteFromCloudinary(
  publicId: string
): Promise<{ success: boolean; result?: { result: string } }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('[API] Cloudinary credentials not configured')
    return { success: false }
  }

  // Create signature for Cloudinary API
  const timestamp = Math.round(new Date().getTime() / 1000)
  const signature = crypto
    .createHash('sha1')
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex')

  // Make the delete request
  const formData = new FormData()
  formData.append('public_id', publicId)
  formData.append('api_key', apiKey)
  formData.append('timestamp', timestamp.toString())
  formData.append('signature', signature)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('[API] Cloudinary API error:', errorData)
    return { success: false }
  }

  const result = await response.json()
  return { success: result.result === 'ok', result }
}
