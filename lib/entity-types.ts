/**
 * Entity Types Helper
 * Maps entity type names to entity_types.id (UUID)
 */

import { supabaseAdmin } from './supabase'

// Cache for entity type lookups
const entityTypeCache = new Map<string, string>()

/**
 * Get entity_types.id (UUID) from entity type name
 * @param entityTypeName - Name like "post", "activity", "book", etc.
 * @returns UUID string from entity_types.id
 */
export async function getEntityTypeId(entityTypeName: string): Promise<string | null> {
  // Map "book" to "Book Post" for comments/posts
  const normalizedName = entityTypeName.toLowerCase() === 'book' ? 'Book Post' : entityTypeName
  
  // Check cache first (use original name for cache key)
  if (entityTypeCache.has(entityTypeName.toLowerCase())) {
    return entityTypeCache.get(entityTypeName.toLowerCase()) || null
  }

  try {
    // If it's already a UUID, validate it exists
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(entityTypeName)) {
      // It's already a UUID, validate it exists in entity_types
      const { data, error } = await supabaseAdmin
        .from('entity_types')
        .select('id')
        .eq('id', entityTypeName)
        .maybeSingle()

      if (error || !data) {
        console.error('❌ Entity type UUID not found:', entityTypeName)
        return null
      }

      // Cache it
      entityTypeCache.set(entityTypeName.toLowerCase(), entityTypeName)
      return entityTypeName
    }

    // Look up by normalized name (book -> Book Post)
    const { data, error } = await supabaseAdmin
      .from('entity_types')
      .select('id')
      .ilike('name', normalizedName)
      .maybeSingle()

    if (error) {
      console.error('❌ Error looking up entity type:', error)
      return null
    }

    if (!data) {
      console.error('❌ Entity type not found:', normalizedName)
      return null
    }

    // Cache it (use original name for cache key)
    entityTypeCache.set(entityTypeName.toLowerCase(), data.id)
    return data.id
  } catch (error) {
    console.error('❌ Exception in getEntityTypeId:', error)
    return null
  }
}

/**
 * Clear the entity type cache (useful for testing or after migrations)
 */
export function clearEntityTypeCache() {
  entityTypeCache.clear()
}
