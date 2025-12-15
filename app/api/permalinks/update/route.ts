import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'


export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { entityId, entityType, newPermalink } = body

    if (!entityId || !entityType || !newPermalink) {
      return NextResponse.json(
        { error: 'Missing required parameters: entityId, entityType, newPermalink' },
        { status: 400 }
      )
    }

    // Validate entity type
    const validEntityTypes = ['user', 'group', 'event', 'book', 'author', 'publisher']
    if (!validEntityTypes.includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      )
    }

    // Validate permalink format
    const isValidFormat = /^[a-z0-9-]{3,100}$/.test(newPermalink) && 
                         !newPermalink.startsWith('-') && 
                         !newPermalink.endsWith('-') && 
                         !newPermalink.includes('--')

    if (!isValidFormat) {
      return NextResponse.json({
        success: false,
        error: 'Invalid permalink format. Must be 3-100 characters, lowercase letters, numbers, and hyphens only.'
      })
    }

    // Check for reserved words
    const reservedWords = [
      'admin', 'api', 'auth', 'login', 'logout', 'register', 'signup', 'signin',
      'profile', 'settings', 'dashboard', 'help', 'support', 'about', 'contact',
      'privacy', 'terms', 'legal', 'blog', 'news', 'feed', 'search', 'explore',
      'discover', 'trending', 'popular', 'new', 'hot', 'top', 'best', 'featured'
    ]

    if (reservedWords.includes(newPermalink.toLowerCase())) {
      return NextResponse.json({
        success: false,
        error: 'This permalink is reserved and cannot be used',
        suggestions: [`${newPermalink}-user`, `${newPermalink}-profile`, `${newPermalink}-page`]
      })
    }

    // Check if user owns the entity (for security)
    const tableMap: Record<string, string> = {
      user: 'users',
      group: 'groups',
      event: 'events',
      book: 'books',
      author: 'authors',
      publisher: 'publishers'
    }

    const tableName = tableMap[entityType]
    
    // For users, check if they're updating their own profile
    if (entityType === 'user' && entityId !== user.id) {
      return NextResponse.json(
        { error: 'You can only update your own permalink' },
        { status: 403 }
      )
    }

    // For other entities, check if user has permission (you can extend this logic)
    // For now, we'll allow updates but you should implement proper authorization

    // Check if permalink is already taken by another entity
    const { data: existingEntity, error: checkError } = await (supabase
      .from(tableName) as any)
      .select('id')
      .eq('permalink', newPermalink)
      .neq('id', entityId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Database error:', checkError)
      return NextResponse.json(
        { error: 'Failed to check permalink availability' },
        { status: 500 }
      )
    }

    if (existingEntity) {
      return NextResponse.json({
        success: false,
        error: 'This permalink is already taken by another entity',
        suggestions: generateSuggestions(newPermalink)
      })
    }

    // Update the permalink
    const { error: updateError } = await (supabase
      .from(tableName) as any)
      .update({ permalink: newPermalink })
      .eq('id', entityId)

    if (updateError) {
      console.error('Error updating permalink:', updateError)
      return NextResponse.json(
        { error: 'Failed to update permalink' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Permalink updated successfully',
      permalink: newPermalink
    })

  } catch (error) {
    console.error('Error updating permalink:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateSuggestions(permalink: string): string[] {
  const suggestions: string[] = []
  
  // Add numbers
  for (let i = 1; i <= 5; i++) {
    suggestions.push(`${permalink}-${i}`)
  }
  
  // Add random suffix
  suggestions.push(`${permalink}-${Math.random().toString(36).substring(2, 6)}`)
  
  // Add common suffixes
  const suffixes = ['user', 'profile', 'page', 'me', 'official']
  suffixes.forEach(suffix => {
    suggestions.push(`${permalink}-${suffix}`)
  })
  
  return suggestions.slice(0, 5) // Return max 5 suggestions
} 