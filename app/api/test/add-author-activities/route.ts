import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Helper function to generate a random UUID string
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export async function GET(request: Request) {
  try {
    // Get the authorId from the URL
    const url = new URL(request.url)
    const authorId = url.searchParams.get('authorId')
    
    if (!authorId) {
      return NextResponse.json(
        { error: 'Author ID is required' },
        { status: 400 }
      )
    }

    // Find books by this author
    const { data: books, error: booksError } = await supabaseAdmin
      .from('books')
      .select('id, title, author')
      .eq('author_id', authorId)
      .limit(10)

    if (booksError || !books || books.length === 0) {
      return NextResponse.json(
        { 
          error: 'No books found for this author',
          details: booksError
        },
        { status: 404 }
      )
    }

    console.log(`Found ${books.length} books for author ${authorId}:`, books.map(b => b.title))

    // Get real user IDs from the database to avoid foreign key constraint violations
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(5)

    if (usersError || !users || users.length === 0) {
      return NextResponse.json(
        { 
          error: 'No users found to create activities',
          details: usersError
        },
        { status: 404 }
      )
    }

    const realUserIds = users.map(user => user.id)
    console.log(`Found ${realUserIds.length} real users to use for activities`)

    // Create activities for those books
    const activityTypes = ['rating', 'finished', 'added', 'reviewed']
    const activities = []
    
    for (const book of books) {
      // Create 2-3 activities per book
      const numActivities = 2 + Math.floor(Math.random() * 2)
      
      for (let i = 0; i < numActivities; i++) {
        const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)]
        const randomUser = realUserIds[Math.floor(Math.random() * realUserIds.length)]
        const daysAgo = Math.floor(Math.random() * 30) // Random day in the last month
        const activityDate = new Date()
        activityDate.setDate(activityDate.getDate() - daysAgo)
        
        let data: any = {
          book_title: book.title,
          book_author: book.author || 'Unknown Author'
        }
        
        if (activityType === 'rating') {
          data.rating = 1 + Math.floor(Math.random() * 5) // Random rating 1-5
        } else if (activityType === 'added') {
          const shelves = ['Want to Read', 'Currently Reading', 'Favorites', 'To Buy']
          data.shelf = shelves[Math.floor(Math.random() * shelves.length)]
        } else if (activityType === 'reviewed') {
          data.review_text = `This is a test review for ${book.title}`
        }
        
        activities.push({
          user_id: randomUser,
          activity_type: activityType,
          book_id: book.id,
          data,
          created_at: activityDate.toISOString()
        })
      }
    }
    
    console.log(`Created ${activities.length} activities to insert`)
    
    // Insert activities
    const { data: insertedActivities, error: insertError } = await supabaseAdmin
      .from('activities')
      .insert(activities)
      .select()
    
    if (insertError) {
      console.error('Error inserting activities:', insertError)
      return NextResponse.json(
        { 
          error: 'Failed to insert activities',
          details: insertError
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: `Added ${activities.length} activities for ${books.length} books`,
      books,
      activities
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: error
      },
      { status: 500 }
    )
  }
} 