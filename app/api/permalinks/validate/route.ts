import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const permalink = searchParams.get('permalink')
    const entityType = searchParams.get('type') as 'user' | 'group' | 'event' | 'book' | 'author' | 'publisher'

    if (!permalink || !entityType) {
      return NextResponse.json(
        { error: 'Missing required parameters: permalink and type' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Validate format
    const isValidFormat = /^[a-z0-9-]{3,100}$/.test(permalink) && 
                         !permalink.startsWith('-') && 
                         !permalink.endsWith('-') && 
                         !permalink.includes('--')

    if (!isValidFormat) {
      return NextResponse.json({
        isValid: false,
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

    if (reservedWords.includes(permalink.toLowerCase())) {
      return NextResponse.json({
        isValid: false,
        error: 'This permalink is reserved and cannot be used',
        suggestions: [`${permalink}-user`, `${permalink}-profile`, `${permalink}-page`]
      })
    }

    // Check availability in database
    const tableMap: Record<string, string> = {
      user: 'users',
      group: 'groups',
      event: 'events',
      book: 'books',
      author: 'authors',
      publisher: 'publishers'
    }

    const tableName = tableMap[entityType]
    if (!tableName) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .eq('permalink', permalink)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to check permalink availability' },
        { status: 500 }
      )
    }

    const isAvailable = !data

    return NextResponse.json({
      isValid: true,
      isAvailable,
      error: isAvailable ? undefined : 'This permalink is already taken',
      suggestions: isAvailable ? undefined : generateSuggestions(permalink)
    })

  } catch (error) {
    console.error('Error validating permalink:', error)
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