/**
 * Enterprise Link Preview Image Optimizer
 * Downloads, optimizes, and uploads preview images to Cloudinary
 * Phase 1: Enterprise Link Post Component
 */

import { v2 as cloudinary } from 'cloudinary'
import type { ImageOptimizationResult } from '@/types/link-preview'

// Configure Cloudinary
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

const OPTIMAL_DIMENSIONS = {
  width: 1200,
  height: 630,
}

const THUMBNAIL_DIMENSIONS = {
  width: 400,
  height: 210,
}

/**
 * Validate image URL
 */
function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const pathname = parsed.pathname.toLowerCase()
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    return imageExtensions.some((ext) => pathname.endsWith(ext))
  } catch {
    return false
  }
}

/**
 * Download image from URL
 */
async function downloadImage(url: string): Promise<Buffer> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      throw new Error(`Invalid content type: ${contentType}`)
    }

    clearTimeout(timeoutId)
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Image download timeout')
    }
    throw error
  }
}

/**
 * Upload image to Cloudinary with optimization
 */
async function uploadToCloudinary(
  imageBuffer: Buffer,
  publicId: string,
  width: number,
  height: number
): Promise<{
  secure_url: string
  public_id: string
  width: number
  height: number
  bytes: number
  format: string
}> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder: 'authorsinfo/link_previews',
        transformation: [
          {
            width,
            height,
            crop: 'fill',
            quality: 'auto',
            fetch_format: 'auto',
          },
        ],
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            format: result.format,
          })
        } else {
          reject(new Error('Upload failed: no result'))
        }
      }
    )

    uploadStream.end(imageBuffer)
  })
}

/**
 * Optimize and upload link preview image
 */
export async function optimizeLinkPreviewImage(
  imageUrl: string,
  linkId?: string
): Promise<ImageOptimizationResult> {
  // Validate image URL
  if (!isValidImageUrl(imageUrl)) {
    throw new Error('Invalid image URL')
  }

  try {
    // Download image
    const imageBuffer = await downloadImage(imageUrl)

    // Generate public ID
    const publicId = linkId
      ? `link_preview_${linkId}`
      : `link_preview_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Upload optimized main image
    const mainResult = await uploadToCloudinary(
      imageBuffer,
      `${publicId}_main`,
      OPTIMAL_DIMENSIONS.width,
      OPTIMAL_DIMENSIONS.height
    )

    // Upload thumbnail
    const thumbnailResult = await uploadToCloudinary(
      imageBuffer,
      `${publicId}_thumb`,
      THUMBNAIL_DIMENSIONS.width,
      THUMBNAIL_DIMENSIONS.height
    )

    return {
      original_url: imageUrl,
      optimized_url: mainResult.secure_url,
      thumbnail_url: thumbnailResult.secure_url,
      width: mainResult.width,
      height: mainResult.height,
      format: mainResult.format as 'webp' | 'avif' | 'jpeg' | 'png',
      size_bytes: mainResult.bytes,
      cloudinary_public_id: mainResult.public_id,
    }
  } catch (error: any) {
    console.error('Error optimizing link preview image:', error)
    throw new Error(`Failed to optimize image: ${error.message}`)
  }
}

/**
 * Delete optimized image from Cloudinary
 */
export async function deleteOptimizedImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.warn('Error deleting optimized image:', error)
    // Don't throw - deletion is best effort
  }
}
