import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET: List all events for an author
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: authorId } = await params
    const supabase = await createRouteHandlerClientAsync()
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('author_id', authorId)
      .order('start_date', { ascending: true })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ data: data || [] })
  } catch (error: any) {
    console.error('Error fetching author events:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch author events' }, { status: 500 })
  }
}

// POST: Create a new event for an author
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: authorId } = await params
    const supabase = await createRouteHandlerClientAsync()
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user is the author owner (created_by) or is admin
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('created_by')
      .eq('id', authorId)
      .single()

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 })
    }

    // Check if user created the author or is admin
    const isAuthorOwner = author.created_by === user.id
    if (!isAuthorOwner) {
      // Check if user is admin
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only the author owner or admins can create events for this author' },
          { status: 403 }
        )
      }
    }

    const body = await req.json()
    
    // Validate required fields
    if (!body.title || !body.start_date || !body.end_date || !body.format) {
      return NextResponse.json({ error: 'Missing required fields: title, start_date, end_date, format' }, { status: 400 })
    }

    // Add created_by and author_id fields
    body.created_by = user.id
    body.author_id = authorId

    // If book_id is provided, link the event to the book
    if (body.book_id) {
      // Verify the book exists and is linked to this author
      const { data: bookAuthor } = await supabaseAdmin
        .from('book_authors')
        .select('book_id')
        .eq('book_id', body.book_id)
        .eq('author_id', authorId)
        .single()
      
      if (!bookAuthor) {
        return NextResponse.json(
          { error: 'The specified book is not associated with this author' },
          { status: 400 }
        )
      }
    }

    // Generate a slug if not provided
    if (!body.slug) {
      const slug = body.title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-')
      body.slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`
    }

    // Create the event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert([body])
      .select()
      .single()
    
    if (eventError) {
      console.error('Error creating author event:', eventError)
      return NextResponse.json({ error: eventError.message || 'Failed to create event' }, { status: 400 })
    }

    return NextResponse.json({ data: event, message: 'Author event created successfully' }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/authors/[id]/events:', error)
    return NextResponse.json({ error: error.message || 'Failed to create author event' }, { status: 500 })
  }
}

