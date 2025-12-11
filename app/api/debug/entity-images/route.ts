import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get('entityId')
    const entityType = searchParams.get('entityType')

    if (!entityId || !entityType) {
      return NextResponse.json({
        error: 'entityId and entityType are required'
      }, { status: 400 })
    }

    const supabase = await createRouteHandlerClientAsync()

    // 1. Query ALL photo_albums for this entity (try multiple ways)
    const { data: allAlbums, error: albumsError } = await supabase
      .from('photo_albums')
      .select('*')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)

    // Also check albums with just entity_id (no type filter)
    const { data: albumsByEntityId, error: albumsByIdError } = await supabase
      .from('photo_albums')
      .select('*')
      .eq('entity_id', entityId)

    // Check albums with "Header" in name for this entity
    const { data: headerAlbums, error: headerAlbumsError } = await supabase
      .from('photo_albums')
      .select('*')
      .eq('entity_id', entityId)
      .ilike('name', '%Header%')

    // 2. Query ALL album_images for those albums
    let allAlbumImages: any[] = []
    if (allAlbums && allAlbums.length > 0) {
      const albumIds = allAlbums.map(a => a.id)
      const { data: albumImagesData, error: albumImagesError } = await supabase
        .from('album_images')
        .select('*')
        .in('album_id', albumIds)
      
      if (!albumImagesError && albumImagesData) {
        allAlbumImages = albumImagesData
      }
    }

    // 3. Query ALL images that might be related (check metadata - multiple ways)
    const { data: imagesByMetadata, error: imagesError } = await supabase
      .from('images')
      .select('*')
      .or(`metadata->>entity_id.eq.${entityId},metadata->>entityId.eq.${entityId},metadata->>entity_id.eq.${entityId}`)

    // Also check images table for ANY images with book-related metadata
    let allImagesWithMetadata: any[] = []
    let potentialBookImages: any[] = []
    let allImagesError: any = null
    try {
      // Query recent images (last 1000) to check metadata
      const { data: allImagesData, error: allImagesErr } = await supabase
        .from('images')
        .select('id, url, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(1000)

      allImagesError = allImagesErr

      if (!allImagesErr && allImagesData) {
        allImagesWithMetadata = allImagesData
        
        // Filter images that might belong to this book
        potentialBookImages = allImagesData.filter((img: any) => {
          try {
            const meta = img.metadata || {}
            if (typeof meta === 'object' && meta !== null) {
              return meta.entity_id === entityId || 
                     meta.entityId === entityId ||
                     meta.entity_type === entityType ||
                     (meta.album_purpose === 'entity_header' && meta.entity_id === entityId)
            }
            return false
          } catch {
            return false
          }
        })
      }
    } catch (e) {
      allImagesError = e
    }

    // 4. Query images by album_images image_ids
    const imageIds = allAlbumImages.map(ai => ai.image_id).filter(Boolean)
    let imagesByAlbumImages: any[] = []
    if (imageIds.length > 0) {
      const { data: imagesData, error: imagesDataError } = await supabase
        .from('images')
        .select('*')
        .in('id', imageIds)
      
      if (!imagesDataError && imagesData) {
        imagesByAlbumImages = imagesData
      }
    }

    // 5. Check for "Header Cover Images" album specifically
    const headerAlbum = allAlbums?.find(a => a.name === 'Header Cover Images' || a.name?.includes('Header')) || headerAlbums?.[0]
    
    let headerAlbumImages: any[] = []
    let headerAlbumImageRecords: any[] = []
    if (headerAlbum) {
      const { data: headerAlbumImagesData, error: headerError } = await supabase
        .from('album_images')
        .select('*')
        .eq('album_id', headerAlbum.id)
      
      if (!headerError && headerAlbumImagesData) {
        headerAlbumImageRecords = headerAlbumImagesData
        
        const headerImageIds = headerAlbumImagesData.map(ai => ai.image_id).filter(Boolean)
        if (headerImageIds.length > 0) {
          const { data: headerImagesData, error: headerImagesError } = await supabase
            .from('images')
            .select('*')
            .in('id', headerImageIds)
          
          if (!headerImagesError && headerImagesData) {
            headerAlbumImages = headerImagesData
          }
        }
      }
    }

    // 6. Check books table for header_image_id
    let bookHeaderImage: any = null
    if (entityType === 'book') {
      try {
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('id, title, header_image_id, cover_image_id')
          .eq('id', entityId)
          .maybeSingle()
        
        if (!bookError && bookData) {
          bookHeaderImage = bookData
        }
      } catch (e) {
        // Ignore errors
      }
    }

    // 7. Check entity_images table if it exists
    let entityImages: any[] = []
    try {
      const { data: entityImagesData, error: entityImagesError } = await supabase
        .from('entity_images')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
      
      if (!entityImagesError && entityImagesData) {
        entityImages = entityImagesData
      }
    } catch (e) {
      // Table might not exist, ignore
    }

    return NextResponse.json({
      entityId,
      entityType,
      summary: {
        totalAlbums: allAlbums?.length || 0,
        totalAlbumsByEntityId: albumsByEntityId?.length || 0,
        totalHeaderAlbums: headerAlbums?.length || 0,
        totalAlbumImages: allAlbumImages.length,
        totalImagesByMetadata: imagesByMetadata?.length || 0,
        totalPotentialBookImages: potentialBookImages.length,
        totalImagesByAlbumImages: imagesByAlbumImages.length,
        headerAlbumExists: !!headerAlbum,
        headerAlbumId: headerAlbum?.id,
        headerAlbumName: headerAlbum?.name,
        headerAlbumImagesCount: headerAlbumImages.length,
        totalImagesInTable: allImagesWithMetadata?.length || 0
      },
      albums: allAlbums || [],
      albumsByEntityId: albumsByEntityId || [],
      headerAlbums: headerAlbums || [],
      albumImages: allAlbumImages,
      imagesByMetadata: imagesByMetadata || [],
      potentialBookImages: potentialBookImages,
      imagesByAlbumImages: imagesByAlbumImages,
      headerAlbum: headerAlbum || null,
      headerAlbumImageRecords: headerAlbumImageRecords,
      headerAlbumImages: headerAlbumImages,
      bookHeaderImage: bookHeaderImage,
      entityImages: entityImages,
      errors: {
        albumsError: albumsError?.message,
        albumsByIdError: albumsByIdError?.message,
        headerAlbumsError: headerAlbumsError?.message,
        imagesError: imagesError?.message,
        allImagesError: allImagesError?.message
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

