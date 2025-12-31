'use server'
import { supabaseAdmin } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function uploadPhoto(
  file: File,
  entityType: string,
  entityId: string,
  albumId?: string
) {
  try {
    // Get Cloudinary credentials from environment variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary credentials are not properly configured')
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error(`Invalid file type: ${file.type}. Only images are allowed.`)
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error(
        `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 10MB.`
      )
    }

    // Create a timestamp for the signature
    const timestamp = Math.round(new Date().getTime() / 1000)

    // Prepare transformation parameters
    const transformationString = 'f_webp,q_95' // Convert to WebP with 95% quality

    // Create the parameters object for signature
    const params: Record<string, string> = {
      timestamp: timestamp.toString(),
      folder: `authorsinfo/${entityType}_photos`,
      transformation: transformationString,
    }

    // Sort parameters alphabetically by key as required by Cloudinary
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc: Record<string, string>, key) => {
        acc[key] = params[key]
        return acc
      }, {})

    // Create signature string from sorted parameters
    const signatureString =
      Object.entries(sortedParams)
        .map(([key, value]) => `${key}=${value}`)
        .join('&') + apiSecret

    // Generate the signature
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex')

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Prepare the form data
    const formData = new FormData()
    formData.append('file', dataUrl)
    formData.append('api_key', apiKey)
    formData.append('timestamp', timestamp.toString())
    formData.append('signature', signature)
    formData.append('folder', `authorsinfo/${entityType}_photos`)
    formData.append('transformation', transformationString)

    // Upload to Cloudinary
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    })

    // Check if the response is ok
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Cloudinary upload failed:', errorText)
      throw new Error(`Cloudinary upload failed: ${errorText}`)
    }

    // Parse response
    const data = await response.json()

    // Create image record in database
    const { data: imageData, error: imageError } = await supabaseAdmin
      .from('images')
      .insert({
        url: data.secure_url,
        alt_text: file.name,
        storage_provider: 'cloudinary',
        storage_path: `authorsinfo/${entityType}_photos`,
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        is_processed: true,
        processing_status: 'completed',
      })
      .select()
      .single()

    if (imageError) {
      console.error('Database image insert error:', imageError)
      throw new Error(`Failed to create image record: ${imageError.message}`)
    }

    // Create album image record if albumId is provided
    if (albumId) {
      try {
        // Get the next display order for this album
        const { data: maxOrderData } = await supabaseAdmin
          .from('album_images')
          .select('display_order')
          .eq('album_id', albumId)
          .order('display_order', { ascending: false })
          .limit(1)
          .single()

        const nextDisplayOrder = maxOrderData?.display_order ? maxOrderData.display_order + 1 : 0

        const { error: albumImageError } = await supabaseAdmin.from('album_images').insert({
          album_id: albumId,
          image_id: imageData.id,
          display_order: nextDisplayOrder,
          is_cover: false,
          is_featured: false,
          metadata: {
            uploaded_at: new Date().toISOString(),
            original_filename: file.name,
            file_size: file.size,
            mime_type: file.type,
            upload_method: 'cloudinary',
          },
        })

        if (albumImageError) {
          console.error('Album image insert error:', albumImageError)
          throw new Error(`Failed to create album image record: ${albumImageError.message}`)
        }
      } catch (error) {
        console.error('Error in album image creation:', error)
        throw error
      }
    }

    return {
      url: data.secure_url,
      publicId: data.public_id,
      imageId: imageData.id,
    }
  } catch (error) {
    console.error('Error uploading photo:', error)
    throw error
  }
}
