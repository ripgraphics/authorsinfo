import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { v2 as cloudinary } from 'cloudinary'

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const bookId = resolvedParams.id

  try {
    // Get book data with original_image_url from images table
    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .select(`
        id,
        title,
        isbn13,
        isbn10,
        cover_image_id,
        cover_image:images!cover_image_id(id, url, alt_text, metadata, original_image_url)
      `)
      .eq('id', bookId)
      .single()

    if (bookError) {
      return NextResponse.json({
        error: 'Book not found',
        details: bookError.message,
      }, { status: 404 })
    }

    // Get original_image_url from images table
    // cover_image can be an array from the relation, so handle both cases
    const coverImage = Array.isArray(book.cover_image) ? book.cover_image[0] : book.cover_image
    const originalImageUrl = coverImage?.original_image_url

    const diagnostics: any = {
      book: {
        id: book.id,
        title: book.title,
        isbn13: book.isbn13,
        isbn10: book.isbn10,
        cover_image_id: book.cover_image_id,
      },
      cover_image_relation: coverImage,
      issues: [],
      fixes: [],
    }

    // Check if cover_image_id exists
    if (!book.cover_image_id) {
      diagnostics.issues.push('Book has no cover_image_id')
      
      if (originalImageUrl) {
        diagnostics.fixes.push({
          action: 'upload_and_link_image',
          imageUrl: originalImageUrl,
          description: 'Found original image URL in images table, can upload to Cloudinary and link',
        })
      } else {
        diagnostics.issues.push('No original_image_url found in images table')
      }
    } else {
      // Check if image record exists
      const { data: imageRecord, error: imageError } = await supabaseAdmin
        .from('images')
        .select('*')
        .eq('id', book.cover_image_id)
        .single()

      if (imageError || !imageRecord) {
        diagnostics.issues.push(`Image record not found for cover_image_id: ${book.cover_image_id}`)
        if (originalImageUrl) {
          diagnostics.fixes.push({
            action: 'recreate_image_record',
            description: 'Need to recreate image record using original_image_url from images table',
            imageUrl: originalImageUrl,
          })
        } else {
          diagnostics.fixes.push({
            action: 'recreate_image_record',
            description: 'Need to recreate image record or clear cover_image_id',
          })
        }
      } else {
        diagnostics.image_record = {
          id: imageRecord.id,
          url: imageRecord.url,
          alt_text: imageRecord.alt_text,
          metadata: imageRecord.metadata,
          original_image_url: imageRecord.original_image_url,
        }

        // Check if URL is valid Cloudinary URL
        if (imageRecord.url && imageRecord.url.includes('cloudinary.com')) {
          // Extract public_id from URL or metadata
          const publicId = imageRecord.metadata?.cloudinary_public_id || 
            imageRecord.url.split('/').slice(-2).join('/').replace(/\.[^/.]+$/, '')
          
          try {
            // Verify image exists in Cloudinary
            const cloudinaryResult = await cloudinary.api.resource(publicId)
            diagnostics.cloudinary_check = {
              exists: true,
              public_id: cloudinaryResult.public_id,
              url: cloudinaryResult.secure_url,
              format: cloudinaryResult.format,
              bytes: cloudinaryResult.bytes,
            }
          } catch (cloudinaryError: any) {
            diagnostics.cloudinary_check = {
              exists: false,
              error: cloudinaryError.message,
            }
            diagnostics.issues.push(`Image not found in Cloudinary: ${cloudinaryError.message}`)
            if (originalImageUrl) {
              diagnostics.fixes.push({
                action: 'reupload_image',
                description: 'Image record exists but Cloudinary image is missing',
                imageUrl: originalImageUrl,
              })
            }
          }
        } else {
          diagnostics.issues.push('Image URL is not a Cloudinary URL')
          if (originalImageUrl) {
            diagnostics.fixes.push({
              action: 'reupload_to_cloudinary',
              description: 'Image URL is not from Cloudinary, need to upload',
              imageUrl: originalImageUrl,
            })
          }
        }
      }
    }

    return NextResponse.json(diagnostics, { status: 200 })
  } catch (error) {
    console.error('Error in diagnostic:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const bookId = resolvedParams.id
  const { action } = await request.json()

  try {
    // Get book data with cover_image_id
    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .select('id, title, cover_image_id')
      .eq('id', bookId)
      .single()

    if (bookError || !book) {
      return NextResponse.json({
        error: 'Book not found',
        details: bookError?.message,
      }, { status: 404 })
    }

    const bookCoverEntityTypeId = '9d91008f-4f24-4501-b18a-922e2cfd6d34'
    
    // Get original_image_url from images table
    let imageUrl: string | null = null
    
    if (book.cover_image_id) {
      const { data: imageRecord } = await supabaseAdmin
        .from('images')
        .select('original_image_url')
        .eq('id', book.cover_image_id)
        .single()
      
      imageUrl = imageRecord?.original_image_url || null
    }

    if (action === 'fix_image') {
      if (!imageUrl) {
        return NextResponse.json({
          error: 'No original_image_url found in images table',
        }, { status: 400 })
      }

      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(imageUrl, {
        folder: 'authorsinfo/bookcovers',
        transformation: [{ height: 900, crop: 'fit', format: 'webp' }],
      })

      // Check if image record already exists
      let imageId: number | null = null
      
      if (book.cover_image_id) {
        // Update existing image record
        const { data: updatedImage, error: updateError } = await supabaseAdmin
          .from('images')
          .update({
            url: uploadResult.secure_url,
            alt_text: book.title || 'Book cover',
            metadata: {
              cloudinary_public_id: uploadResult.public_id,
              entity_type: 'book',
              entity_id: bookId,
            },
          })
          .eq('id', book.cover_image_id)
          .select('id')
          .single()

        if (updateError) {
          // If update fails, create new record
          const { data: newImage, error: createError } = await supabaseAdmin
            .from('images')
            .insert({
              url: uploadResult.secure_url,
              alt_text: book.title || 'Book cover',
              entity_type_id: bookCoverEntityTypeId,
              metadata: {
                cloudinary_public_id: uploadResult.public_id,
                entity_type: 'book',
                entity_id: bookId,
              },
            })
            .select('id')
            .single()

          if (createError) {
            return NextResponse.json({
              error: 'Failed to create image record',
              details: createError.message,
            }, { status: 500 })
          }

          imageId = newImage.id
        } else {
          imageId = updatedImage.id
        }
      } else {
        // Create new image record
        const { data: newImage, error: createError } = await supabaseAdmin
          .from('images')
          .insert({
            url: uploadResult.secure_url,
            alt_text: book.title || 'Book cover',
            entity_type_id: bookCoverEntityTypeId,
            metadata: {
              cloudinary_public_id: uploadResult.public_id,
              entity_type: 'book',
              entity_id: bookId,
            },
          })
          .select('id')
          .single()

        if (createError) {
          return NextResponse.json({
            error: 'Failed to create image record',
            details: createError.message,
          }, { status: 500 })
        }

        imageId = newImage.id
      }

      // Update book with cover_image_id (don't set original_image_url in books table)
      const { error: updateBookError } = await supabaseAdmin
        .from('books')
        .update({
          cover_image_id: imageId,
        })
        .eq('id', bookId)

      if (updateBookError) {
        return NextResponse.json({
          error: 'Failed to update book',
          details: updateBookError.message,
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Image uploaded and linked successfully',
        imageId,
        cloudinaryUrl: uploadResult.secure_url,
      })
    }

    return NextResponse.json({
      error: 'Invalid action',
    }, { status: 400 })
  } catch (error) {
    console.error('Error fixing image:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

