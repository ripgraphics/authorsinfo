import { supabaseClient } from '@/lib/supabase/client'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export interface UserWithRole {
  id: string
  email?: string
  name?: string
  role?: string
}

/**
 * Check if a user has admin or super admin privileges
 */
export async function isUserAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false

  try {
    const supabase = supabaseClient

    // Check public.profiles table for admin role (auth.users doesn't exist in current schema)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (!profileError && profile) {
      return (profile as any).role === 'admin'
    }

    return false
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Check if a user has super admin privileges
 */
export async function isUserSuperAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false

  try {
    const supabase = supabaseClient

    // Check public.profiles table for super admin role (auth.users doesn't exist in current schema)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (!profileError && profile) {
      return (profile as any).role === 'super_admin'
    }

    return false
  } catch (error) {
    console.error('Error checking super admin status:', error)
    return false
  }
}

/**
 * Get the user's role from both auth.users and public.profiles
 */
export async function getUserRole(userId?: string): Promise<string> {
  if (!userId) return 'user'

  try {
    const supabase = supabaseClient

    // Check public.profiles table for user role (auth.users doesn't exist in current schema)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (!profileError && profile) {
      return (profile as any).role || 'user'
    }

    return 'user'
  } catch (error) {
    console.error('Error getting user role:', error)
    return 'user'
  }
}

/**
 * Check if a user can edit an entity based on ownership or admin privileges
 */
export async function canUserEditEntity(
  userId?: string,
  entityType?: string,
  entityId?: string,
  entityData?: any
): Promise<boolean> {
  if (!userId) return false

  try {
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // First check if user is admin (admins can edit everything)
    const isAdmin = await isUserAdmin(userId)
    if (isAdmin) return true

    // If no entity info provided, can't determine ownership
    if (!entityType || !entityId) return false

    // Check ownership based on entity type
    switch (entityType) {
      case 'group':
        // Check if user is group owner or admin
        const { data: groupMember } = await supabase
          .from('group_members')
          .select('role_id, group_roles(name)')
          .eq('group_id', entityId)
          .eq('user_id', userId)
          .single()

        if (
          (groupMember as any)?.group_roles?.name === 'Owner' ||
          (groupMember as any)?.group_roles?.name === 'Admin'
        ) {
          return true
        }
        break

      case 'event':
        // Check if user created the event
        const { data: event } = await supabase
          .from('events')
          .select('created_by')
          .eq('id', entityId)
          .single()

        if ((event as any)?.created_by === userId) {
          return true
        }
        break

      case 'photo_album':
        // Check if user owns the album
        const { data: album } = await supabase
          .from('photo_albums')
          .select('owner_id')
          .eq('id', entityId)
          .single()

        if ((album as any)?.owner_id === userId) {
          return true
        }
        break

      case 'reading_list':
        // Check if user owns the reading list
        const { data: readingList } = await supabase
          .from('reading_lists')
          .select('user_id')
          .eq('id', entityId)
          .single()

        if ((readingList as any)?.user_id === userId) {
          return true
        }
        break

      case 'book_club':
        // Check if user created the book club
        const { data: bookClub } = await supabase
          .from('book_clubs')
          .select('created_by')
          .eq('id', entityId)
          .single()

        if ((bookClub as any)?.created_by === userId) {
          return true
        }
        break

      case 'discussion':
        // Check if user created the discussion
        const { data: discussion } = await supabase
          .from('discussions')
          .select('user_id')
          .eq('id', entityId)
          .single()

        if ((discussion as any)?.user_id === userId) {
          return true
        }
        break

      case 'book_review':
        // Check if user wrote the review
        const { data: review } = await supabase
          .from('book_reviews')
          .select('user_id')
          .eq('id', entityId)
          .single()

        if ((review as any)?.user_id === userId) {
          return true
        }
        break

      case 'user':
        // Users can always edit their own profile
        if (entityId === userId) {
          return true
        }
        break

      case 'author':
        // Check if user created the author or is admin
        const { data: author } = await supabase
          .from('authors')
          .select('created_by')
          .eq('id', entityId)
          .single()

        if ((author as any)?.created_by === userId) {
          return true
        }
        // Authors are catalog entities, so only creators and admins can edit
        return false

      case 'publisher':
        // Publishers are catalog entities, only admins can edit
        return false

      case 'book':
        // Check if user created the book or is admin
        const { data: book } = await supabase
          .from('books')
          .select('created_by')
          .eq('id', entityId)
          .single()

        if ((book as any)?.created_by === userId) {
          return true
        }
        // Books are catalog entities, so only creators and admins can edit
        return false

      default:
        // For unknown entity types, check if entityData has ownership fields
        if (entityData) {
          if (entityData.created_by === userId) return true
          if (entityData.user_id === userId) return true
          if (entityData.owner_id === userId) return true
        }
        break
    }

    return false
  } catch (error) {
    console.error('Error checking edit permissions:', error)
    return false
  }
}
