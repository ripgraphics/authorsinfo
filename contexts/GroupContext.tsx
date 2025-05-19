"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { useGroupPermissions, GroupPermission } from '@/hooks/useGroupPermissions'

interface Group {
  id: string
  name: string
  description: string | null
  is_private: boolean
  created_by: string
  created_at: string
  cover_image_url: string | null
  member_count: number
}

interface GroupContextValue {
  group: Group | null
  loading: boolean
  error: string | null
  permissions: {
    loading: boolean
    error: string | null
    hasPermission: (permission: GroupPermission) => boolean
    isOwner: () => boolean
    isAdmin: () => boolean
    isMember: boolean
  }
  refreshGroup: () => Promise<void>
}

const GroupContext = createContext<GroupContextValue | undefined>(undefined)

export function GroupProvider({
  groupId,
  children
}: {
  groupId: string
  children: ReactNode
}) {
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | undefined>()

  // Get current user
  useEffect(() => {
    supabaseClient.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id)
    })
  }, [])

  // Get group permissions
  const {
    loading: permissionsLoading,
    error: permissionsError,
    hasPermission,
    isOwner,
    isAdmin,
    isMember
  } = useGroupPermissions(groupId, userId)

  const loadGroup = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: groupError } = await supabaseClient
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (groupError) throw groupError

      setGroup(data)
    } catch (err: any) {
      console.error('Error loading group:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Load group data
  useEffect(() => {
    loadGroup()
  }, [groupId])

  // Subscribe to realtime changes
  useEffect(() => {
    const subscription = supabaseClient
      .channel(`group:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups',
          filter: `id=eq.${groupId}`
        },
        loadGroup
      )
      .subscribe()

    return () => {
      supabaseClient.removeChannel(subscription)
    }
  }, [groupId])

  const value: GroupContextValue = {
    group,
    loading,
    error,
    permissions: {
      loading: permissionsLoading,
      error: permissionsError,
      hasPermission,
      isOwner,
      isAdmin,
      isMember
    },
    refreshGroup: loadGroup
  }

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  )
}

export function useGroup() {
  const context = useContext(GroupContext)
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider')
  }
  return context
} 