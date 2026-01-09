import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { supabaseAdmin } from '@/lib/supabase'
import { upsertContactInfo } from '@/utils/contactInfo'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await context.params
    const id = resolvedParams.id
    if (!id) {
      return NextResponse.json({ error: 'Author ID is required' }, { status: 400 })
    }

    const { data: author, error } = await supabaseAdmin
      .from('authors')
      .select(
        `
        *,
        cover_image:cover_image_id(id, url, alt_text),
        author_image:author_image_id(id, url, alt_text)
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching author:', error)
      return NextResponse.json({ error: 'Failed to fetch author' }, { status: 500 })
    }

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 })
    }

    return NextResponse.json(author)
  } catch (err) {
    console.error('Internal server error in author route:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await context.params
    const id = resolvedParams.id
    if (!id) {
      return NextResponse.json({ error: 'Author ID is required' }, { status: 400 })
    }

    const body = await request.json()

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const supabase = await createRouteHandlerClientAsync()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Support section-based updates (like publishers)
    if (body.section && body.data) {
      const { section, data } = body

      if (section === 'overview') {
        // Update author table fields
        const sanitizedData: Record<string, any> = {}
        if (data.bio !== undefined) sanitizedData.bio = data.bio || null
        if (data.birth_date !== undefined) sanitizedData.birth_date = data.birth_date || null
        if (data.nationality !== undefined) sanitizedData.nationality = data.nationality || null
        if (data.website !== undefined) sanitizedData.website = data.website || null
        if (data.twitter_handle !== undefined) sanitizedData.twitter_handle = data.twitter_handle || null
        if (data.facebook_handle !== undefined) sanitizedData.facebook_handle = data.facebook_handle || null
        if (data.instagram_handle !== undefined) sanitizedData.instagram_handle = data.instagram_handle || null
        if (data.goodreads_url !== undefined) sanitizedData.goodreads_url = data.goodreads_url || null

        if (Object.keys(sanitizedData).length === 0) {
          return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
        }

        const { data: updatedAuthor, error } = await supabaseAdmin
          .from('authors')
          .update(sanitizedData)
          .eq('id', id)
          .select()
          .single()

        if (error) {
          console.error('Error updating author:', error)
          return NextResponse.json({ error: 'Failed to update author' }, { status: 500 })
        }

        try {
          await supabaseAdmin.from('activities').insert({
            user_id: user?.id,
            activity_type: 'author_profile_updated',
            data: {
              author_id: id,
              author_name: updatedAuthor.name,
              updated_fields: Object.keys(sanitizedData),
            },
            created_at: new Date().toISOString(),
          })
        } catch (logError) {
          console.error('Error creating activity log:', logError)
        }

        return NextResponse.json(updatedAuthor)
      } else if (section === 'contact' || section === 'location') {
        // Update contact_info table using upsertContactInfo utility
        const contactData: Record<string, any> = {
          entity_type: 'author',
          entity_id: id,
        }

        if (section === 'contact') {
          if (data.email !== undefined) contactData.email = data.email || undefined
          if (data.phone !== undefined) contactData.phone = data.phone || undefined
          if (data.website !== undefined) contactData.website = data.website || undefined
        }

        if (section === 'location') {
          if (data.address_line1 !== undefined) contactData.address_line1 = data.address_line1 || undefined
          if (data.address_line2 !== undefined) contactData.address_line2 = data.address_line2 || undefined
          if (data.city !== undefined) contactData.city = data.city || undefined
          if (data.state !== undefined) contactData.state = data.state || undefined
          if (data.postal_code !== undefined) contactData.postal_code = data.postal_code || undefined
          if (data.country !== undefined) contactData.country = data.country || undefined
        }

        // Use server-side supabaseAdmin to upsert contact info
        const { data: contactInfo, error: contactError } = await supabaseAdmin
          .from('contact_info')
          .upsert(contactData, { onConflict: 'entity_type,entity_id' })
          .select()
          .single()

        if (contactError) {
          console.error('Error updating contact info:', contactError)
          return NextResponse.json({ error: 'Failed to update contact information' }, { status: 500 })
        }

        // Also fetch the updated author to return complete data
        const { data: updatedAuthor } = await supabaseAdmin
          .from('authors')
          .select(
            `
            *,
            cover_image:cover_image_id(id, url, alt_text),
            author_image:author_image_id(id, url, alt_text)
          `
          )
          .eq('id', id)
          .single()

        return NextResponse.json(updatedAuthor || contactInfo)
      } else {
        return NextResponse.json({ error: 'Invalid section specified' }, { status: 400 })
      }
    }

    // Fallback to legacy update format (for backward compatibility)
    const allowedFields = [
      'name',
      'bio',
      'nationality',
      'birth_date',
      'website',
      'twitter_handle',
      'facebook_handle',
      'instagram_handle',
      'goodreads_url',
    ]

    const updateData: Record<string, any> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: updatedAuthor, error } = await supabaseAdmin
      .from('authors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating author:', error)
      return NextResponse.json({ error: 'Failed to update author' }, { status: 500 })
    }

    try {
      await supabaseAdmin.from('activities').insert({
        user_id: user?.id,
        activity_type: 'author_profile_updated',
        data: {
          author_id: id,
          author_name: updatedAuthor.name,
          updated_fields: Object.keys(updateData),
        },
        created_at: new Date().toISOString(),
      })
    } catch (logError) {
      console.error('Error creating activity log:', logError)
    }

    return NextResponse.json(updatedAuthor)
  } catch (err) {
    console.error('Internal server error in author update route:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
