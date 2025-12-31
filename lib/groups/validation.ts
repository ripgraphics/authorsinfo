/**
 * Validate group name
 */
export function validateGroupName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Group name is required' }
  }

  if (name.trim().length > 255) {
    return { valid: false, error: 'Group name must be 255 characters or less' }
  }

  if (name.trim().length < 3) {
    return { valid: false, error: 'Group name must be at least 3 characters' }
  }

  return { valid: true }
}

/**
 * Validate group description
 */
export function validateGroupDescription(description?: string | null): {
  valid: boolean
  error?: string
} {
  if (!description) {
    return { valid: true } // Description is optional
  }

  if (description.length > 5000) {
    return { valid: false, error: 'Description must be 5000 characters or less' }
  }

  return { valid: true }
}

/**
 * Validate join method
 */
export function validateJoinMethod(method?: string): { valid: boolean; error?: string } {
  if (!method) {
    return { valid: true } // Defaults to 'open'
  }

  const validMethods = ['open', 'approval', 'invite_only']
  if (!validMethods.includes(method)) {
    return { valid: false, error: `Join method must be one of: ${validMethods.join(', ')}` }
  }

  return { valid: true }
}

/**
 * Validate role name
 */
export function validateRoleName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Role name is required' }
  }

  if (name.trim().length > 100) {
    return { valid: false, error: 'Role name must be 100 characters or less' }
  }

  if (name.trim().length < 2) {
    return { valid: false, error: 'Role name must be at least 2 characters' }
  }

  return { valid: true }
}

/**
 * Validate permissions array
 */
export function validatePermissions(permissions: string[]): { valid: boolean; error?: string } {
  if (!Array.isArray(permissions)) {
    return { valid: false, error: 'Permissions must be an array' }
  }

  const validPermissions = [
    'manage_group',
    'manage_members',
    'manage_content',
    'view_content',
    'create_content',
    'delete_content',
    'manage_roles',
    'invite_members',
    'remove_members',
    'create_events',
    'manage_events',
    '*',
  ]

  for (const permission of permissions) {
    if (!validPermissions.includes(permission)) {
      return { valid: false, error: `Invalid permission: ${permission}` }
    }
  }

  return { valid: true }
}

/**
 * Validate content
 */
export function validateContent(content: string): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Content is required' }
  }

  if (content.length > 50000) {
    return { valid: false, error: 'Content must be 50000 characters or less' }
  }

  return { valid: true }
}

/**
 * Validate email for invitation
 */
export function validateInvitationEmail(email?: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: true } // Email is optional if userId is provided
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }

  return { valid: true }
}
