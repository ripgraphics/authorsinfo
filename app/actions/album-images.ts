"use server"

import { supabaseAdmin } from "@/lib/supabase/server"

export async function linkImagesToAlbum(
  imageIds: string[],
  albumId: string,
  entityId: string,
  entityType: string
) {
  try {
    // Get the current highest display order for this album
    const { data: maxOrderData } = await supabaseAdmin
      .from('album_images')
      .select('display_order')
      .eq('album_id', albumId)
      .order('display_order', { ascending: false })
      .limit(1)

    let nextDisplayOrder = 1
    if (maxOrderData && maxOrderData.length > 0) {
      nextDisplayOrder = (maxOrderData[0].display_order || 0) + 1
    }

    // Create album_images records for each uploaded image
    const albumImageRecords = imageIds.map((imageId, index) => ({
      album_id: albumId,
      image_id: imageId,
      display_order: nextDisplayOrder + index,
      is_cover: false,
      is_featured: false,
      entity_id: entityId,
      metadata: {
        upload_context: `${entityType}_album`,
        uploaded_at: new Date().toISOString()
      }
    }))

    const { data, error } = await supabaseAdmin
      .from('album_images')
      .insert(albumImageRecords)
      .select()

    if (error) {
      console.error('Error linking images to album:', error)
      throw new Error(`Failed to link images to album: ${error.message}`)
    }

    return {
      success: true,
      linkedCount: albumImageRecords.length,
      albumImageIds: data.map((record: { id: string }) => record.id)
    }
  } catch (error) {
    console.error('Error in linkImagesToAlbum:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 