import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export type EntityType = 'user' | 'group' | 'event' | 'book' | 'author' | 'publisher'

export interface PermalinkValidationResult {
  isValid: boolean
  error?: string
  suggestions?: string[]
}

export interface PermalinkAvailabilityResult {
  isAvailable: boolean
  error?: string
  suggestions?: string[]
}

/**
 * Validates a permalink format
 */
export function validatePermalinkFormat(permalink: string): PermalinkValidationResult {
  // Check if permalink is empty
  if (!permalink || permalink.trim().length === 0) {
    return {
      isValid: false,
      error: 'Permalink cannot be empty'
    }
  }

  // Check length (3-100 characters)
  if (permalink.length < 3) {
    return {
      isValid: false,
      error: 'Permalink must be at least 3 characters long'
    }
  }

  if (permalink.length > 100) {
    return {
      isValid: false,
      error: 'Permalink must be 100 characters or less'
    }
  }

  // Check format (only lowercase letters, numbers, and hyphens)
  if (!/^[a-z0-9-]+$/.test(permalink)) {
    return {
      isValid: false,
      error: 'Permalink can only contain lowercase letters, numbers, and hyphens'
    }
  }

  // Check for consecutive hyphens
  if (permalink.includes('--')) {
    return {
      isValid: false,
      error: 'Permalink cannot contain consecutive hyphens'
    }
  }

  // Check for leading/trailing hyphens
  if (permalink.startsWith('-') || permalink.endsWith('-')) {
    return {
      isValid: false,
      error: 'Permalink cannot start or end with a hyphen'
    }
  }

  // Check for reserved words
  const reservedWords = [
    'admin', 'api', 'auth', 'login', 'logout', 'register', 'signup', 'signin',
    'profile', 'settings', 'dashboard', 'help', 'support', 'about', 'contact',
    'privacy', 'terms', 'legal', 'blog', 'news', 'feed', 'search', 'explore',
    'discover', 'trending', 'popular', 'new', 'hot', 'top', 'best', 'featured'
  ]

  if (reservedWords.includes(permalink.toLowerCase())) {
    return {
      isValid: false,
      error: 'This permalink is reserved and cannot be used',
      suggestions: [`${permalink}-user`, `${permalink}-profile`, `${permalink}-page`]
    }
  }

  return { isValid: true }
}

/**
 * Generates a permalink from input text
 */
export function generatePermalink(input: string): string {
  if (!input) return ''

  // Convert to lowercase
  let permalink = input.toLowerCase()

  // Remove special characters except spaces and hyphens
  permalink = permalink.replace(/[^a-z0-9\s-]/g, '')

  // Replace spaces with hyphens
  permalink = permalink.replace(/\s+/g, '-')

  // Remove consecutive hyphens
  permalink = permalink.replace(/-+/g, '-')

  // Remove leading and trailing hyphens
  permalink = permalink.replace(/^-+|-+$/g, '')

  // Ensure minimum length
  if (permalink.length < 3) {
    permalink = permalink + '-' + Math.random().toString(36).substring(2, 6)
  }

  return permalink
}

/**
 * Checks if a permalink is available for a given entity type using API
 */
export async function checkPermalinkAvailability(
  permalink: string, 
  entityType: EntityType, 
  excludeId?: string
): Promise<PermalinkAvailabilityResult> {
  try {
    // Use the API endpoint for validation
    const response = await fetch(`/api/permalinks/validate?permalink=${encodeURIComponent(permalink)}&type=${entityType}`)
    
    if (!response.ok) {
      throw new Error('Failed to validate permalink')
    }

    const result = await response.json()
    
    if (!result.isValid) {
      return {
        isAvailable: false,
        error: result.error,
        suggestions: result.suggestions
      }
    }

    return {
      isAvailable: result.isAvailable,
      error: result.error,
      suggestions: result.suggestions
    }
  } catch (error) {
    console.error('Error checking permalink availability:', error)
    return {
      isAvailable: false,
      error: 'Failed to check permalink availability'
    }
  }
}

/**
 * Gets the table name for an entity type
 */
function getTableName(entityType: EntityType): string {
  const tableMap: Record<EntityType, string> = {
    user: 'users',
    group: 'groups',
    event: 'events',
    book: 'books',
    author: 'authors',
    publisher: 'publishers'
  }
  return tableMap[entityType]
}

/**
 * Generates suggestions for alternative permalinks
 */
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

/**
 * Gets entity ID by permalink
 */
export async function getEntityByPermalink(
  permalink: string, 
  entityType: EntityType
): Promise<string | null> {
  try {
    const supabase = createClientComponentClient()
    
    const { data, error } = await supabase
      .from(getTableName(entityType))
      .select('id')
      .eq('permalink', permalink)
      .single()

    if (error) {
      console.error('Error getting entity by permalink:', error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error('Error getting entity by permalink:', error)
    return null
  }
}

/**
 * Updates an entity's permalink using API
 */
export async function updateEntityPermalink(
  entityId: string,
  entityType: EntityType,
  newPermalink: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/permalinks/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entityId,
        entityType,
        newPermalink
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || 'Failed to update permalink'
      }
    }

    const result = await response.json()
    return { success: result.success }
  } catch (error) {
    console.error('Error updating permalink:', error)
    return {
      success: false,
      error: 'Failed to update permalink'
    }
  }
}

/**
 * Generates a permalink using the API
 */
export async function generatePermalinkAPI(
  inputText: string,
  entityType: EntityType,
  entityId?: string
): Promise<{ success: boolean; permalink?: string; error?: string }> {
  try {
    const response = await fetch('/api/permalinks/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputText,
        entityType,
        entityId
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || 'Failed to generate permalink'
      }
    }

    const result = await response.json()
    return {
      success: result.success,
      permalink: result.permalink
    }
  } catch (error) {
    console.error('Error generating permalink:', error)
    return {
      success: false,
      error: 'Failed to generate permalink'
    }
  }
}

/**
 * Creates a permalink for an entity if it doesn't have one
 */
export async function createEntityPermalink(
  entityId: string,
  entityType: EntityType,
  baseName: string
): Promise<{ success: boolean; permalink?: string; error?: string }> {
  try {
    // Use the API to generate a permalink
    const result = await generatePermalinkAPI(baseName, entityType, entityId)
    
    if (!result.success) {
      return result
    }

    // Update the entity with the generated permalink
    const updateResult = await updateEntityPermalink(entityId, entityType, result.permalink!)
    
    if (!updateResult.success) {
      return {
        success: false,
        error: updateResult.error
      }
    }

    return { success: true, permalink: result.permalink }
  } catch (error) {
    console.error('Error creating permalink:', error)
    return {
      success: false,
      error: 'Failed to create permalink'
    }
  }
} 