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

export function useGroupPermissions(groupId: string, userId?: string) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<GroupRole | null>(null)
  const [permissions, setPermissions] = useState<GroupPermission[]>([])
  const [isMember, setIsMember] = useState(false)
  const [membership, setMembership] = useState<GroupMember | null>(null)

  useEffect(() => {
    async function loadPermissions() {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        // Get user's membership in the group
        const { data: memberData, error: memberError } = await supabaseClient
          .from('group_members')
          .select('user_id, role_id, status, joined_at')
          .eq('group_id', groupId)
          .eq('user_id', userId)
          .single()

        if (memberError) {
          if (memberError.code === 'PGRST116') { // Record not found
            setIsMember(false)
            setMembership(null)
            setRole(null)
            setPermissions([])
            setLoading(false)
            return
          }
          throw memberError
        }

        setIsMember(true)
        setMembership(memberData)

        // Get role details and permissions
        const { data: roleData, error: roleError } = await supabaseClient
          .from('group_roles')
          .select('*')
          .eq('id', memberData.role_id)
          .single()

        if (roleError) throw roleError

        setRole(roleData)
        setPermissions(roleData.permissions)
      } catch (err: any) {
        console.error('Error loading group permissions:', err)
        setError(err.message)
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
    return role?.name === 'Owner'
  }

  const isAdmin = () => {
    return role?.name === 'Owner' || role?.name === 'Admin'
  }

  return {
    loading,
    error,
    role,
    permissions,
    isMember,
    membership,
    hasPermission,
    isOwner,
    isAdmin
  }
} 