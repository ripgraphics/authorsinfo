import { NextRequest, NextResponse } from 'next/server'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: async () => cookieStore })
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const { bookId, status } = await request.json()

    if (!bookId || !status) {
      return NextResponse.json({ error: 'Missing bookId or status' }, { status: 400 })
    }

    // Map status to reading progress status
    const statusMapping: Record<string, string> = {
      'want_to_read': 'not_started',
      'currently_reading': 'in_progress', 
      'read': 'completed',
      'on_hold': 'on_hold',
      'abandoned': 'abandoned'
    }

    const readingProgressStatus = statusMapping[status] || 'not_started'

    // Get user's default privacy settings
    const { data: privacySettings } = await supabase
      .from('user_privacy_settings')
      .select('default_privacy_level')
      .eq('user_id', user.id)
      .single()

    const defaultPrivacyLevel = privacySettings?.default_privacy_level || 'private'

    // Check if a record already exists
    const { data: existingProgress } = await supabase
      .from('reading_progress')
      .select('id')
      .eq('book_id', bookId)
      .eq('user_id', user.id)
      .single()

    let result

    if (existingProgress) {
      // Update existing record
      const { data, error } = await supabase
        .from('reading_progress')
        .update({
          status: readingProgressStatus,
          updated_at: new Date().toISOString(),
          // Set finish_date if completed
          ...(readingProgressStatus === 'completed' && { finish_date: new Date().toISOString() }),
          // Set start_date if in_progress and no start_date
          ...(readingProgressStatus === 'in_progress' && { start_date: new Date().toISOString() })
        })
        .eq('id', existingProgress.id)
        .select()

      result = { data, error }
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('reading_progress')
        .insert({
          book_id: bookId,
          user_id: user.id,
          status: readingProgressStatus,
          start_date: readingProgressStatus === 'in_progress' ? new Date().toISOString() : undefined,
          finish_date: readingProgressStatus === 'completed' ? new Date().toISOString() : undefined,
          privacy_level: defaultPrivacyLevel,
          allow_friends: defaultPrivacyLevel === 'friends',
          allow_followers: defaultPrivacyLevel === 'followers',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()

      result = { data, error }
    }

    if (result.error) {
      console.error('Error updating reading status:', result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    // Create activity for timeline
    try {
      // Get book details for the activity
      const { data: book } = await supabase
        .from('books')
        .select('id, title, author_id')
        .eq('id', bookId)
        .single()

      if (book) {
        // Get author details if available
        let authorName = "Unknown Author"
        if (book.author_id) {
          const { data: author } = await supabase
            .from('authors')
            .select('id, name')
            .eq('id', book.author_id)
            .single()
          
          if (author) {
            authorName = author.name
          }
        }

        // Determine activity type and data based on status
        let activityType = "book_added"
        let activityData: any = {
          book_title: book.title,
          book_author: authorName,
          shelf: status === "want_to_read" ? "Want to Read" : 
                 status === "currently_reading" ? "Currently Reading" :
                 status === "read" ? "Read" :
                 status === "on_hold" ? "On Hold" : "Abandoned"
        }

        // Create the activity
        const { error: activityError } = await supabase
          .from('activities')
          .insert({
            user_id: user.id,
            activity_type: activityType,
            entity_type: "book",
            entity_id: book.id,
            data: activityData,
            metadata: {
              privacy_level: defaultPrivacyLevel,
              engagement_count: 0,
              is_premium: false
            }
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

    return NextResponse.json({ 
      success: true, 
      status: readingProgressStatus,
      progress: result.data?.[0]
    })

  } catch (error) {
    console.error('Error in reading status API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: async () => cookieStore })
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const { bookId } = await request.json()

    if (!bookId) {
      return NextResponse.json({ error: 'Missing bookId' }, { status: 400 })
    }

    // Delete from reading_progress
    const { error: progressError } = await supabase
      .from('reading_progress')
      .delete()
      .eq('book_id', bookId)
      .eq('user_id', user.id)

    if (progressError) {
      console.error('Error deleting reading progress:', progressError)
      return NextResponse.json({ error: progressError.message }, { status: 500 })
    }

    // Delete from reading_status
    const { error: statusError } = await supabase
      .from('reading_status')
      .delete()
      .eq('book_id', bookId)
      .eq('user_id', user.id)

    if (statusError) {
      console.error('Error deleting reading status:', statusError)
      return NextResponse.json({ error: statusError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in reading status DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: async () => cookieStore })
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')

    if (!bookId) {
      return NextResponse.json({ error: 'Missing bookId' }, { status: 400 })
    }

    // Get the current reading status for this book
    const { data, error } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('book_id', bookId)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching reading status:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      status: data?.status || null,
      progress: data
    })

  } catch (error) {
    console.error('Error in reading status API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 