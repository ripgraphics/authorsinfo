import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { bookId } = await request.json()
    
    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 })
    }

    console.log(`Attempting to update book: ${bookId}`)
    
    // Test update with updated_at column
    const updateData = {
      title: 'Test Update',
      updated_at: new Date().toISOString()
    }
    
    console.log('Update data:', updateData)
    
    const { data, error } = await supabaseAdmin
      .from('books')
      .update(updateData)
      .eq('id', bookId)
      .select()

    if (error) {
      console.log('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Update successful:', data)
    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Error updating book:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 