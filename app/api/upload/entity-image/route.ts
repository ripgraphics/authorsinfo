import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { supabaseAdmin } from '@/lib/supabase-admin'
import crypto from 'crypto'

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

    // Get actual schema columns from Supabase
    const { data: columnsData } = await supabaseAdmin
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "images")
      .eq("table_schema", "public")

    const availableColumns = new Set(columnsData?.map((col: { column_name: string }) => col.column_name) || [])

    // Build insert object using only columns that exist in the schema
    const insertObject: Record<string, any> = {
      url: data.secure_url,
      alt_text: `${imageType} for ${entityType} ${entityId}`,
      storage_provider: 'cloudinary',
      storage_path: folderPath,
      original_filename: file.name,
      file_size: file.size,
      mime_type: file.type,
    }

    // Only include columns that exist in the schema
    if (availableColumns.has('is_processed')) {
      insertObject.is_processed = true
    }
    if (availableColumns.has('processing_status')) {
      insertObject.processing_status = 'completed'
    }
    if (availableColumns.has('metadata')) {
      insertObject.metadata = {
        original_name: file.name,
        file_size: file.size,
        content_type: file.type,
        upload_timestamp: new Date().toISOString(),
        cloudinary_public_id: data.public_id,
        entity_type: entityType,
        entity_id: entityId,
        image_type: imageType
      }
    }
    if (availableColumns.has('img_type_id')) {
      // If img_type_id exists, we could use it, but for now we'll skip it since we don't have the mapping
      // insertObject.img_type_id = imgTypeId
    }

    // Create image record in database using only existing columns
    const { data: imageRecord, error: imageError } = await supabase
      .from('images')
      .insert(insertObject)
      .select()
      .single()

    if (imageError) {
      console.error('Error creating image record:', imageError)
      return NextResponse.json(
        { error: `Failed to create image record: ${imageError.message}` },
        { status: 500 }
      )
    }

    // Check what image columns actually exist in the entity table before updating
    // Map entity type to actual table name (users -> profiles)
    const entityTableName = entityType === 'user' ? 'profiles' : `${entityType}s`
    const entityIdColumn = entityType === 'user' ? 'user_id' : 'id'
    const { data: entityColumnsData } = await supabaseAdmin
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", entityTableName)
      .eq("table_schema", "public")

    const entityColumns = new Set(entityColumnsData?.map((col: { column_name: string }) => col.column_name) || [])
    
    // Map imageType to actual column names that might exist
    // For books: 'cover' -> 'cover_image_id', 'avatar' might not exist
    // For authors: 'cover' -> 'cover_image_id', 'avatar' -> 'author_image_id'
    // For users (profiles): 'cover' -> 'cover_image_id', 'avatar' -> 'avatar_image_id'
    let columnName = `${imageType}_image_id`
    
    // Handle special cases for different entity types
    if (entityType === 'book' && imageType === 'avatar') {
      // Books might not have avatar_image_id, skip update if it doesn't exist
      if (!entityColumns.has('avatar_image_id')) {
        console.warn(`Column 'avatar_image_id' does not exist in '${entityTableName}' table, skipping entity update`)
        // Still return success since the image was uploaded and saved
        return NextResponse.json({
          success: true,
          url: data.secure_url,
          image_id: imageRecord.id,
          public_id: data.public_id,
          message: 'Image uploaded successfully (entity profile not updated - column does not exist)'
        })
      }
    } else if (entityType === 'author' && imageType === 'avatar') {
      columnName = 'author_image_id' // Authors use author_image_id for avatars
    }

    // Only update if the column exists
    if (entityColumns.has(columnName)) {
      const { error: updateError } = await supabase
        .from(entityTableName)
        .update({
          [columnName]: imageRecord.id
        })
        .eq(entityIdColumn, entityId)

      if (updateError) {
        console.error('Error updating entity profile:', updateError)
        return NextResponse.json(
          { error: `Failed to update ${entityType} profile: ${updateError.message}` },
          { status: 500 }
        )
      }
    } else {
      console.warn(`Column '${columnName}' does not exist in '${entityTableName}' table, skipping entity update`)
      // Still return success since the image was uploaded and saved to images table
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

