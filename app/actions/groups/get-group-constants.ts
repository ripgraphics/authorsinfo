'use server'

import { supabaseAdmin } from '@/lib/supabase/server'

export interface GroupCategory {
  id: number
  name: string
  description: string | null
  display_order: number
  is_active: boolean
}

export interface ActivityLevelDefinition {
  id: number
  level_key: string
  label: string
  min_activities: number
  max_activities: number | null
  display_order: number
}

/**
 * Get all active group categories from database
 * Single source of truth - replaces hardcoded CATEGORIES constant
 */
export async function getGroupCategories(): Promise<{
  success: boolean
  categories?: GroupCategory[]
  error?: string
}> {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('group_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching group categories:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch group categories',
      }
    }

    return {
      success: true,
      categories: categories || [],
    }
  } catch (error) {
    console.error('Unexpected error fetching group categories:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Get all activity level definitions from database
 * Single source of truth - replaces hardcoded ACTIVITY_LEVELS constant
 */
export async function getActivityLevelDefinitions(): Promise<{
  success: boolean
  definitions?: ActivityLevelDefinition[]
  error?: string
}> {
  try {
    const { data: definitions, error } = await supabaseAdmin
      .from('group_activity_level_definitions')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching activity level definitions:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch activity level definitions',
      }
    }

    return {
      success: true,
      definitions: definitions || [],
    }
  } catch (error) {
    console.error('Unexpected error fetching activity level definitions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}
