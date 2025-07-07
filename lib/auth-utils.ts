import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
    const supabase = createClientComponentClient()
    
    // First check auth.users for admin/super_admin role
    const { data: authUser, error: authUserError } = await supabase
      .from('auth.users')
      .select(`
        id,
        email,
        role,
        is_super_admin
      `)
      .eq('id', userId)
      .single()

    if (!authUserError && authUser) {
      // Check if user is super admin first
      if (authUser.is_super_admin) {
        return true
      } else if (authUser.role === 'admin') {
        return true
      }
    }

    // If not admin in auth.users, check public.profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (!profileError && profile) {
      return profile.role === 'admin'
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
    const supabase = createClientComponentClient()
    
    const { data: authUser, error: authUserError } = await supabase
      .from('auth.users')
      .select('is_super_admin')
      .eq('id', userId)
      .single()

    if (!authUserError && authUser) {
      return authUser.is_super_admin === true
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
    const supabase = createClientComponentClient()
    
    // First check auth.users for admin/super_admin role
    const { data: authUser, error: authUserError } = await supabase
      .from('auth.users')
      .select(`
        id,
        email,
        role,
        is_super_admin
      `)
      .eq('id', userId)
      .single()

    if (!authUserError && authUser) {
      // Check if user is super admin first
      if (authUser.is_super_admin) {
        return 'super_admin'
      } else if (authUser.role === 'admin') {
        return 'admin'
      }
    }

    // If not admin in auth.users, check public.profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (!profileError && profile) {
      return profile.role || 'user'
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
    const supabase = createClientComponentClient()
    
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
        
        if (groupMember?.group_roles?.name === 'Owner' || groupMember?.group_roles?.name === 'Admin') {
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
        
        if (event?.created_by === userId) {
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
        
        if (album?.owner_id === userId) {
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
        
        if (readingList?.user_id === userId) {
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
        
        if (bookClub?.created_by === userId) {
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
        
        if (discussion?.user_id === userId) {
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
        
        if (review?.user_id === userId) {
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
        
        if (author?.created_by === userId) {
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
        
        if (book?.created_by === userId) {
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