import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Entity types that match the existing working system
type EntityType = 'book' | 'author' | 'publisher' | 'user' | 'event'

// Album purpose types that will be stored in metadata
type AlbumPurpose = 
  | 'cover'
  | 'avatar' 
  | 'entity_header'
  | 'gallery'
  | 'posts'

interface EntityImageRequest {
  entityId: string
  entityType: EntityType
  albumPurpose: AlbumPurpose
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
    console.log('🚀 GET /api/entity-images called')
    
    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get('entityId')
    const entityType = searchParams.get('entityType') as EntityType
    const albumPurpose = searchParams.get('albumPurpose') as AlbumPurpose

    console.log('📋 Request params:', { entityId, entityType, albumPurpose })

    if (!entityId || !entityType) {
      console.log('❌ Missing required params')
      return NextResponse.json({
        success: false,
        error: 'entityId and entityType are required'
      }, { status: 400 })
    }

    console.log('🔐 Creating Supabase client...')
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    console.log('✅ Supabase client created')

    // Build query to find albums based on entity and purpose
    let query = supabase
      .from('photo_albums')
      .select(`
        id,
        name,
        description,
        is_public,
        cover_image_id,
        created_at,
        updated_at,
        metadata
      `)
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)

    // If albumPurpose is specified, filter by metadata
    if (albumPurpose) {
      query = query.contains('metadata', { album_purpose: albumPurpose })
    }

    // Debug: Let's also check what albums exist without any filters
    console.log('🔍 API Debug - Checking all albums for entity...')
    const { data: allAlbumsForEntity, error: allAlbumsError } = await supabase
      .from('photo_albums')
      .select('id, name, entity_id, entity_type, metadata')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
    
    if (allAlbumsError) {
      console.error('❌ Error fetching all albums:', allAlbumsError)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch albums: ${allAlbumsError.message}`
      }, { status: 500 })
    }
    
    console.log('🔍 API Debug - All albums for entity (no purpose filter):', allAlbumsForEntity)
    
    // 🔧 ONE-TIME FIX: Repair existing albums that are missing album_purpose metadata
    if (allAlbumsForEntity && allAlbumsForEntity.length > 0) {
      console.log('🔧 Checking for albums that need metadata repair...')
      
      for (const album of allAlbumsForEntity) {
        if (!album.metadata?.album_purpose) {
          // Determine album purpose from name
          let inferredAlbumPurpose: string | null = null
          if (album.name === 'Header Cover Images') {
            inferredAlbumPurpose = 'entity_header'
          } else if (album.name === 'Avatar Images') {
            inferredAlbumPurpose = 'avatar'
          } else if (album.name === 'Cover Images') {
            inferredAlbumPurpose = 'cover'
          } else if (album.name === 'Gallery Images') {
            inferredAlbumPurpose = 'gallery'
          } else if (album.name === 'Post Images') {
            inferredAlbumPurpose = 'posts'
          }
          
          if (inferredAlbumPurpose) {
            console.log(`🔧 Fixing album "${album.name}" - adding missing album_purpose: ${inferredAlbumPurpose}`)
            await supabase
              .from('photo_albums')
              .update({
                metadata: {
                  ...(album.metadata || {}),
                  album_purpose: inferredAlbumPurpose
                }
              })
              .eq('id', album.id)
            
            // Update the local album object so the query below works
            album.metadata = {
              ...(album.metadata || {}),
              album_purpose: inferredAlbumPurpose
            }
          }
        }
      }
    }

    console.log('🔍 Executing main query...')
    const { data: albums, error } = await query

    console.log('🔍 API Debug - Query params:', { entityId, entityType, albumPurpose })
    console.log('🔍 API Debug - Raw albums result:', albums)
    console.log('🔍 API Debug - Albums count:', albums?.length)

    if (error) {
      console.error('❌ Error fetching entity albums:', error)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch entity albums: ${error.message}`
      }, { status: 500 })
    }

    // Get images for each album with full image details
    console.log('🖼️ Fetching images for albums...')
    const albumsWithImages = await Promise.all(
      (albums || []).map(async (album) => {
        try {
          console.log(`🖼️ Fetching album_images for album ${album.id} (${album.name})...`)
          const { data: albumImages, error: albumImagesError } = await supabase
            .from('album_images')
            .select(`
              id,
              image_id,
              display_order,
              is_cover,
              is_featured,
              created_at,
              metadata
            `)
            .eq('album_id', album.id)
            .order('display_order', { ascending: true })

          if (albumImagesError) {
            console.error(`❌ Error fetching images for album ${album.id}:`, albumImagesError)
            return {
              ...album,
              images: []
            }
          }

          console.log(`📸 Found ${albumImages?.length || 0} album_images for album ${album.id}`)
          if (albumImages && albumImages.length > 0) {
            console.log(`📸 Album images:`, albumImages.map(ai => ({ id: ai.id, image_id: ai.image_id, is_cover: ai.is_cover })))
            
            // 🔧 ONE-TIME FIX: Clean up cover flags - only one image per album should be cover
            const coverImages = albumImages.filter(ai => ai.is_cover === true)
            if (coverImages.length > 1) {
              console.log(`🔧 FIXING: Album ${album.id} has ${coverImages.length} cover images, should only have 1`)
              
              // Set all to false first
              await supabase
                .from('album_images')
                .update({ is_cover: false })
                .eq('album_id', album.id)
              
              // Set only the most recent one to true
              const mostRecentImage = albumImages.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0]
              
              if (mostRecentImage) {
                console.log(`🔧 Setting most recent image ${mostRecentImage.image_id} as cover`)
                await supabase
                  .from('album_images')
                  .update({ is_cover: true })
                  .eq('id', mostRecentImage.id)
                
                // Update the local data for this request
                albumImages.forEach(ai => {
                  ai.is_cover = ai.id === mostRecentImage.id
                })
              }
            }
          }

          // Get full image details for each album image
          console.log(`🖼️ Fetching image details for ${albumImages?.length || 0} images...`)
          const imagesWithDetails = await Promise.all(
            (albumImages || []).map(async (albumImage) => {
              try {
                console.log(`🖼️ Fetching image details for image_id: ${albumImage.image_id}`)
                const { data: imageDetails, error: imageError } = await supabase
                  .from('images')
                  .select(`
                    id,
                    url,
                    alt_text,
                    description,
                    caption,
                    metadata,
                    created_at
                  `)
                  .eq('id', albumImage.image_id)
                  .single()

                if (imageError) {
                  console.error(`❌ Error fetching image ${albumImage.image_id}:`, imageError)
                  return {
                    ...albumImage,
                    image: null
                  }
                }

                console.log(`✅ Image details fetched for ${albumImage.image_id}:`, { id: imageDetails?.id, url: imageDetails?.url })
                return {
                  ...albumImage,
                  image: imageDetails,
                  // Include the album-specific alt_text and description
                  alt_text: albumImage.alt_text || imageDetails.alt_text,
                  description: albumImage.description || imageDetails.description
                }
              } catch (imageError) {
                console.error(`❌ Error processing image ${albumImage.image_id}:`, imageError)
                return {
                  ...albumImage,
                  image: null
                }
              }
            })
          )

          return {
            ...album,
            images: imagesWithDetails || []
          }
        } catch (albumError) {
          console.error(`❌ Error processing album ${album.id}:`, albumError)
          return {
            ...album,
            images: []
          }
        }
      })
    )

    console.log('✅ Successfully processed albums with images')
    console.log('📊 Final result - Albums with images:', albumsWithImages.map(album => ({
      id: album.id,
      name: album.name,
      imageCount: album.images?.length || 0,
      images: album.images?.map(img => ({ id: img.image?.id, url: img.image?.url, is_cover: img.is_cover })) || []
    })))
    
    return NextResponse.json({
      success: true,
      albums: albumsWithImages
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
      albumPurpose,
      imageId,
      imageUrl,
      altText,
      caption,
      displayOrder,
      isCover = false,
      isFeatured = false,
      metadata = {}
    } = body

    if (!entityId || !entityType || !albumPurpose) {
      return NextResponse.json({
        success: false,
        error: 'entityId, entityType, and albumPurpose are required'
      }, { status: 400 })
    }

         const cookieStore = await cookies()
         const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
 
     // Get the current authenticated user ID early (needed for album search)
     const { data: { user }, error: userError } = await supabase.auth.getUser()
     
     if (userError || !user) {
       console.error('Error getting authenticated user:', userError)
       return NextResponse.json({
         success: false,
         error: 'Authentication required to create albums'
       }, { status: 401 })
     }
     
     console.log('Authenticated user:', user.id)
 
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
            album_purpose: albumPurpose,
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

    // Map album purpose to user-friendly names that match your existing system
    const albumNameMap: Record<AlbumPurpose, string> = {
      cover: 'Cover Images',
      avatar: 'Avatar Images',
      entity_header: 'Header Cover Images',
      gallery: 'Gallery Images',
      posts: 'Post Images'
    }
    
    const albumName = albumNameMap[albumPurpose]
    
    // Find or create album based on entity and purpose
    // First try to find by exact name match AND correct owner_id (more reliable)
    console.log('Looking for existing album:', { entityId, entityType, albumName, albumPurpose })
    
    let { data: existingAlbum, error: searchError } = await supabase
      .from('photo_albums')
      .select('id, metadata, owner_id')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .eq('owner_id', user.id) // ✅ Ensure album is owned by the authenticated user
      .eq('name', albumName)
      .single()
    
    if (searchError && searchError.code !== 'PGRST116') {
      console.error('Error searching for album by name:', searchError)
    }
    
    // If not found by name, try metadata search as fallback
    if (!existingAlbum) {
      console.log('Album not found by name, trying metadata search...')
      const { data: metadataAlbum, error: metadataError } = await supabase
        .from('photo_albums')
        .select('id, metadata, owner_id')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .eq('owner_id', user.id) // ✅ Ensure album is owned by the authenticated user
        .contains('metadata', { album_purpose: albumPurpose })
        .single()
      
      if (metadataError && metadataError.code !== 'PGRST116') {
        console.error('Error searching for album by metadata:', metadataError)
      }
      
      existingAlbum = metadataAlbum
    }
    
    if (existingAlbum) {
      console.log('Found existing album:', { id: existingAlbum.id, owner_id: existingAlbum.owner_id })
      
      // Fix existing album metadata if album_purpose is missing
      if (!existingAlbum.metadata?.album_purpose) {
        console.log('Fixing existing album metadata - adding missing album_purpose')
        await supabase
          .from('photo_albums')
          .update({
            metadata: {
              ...(existingAlbum.metadata || {}),
              album_purpose: albumPurpose
            }
          })
          .eq('id', existingAlbum.id)
        
        // Refresh the existing album data
        const { data: updatedAlbum } = await supabase
          .from('photo_albums')
          .select('id, metadata, owner_id')
          .eq('id', existingAlbum.id)
          .single()
        
        if (updatedAlbum) {
          existingAlbum = updatedAlbum
        }
      }
    } else {
      console.log('No existing album found, will create new one')
    }

    let albumId: string

    if (!existingAlbum) {
      // Create new album using the existing working system pattern
      const albumDescription = `${albumName} for ${entityType} ${entityId}`
      
             console.log('Creating new album:', { albumName, albumDescription, entityId, entityType, albumPurpose })
      
             const albumData = {
         name: albumName,
         description: albumDescription,
         owner_id: user.id, // ✅ User owns the album (for RLS compliance)
         entity_id: entityId, // ✅ Album is associated with the book
         entity_type: entityType, // ✅ Album is for book type
         is_public: false,
         metadata: {
           album_purpose: albumPurpose,
           created_via: 'entity_image_api',
           total_images: 0,
           total_size: 0,
           last_modified: new Date().toISOString(),
           entity_type: entityType,
           entity_id: entityId,
           created_by: user.id
         }
       }
      
      console.log('Album data to insert:', albumData)
      
      const { data: newAlbum, error: createAlbumError } = await supabase
        .from('photo_albums')
        .insert(albumData)
        .select('id')
        .single()

      if (createAlbumError) {
        console.error('Error creating album:', createAlbumError)
        console.error('Album creation data:', {
          name: albumName,
          description: albumDescription,
          owner_id: user.id,
          entity_id: entityId,
          entity_type: entityType,
          is_public: false,
          metadata: {
            album_purpose: albumPurpose,
            created_via: 'entity_image_api',
            total_images: 0,
            total_size: 0,
            last_modified: new Date().toISOString(),
            entity_type: entityType,
            entity_id: entityId,
            created_by: user.id
          }
        })
        return NextResponse.json({
          success: false,
          error: `Failed to create album: ${createAlbumError.message}`
        }, { status: 500 })
      }

      albumId = newAlbum.id
    } else {
      albumId = existingAlbum.id
    }

    // If this image should be the cover, first unset any existing cover images
    if (isCover) {
      console.log(`Setting image ${finalImageId} as cover - unsetting previous cover images`)
      await supabase
        .from('album_images')
        .update({ is_cover: false })
        .eq('album_id', albumId)
        .eq('is_cover', true)
    }

    // Add image to album
    const { error: addImageError } = await supabase
      .from('album_images')
      .insert({
        album_id: albumId,
        image_id: finalImageId,
        display_order: displayOrder || 1,
        is_cover: isCover,
        is_featured: isFeatured,
        metadata: {
          album_purpose: albumPurpose,
          entity_type: entityType,
          entity_id: entityId,
          added_via: 'entity_image_api'
        }
      })

    if (addImageError) {
      console.error('Error adding image to album:', addImageError)
      console.error('Image addition data:', {
        album_id: albumId,
        image_id: finalImageId,
        display_order: displayOrder || 1,
        is_cover: isCover,
        is_featured: isFeatured,
        metadata: {
          album_purpose: albumPurpose,
          entity_type: entityType,
          entity_id: entityId,
          added_via: 'entity_image_api'
        }
      })
      return NextResponse.json({
        success: false,
        error: `Failed to add image to entity album: ${addImageError.message}`
      }, { status: 500 })
    }

    // Update album metadata to reflect new image (preserve existing metadata)
    await supabase
      .from('photo_albums')
      .update({
        metadata: {
          ...(existingAlbum?.metadata || {}), // Preserve existing metadata including album_purpose
          total_images: (existingAlbum?.metadata?.total_images || 0) + 1,
          last_modified: new Date().toISOString()
        }
      })
      .eq('id', albumId)

    // Entity images are stored in albums and should NOT update book cover images
    // Book cover images remain completely separate and unchanged

    return NextResponse.json({
      success: true,
      albumId: albumId,
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
      albumPurpose,
      imageId,
      altText,
      caption,
      displayOrder,
      isCover,
      isFeatured,
      metadata
    } = body

    if (!entityId || !entityType || !albumPurpose || !imageId) {
      return NextResponse.json({
        success: false,
        error: 'entityId, entityType, albumPurpose, and imageId are required'
      }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get album ID
    const { data: album } = await supabase
      .from('photo_albums')
      .select('id, metadata')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .contains('metadata', { album_purpose: albumPurpose })
      .single()

    if (!album) {
      return NextResponse.json({
        success: false,
        error: 'Album not found'
      }, { status: 404 })
    }

    // Update image record
    if (altText || caption || metadata) {
      const { error: imageUpdateError } = await supabase
        .from('images')
        .update({
          alt_text: altText,
          caption: caption,
          metadata: metadata ? { ...metadata, updated_via: 'entity_image_api' } : undefined
        })
        .eq('id', imageId)

      if (imageUpdateError) {
        console.error('Error updating image:', imageUpdateError)
        return NextResponse.json({
          success: false,
          error: 'Failed to update image'
        }, { status: 500 })
      }
    }

    // If setting this image as cover, first unset any existing cover images
    if (isCover === true) {
      console.log(`Setting image ${imageId} as cover - unsetting previous cover images`)
      await supabase
        .from('album_images')
        .update({ is_cover: false })
        .eq('album_id', album.id)
        .eq('is_cover', true)
    }

    // Update album image record
    const updateData: any = {}
    if (displayOrder !== undefined) updateData.display_order = displayOrder
    if (isCover !== undefined) updateData.is_cover = isCover
    if (isFeatured !== undefined) updateData.is_featured = isFeatured

    if (Object.keys(updateData).length > 0) {
      const { error: albumImageUpdateError } = await supabase
        .from('album_images')
        .update(updateData)
        .eq('album_id', album.id)
        .eq('image_id', imageId)

      if (albumImageUpdateError) {
        console.error('Error updating album image:', albumImageUpdateError)
        return NextResponse.json({
          success: false,
          error: 'Failed to update album image'
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Entity image updated successfully'
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
    const albumPurpose = searchParams.get('albumPurpose') as AlbumPurpose
    const imageId = searchParams.get('imageId')

    if (!entityId || !entityType || !albumPurpose || !imageId) {
      return NextResponse.json({
        success: false,
        error: 'entityId, entityType, albumPurpose, and imageId are required'
      }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get album ID
    const { data: album } = await supabase
      .from('photo_albums')
      .select('id, metadata')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .contains('metadata', { album_purpose: albumPurpose })
      .single()

    if (!album) {
      return NextResponse.json({
        success: false,
        error: 'Album not found'
      }, { status: 404 })
    }

    // Remove image from album
    const { error: removeError } = await supabase
      .from('album_images')
      .delete()
      .eq('album_id', album.id)
      .eq('image_id', imageId)

    if (removeError) {
      console.error('Error removing image from album:', removeError)
      return NextResponse.json({
        success: false,
        error: 'Failed to remove image from album'
      }, { status: 500 })
    }

    // Update album metadata
    await supabase
      .from('photo_albums')
      .update({
        metadata: {
          total_images: (album.metadata?.total_images || 1) - 1,
          last_modified: new Date().toISOString()
        }
      })
      .eq('id', album.id)

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

 