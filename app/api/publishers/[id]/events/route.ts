import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET: List all events for a publisher
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: publisherId } = await params
    const supabase = await createRouteHandlerClientAsync()
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('publisher_id', publisherId)
      .order('start_date', { ascending: true })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ data: data || [] })
  } catch (error: any) {
    console.error('Error fetching publisher events:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch publisher events' }, { status: 500 })
  }
}

// POST: Create a new event for a publisher
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: publisherId } = await params
    const supabase = await createRouteHandlerClientAsync()
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user is the publisher owner (created_by) or is admin
    const { data: publisher } = await supabaseAdmin
      .from('publishers')
      .select('created_by')
      .eq('id', publisherId)
      .single()

    if (!publisher) {
      return NextResponse.json({ error: 'Publisher not found' }, { status: 404 })
    }

    // Check if user created the publisher or is admin
    const isPublisherOwner = publisher.created_by === user.id
    if (!isPublisherOwner) {
      // Check if user is admin
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only the publisher owner or admins can create events for this publisher' },
          { status: 403 }
        )
      }
    }

    const body = await req.json()
    
    // Validate required fields
    if (!body.title || !body.start_date || !body.end_date || !body.format) {
      return NextResponse.json({ error: 'Missing required fields: title, start_date, end_date, format' }, { status: 400 })
    }

    // Add created_by and publisher_id fields
    body.created_by = user.id
    body.publisher_id = publisherId

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
      console.error('Error creating publisher event:', eventError)
      return NextResponse.json({ error: eventError.message || 'Failed to create event' }, { status: 400 })
    }

    return NextResponse.json({ data: event, message: 'Publisher event created successfully' }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/publishers/[id]/events:', error)
    return NextResponse.json({ error: error.message || 'Failed to create publisher event' }, { status: 500 })
  }
}

