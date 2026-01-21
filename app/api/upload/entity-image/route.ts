import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isValidCloudinaryUrl } from '@/lib/utils/image-url-validation'
import crypto from 'crypto'

const normalizeImageType = (imageType: string | null, originalType: string | null) => {
  if (originalType === 'bookCover' || originalType === 'entityHeaderCover') {
    return 'cover'
  }

  if (!imageType) {
    return null
  }

  const normalized = imageType.toLowerCase()
  if (normalized === 'book_cover' || normalized === 'entity_cover') {
    return 'cover'
  }
  return normalized
}

const deriveImageColumnName = (entityType: string, normalizedImageType: string | null) => {
  if (!normalizedImageType) {
    return null
  }

  const overrides: Record<string, Record<string, string>> = {
    user: {
      avatar: 'avatar_image_id',
      cover: 'cover_image_id',
    },
    author: {
      avatar: 'author_image_id',
      cover: 'cover_image_id',
    },
    publisher: {
      avatar: 'publisher_image_id',
      cover: 'cover_image_id',
    },
    book: {
      cover: 'cover_image_id',
    },
  }

  const normalizedType = overrides[entityType]?.[normalizedImageType]
  if (normalizedType) {
    return normalizedType
  }

  return `${normalizedImageType}_image_id`
}

// Helper function to delete image from Cloudinary if database operations fail
async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('⚠️ Cannot delete from Cloudinary: credentials not configured')
      return
    }

    const timestamp = Math.round(new Date().getTime() / 1000)
    const signature = crypto
      .createHash('sha1')
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex')

    const formData = new FormData()
    formData.append('public_id', publicId)
    formData.append('api_key', apiKey)
    formData.append('timestamp', timestamp.toString())
    formData.append('signature', signature)

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      console.log(`✅ Rollback: Deleted orphaned image from Cloudinary: ${publicId}`)
    } else {
      const errorData = await response.json().catch(() => ({}))
      console.error(
        `⚠️ Rollback failed: Could not delete image from Cloudinary: ${publicId}`,
        errorData
      )
    }
  } catch (error) {
    console.error(`⚠️ Rollback error: Exception while deleting from Cloudinary: ${publicId}`, error)
  }
}

