import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import crypto from 'crypto'

const IMAGE_TYPE_IDS = {
  user: {
    avatar: 33,
    cover: 32,
  },
  group: {
    avatar: 35,
    cover: 34,
  },
  author: {
    avatar: 37,
    cover: 36,
  },
  publisher: {
    avatar: 39,
    cover: 38,
  },
  book: {
    avatar: 41,
    cover: 40,
  },
  event: {
    avatar: 43,
    cover: 42,
  },
  photo: {
    avatar: 45,
    cover: 44,
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from session
    const supabase = await createRouteHandlerClientAsync()
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        { error: 'Failed to get session' },
        { status: 500 }
      )
    }
    
    if (!session?.user) {
      console.error('No authenticated user')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const user = session.user

    const formData = await request.formData()
    const file = formData.get('file') as File
    const entityType = formData.get('entityType') as string
    const entityId = formData.get('entityId') as string
    const imageType = formData.get('imageType') as string // 'avatar' or 'cover'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!entityType || !entityId || !imageType) {
      return NextResponse.json(
        { error: 'entityType, entityId, and imageType are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Get Cloudinary credentials from environment variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Cloudinary credentials are not properly configured')
      return NextResponse.json(
        { error: 'Image upload service not configured' },
        { status: 500 }
      )
    }

    // Create a timestamp for the signature
    const timestamp = Math.round(new Date().getTime() / 1000)

    // Prepare transformation parameters
    const transformationString = "f_webp,q_95"

    // Create folder path
    const folderPath = `authorsinfo/${entityType}_${imageType}`

    // Create the parameters object for signature
    const params: Record<string, string> = {
      timestamp: timestamp.toString(),
      folder: folderPath,
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
        .join("&") + apiSecret

    // Generate the signature
    const signature = crypto.createHash("sha1").update(signatureString).digest("hex")

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Prepare the form data
    const uploadFormData = new FormData()
    uploadFormData.append("file", dataUrl)
    uploadFormData.append("api_key", apiKey)
    uploadFormData.append("timestamp", timestamp.toString())
    uploadFormData.append("signature", signature)
    uploadFormData.append("folder", folderPath)
    uploadFormData.append("transformation", transformationString)

    // Upload to Cloudinary
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: uploadFormData,
    })

    // Check if the response is ok
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Cloudinary upload failed:', errorText)
      return NextResponse.json(
        { error: `Failed to upload image: ${errorText}` },
        { status: 500 }
      )
    }

    // Parse response
    const data = await response.json()

    // Get image type ID
    const imgTypeId = IMAGE_TYPE_IDS[entityType as keyof typeof IMAGE_TYPE_IDS]?.[imageType as 'avatar' | 'cover']
    
    if (!imgTypeId) {
      return NextResponse.json(
        { error: `Invalid entityType or imageType combination` },
        { status: 400 }
      )
    }

    // Create image record in database
    const { data: imageRecord, error: imageError } = await supabase
      .from('images')
      .insert({
        url: data.secure_url,
        alt_text: `${imageType} for ${entityType} ${entityId}`,
        img_type_id: imgTypeId,
        storage_provider: 'cloudinary',
        storage_path: folderPath,
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        is_processed: true,
        processing_status: 'completed',
        metadata: {
          original_name: file.name,
          file_size: file.size,
          content_type: file.type,
          upload_timestamp: new Date().toISOString(),
          cloudinary_public_id: data.public_id,
          entity_type: entityType,
          entity_id: entityId
        }
      })
      .select()
      .single()

    if (imageError) {
      console.error('Error creating image record:', imageError)
      return NextResponse.json(
        { error: `Failed to create image record: ${imageError.message}` },
        { status: 500 }
      )
    }

    // Update entity profile with image_id
    const { error: updateError } = await supabase
      .from(`${entityType}s`)
      .update({
        [`${imageType}_image_id`]: imageRecord.id
      })
      .eq('id', entityId)

    if (updateError) {
      console.error('Error updating entity profile:', updateError)
      return NextResponse.json(
        { error: `Failed to update ${entityType} profile: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      url: data.secure_url,
      image_id: imageRecord.id,
      public_id: data.public_id,
      message: 'Image uploaded successfully'
    })
  } catch (error: any) {
    console.error('Error in entity image upload:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

