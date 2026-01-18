import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isUserAdmin, isUserSuperAdmin } from '@/lib/auth-utils'
import { createActivityWithValidation } from '@/app/actions/create-activity-with-validation'

/**
 * GET /api/books/[id]/images
 * Get all images for a book (front cover, back cover, gallery)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params
    
    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 })
    }

    // Call the database function to get book images
    const { data: images, error } = await supabaseAdmin.rpc('get_book_images', {
      p_book_id: bookId,
      p_image_type: undefined, // Get all types (undefined means optional parameter not provided)
    } as any)

    if (error) {
      console.error('Error fetching book images:', error)
      return NextResponse.json({ error: 'Failed to fetch book images' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      images: images || [],
    })
  } catch (error: any) {
    console.error('Error in GET /api/books/[id]/images:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/books/[id]/images
 * Add an image to a book (front cover, back cover, or gallery)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params
    const body = await request.json()
    const { imageId, imageType, displayOrder, altText } = body

    if (!bookId || !imageId || !imageType) {
      return NextResponse.json(
        { error: 'Book ID, image ID, and image type are required' },
        { status: 400 }
      )
    }

    // Validate image type
    if (!['book_cover_front', 'book_cover_back', 'book_gallery'].includes(imageType)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 })
    }

    // Authenticate user
    const supabase = await createRouteHandlerClientAsync()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions using server-side client
    // First check if user is admin using supabaseAdmin to query profiles table
    let isAdmin = false
    let isSuperAdmin = false
    
    try {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!profileError && profile) {
        const role = (profile as any).role
        isAdmin = role === 'admin'
        isSuperAdmin = role === 'super_admin'
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      // Fall back to client-side check if server-side check fails
      isAdmin = await isUserAdmin(user.id)
      isSuperAdmin = await isUserSuperAdmin(user.id)
    }

    // Check if user can edit the book (creator or admin)
    let canEdit = false
    if (isAdmin || isSuperAdmin) {
      canEdit = true
    } else {
      // Check if user created the book
      try {
        const { data: book, error: bookError } = await supabaseAdmin
          .from('books')
          .select('created_by')
          .eq('id', bookId)
          .single()

        if (!bookError && book && (book as any).created_by === user.id) {
          canEdit = true
        }
      } catch (error) {
        console.error('Error checking book ownership:', error)
      }
    }

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access or book ownership required' },
        { status: 403 }
      )
    }

    let result

    if (imageType === 'book_cover_front' || imageType === 'book_cover_back') {
      // Use set_book_cover_image function
      const { data, error } = await supabaseAdmin.rpc('set_book_cover_image', {
        p_book_id: bookId,
        p_image_id: imageId,
        p_cover_type: imageType,
        p_user_id: user.id,
      } as any)

      if (error) {
        console.error('Error setting book cover image:', error)
        return NextResponse.json({ error: 'Failed to set cover image' }, { status: 500 })
      }

      result = data

      // Create timeline activity for cover image upload (non-blocking)
      try {
        const { data: imageData, error: imageError } = await (supabaseAdmin
          .from('images')
          .select('url, alt_text')
          .eq('id', imageId)
          .single() as any)

        if (imageData && !imageError && (imageData as { url?: string }).url) {
          await createActivityWithValidation({
            user_id: user.id,
            activity_type: 'photo_added',
            content_type: 'image',
            image_url: (imageData as { url: string }).url,
            entity_type: 'book',
            entity_id: bookId,
            metadata: {
              image_type: imageType,
              alt_text: (imageData as { alt_text?: string }).alt_text,
            },
            publish_status: 'published',
            published_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }
      } catch (activityError) {
        console.error('Failed to create photo upload activity:', activityError)
        // Don't throw - image upload was successful
      }
    } else {
      // Use add_book_gallery_image function
      const { data, error } = await supabaseAdmin.rpc('add_book_gallery_image', {
        p_book_id: bookId,
        p_image_id: imageId,
        p_user_id: user.id,
        p_display_order: displayOrder || null,
      } as any)

      if (error) {
        console.error('Error adding gallery image:', error)
        return NextResponse.json({ error: 'Failed to add gallery image' }, { status: 500 })
      }

      result = data

      // Update alt_text if provided
      if (altText) {
        await (supabaseAdmin.from('album_images') as any)
          .update({ alt_text: altText })
          .eq('id', result)
      }

      // Create timeline activity for gallery image upload (non-blocking)
      try {
        const { data: imageData, error: imageError } = await (supabaseAdmin
          .from('images')
          .select('url, alt_text')
          .eq('id', imageId)
          .single() as any)

        if (imageData && !imageError && (imageData as { url?: string }).url) {
          await createActivityWithValidation({
            user_id: user.id,
            activity_type: 'photo_added',
            content_type: 'image',
            image_url: (imageData as { url: string }).url,
            entity_type: 'book',
            entity_id: bookId,
            metadata: {
              image_type: imageType,
              alt_text: (imageData as { alt_text?: string }).alt_text || altText,
            },
            publish_status: 'published',
            published_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }
      } catch (activityError) {
        console.error('Failed to create photo upload activity:', activityError)
        // Don't throw - image upload was successful
      }
    }

    return NextResponse.json({
      success: true,
      albumImageId: result,
      message: 'Image added successfully',
    })
  } catch (error: any) {
    console.error('Error in POST /api/books/[id]/images:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/books/[id]/images
 * Remove an image from a book
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params
    const { searchParams } = new URL(request.url)
    const albumImageId = searchParams.get('albumImageId')

    if (!bookId || !albumImageId) {
      return NextResponse.json(
        { error: 'Book ID and album image ID are required' },
        { status: 400 }
      )
    }

    // Authenticate user
    const supabase = await createRouteHandlerClientAsync()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions using server-side client
    // First check if user is admin using supabaseAdmin to query profiles table
    let isAdmin = false
    let isSuperAdmin = false
    
    try {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!profileError && profile) {
        const role = (profile as any).role
        isAdmin = role === 'admin'
        isSuperAdmin = role === 'super_admin'
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      // Fall back to client-side check if server-side check fails
      isAdmin = await isUserAdmin(user.id)
      isSuperAdmin = await isUserSuperAdmin(user.id)
    }

    // Check if user can edit the book (creator or admin)
    let canEdit = false
    if (isAdmin || isSuperAdmin) {
      canEdit = true
    } else {
      // Check if user created the book
      try {
        const { data: book, error: bookError } = await supabaseAdmin
          .from('books')
          .select('created_by')
          .eq('id', bookId)
          .single()

        if (!bookError && book && (book as any).created_by === user.id) {
          canEdit = true
        }
      } catch (error) {
        console.error('Error checking book ownership:', error)
      }
    }

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access or book ownership required' },
        { status: 403 }
      )
    }

    // Delete the album_image record
    const { error } = await supabaseAdmin
      .from('album_images')
      .delete()
      .eq('id', albumImageId)
      .eq('entity_id', bookId)

    if (error) {
      console.error('Error deleting book image:', error)
      return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Image removed successfully',
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/books/[id]/images:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
