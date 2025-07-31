import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Entity album types
type EntityAlbumType = 
  | 'book_cover_album'
  | 'book_avatar_album' 
  | 'book_entity_header_album'
  | 'book_gallery_album'
  | 'author_avatar_album'
  | 'author_entity_header_album'
  | 'author_gallery_album'
  | 'publisher_avatar_album'
  | 'publisher_entity_header_album'
  | 'publisher_gallery_album'
  | 'user_avatar_album'
  | 'user_gallery_album'
  | 'event_entity_header_album'
  | 'event_gallery_album'

// Entity types
type EntityType = 'book' | 'author' | 'publisher' | 'user' | 'event'

interface EntityImageRequest {
  entityId: string
  entityType: EntityType
  albumType: EntityAlbumType
  imageId?: string
  imageUrl?: string
  altText?: string
  caption?: string
  displayOrder?: number
  isCover?: boolean
  isFeatured?: boolean
  metadata?: Record<string, any>
}

interface EntityImageResponse {
  success: boolean
  albumId?: string
  imageId?: string
  message?: string
  error?: string
}

// GET - Retrieve entity images from albums
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get('entityId')
    const entityType = searchParams.get('entityType') as EntityType
    const albumType = searchParams.get('albumType') as EntityAlbumType

    if (!entityId || !entityType) {
      return NextResponse.json({
        success: false,
        error: 'entityId and entityType are required'
      }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Get entity images using the database function
    const { data: images, error } = await supabase.rpc('get_entity_images', {
      p_entity_id: entityId,
      p_entity_type: entityType,
      p_album_type: albumType || null
    })

    if (error) {
      console.error('Error fetching entity images:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch entity images'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      images: images || []
    })

  } catch (error) {
    console.error('Error in GET /api/entity-images:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST - Add image to entity album
export async function POST(request: NextRequest) {
  try {
    const body: EntityImageRequest = await request.json()
    const {
      entityId,
      entityType,
      albumType,
      imageId,
      imageUrl,
      altText,
      caption,
      displayOrder,
      isCover = false,
      isFeatured = false,
      metadata = {}
    } = body

    if (!entityId || !entityType || !albumType) {
      return NextResponse.json({
        success: false,
        error: 'entityId, entityType, and albumType are required'
      }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    let finalImageId = imageId

    // If imageUrl is provided but no imageId, create image record first
    if (imageUrl && !imageId) {
      const { data: imageData, error: imageError } = await supabase
        .from('images')
        .insert({
          url: imageUrl,
          alt_text: altText,
          caption: caption,
          metadata: {
            ...metadata,
            entity_type: entityType,
            entity_id: entityId,
            album_type: albumType,
            uploaded_via: 'entity_image_api'
          }
        })
        .select('id')
        .single()

      if (imageError) {
        console.error('Error creating image record:', imageError)
        return NextResponse.json({
          success: false,
          error: 'Failed to create image record'
        }, { status: 500 })
      }

      finalImageId = imageData.id
    }

    if (!finalImageId) {
      return NextResponse.json({
        success: false,
        error: 'Either imageId or imageUrl must be provided'
      }, { status: 400 })
    }

    // Try to use the database function first, but fall back to manual creation if it fails
    let albumData: any = null
    let albumError: any = null

    try {
      const { data, error } = await supabase.rpc('add_image_to_entity_album', {
        p_entity_id: entityId,
        p_entity_type: entityType,
        p_album_type: albumType,
        p_image_id: finalImageId,
        p_display_order: displayOrder || 1,
        p_is_cover: isCover,
        p_is_featured: isFeatured
      })
      
      albumData = data
      albumError = error
    } catch (error) {
      console.log('Database function not available, using manual album creation')
      albumError = error
    }

    // If the database function failed, create the album and add image manually
    if (albumError) {
      console.log('Creating album and adding image manually')
      
      // First, check if album exists
      let { data: existingAlbum } = await supabase
        .from('photo_albums')
        .select('id')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .eq('album_type', albumType)
        .single()

      let albumId: string

      if (!existingAlbum) {
        // Create new album
        const { data: newAlbum, error: createAlbumError } = await supabase
          .from('photo_albums')
          .insert({
            name: albumType,
            description: `Auto-created album for ${entityType} ${entityId}`,
            entity_id: entityId,
            entity_type: entityType,
            album_type: albumType,
            is_public: false,
            metadata: {
              created_via: 'entity_image_api',
              total_images: 0,
              total_size: 0,
              last_modified: new Date().toISOString()
            }
          })
          .select('id')
          .single()

        if (createAlbumError) {
          console.error('Error creating album:', createAlbumError)
          return NextResponse.json({
            success: false,
            error: 'Failed to create album'
          }, { status: 500 })
        }

        albumId = newAlbum.id
      } else {
        albumId = existingAlbum.id
      }

      // Add image to album
      const { error: addImageError } = await supabase
        .from('album_images')
        .insert({
          album_id: albumId,
          image_id: finalImageId,
          display_order: displayOrder || 1,
          is_cover: isCover,
          is_featured: isFeatured
        })

      if (addImageError) {
        console.error('Error adding image to album:', addImageError)
        return NextResponse.json({
          success: false,
          error: 'Failed to add image to entity album'
        }, { status: 500 })
      }

      albumData = albumId
    }

    // Update entity table with image reference if it's a cover/avatar/header
    if (isCover) {
      await updateEntityImageReference(entityId, entityType, albumType, finalImageId, supabase)
    }

    return NextResponse.json({
      success: true,
      albumId: albumData,
      imageId: finalImageId,
      message: 'Image added to entity album successfully'
    })

  } catch (error) {
    console.error('Error in POST /api/entity-images:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// PUT - Update entity image
export async function PUT(request: NextRequest) {
  try {
    const body: EntityImageRequest = await request.json()
    const {
      entityId,
      entityType,
      albumType,
      imageId,
      altText,
      caption,
      displayOrder,
      isCover,
      isFeatured,
      metadata
    } = body

    if (!entityId || !entityType || !albumType || !imageId) {
      return NextResponse.json({
        success: false,
        error: 'entityId, entityType, albumType, and imageId are required'
      }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Get album ID
    const { data: albumData, error: albumError } = await supabase
      .from('photo_albums')
      .select('id')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .eq('album_type', albumType)
      .single()

    if (albumError || !albumData) {
      return NextResponse.json({
        success: false,
        error: 'Album not found'
      }, { status: 404 })
    }

    // Update album image record
    const updateData: any = {}
    if (displayOrder !== undefined) updateData.display_order = displayOrder
    if (isCover !== undefined) updateData.is_cover = isCover
    if (isFeatured !== undefined) updateData.is_featured = isFeatured
    if (metadata) updateData.metadata = metadata

    const { error: updateError } = await supabase
      .from('album_images')
      .update(updateData)
      .eq('album_id', albumData.id)
      .eq('image_id', imageId)

    if (updateError) {
      console.error('Error updating album image:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update image'
      }, { status: 500 })
    }

    // Update image record if altText or caption provided
    if (altText !== undefined || caption !== undefined) {
      const imageUpdateData: any = {}
      if (altText !== undefined) imageUpdateData.alt_text = altText
      if (caption !== undefined) imageUpdateData.caption = caption

      const { error: imageUpdateError } = await supabase
        .from('images')
        .update(imageUpdateData)
        .eq('id', imageId)

      if (imageUpdateError) {
        console.error('Error updating image record:', imageUpdateError)
      }
    }

    // Update entity table if this is a cover image
    if (isCover) {
      await updateEntityImageReference(entityId, entityType, albumType, imageId, supabase)
    }

    return NextResponse.json({
      success: true,
      message: 'Image updated successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/entity-images:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// DELETE - Remove image from entity album
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get('entityId')
    const entityType = searchParams.get('entityType') as EntityType
    const albumType = searchParams.get('albumType') as EntityAlbumType
    const imageId = searchParams.get('imageId')

    if (!entityId || !entityType || !albumType || !imageId) {
      return NextResponse.json({
        success: false,
        error: 'entityId, entityType, albumType, and imageId are required'
      }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Get album ID
    const { data: albumData, error: albumError } = await supabase
      .from('photo_albums')
      .select('id')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .eq('album_type', albumType)
      .single()

    if (albumError || !albumData) {
      return NextResponse.json({
        success: false,
        error: 'Album not found'
      }, { status: 404 })
    }

    // Remove image from album
    const { error: deleteError } = await supabase
      .from('album_images')
      .delete()
      .eq('album_id', albumData.id)
      .eq('image_id', imageId)

    if (deleteError) {
      console.error('Error removing image from album:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Failed to remove image from album'
      }, { status: 500 })
    }

    // Check if this was a cover image and clear entity reference
    const { data: albumImageData } = await supabase
      .from('album_images')
      .select('is_cover')
      .eq('album_id', albumData.id)
      .eq('image_id', imageId)
      .single()

    if (albumImageData?.is_cover) {
      await clearEntityImageReference(entityId, entityType, albumType, supabase)
    }

    return NextResponse.json({
      success: true,
      message: 'Image removed from entity album successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/entity-images:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Helper function to update entity image references
async function updateEntityImageReference(
  entityId: string,
  entityType: EntityType,
  albumType: EntityAlbumType,
  imageId: string,
  supabase: any
) {
  const updateData: any = {}

  if (entityType === 'book') {
    if (albumType === 'book_cover_album') {
      updateData.cover_image_id = imageId
    } else if (albumType === 'book_avatar_album') {
      updateData.avatar_image_id = imageId
    } else if (albumType === 'book_entity_header_album') {
      updateData.entity_header_image_id = imageId
    }
  } else if (entityType === 'author') {
    if (albumType === 'author_avatar_album') {
      updateData.author_image_id = imageId
    } else if (albumType === 'author_entity_header_album') {
      updateData.cover_image_id = imageId
    }
  } else if (entityType === 'event') {
    if (albumType === 'event_entity_header_album') {
      updateData.entity_header_image_id = imageId
    } else if (albumType === 'event_gallery_album') {
      // No specific album image reference for events, so this might need adjustment
      // For now, we'll just log a warning if an event album type is encountered
      console.warn(`Event album type ${albumType} does not have a specific image reference update.`)
    }
  }

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase
      .from(entityType === 'book' ? 'books' : 'authors')
      .update(updateData)
      .eq('id', entityId)

    if (error) {
      console.error(`Error updating ${entityType} image reference:`, error)
    }
  }
}

// Helper function to clear entity image references
async function clearEntityImageReference(
  entityId: string,
  entityType: EntityType,
  albumType: EntityAlbumType,
  supabase: any
) {
  const updateData: any = {}

  if (entityType === 'book') {
    if (albumType === 'book_cover_album') {
      updateData.cover_image_id = null
    } else if (albumType === 'book_avatar_album') {
      updateData.avatar_image_id = null
    } else if (albumType === 'book_entity_header_album') {
      updateData.entity_header_image_id = null
    }
  } else if (entityType === 'author') {
    if (albumType === 'author_avatar_album') {
      updateData.author_image_id = null
    } else if (albumType === 'author_entity_header_album') {
      updateData.cover_image_id = null
    }
  } else if (entityType === 'event') {
    if (albumType === 'event_entity_header_album') {
      updateData.entity_header_image_id = null
    }
  }

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase
      .from(entityType === 'book' ? 'books' : 'authors')
      .update(updateData)
      .eq('id', entityId)

    if (error) {
      console.error(`Error clearing ${entityType} image reference:`, error)
    }
  }
} 