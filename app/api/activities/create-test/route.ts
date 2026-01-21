import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Create a test activity
    const { data: activity, error } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: userId,
        activity_type: 'book_added',
        entity_type: 'book',
        entity_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        data: {
          book_title: 'The Great Gatsby',
          author_name: 'F. Scott Fitzgerald',
          shelf: 'Want to Read',
          rating: 5,
          review:
            "Excited to read this classic American novel! I've heard great things about the story and the writing style. Looking forward to diving into the world of Jay Gatsby and the Jazz Age.",
          text: 'Added "The Great Gatsby" to my Want to Read shelf. Can\'t wait to start this classic!',
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating test activity:', error)
      return NextResponse.json({ error: 'Failed to create test activity' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      activity,
    })
  } catch (error) {
    console.error('Error in create test activity API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

