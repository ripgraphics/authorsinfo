import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { inputText, entityType, entityId } = body

    if (!inputText || !entityType) {
      return NextResponse.json(
        { error: 'Missing required parameters: inputText, entityType' },
        { status: 400 }
      )
    }

    // Validate entity type
    const validEntityTypes = ['user', 'group', 'event', 'book', 'author', 'publisher']
    if (!validEntityTypes.includes(entityType)) {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
    }

    // Generate base permalink
    let permalink = inputText
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove consecutive hyphens
      .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens

    // Ensure minimum length
    if (permalink.length < 3) {
      permalink = permalink + '-' + Math.random().toString(36).substring(2, 6)
    }

    // Check for reserved words
    const reservedWords = [
      'admin',
      'api',
      'auth',
      'login',
      'logout',
      'register',
      'signup',
      'signin',
      'profile',
      'settings',
      'dashboard',
      'help',
      'support',
      'about',
      'contact',
      'privacy',
      'terms',
      'legal',
      'blog',
      'news',
      'feed',
      'search',
      'explore',
      'discover',
      'trending',
      'popular',
      'new',
      'hot',
      'top',
      'best',
      'featured',
    ]

    if (reservedWords.includes(permalink.toLowerCase())) {
      permalink = `${permalink}-user`
    }

    // Check availability and generate unique permalink
    const tableMap: Record<string, string> = {
      user: 'users',
      group: 'groups',
      event: 'events',
      book: 'books',
      author: 'authors',
      publisher: 'publishers',
    }

    const tableName = tableMap[entityType]
    let finalPermalink = permalink
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      // Check if permalink is available
      const { data: existingEntity, error: checkError } = await supabase
        .from(tableName)
        .select('id')
        .eq('permalink', finalPermalink)
        .neq('id', entityId || '00000000-0000-0000-0000-000000000000') // Exclude current entity
        .single()

      if (checkError && checkError.code === 'PGRST116') {
        // Permalink is available
        break
      }

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Database error:', checkError)
        return NextResponse.json(
          { error: 'Failed to check permalink availability' },
          { status: 500 }
        )
      }

      // Permalink is taken, generate alternative
      attempts++
      if (attempts <= 5) {
        finalPermalink = `${permalink}-${attempts}`
      } else {
        finalPermalink = `${permalink}-${Math.random().toString(36).substring(2, 6)}`
      }
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Could not generate a unique permalink after multiple attempts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      permalink: finalPermalink,
      originalInput: inputText,
      entityType: entityType,
    })
  } catch (error) {
    console.error('Error generating permalink:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