async function deleteImageRecord(adminClient: any, imageId: string): Promise<void> {
  try {
    const { error } = await (adminClient.from('images') as any).delete().eq('id', imageId)
    if (error) {
      console.error(`⚠️ Rollback failed: Could not delete images row: ${imageId}`, error)
    } else {
      console.log(`✅ Rollback: Deleted orphaned images row: ${imageId}`)
    }
  } catch (error) {
    console.error(`⚠️ Rollback error: Exception while deleting images row: ${imageId}`, error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user - use getUser() to authenticate with Supabase Auth server
    const supabase = await createRouteHandlerClientAsync()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) {
      console.error('User authentication error:', userError)
      return NextResponse.json({ error: 'Failed to authenticate user' }, { status: 500 })
    }

    if (!user) {
      console.error('No authenticated user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = supabaseAdmin

    const formData = await request.formData()
    const file = formData.get('file') as File
    const entityType = formData.get('entityType') as string
    const entityId = formData.get('entityId') as string
    const imageType = formData.get('imageType') as string // 'avatar' or 'cover'
    const originalType = formData.get('originalType') as string // 'avatar', 'bookCover', or 'entityHeaderCover'
    const isCropped = formData.get('isCropped') === 'true' // Whether this is a cropped version
    const originalImageId = formData.get('originalImageId') as string | null // ID of original image if this is cropped

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!entityType || !entityId || !imageType) {
      return NextResponse.json(
        { error: 'entityType, entityId, and imageType are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Get Cloudinary credentials from environment variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Cloudinary credentials are not properly configured')
      return NextResponse.json({ error: 'Image upload service not configured' }, { status: 500 })
    }

    // Create a timestamp for the signature
    const timestamp = Math.round(new Date().getTime() / 1000)

    // Prepare transformation parameters
    const transformationString = 'f_webp,q_95'

    // Create folder path - use originalType to distinguish between bookCover and entityHeaderCover
    // originalType can be: 'avatar', 'bookCover', 'entityHeaderCover'
    let folderType = imageType // Default to imageType
    if (originalType === 'entityHeaderCover') {
      folderType = 'entity_header_cover'
    } else if (originalType === 'bookCover') {
      folderType = 'book_cover'
    }
    const folderPath = `authorsinfo/${folderType}`

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
        .join('&') + apiSecret

    // Generate the signature
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex')

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Prepare the form data
    const uploadFormData = new FormData()
    uploadFormData.append('file', dataUrl)
    uploadFormData.append('api_key', apiKey)
    uploadFormData.append('timestamp', timestamp.toString())
    uploadFormData.append('signature', signature)
    uploadFormData.append('folder', folderPath)
    uploadFormData.append('transformation', transformationString)

    // Upload to Cloudinary
    console.log(
      `📤 Starting Cloudinary upload for ${entityType} ${entityId}, imageType: ${imageType}`
    )
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: uploadFormData,
    })

    // Check if the response is ok
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Cloudinary upload failed:', errorText)
      return NextResponse.json({ error: `Failed to upload image: ${errorText}` }, { status: 500 })
    }

    // Parse response
    const data = await response.json()

    // Validate that the Cloudinary URL is valid before saving
    if (!data.secure_url || !isValidCloudinaryUrl(data.secure_url)) {
      console.error('❌ Invalid Cloudinary URL received:', data.secure_url)
      // Try to clean up the invalid upload
      if (data.public_id) {
        await deleteFromCloudinary(data.public_id)
      }
      return NextResponse.json(
        { error: 'Invalid image URL received from Cloudinary' },
        { status: 500 }
      )
    }

    console.log(`✅ Cloudinary upload successful: ${data.secure_url}, public_id: ${data.public_id}`)

    // Get actual schema columns from Supabase by querying a sample row
    // (information_schema is not accessible via PostgREST)
    const { data: sampleImageRow } = await (adminClient.from('images') as any)
      .select('*')
      .limit(1)
      .maybeSingle()

    const availableColumns = new Set(sampleImageRow ? Object.keys(sampleImageRow) : [])

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
      // Use descriptive naming: 'book_cover' instead of just 'cover' to avoid conflicts
      // originalType can be: 'avatar', 'bookCover', 'entityHeaderCover'
      const descriptiveImageType =
        originalType === 'bookCover'
          ? 'book_cover'
          : originalType === 'entityHeaderCover'
            ? 'entity_header_cover'
            : imageType

      insertObject.metadata = {
        original_name: file.name,
        file_size: file.size,
        content_type: file.type,
        upload_timestamp: new Date().toISOString(),
        cloudinary_public_id: data.public_id,
        entity_type: entityType,
        entity_id: entityId,
        image_type: descriptiveImageType,
        is_cropped: isCropped,
        ...(originalImageId && { original_image_id: originalImageId }),
      }
    }
    if (availableColumns.has('img_type_id')) {
      // If img_type_id exists, we could use it, but for now we'll skip it since we don't have the mapping
      // insertObject.img_type_id = imgTypeId
    }

    // Create image record in database using only existing columns
    console.log(`💾 Saving image to Supabase database: ${data.secure_url}`)
    const { data: imageRecord, error: imageError } = await (adminClient.from('images') as any)
      .insert(insertObject)
      .select()
      .single()

    if (imageError) {
      console.error('❌ Database insert failed:', imageError)
      console.error('   Entity:', { entityType, entityId, imageType })
      console.error('   Cloudinary URL:', data.secure_url)
      console.error('   Cloudinary public_id:', data.public_id)

      // ROLLBACK: Delete from Cloudinary since database insert failed
      console.log('🔄 Rolling back: Deleting image from Cloudinary due to database failure')
      await deleteFromCloudinary(data.public_id)

      return NextResponse.json(
        {
          error: `Failed to create image record: ${imageError.message}`,
          details:
            'Image was uploaded to Cloudinary but database save failed. Image has been removed from Cloudinary.',
        },
        { status: 500 }
      )
    }

    if (!imageRecord || !imageRecord.id) {
      console.error('❌ Database insert returned no record:', { imageRecord, imageError })
      console.error('   Entity:', { entityType, entityId, imageType })
      console.error('   Cloudinary URL:', data.secure_url)

      // ROLLBACK: Delete from Cloudinary since we didn't get a valid record
      console.log('🔄 Rolling back: Deleting image from Cloudinary - no database record returned')
      await deleteFromCloudinary(data.public_id)

      return NextResponse.json(
        {
          error: 'Database insert succeeded but no record was returned',
          details:
            'Image was uploaded to Cloudinary but database verification failed. Image has been removed from Cloudinary.',
        },
        { status: 500 }
      )
    }

    // VERIFY: Confirm the record actually exists in the database
    console.log(`🔍 Verifying database record exists: ${imageRecord.id}`)
    const { data: verifyRecord, error: verifyError } = await (adminClient.from('images') as any)
      .select('id, url')
      .eq('id', imageRecord.id)
      .single()

    if (verifyError || !verifyRecord) {
      console.error('❌ Database verification failed:', verifyError)
      console.error('   Image ID:', imageRecord.id)
      console.error('   Cloudinary URL:', data.secure_url)

      // ROLLBACK: Delete from Cloudinary since verification failed
      console.log('🔄 Rolling back: Deleting image from Cloudinary - verification failed')
      await deleteFromCloudinary(data.public_id)

      return NextResponse.json(
        {
          error: 'Database record could not be verified',
          details:
            'Image was uploaded to Cloudinary and database insert appeared successful, but verification failed. Image has been removed from Cloudinary.',
        },
        { status: 500 }
      )
    }

    console.log(`✅ Database record verified: ${verifyRecord.id}, URL: ${verifyRecord.url}`)

    // Map entity type to actual table name (users -> profiles) and id column
    const entityTableName = entityType === 'user' ? 'profiles' : `${entityType}s`
    const entityIdColumn = entityType === 'user' ? 'user_id' : 'id'
    const normalizedImageType = normalizeImageType(imageType, originalType)
    const columnName = deriveImageColumnName(entityType, normalizedImageType)
    const entityWarnings: string[] = []
    const shouldSkipEntityLinking = entityType === 'book' && imageType === 'bookCoverBack'

    // Strict integrity: if an author avatar is uploaded, it MUST be linked via authors.author_image_id.
    const strictLinking = entityType === 'author' && normalizedImageType === 'avatar'

    const appendEntityWarning = (warning: string) => {
      console.warn(warning)
      entityWarnings.push(warning)
    }

    const isMissingColumnError = (error: any) => {
      const message = error?.message?.toString().toLowerCase()
      if (!message) return false
      return message.includes('column') && message.includes('does not exist')
    }

    const upsertUserProfileImage = async (): Promise<boolean> => {
      if (!columnName) return false
      try {
        const { data: existingProfile, error: profileError } = await (
          adminClient.from('profiles') as any
        )
          .select('id, user_id')
          .eq('user_id', entityId)
          .maybeSingle()

        if (profileError) {
          const warning = `Unable to read profiles for user ${entityId}: ${profileError.message || 'Unknown error'}`
          console.error(warning, profileError)
          appendEntityWarning(warning)
          return false
        }

        const updatePayload: Record<string, any> = {
          [columnName]: imageRecord.id,
        }

        if (!existingProfile) {
          const insertPayload: Record<string, any> = {
            user_id: entityId,
            role: 'user',
            ...updatePayload,
          }
          const { error: createError } = await (adminClient.from('profiles') as any)
            .insert(insertPayload)
            .select('id')
            .single()

          if (createError) {
            throw createError
          }

          console.log(
            `✅ Profile created for user ${entityId}, linked ${columnName} = ${imageRecord.id}`
          )
          return true
        } else {
          const { error: updateError, data: updatedProfile } = await (
            adminClient.from('profiles') as any
          )
            .update(updatePayload)
            .eq('user_id', entityId)
            .select('id')
            .single()

          if (updateError) {
            throw updateError
          }

          if (!updatedProfile) {
            const warning = `Profiles update affected 0 rows for user ${entityId}`
            console.warn(warning)
            appendEntityWarning(warning)
            return false
          }

          console.log(`✅ Profile updated: ${updatedProfile.id}, ${columnName} = ${imageRecord.id}`)
          return true
        }
      } catch (error: any) {
        const warning = isMissingColumnError(error)
          ? `Column '${columnName}' does not exist on profiles; image ${imageRecord.id} cannot be linked to user ${entityId}`
          : `Failed to link image ${imageRecord.id} to profile for user ${entityId}: ${error?.message || 'Unknown error'}`
        console.error(warning, error)
        appendEntityWarning(warning)
        return false
      }
    }

    const updateGenericEntityImage = async (): Promise<boolean> => {
      if (!columnName) return false
      try {
        const updatePayload: Record<string, any> = {
          [columnName]: imageRecord.id,
        }

        const { data: updatedEntity, error: updateError } = await (
          adminClient.from(entityTableName) as any
        )
          .update(updatePayload)
          .eq(entityIdColumn, entityId)
          .select('id')
          .maybeSingle()

        if (updateError) {
          throw updateError
        }

        if (!updatedEntity) {
          const warning = `${entityType} ${entityId} not found in table '${entityTableName}', image saved without linking`
          console.warn(warning)
          appendEntityWarning(warning)
          return false
        }

        console.log(
          `✅ Entity updated: ${entityType} ${entityId}, ${columnName} = ${imageRecord.id}`
        )

        return true
      } catch (error: any) {
        const warning = isMissingColumnError(error)
          ? `Column '${columnName}' does not exist on table '${entityTableName}', cannot link image ${imageRecord.id}`
          : `Failed to update ${entityType} ${entityId} in '${entityTableName}': ${error?.message || 'Unknown error'}`
        console.error(warning, error)
        appendEntityWarning(warning)
        return false
      }
    }

    let linkSucceeded = false

    if (shouldSkipEntityLinking) {
      // Back cover uploads must NEVER overwrite books.cover_image_id (or any entity cover column).
      // Back covers are managed via the book images album (`/api/books/[id]/images`) only.
      console.log(
        `ℹ️ Skipping entity-table image linking for book back cover upload (entityId=${entityId})`
      )
      linkSucceeded = true
    } else if (!columnName) {
      appendEntityWarning(
        `Unable to derive an image column for entity type '${entityType}' and image type '${imageType}'`
      )
    } else if (entityType === 'user') {
      linkSucceeded = await upsertUserProfileImage()
    } else {
      linkSucceeded = await updateGenericEntityImage()
    }

    if (strictLinking && !linkSucceeded) {
      console.error(
        `❌ Strict integrity violation: failed to link author avatar image ${imageRecord.id} to author ${entityId}`,
        entityWarnings
      )

      // ROLLBACK: remove the orphan images row and Cloudinary asset
      await deleteImageRecord(adminClient, imageRecord.id)
      await deleteFromCloudinary(data.public_id)

      return NextResponse.json(
        {
          error: 'Failed to link uploaded author avatar to author record',
          details: entityWarnings,
        },
        { status: 500 }
      )
    }

    console.log(`✅ Upload complete: Image ${imageRecord.id} saved to Supabase and Cloudinary`)
    const responsePayload: Record<string, any> = {
      success: true,
      url: data.secure_url,
      image_id: imageRecord.id,
      public_id: data.public_id,
      message: 'Image uploaded successfully',
    }

    if (entityWarnings.length > 0) {
      responsePayload.warnings = entityWarnings
    }

    return NextResponse.json(responsePayload)
  } catch (error: any) {
    console.error('❌ Unexpected error in entity image upload:', error)
    console.error('   Stack:', error.stack)

    // If we have Cloudinary data but hit an error, try to clean up
    // Note: This is a best-effort cleanup since we may not have the public_id
    if (error.cloudinaryPublicId) {
      console.log('🔄 Attempting cleanup of Cloudinary image due to unexpected error')
      await deleteFromCloudinary(error.cloudinaryPublicId)
    }

    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details:
          'An unexpected error occurred during image upload. If the image was uploaded to Cloudinary, it may need manual cleanup.',
      },
      { status: 500 }
    )
  }
}

