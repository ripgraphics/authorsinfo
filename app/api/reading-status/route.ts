import { NextRequest, NextResponse } from 'next/server'
import { createServerActionClientAsync } from '@/lib/supabase/client-helper'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerActionClientAsync()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const { bookId, status, currentPage } = await request.json()

    if (!bookId || !status) {
      return NextResponse.json({ error: 'Missing bookId or status' }, { status: 400 })
    }

    // Map status to reading progress status
    const statusMapping: Record<string, string> = {
      want_to_read: 'not_started',
      currently_reading: 'in_progress',
      read: 'completed',
      on_hold: 'on_hold',
      abandoned: 'abandoned',
    }

    const readingProgressStatus = statusMapping[status] || 'not_started'

    // Get user's default privacy settings
    const { data: privacySettings } = await (supabase.from('user_privacy_settings') as any)
      .select('default_privacy_level')
      .eq('user_id', user.id)
      .single()

    const defaultPrivacyLevel = privacySettings?.default_privacy_level || 'private'

    // Check if a record already exists
    const { data: existingProgress } = await (supabase.from('reading_progress') as any)
      .select('id')
      .eq('book_id', bookId)
      .eq('user_id', user.id)
      .single()

    let result

    // Prepare base update/insert data - only core columns that definitely exist
    const progressData: any = {
      status: readingProgressStatus,
      updated_at: new Date().toISOString(),
    }

    // Add start_date or finish_date based on status
    if (readingProgressStatus === 'in_progress' && !existingProgress) {
      progressData.start_date = new Date().toISOString()
    } else if (readingProgressStatus === 'completed') {
      progressData.finish_date = new Date().toISOString()
    }

    if (existingProgress) {
      // Update existing record
      const { data, error } = await (supabase.from('reading_progress') as any)
        .update(progressData)
        .eq('id', existingProgress.id)
        .select()

      result = { data, error }
    } else {
      // Insert new record with core columns
      const { data, error } = await (supabase.from('reading_progress') as any)
        .insert({
          book_id: bookId,
          user_id: user.id,
          ...progressData,
          privacy_level: defaultPrivacyLevel,
          allow_friends: defaultPrivacyLevel === 'friends',
          allow_followers: defaultPrivacyLevel === 'followers',
          created_at: new Date().toISOString(),
        })
        .select()

      result = { data, error }
    }

    if (result.error) {
      console.error('Error updating reading status:', result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    // Refetch from database to ensure we return the authoritative state
    // Explicitly select only core columns that exist in the database to avoid schema cache issues
    const { data: dbProgress, error: fetchError } = await (supabase.from('reading_progress') as any)
      .select('id, book_id, user_id, status, start_date, finish_date, privacy_level, created_at, updated_at')
      .eq('book_id', bookId)
      .eq('user_id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error refetching reading progress:', fetchError)
      // Still return success but log the error
    }

    // Create activity for timeline
    try {
      // Get book details for the activity
      const { data: book } = await (supabase.from('books') as any)
        .select('id, title, author_id')
        .eq('id', bookId)
        .single()

      if (book) {
        // Get author details if available
        let authorName = 'Unknown Author'
        if (book.author_id) {
          const { data: author } = await (supabase.from('authors') as any)
            .select('id, name')
            .eq('id', book.author_id)
            .single()

          if (author) {
            authorName = author.name
          }
        }

        // Determine activity type and data based on status
        const activityType = 'book_added'
        const activityData: any = {
          book_title: book.title,
          book_author: authorName,
          shelf:
            status === 'want_to_read'
              ? 'Want to Read'
              : status === 'currently_reading'
                ? 'Currently Reading'
                : status === 'read'
                  ? 'Read'
                  : status === 'on_hold'
                    ? 'On Hold'
                    : 'Abandoned',
        }

        // Create the activity
        const { error: activityError } = await (supabase.from('activities') as any).insert({
          user_id: user.id,
          activity_type: activityType,
          entity_type: 'book',
          entity_id: book.id,
          data: activityData,
          metadata: {
            privacy_level: defaultPrivacyLevel,
            engagement_count: 0,
            is_premium: false,
          },
        })

        if (activityError) {
          console.error('Error creating activity:', activityError)
          // Don't fail the whole operation if activity creation fails
        }
      }
    } catch (activityError) {
      console.error('Error creating activity for reading status:', activityError)
      // Don't fail the whole operation if activity creation fails
    }

    // Return the authoritative state from database
    return NextResponse.json({
      success: true,
      status: dbProgress?.status || readingProgressStatus,
      progress: dbProgress || result.data?.[0],
    })
  } catch (error) {
    console.error('Error in reading status API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerActionClientAsync()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const { bookId } = await request.json()

    if (!bookId) {
      return NextResponse.json({ error: 'Missing bookId' }, { status: 400 })
    }

    // Delete from reading_progress
    const { error: progressError } = await (supabase.from('reading_progress') as any)
      .delete()
      .eq('book_id', bookId)
      .eq('user_id', user.id)

    if (progressError) {
      console.error('Error deleting reading progress:', progressError)
      return NextResponse.json({ error: progressError.message }, { status: 500 })
    }

    // Verify deletion by attempting to fetch (should return null)
    const { data: verifyData } = await (supabase.from('reading_progress') as any)
      .select('id')
      .eq('book_id', bookId)
      .eq('user_id', user.id)
      .single()

    if (verifyData) {
      console.warn('Warning: Reading progress still exists after deletion attempt')
    }

    return NextResponse.json({ success: true, deleted: !verifyData })
  } catch (error) {
    console.error('Error in reading status DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerActionClientAsync()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')

    if (!bookId) {
      return NextResponse.json({ error: 'Missing bookId' }, { status: 400 })
    }

    // Get the current reading status for this book
    // Explicitly select only core columns that exist in the database to avoid schema cache issues
    const { data, error } = await (supabase.from('reading_progress') as any)
      .select('id, book_id, user_id, status, start_date, finish_date, privacy_level, created_at, updated_at')
      .eq('book_id', bookId)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching reading status:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      status: data?.status || null,
      progress: data,
    })
  } catch (error) {
    console.error('Error in reading status API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

