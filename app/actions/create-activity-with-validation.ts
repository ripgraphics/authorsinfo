'use server'

import { createServerActionClientAsync } from '@/lib/supabase/client-helper'
import { validateAndFilterPayload } from '@/lib/schema/schema-validators'
import { supabaseAdmin } from '@/lib/supabase/server'

export interface CreateActivityParams {
  user_id: string
  activity_type: string
  visibility?: string
  content_type?: string
  text?: string
  content_summary?: string
  image_url?: string | null
  link_url?: string | null
  hashtags?: string[] | null
  data?: Record<string, any>
  entity_type?: string
  entity_id?: string
  metadata?: Record<string, any>
  publish_status?: string
  published_at?: string
  created_at?: string
  updated_at?: string
}

export interface CreateActivityResult {
  success: boolean
  activity?: any
  error?: string
  warnings?: string[]
  removedColumns?: string[]
}

/**
 * Validate that an entity exists before creating an activity
 */
async function validateEntityExists(
  entityType: string | undefined,
  entityId: string | undefined
): Promise<{ valid: boolean; error?: string }> {
  if (!entityType || !entityId) {
    // Allow null entity references
    return { valid: true }
  }

  try {
    let exists = false

    switch (entityType) {
      case 'user':
        // For users, check if they exist in the profiles table
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('user_id')
          .eq('user_id', entityId)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error checking user profile:', profileError)
          // If there's a real error, still try to check users table as fallback
        }

        if (profile) {
          exists = true
        } else {
          // Fallback: check if user exists in users table
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('id', entityId)
            .single()

          exists = !!user
        }
        break

      case 'author':
        const { data: author } = await supabaseAdmin
          .from('authors')
          .select('id')
          .eq('id', entityId)
          .single()
        exists = !!author
        break

      case 'publisher':
        const { data: publisher } = await supabaseAdmin
          .from('publishers')
          .select('id')
          .eq('id', entityId)
          .single()
        exists = !!publisher
        break

      case 'group':
        const { data: group } = await supabaseAdmin
          .from('groups')
          .select('id')
          .eq('id', entityId)
          .single()
        exists = !!group
        break

      case 'event':
        const { data: event } = await supabaseAdmin
          .from('events')
          .select('id')
          .eq('id', entityId)
          .single()
        exists = !!event
        break

      case 'book':
        const { data: book } = await supabaseAdmin
          .from('books')
          .select('id')
          .eq('id', entityId)
          .single()
        exists = !!book
        break

      default:
        // For unknown entity types, allow the insert (let database constraints handle validation)
        return { valid: true }
    }

    if (!exists) {
      return {
        valid: false,
        error: `Referenced entity does not exist: ${entityType}/${entityId}`,
      }
    }

    return { valid: true }
  } catch (error) {
    console.error('Error validating entity:', error)
    // On validation error, allow the insert to proceed (database will handle it)
    return { valid: true }
  }
}

/**
 * Create activity with schema validation
 * Filters payload to only include columns that exist in the database
 */
export async function createActivityWithValidation(
  params: CreateActivityParams
): Promise<CreateActivityResult> {
  try {
    const supabase = await createServerActionClientAsync()

    // Validate entity exists before proceeding
    const entityValidation = await validateEntityExists(params.entity_type, params.entity_id)
    if (!entityValidation.valid) {
      return {
        success: false,
        error: entityValidation.error || 'Entity validation failed',
        warnings: [],
        removedColumns: [],
      }
    }

    // Validate and filter payload against actual schema
    // Map 'text' to 'content' for the posts table
    const postPayload = {
      ...params,
      content: params.text || (params.data as any)?.content || (params.data as any)?.text,
    }
    
    // Remove 'text' as it's now 'content'
    delete (postPayload as any).text;

    const { payload, removedColumns, warnings } = await validateAndFilterPayload(
      'posts',
      postPayload
    )

    // Log warnings if any columns were removed
    if (removedColumns.length > 0) {
      console.warn(`Removed non-existent columns from posts insert:`, removedColumns)
    }

    // Note: Engagement counts are calculated dynamically from 
    // engagement tables which are the single source of truth.

    // Insert the filtered payload (no cached count columns)
    const { data: activity, error } = await (supabase.from('posts') as any)
      .insert([payload])
      .select()
      .single()

    if (error) {
      console.error('Error creating activity:', error)

      // Provide more helpful error messages
      let errorMessage = error.message || 'Failed to create activity'

      // Check if it's the entity reference error
      if (error.message?.includes('Referenced entity does not exist')) {
        errorMessage = error.message
      } else if (error.message?.includes('foreign key') || error.message?.includes('constraint')) {
        errorMessage = `Database constraint violation: ${error.message}. Please verify the entity exists.`
      }

      return {
        success: false,
        error: errorMessage,
        warnings: warnings.length > 0 ? warnings : undefined,
        removedColumns: removedColumns.length > 0 ? removedColumns : undefined,
      }
    }

    return {
      success: true,
      activity,
      warnings: warnings.length > 0 ? warnings : undefined,
      removedColumns: removedColumns.length > 0 ? removedColumns : undefined,
    }
  } catch (error) {
    console.error('Unexpected error creating activity:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}
