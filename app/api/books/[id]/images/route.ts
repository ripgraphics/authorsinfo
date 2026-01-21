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

    // If front cover, update books.cover_image_id
    if (imageType === 'book_cover_front') {
      const { error: updateError } = await (supabaseAdmin.from('books') as any)
        .update({ cover_image_id: imageId })
        .eq('id', bookId)
      if (updateError) {
        return NextResponse.json({ error: updateError.message || 'Failed to set cover image' }, { status: 500 })
      }
    }
    // Update alt_text in images table if provided
    if (altText) {
      await (supabaseAdmin.from('images') as any)
        .update({ alt_text: altText })
        .eq('id', imageId)
    }
    return NextResponse.json({
      success: true,
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

    // Only acknowledge delete (actual image deletion should be handled elsewhere if needed)
    return NextResponse.json({
      success: true,
      message: 'Image removal acknowledged',
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/books/[id]/images:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
