import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { supabaseAdmin } from '@/lib/supabase'
import { upsertContactInfo } from '@/utils/contactInfo'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await context.params
    const id = resolvedParams.id
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Fetch user data from users table
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (userError) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch profile data from profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', id)
      .maybeSingle()

    // Combine user and profile data
    const userData = {
      ...user,
      bio: profile?.bio || null,
      occupation: profile?.occupation || null,
      avatar_image_id: profile?.avatar_image_id || null,
    }

    return NextResponse.json(userData)
  } catch (err) {
    console.error('Internal server error in user route:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await context.params
    const id = resolvedParams.id
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const body = await request.json()

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const supabase = await createRouteHandlerClientAsync()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    // Check if user is authorized (can only edit own profile unless admin)
    if (authUser?.id !== id) {
      // Check if user is admin
      const { data: userRole } = await supabaseAdmin
        .from('users')
        .select('role_id')
        .eq('id', authUser?.id || '')
        .single()

      const { data: role } = userRole?.role_id
        ? await supabaseAdmin
            .from('roles')
            .select('name')
            .eq('id', userRole.role_id)
            .single()
        : { data: null }

      if (role?.name !== 'admin' && role?.name !== 'super_admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Support section-based updates (like publishers/authors)
    if (body.section && body.data) {
      const { section, data } = body

      if (section === 'overview') {
        // Update user table fields (location, website)
        const userUpdateData: Record<string, any> = {}
        if (data.location !== undefined) userUpdateData.location = data.location || null
        if (data.website !== undefined) userUpdateData.website = data.website || null
        if (data.occupation !== undefined) {
          // occupation is in profiles table, handle separately
        }

        // Update profile table fields (bio, occupation)
        const profileUpdateData: Record<string, any> = {}
        if (data.bio !== undefined) profileUpdateData.bio = data.bio || null
        if (data.occupation !== undefined) profileUpdateData.occupation = data.occupation || null

        // Perform updates
        let updatedUser = user
        if (Object.keys(userUpdateData).length > 0) {
          userUpdateData.updated_at = new Date().toISOString()
          const { data: updated, error: userUpdateError } = await supabaseAdmin
            .from('users')
            .update(userUpdateData)
            .eq('id', id)
            .select()
            .single()

          if (userUpdateError) {
            console.error('Error updating user:', userUpdateError)
            return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
          }
          updatedUser = updated
        }

        // Update or create profile
        if (Object.keys(profileUpdateData).length > 0) {
          // Check if profile exists
          const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('user_id', id)
            .maybeSingle()

          if (existingProfile) {
            // Update existing profile
            const { error: profileUpdateError } = await supabaseAdmin
              .from('profiles')
              .update(profileUpdateData)
              .eq('user_id', id)

            if (profileUpdateError) {
              console.error('Error updating profile:', profileUpdateError)
              return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
            }
          } else {
            // Create new profile
            const { error: profileCreateError } = await supabaseAdmin
              .from('profiles')
              .insert({
                user_id: id,
                ...profileUpdateData,
              })

            if (profileCreateError) {
              console.error('Error creating profile:', profileCreateError)
              return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
            }
          }
        }

        // Fetch updated user with profile
        const { data: finalUser } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', id)
          .single()

        const { data: finalProfile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('user_id', id)
          .maybeSingle()

        const responseData = {
          ...finalUser,
          bio: finalProfile?.bio || null,
          occupation: finalProfile?.occupation || null,
        }

        // Log activity
        try {
          await supabaseAdmin.from('activities').insert({
            user_id: authUser?.id,
            activity_type: 'user_profile_updated',
            data: {
              user_id: id,
              updated_fields: Object.keys({ ...userUpdateData, ...profileUpdateData }),
            },
            created_at: new Date().toISOString(),
          })
        } catch (logError) {
          console.error('Error creating activity log:', logError)
        }

        return NextResponse.json(responseData)
      } else if (section === 'contact' || section === 'location') {
        // Update contact_info table using upsertContactInfo utility
        const contactData: Record<string, any> = {
          entity_type: 'user',
          entity_id: id,
        }

        if (section === 'contact') {
          if (data.email !== undefined) {
            // Email is in users table, update there
            const { error: emailUpdateError } = await supabaseAdmin
              .from('users')
              .update({ email: data.email || null, updated_at: new Date().toISOString() })
              .eq('id', id)

            if (emailUpdateError) {
              console.error('Error updating email:', emailUpdateError)
              return NextResponse.json({ error: 'Failed to update email' }, { status: 500 })
            }
          }
          if (data.phone !== undefined) contactData.phone = data.phone || undefined
          if (data.website !== undefined) {
            // Website is in users table, update there
            const { error: websiteUpdateError } = await supabaseAdmin
              .from('users')
              .update({ website: data.website || null, updated_at: new Date().toISOString() })
              .eq('id', id)

            if (websiteUpdateError) {
              console.error('Error updating website:', websiteUpdateError)
              return NextResponse.json({ error: 'Failed to update website' }, { status: 500 })
            }
          }
        }

        if (section === 'location') {
          if (data.address_line1 !== undefined) contactData.address_line1 = data.address_line1 || undefined
          if (data.address_line2 !== undefined) contactData.address_line2 = data.address_line2 || undefined
          if (data.city !== undefined) contactData.city = data.city || undefined
          if (data.state !== undefined) contactData.state = data.state || undefined
          if (data.postal_code !== undefined) contactData.postal_code = data.postal_code || undefined
          if (data.country !== undefined) contactData.country = data.country || undefined
          // Also update location in users table if provided
          if (data.location !== undefined) {
            const { error: locationUpdateError } = await supabaseAdmin
              .from('users')
              .update({ location: data.location || null, updated_at: new Date().toISOString() })
              .eq('id', id)

            if (locationUpdateError) {
              console.error('Error updating location:', locationUpdateError)
              return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
            }
          }
        }

        // Use upsertContactInfo for contact_info table
        if (Object.keys(contactData).length > 2) {
          // More than just entity_type and entity_id
          await upsertContactInfo(contactData as any)
        }

        // Fetch updated user
        const { data: updatedUser } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', id)
          .single()

        const { data: updatedProfile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('user_id', id)
          .maybeSingle()

        const { data: contactInfo } = await supabaseAdmin
          .from('contact_info')
          .select('*')
          .eq('entity_type', 'user')
          .eq('entity_id', id)
          .maybeSingle()

        const responseData = {
          ...updatedUser,
          bio: updatedProfile?.bio || null,
          occupation: updatedProfile?.occupation || null,
          ...contactInfo,
        }

        return NextResponse.json(responseData)
      } else {
        return NextResponse.json({ error: 'Invalid section specified' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'Section and data are required' }, { status: 400 })
    }
  } catch (err) {
    console.error('Internal server error in user PATCH route:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
