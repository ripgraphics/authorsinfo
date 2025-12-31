import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabase/client'

export type GroupPermission =
  | 'manage_group'
  | 'manage_members'
  | 'manage_content'
  | 'view_content'
  | 'create_content'
  | 'delete_content'
  | 'manage_roles'
  | 'invite_members'
  | 'remove_members'
  | 'create_events'
  | 'manage_events'

interface GroupRole {
  id: number
  name: string
  description: string
  permissions: GroupPermission[]
  is_default: boolean
}

interface GroupMember {
  user_id: string
  role_id: number
  status: 'active' | 'inactive' | 'banned'
  joined_at: string
}

export function useGroupPermissions(groupId: string | null, userId?: string) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<GroupRole | null>(null)
  const [permissions, setPermissions] = useState<GroupPermission[]>([])
  const [isMember, setIsMember] = useState(false)
  const [membership, setMembership] = useState<GroupMember | null>(null)
  const [isCreator, setIsCreator] = useState(false)

  useEffect(() => {
    async function loadPermissions() {
      // If no group ID, return early with default values
      if (!groupId) {
        setLoading(false)
        setIsMember(false)
        setMembership(null)
        setRole(null)
        setPermissions([])
        setIsCreator(false)
        return
      }

      if (!userId) {
        console.log('Waiting for userId to be available...')
        setLoading(true)
        return
      }

      try {
        console.log('Loading permissions for user:', userId, 'in group:', groupId)

        // First check if user is the group creator
        const { data: groupData, error: groupError } = await supabaseClient
          .from('groups')
          .select('created_by')
          .eq('id', groupId)
          .single()

        if (groupError) throw groupError

        const isGroupCreator = (groupData as any).created_by === userId
        console.log('Is group creator:', isGroupCreator)
        setIsCreator(isGroupCreator)

        // If user is creator, they automatically have all permissions
        if (isGroupCreator) {
          setIsMember(true)
          setPermissions([
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
          ])
          setLoading(false)
          return
        }

        // Get user's membership in the group
        const { data: memberData, error: memberError } = await supabaseClient
          .from('group_members')
          .select('user_id, role_id, status, joined_at')
          .eq('group_id', groupId)
          .eq('user_id', userId)
          .single()

        if (memberError) {
          if (memberError.code === 'PGRST116') {
            // Record not found
            console.log('User is not a member of the group')
            setIsMember(false)
            setMembership(null)
            setRole(null)
            setPermissions([])
            setLoading(false)
            return
          }
          throw memberError
        }

        console.log('User membership data:', memberData)
        setIsMember(true)
        setMembership(memberData)

        // Get role details and permissions
        const roleId = (memberData as any).role_id

        // If role_id is null or undefined, set default permissions for members
        if (!roleId) {
          console.log('No role_id found for member, using default member permissions')
          setRole(null)
          setPermissions(['view_content', 'create_content']) // Default member permissions
          setLoading(false)
          return
        }

        const { data: roleData, error: roleError } = await supabaseClient
          .from('group_roles')
          .select('id, name, display_name, permissions, is_default, created_at')
          .eq('id', roleId)
          .single()

        if (roleError) {
          // If role doesn't exist, use default member permissions
          console.warn('Role not found, using default member permissions:', roleError)
          setRole(null)
          setPermissions(['view_content', 'create_content']) // Default member permissions
          setLoading(false)
          return
        }

        console.log('User role data:', roleData)
        setRole(roleData)
        setPermissions((roleData as any).permissions || ['view_content', 'create_content'])
      } catch (err: any) {
        console.error('Error loading group permissions:', err)
        // Only set error message if it exists and is a string
        const errorMessage = err?.message || err?.toString() || 'Unknown error occurred'
        setError(typeof errorMessage === 'string' ? errorMessage : 'Error loading permissions')
      } finally {
        setLoading(false)
      }
    }

    loadPermissions()
  }, [groupId, userId])

  const hasPermission = (permission: GroupPermission) => {
    return permissions.includes(permission)
  }

  const isOwner = () => {
    // If we're still loading, return false
    if (loading) return false
    // If user is creator, they are automatically the owner
    if (isCreator) return true
    // If we have a role, check if it's Owner
    if (role) return role.name === 'Owner'
    return false
  }

  const isAdmin = () => {
    // If we're still loading, return false
    if (loading) return false
    // If user is creator, they are automatically an admin
    if (isCreator) return true
    // If we have a role, check if it's Owner or Admin
    if (role) return role.name === 'Owner' || role.name === 'Admin'
    return false
  }

  return {
    loading,
    error,
    role,
    permissions,
    isMember,
    membership,
    isCreator,
    hasPermission,
    isOwner,
    isAdmin,
  }
}
