import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isUserAdmin, isUserSuperAdmin } from '@/lib/auth-utils'
import { shouldRejectUrl } from '@/lib/utils/image-url-validation'

/**
 * Admin endpoint to identify and report images with blob/data URLs
 * This helps identify problematic records in the database
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createRouteHandlerClientAsync()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin or super admin
    const isAdmin = await isUserAdmin(user.id)
    const isSuperAdmin = await isUserSuperAdmin(user.id)
    
    if (!isAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Query for images with invalid URLs
    const { data: allImages, error: queryError } = await supabaseAdmin
      .from('images')
      .select('id, url, created_at, storage_provider, original_filename')
      .order('created_at', { ascending: false })
      .limit(1000) // Limit to recent 1000 images for performance

    if (queryError) {
      console.error('Error querying images:', queryError)
      return NextResponse.json(
        { error: 'Failed to query images' },
        { status: 500 }
      )
    }

    // Filter images with blob/data URLs
    const invalidImages = (allImages || []).filter((img: any) => 
      shouldRejectUrl(img.url)
    )

    // Get count of all invalid images (may be more than 1000)
    const { count: totalInvalidCount } = await supabaseAdmin
      .from('images')
      .select('*', { count: 'exact', head: true })
      .or(`url.ilike.blob:%,url.ilike.data:%,url.ilike.file://%,url.ilike.C:\\%`)

    return NextResponse.json({
      success: true,
      totalInvalidCount: totalInvalidCount || 0,
      invalidImagesFound: invalidImages.length,
      invalidImages: invalidImages.map((img: any) => ({
        id: img.id,
        url: img.url?.substring(0, 100), // Truncate for security
        created_at: img.created_at,
        storage_provider: img.storage_provider,
        original_filename: img.original_filename
      })),
      message: invalidImages.length > 0 
        ? `Found ${invalidImages.length} images with invalid URLs (blob/data URLs)`
        : 'No invalid URLs found in recent images'
    })

  } catch (error: any) {
    console.error('Error in fix-blob-urls endpoint:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Admin endpoint to delete images with blob/data URLs
 * WARNING: This permanently deletes images with invalid URLs
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createRouteHandlerClientAsync()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is super admin (only super admin can delete)
    const isSuperAdmin = await isUserSuperAdmin(user.id)
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Super admin access required' },
        { status: 403 }
      )
    }

    // Find all images with invalid URLs
    const { data: invalidImages, error: queryError } = await supabaseAdmin
      .from('images')
      .select('id, url')
      .or(`url.ilike.blob:%,url.ilike.data:%,url.ilike.file://%,url.ilike.C:\\%`)

    if (queryError) {
      console.error('Error querying invalid images:', queryError)
      return NextResponse.json(
        { error: 'Failed to query invalid images' },
        { status: 500 }
      )
    }

    if (!invalidImages || invalidImages.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: 'No invalid URLs found to delete'
      })
    }

    const imageIds = (invalidImages as any[]).map((img: any) => img.id)

    // Delete album_images records first (foreign key constraint)
    const { error: albumImagesError } = await supabaseAdmin
      .from('album_images')
      .delete()
      .in('image_id', imageIds)

    if (albumImagesError) {
      console.error('Error deleting album_images:', albumImagesError)
      // Continue anyway
    }

    // Delete entity_images records
    const { error: entityImagesError } = await supabaseAdmin
      .from('entity_images')
      .delete()
      .in('image_id', imageIds)

    if (entityImagesError) {
      console.error('Error deleting entity_images:', entityImagesError)
      // Continue anyway
    }

    // Delete the images themselves
    const { error: deleteError } = await supabaseAdmin
      .from('images')
      .delete()
      .in('id', imageIds)

    if (deleteError) {
      console.error('Error deleting images:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete images' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deletedCount: imageIds.length,
      message: `Successfully deleted ${imageIds.length} images with invalid URLs`
    })

  } catch (error: any) {
    console.error('Error in fix-blob-urls DELETE endpoint:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

