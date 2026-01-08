import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteHandlerClientAsync()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const shelfId = id

    // Get the shelf
    const { data: shelf, error: shelfError } = await (
      supabase.from('custom_shelves') as any
    )
      .select('*')
      .eq('id', shelfId)
      .single()

    if (shelfError || !shelf) {
      return NextResponse.json({ error: 'Shelf not found' }, { status: 404 })
    }

    // Check if shelf is public or owned by user
    if (!shelf.is_public && shelf.user_id !== user.id) {
      return NextResponse.json({ error: 'Shelf not accessible' }, { status: 403 })
    }

    let shelfBookIds: string[] = []

    if (shelf.is_default) {
      // For default shelves, get books from reading_progress
      const statusMap: Record<string, string> = {
        'Want to Read': 'not_started',
        'Currently Reading': 'in_progress',
        'Read': 'completed',
      }

      const status = statusMap[shelf.name]
      if (status) {
        const { data: readingProgress } = await (
          supabase.from('reading_progress') as any
        )
          .select('book_id')
          .eq('user_id', shelf.user_id)
          .eq('status', status)

        shelfBookIds = (readingProgress || []).map((rp: any) => rp.book_id)
      }
    } else {
      // For custom shelves, get books from shelf_books
      const { data: shelfBooks } = await (supabase.from('shelf_books') as any)
        .select('book_id')
        .eq('shelf_id', shelfId)

      shelfBookIds = (shelfBooks || []).map((sb: any) => sb.book_id)
    }

    if (shelfBookIds.length === 0) {
      return NextResponse.json({ count: 0 })
    }

    // Get user's books from their shelves and reading progress
    const { data: userReadingProgress } = await (
      supabase.from('reading_progress') as any
    )
      .select('book_id')
      .eq('user_id', user.id)

    const { data: userShelfBooks } = await (supabase.from('shelf_books') as any)
      .select('book_id')
      .in(
        'shelf_id',
        (
          await (
            supabase.from('custom_shelves') as any
          )
            .select('id')
            .eq('user_id', user.id)
        ).data?.map((s: any) => s.id) || []
      )

    const userBookIds = new Set([
      ...(userReadingProgress || []).map((rp: any) => rp.book_id),
      ...(userShelfBooks || []).map((sb: any) => sb.book_id),
    ])

    // Count books in common
    const shelfBookIdsSet = new Set(shelfBookIds)
    const commonBooks = Array.from(userBookIds).filter((id) =>
      shelfBookIdsSet.has(id)
    )

    return NextResponse.json({ count: commonBooks.length })
  } catch (error) {
    console.error('Error fetching books in common:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

