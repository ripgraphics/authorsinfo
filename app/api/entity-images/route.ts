import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

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
    
    
    const { searchParams } = new URL(request.url)
    const albumId = searchParams.get('albumId')  // ✅ If albumId is provided, use it directly
    let entityId = searchParams.get('entityId')
    const entityType = searchParams.get('entityType') as EntityType
    const albumPurpose = searchParams.get('albumPurpose') as AlbumPurpose

    const supabase = await createRouteHandlerClientAsync()

    // If albumId is provided, just get that album - no need for entity_id/entity_type
    if (albumId) {
      const { data: album, error: albumError } = await supabase
        .from('photo_albums')
        .select(`
          id,
          name,
          description,
          is_public,
          cover_image_id,
          created_at,
          updated_at,
          metadata,
          entity_id,
          entity_type
        `)
        .eq('id', albumId)
        .single()

      if (albumError || !album) {
        return NextResponse.json({
          success: false,
          error: 'Album not found'
        }, { status: 404 })
      }

      // Use the album's entity_id and entity_type if not provided
      const albumData = album as { entity_id?: string; entity_type?: string }
      if (!entityId) entityId = albumData.entity_id || null
      if (!entityType && albumData.entity_type) {
        const albums = [album]
        // Continue to get images for this album
        const albumsWithImages = await Promise.all(
          albums.map(async (alb) => {
            const albumWithId = alb as { id: string; [key: string]: any }
            // Get images for this album
            const { data: albumImages } = await supabase
              .from('album_images')
              .select(`
                id,
                image_id,
                entity_id,
                display_order,
                is_cover,
                is_featured,
                created_at,
                metadata
              `)
              .eq('album_id', albumWithId.id)
              .order('display_order', { ascending: true })

            if (!albumImages || albumImages.length === 0) {
              return { ...(alb as Record<string, any>), images: [] }
            }

            const imageIds = (albumImages as Array<{ image_id: string | null }>).map(ai => ai.image_id).filter(Boolean)
            const { data: allImages } = await supabase
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
              .in('id', imageIds)

            const imageMap = new Map((allImages || []).map((img: { id: string; [key: string]: any }) => [img.id, img]))
            const imagesWithDetails = (albumImages as Array<{ image_id: string | null; [key: string]: any }>).map((albumImage) => {
              const imageDetails = albumImage.image_id ? imageMap.get(albumImage.image_id) : null
              if (!imageDetails) {
                return { ...albumImage, image: null }
              }
              return {
                ...albumImage,
                image: imageDetails,
                alt_text: imageDetails.alt_text,
                description: imageDetails.description || imageDetails.caption
              }
            }).filter(item => item.image !== null)

            return { ...(alb as Record<string, any>), images: imagesWithDetails }
          })
        )

        return NextResponse.json({
          success: true,
          albums: albumsWithImages
        })
      }
    }

    // If no albumId, fall back to entity-based query
    if (!entityId || !entityType) {
      return NextResponse.json({
        success: false,
        error: 'Either albumId or (entityId and entityType) are required'
      }, { status: 400 })
    }

    // Resolve permalink to UUID if necessary
    if (entityId && entityType) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(entityId)) {
        const table = entityType === 'user' ? 'users' : entityType + 's'
        const { data: resolved } = await supabase
          .from(table)
          .select('id, permalink')
          .or(`id.eq.${entityId},permalink.eq.${entityId}`)
          .maybeSingle()

        const resolvedData = resolved as { id?: string } | null
        if (resolvedData?.id) {
          entityId = resolvedData.id
        }
      }
    }

    // Build query to find albums - SIMPLIFIED: just by entity_id, no entity_type filter
    try {
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
          metadata,
          entity_id,
          entity_type
        `)
        .eq('entity_id', entityId)  // Only filter by entity_id

      // If albumPurpose is specified, find by name (exact match required)
      if (albumPurpose) {
        const albumNameMap: Record<AlbumPurpose, string> = {
          cover: 'Cover Images',
          avatar: 'Avatar Images',
          entity_header: 'Header Cover Images',
          gallery: 'Gallery Images',
          posts: 'Post Images'
        }
        const expectedAlbumName = albumNameMap[albumPurpose]
        console.log(`🔍 Querying albums for: entityId=${entityId}, entityType=${entityType}, albumPurpose=${albumPurpose}, expectedName="${expectedAlbumName}"`)
        query = query.eq('name', expectedAlbumName)
      } else {
        console.log(`🔍 Querying albums for: entityId=${entityId}, entityType=${entityType}, albumPurpose=ALL`)
      }
      
      // If no album found and albumPurpose is specified, return empty - don't show wrong album

      const { data: albums, error } = await query
      
      console.log(`🔍 Album query result: ${albums?.length || 0} albums found`, {
        entityId,
        entityType,
        albumPurpose,
        albumNames: (albums || []).map((a: { name?: string }) => a.name || '') || [],
        error: error?.message
      })

    

    if (error) {
      console.error('Error fetching entity albums:', error)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch entity albums: ${error.message}`
      }, { status: 500 })
    }

    // Get images for each album with full image details
    // Also query album_images directly by entity_id to catch any orphaned records
    
    const albumsWithImages = await Promise.all(
      (albums || []).map(async (album: { id?: string; name?: string; entity_type?: string; [key: string]: any }) => {
        try {
          console.log(`🖼️ Fetching album_images for album ${album.id} (${album.name})...`)
          
          // If album.entity_type is missing, try to extract from images.storage_path
          let actualEntityType = album.entity_type || entityType;
          if (!actualEntityType) {
            // Get a sample image to extract entity_type from storage_path
            const { data: sampleImage } = await supabase
              .from('album_images')
              .select('images(storage_path)')
              .eq('album_id', album.id!)
              .limit(1)
              .single();
            
            const sampleImageData = sampleImage as { images?: { storage_path?: string } } | null
            if (sampleImageData?.images?.storage_path) {
              const path = sampleImageData.images.storage_path.toLowerCase();
              if (path.includes('book_')) actualEntityType = 'book';
              else if (path.includes('author_')) actualEntityType = 'author';
              else if (path.includes('publisher_')) actualEntityType = 'publisher';
              else if (path.includes('event_')) actualEntityType = 'event';
              else if (path.includes('user_') || path.includes('user_photos') || path.includes('user_album')) actualEntityType = 'user';
            }
          }
          
          // Query album_images by album_id only - we don't need entity_id filter
          // The album already belongs to the entity, so all images in the album should be shown
          const { data: albumImages, error: albumImagesError } = await supabase
            .from('album_images')
            .select(`
              id,
              image_id,
              entity_id,
              display_order,
              is_cover,
              is_featured,
              created_at,
              metadata
            `)
            .eq('album_id', album.id!)  // Only filter by album_id - that's all we need
            .order('display_order', { ascending: true })
          
          console.log(`🖼️ Found ${albumImages?.length || 0} album_images for album ${album.id}`)
          
          if (!albumImages || albumImages.length === 0) {
            console.log(`⚠️ No album_images found for album ${album.id}, returning empty images array`)
            return {
              ...album,
              images: []
            }
          }

          if (albumImagesError) {
            console.error(`❌ Error fetching images for album ${album.id}:`, albumImagesError)
            return {
              ...album,
              images: []
            }
          }

          
          if (albumImages && albumImages.length > 0) {
            
            
            // 🔧 ONE-TIME FIX: Clean up cover flags - only one image per album should be cover
            const coverImages = (albumImages as Array<{ is_cover?: boolean; [key: string]: any }>).filter(ai => ai.is_cover === true)
            if (coverImages.length > 1) {
              
              
              // Set all to false first
              await (supabase
                .from('album_images') as any)
                .update({ is_cover: false })
                .eq('album_id', album.id!)
              
              // Set only the most recent one to true
              const mostRecentImage = (albumImages as Array<{ created_at?: string; id?: string; [key: string]: any }>).sort((a, b) => 
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
              )[0]
              
              if (mostRecentImage) {
                
                await (supabase
                  .from('album_images') as any)
                  .update({ is_cover: true })
                  .eq('id', mostRecentImage.id)
                
                // Update the local data for this request
                (albumImages as Array<{ is_cover?: boolean; id?: string; [key: string]: any }>).forEach((ai: { is_cover?: boolean; id?: string; [key: string]: any }) => {
                  ai.is_cover = ai.id === mostRecentImage.id
                })
              }
            }
          }

          // Get all images from images table in one query (more efficient)
          const imageIds = (albumImages as Array<{ image_id?: string | null; [key: string]: any }>).map(ai => ai.image_id).filter(Boolean)
          
          if (imageIds.length === 0) {
            console.log(`⚠️ No image_ids found in album_images for album ${album.id}`)
            return {
              ...album,
              images: []
            }
          }
          
          console.log(`🖼️ Fetching ${imageIds.length} images from images table...`)
          const { data: allImages, error: imagesError } = await supabase
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
            .in('id', imageIds)
          
          if (imagesError) {
            console.error(`❌ Error fetching images:`, imagesError)
            return {
              ...album,
              images: []
            }
          }
          
          // Create a map of image_id -> image for quick lookup
          const imageMap = new Map((allImages || []).map((img: { id: string; [key: string]: any }) => [img.id, img]))
          
          // Match album_images with their images
          const imagesWithDetails = (albumImages as Array<{ image_id?: string | null; [key: string]: any }>).map((albumImage) => {
            const imageDetails = albumImage.image_id ? imageMap.get(albumImage.image_id) : null
            
            if (!imageDetails) {
              console.warn(`⚠️ Image ${albumImage.image_id} not found in images table`)
              return {
                ...albumImage,
                image: null,
                error: 'Image not found in images table'
              }
            }
            
            // Log if it's a blob URL for debugging
            if (imageDetails.url && (imageDetails.url.startsWith('blob:') || imageDetails.url.startsWith('data:'))) {
              console.warn(`⚠️ Image ${albumImage.image_id} has invalid URL (blob/data): ${imageDetails.url.substring(0, 50)}...`)
            }
            
            return {
              ...albumImage,
              image: imageDetails,
              alt_text: imageDetails.alt_text,
              description: imageDetails.description || imageDetails.caption
            }
          })
          
          const validImages = imagesWithDetails.filter(item => item.image !== null)
          const invalidImages = imagesWithDetails.filter(item => item.image === null)
          console.log(`🖼️ Album ${album.id} (${album.name}): ${validImages.length} valid images, ${invalidImages.length} invalid/missing images`)

          // Return only valid images (filter out null image objects)
          return {
            ...album,
            images: validImages || []
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

    
    
    return NextResponse.json({
      success: true,
      albums: albumsWithImages
    })

    } catch (photoAlbumsError) {
      console.log('Photo albums table not available, returning empty result:', photoAlbumsError)
      return NextResponse.json({
        success: true,
        albums: []
      })
    }

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

    console.log(`📥 Album addition request:`, { entityId, entityType, albumPurpose, imageId, isCover, isFeatured })

    if (!entityId || !entityType || !albumPurpose) {
      console.error('❌ Missing required parameters:', { entityId, entityType, albumPurpose })
      return NextResponse.json({
        success: false,
        error: 'entityId, entityType, and albumPurpose are required'
      }, { status: 400 })
    }

    const supabase = await createRouteHandlerClientAsync()
 
     // Get the current authenticated user ID early (needed for album search)
     const { data: { user }, error: userError } = await supabase.auth.getUser()
     
     if (userError || !user) {
       console.error('❌ Error getting authenticated user:', userError)
       return NextResponse.json({
         success: false,
         error: 'Authentication required to create albums'
       }, { status: 401 })
     }
     
     console.log(`✅ Authenticated user: ${user.id}`)
 
     let finalImageId = imageId

    // If imageUrl is provided but no imageId, create image record first
    if (imageUrl && !imageId) {
      console.log(`💾 Creating image record from URL: ${imageUrl}`)
      const { data: imageData, error: imageError } = await supabase
        .from('images')
        .insert({
          url: imageUrl,
          alt_text: altText,
          ...(caption && { caption: caption }),
          metadata: {
            // Only file metadata - NO entity info
            ...(metadata?.file_size && { file_size: metadata.file_size }),
            ...(metadata?.mime_type && { mime_type: metadata.mime_type }),
            ...(metadata?.original_filename && { original_filename: metadata.original_filename }),
            uploaded_via: 'entity_image_api'
          }
        } as any)
        .select('id')
        .single()

      if (imageError) {
        console.error('❌ Error creating image record:', imageError)
        console.error('   Entity:', { entityId, entityType, albumPurpose })
        console.error('   Image URL:', imageUrl)
        return NextResponse.json({
          success: false,
          error: 'Failed to create image record'
        }, { status: 500 })
      }

      finalImageId = (imageData as any)?.id
      console.log(`✅ Image record created: ${finalImageId}`)
    }

    if (!finalImageId) {
      console.error('❌ No imageId provided and imageUrl creation failed')
      return NextResponse.json({
        success: false,
        error: 'Either imageId or imageUrl must be provided'
      }, { status: 400 })
    }

    // VERIFY: Ensure the image actually exists in the database
    console.log(`🔍 Verifying image exists in database: ${finalImageId}`)
    const { data: verifyImage, error: verifyError } = await supabase
      .from('images')
      .select('id, url')
      .eq('id', finalImageId)
      .single()

    if (verifyError || !verifyImage) {
      console.error('❌ Image verification failed:', verifyError)
      console.error('   Image ID:', finalImageId)
      console.error('   Entity:', { entityId, entityType, albumPurpose })
      return NextResponse.json({
        success: false,
        error: `Image ${finalImageId} not found in database. Image must be saved to database before adding to album.`
      }, { status: 404 })
    }

    console.log(`✅ Image verified in database: ${(verifyImage as any)?.id}, URL: ${(verifyImage as any)?.url}`)

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
    console.log(`🔍 Looking for existing album: "${albumName}" for ${entityType} ${entityId}`)
    
    let { data: existingAlbum, error: searchError } = await supabase
      .from('photo_albums')
      .select('id, metadata, owner_id, entity_id, entity_type')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .eq('owner_id', user.id) // ✅ Ensure album is owned by the authenticated user
      .eq('name', albumName)
      .single()
    
    if (searchError && searchError.code !== 'PGRST116') {
      console.error('❌ Error searching for album by name:', searchError)
      console.error('   Search params:', { entityId, entityType, albumName, owner_id: user.id })
    }
    
    // If not found by name, we'll create it - no metadata fallback needed
    
    if (existingAlbum) {
      const album = existingAlbum as any
      console.log(`✅ Found existing album: ${album.id}`, { 
        owner_id: album.owner_id,
        entity_id: album.entity_id,
        entity_type: album.entity_type
      })
    } else {
      console.log(`📁 No existing album found, will create new album: "${albumName}"`)
    }

    let albumId: string

    if (!existingAlbum) {
      // Create new album using the existing working system pattern
      const albumDescription = `${albumName} for ${entityType} ${entityId}`
      
      console.log(`📁 Creating new album:`, { albumName, albumDescription, entityId, entityType, albumPurpose, owner_id: user.id })
      
      const albumData = {
        name: albumName,
        description: albumDescription,
        owner_id: user.id, // ✅ User owns the album (for RLS compliance)
        entity_id: entityId, // ✅ Album is associated with the entity
        entity_type: entityType, // ✅ Album is for entity type
        is_public: false,
        metadata: {
          album_purpose: albumPurpose,  // Keep this in metadata if no column exists
          created_via: 'entity_image_api',
          total_images: 0,
          total_size: 0,
          last_modified: new Date().toISOString(),
          created_by: user.id
          // NO entity_type or entity_id - those are in columns!
        }
      }
      
      const { data: newAlbum, error: createAlbumError } = await supabase
        .from('photo_albums')
        .insert(albumData as any)
        .select('id, name, entity_id, entity_type')
        .single()

      if (createAlbumError) {
        console.error('❌ Error creating album:', createAlbumError)
        console.error('   Album data:', albumData)
        console.error('   Entity:', { entityId, entityType, albumPurpose })
        return NextResponse.json({
          success: false,
          error: `Failed to create album: ${createAlbumError.message}`
        }, { status: 500 })
      }

      albumId = (newAlbum as any).id
      console.log(`✅ Album created: ${albumId}`, { name: (newAlbum as any).name, entity_id: (newAlbum as any).entity_id, entity_type: (newAlbum as any).entity_type })
    } else {
      albumId = (existingAlbum as any).id
      console.log(`✅ Using existing album: ${albumId}`)
    }

    // If this image should be the cover, first unset any existing cover images
    if (isCover) {
      console.log(`Setting image ${finalImageId} as cover - unsetting previous cover images`)
      await (supabase
        .from('album_images') as any)
        .update({ is_cover: false })
        .eq('album_id', albumId)
        .eq('is_cover', true)
    }

    // Get entity_type_id for album_images
    console.log(`🔍 Looking up entity_type_id for: ${entityType}`)
    const { data: entityTypeData, error: entityTypeError } = await supabase
      .from('entity_types')
      .select('id')
      .ilike('name', `${entityType}%`)
      .limit(1)
      .single()

    let entityTypeId: string | null = null
    if (!entityTypeError && entityTypeData) {
      entityTypeId = (entityTypeData as any)?.id
      console.log(`✅ Found entity_type_id: ${entityTypeId} for ${entityType}`)
    } else {
      console.warn(`⚠️ Could not find entity_type_id for ${entityType}, will insert without it`)
    }

    // Add image to album - USE ACTUAL COLUMNS, NOT METADATA
    console.log(`📎 Adding image ${finalImageId} to album ${albumId}`)
    const albumImageData = {
      album_id: albumId,
      image_id: finalImageId,
      entity_id: entityId,  // ✅ Use actual column
      entity_type_id: entityTypeId, // ✅ Use actual column
      display_order: displayOrder || 1,
      is_cover: isCover,
      is_featured: isFeatured,
      metadata: {
        // Only file metadata - NO entity info
        added_via: 'entity_image_api',
        ...(metadata?.file_size && { file_size: metadata.file_size }),
        ...(metadata?.mime_type && { mime_type: metadata.mime_type }),
        ...(metadata?.original_filename && { original_filename: metadata.original_filename }),
        ...(metadata?.aspect_ratio && { aspect_ratio: metadata.aspect_ratio })
      }
    }

    const { data: addedImage, error: addImageError } = await supabase
      .from('album_images')
      .insert(albumImageData as any)
      .select('id, album_id, image_id, entity_id')
      .single()

    if (addImageError) {
      console.error('❌ Error adding image to album:', addImageError)
      console.error('   Album image data:', albumImageData)
      console.error('   Entity:', { entityId, entityType, albumPurpose })
      console.error('   Album ID:', albumId)
      console.error('   Image ID:', finalImageId)
      return NextResponse.json({
        success: false,
        error: `Failed to add image to entity album: ${addImageError.message}`
      }, { status: 500 })
    }

    const addedImg = addedImage as any
    console.log(`✅ Image added to album:`, { 
      album_image_id: addedImg?.id, 
      album_id: addedImg?.album_id, 
      image_id: addedImg?.image_id,
      entity_id: addedImg?.entity_id
    })

    // Update album metadata to reflect new image (preserve existing metadata)
    console.log(`📊 Updating album metadata for album ${albumId}`)
    const { error: updateMetadataError } = await (supabase
      .from('photo_albums') as any)
      .update({
        metadata: {
          ...((existingAlbum as any)?.metadata || {}), // Preserve existing metadata including album_purpose
          total_images: ((existingAlbum as any)?.metadata?.total_images || 0) + 1,
          last_modified: new Date().toISOString()
        }
      })
      .eq('id', albumId)

    if (updateMetadataError) {
      console.warn('⚠️ Failed to update album metadata (non-critical):', updateMetadataError)
      // Don't fail - the image is already in the album
    } else {
      console.log(`✅ Album metadata updated for album ${albumId}`)
    }

    // Entity images are stored in albums and should NOT update book cover images
    // Book cover images remain completely separate and unchanged

    // Update publisher_image_id when adding avatar images for publishers
    if (entityType === 'publisher' && albumPurpose === 'avatar' && (isCover || isFeatured)) {
      console.log(`🔄 Updating publisher_image_id for publisher ${entityId} with image ${finalImageId}`)
      const { error: publisherUpdateError } = await (supabase
        .from('publishers') as any)
        .update({ publisher_image_id: finalImageId })
        .eq('id', entityId)

      if (publisherUpdateError) {
        console.error('❌ Error updating publisher_image_id:', publisherUpdateError)
        // Don't fail the request - the image is already in the album
      } else {
        console.log(`✅ publisher_image_id updated for publisher ${entityId}`)
      }
    }

    console.log(`✅ Album addition complete: Image ${finalImageId} added to album ${albumId}`)
    return NextResponse.json({
      success: true,
      albumId: albumId,
      imageId: finalImageId,
      message: 'Image added to entity album successfully'
    })

  } catch (error) {
    console.error('❌ Unexpected error in POST /api/entity-images:', error)
    console.error('   Stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
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

    const supabase = await createRouteHandlerClientAsync()

    // Get album ID
    const { data: album } = await supabase
      .from('photo_albums')
      .select('id, metadata')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .contains('metadata', { album_purpose: albumPurpose })
      .single()

    const albumData = album as any
    if (!albumData || !albumData.id) {
      return NextResponse.json({
        success: false,
        error: 'Album not found'
      }, { status: 404 })
    }

    const albumId = albumData.id

    // Update image record
    if (altText || caption || metadata) {
      const { error: imageUpdateError } = await (supabase
        .from('images') as any)
        .update({
          alt_text: altText,
          ...(caption && { caption: caption }),
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
      await (supabase
        .from('album_images') as any)
        .update({ is_cover: false })
        .eq('album_id', albumId)
        .eq('is_cover', true)
    }

    // Update album image record
    const updateData: any = {}
    if (displayOrder !== undefined) updateData.display_order = displayOrder
    if (isCover !== undefined) updateData.is_cover = isCover
    if (isFeatured !== undefined) updateData.is_featured = isFeatured

    if (Object.keys(updateData).length > 0) {
      const { error: albumImageUpdateError } = await (supabase
        .from('album_images') as any)
        .update(updateData)
        .eq('album_id', albumId)
        .eq('image_id', imageId)

      if (albumImageUpdateError) {
        console.error('Error updating album image:', albumImageUpdateError)
        return NextResponse.json({
          success: false,
          error: 'Failed to update album image'
        }, { status: 500 })
      }
    }

    // Update publisher_image_id when setting avatar as cover for publishers
    if (entityType === 'publisher' && albumPurpose === 'avatar' && isCover === true) {
      console.log(`🔄 Updating publisher_image_id for publisher ${entityId} with image ${imageId}`)
      const { error: publisherUpdateError } = await (supabase
        .from('publishers') as any)
        .update({ publisher_image_id: imageId })
        .eq('id', entityId)

      if (publisherUpdateError) {
        console.error('❌ Error updating publisher_image_id:', publisherUpdateError)
        // Don't fail the request - the album image is already updated
      } else {
        console.log(`✅ publisher_image_id updated for publisher ${entityId}`)
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

    const supabase = await createRouteHandlerClientAsync()

    // Get album ID
    const { data: album } = await supabase
      .from('photo_albums')
      .select('id, metadata')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .contains('metadata', { album_purpose: albumPurpose })
      .single()

    const albumData2 = album as any
    if (!albumData2 || !albumData2.id) {
      return NextResponse.json({
        success: false,
        error: 'Album not found'
      }, { status: 404 })
    }

    // Remove image from album
    const { error: removeError } = await (supabase
      .from('album_images') as any)
      .delete()
      .eq('album_id', albumData2.id)
      .eq('image_id', imageId)

    if (removeError) {
      console.error('Error removing image from album:', removeError)
      return NextResponse.json({
        success: false,
        error: 'Failed to remove image from album'
      }, { status: 500 })
    }

    // Update album metadata
    await (supabase
      .from('photo_albums') as any)
      .update({
        metadata: {
          total_images: ((album as any).metadata?.total_images || 1) - 1,
          last_modified: new Date().toISOString()
        }
      })
      .eq('id', (album as any).id)

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

 