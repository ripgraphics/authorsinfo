"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { useGroupPermissions, GroupPermission } from '@/hooks/useGroupPermissions'
import type { Group } from '@/types/group'

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
    const initializeUser = async () => {
      try {
        console.log('Initializing user session...')
        const { data: { user }, error } = await supabaseClient.auth.getUser()
        
        // Handle AuthSessionMissingError gracefully - this is normal for public users
        if (error) {
          const errorName = (error as any)?.name || error?.constructor?.name || ''
          const errorMessage = error?.message || String(error) || ''
          const isSessionError = errorName === 'AuthSessionMissingError' || 
                                errorMessage.includes('session') || 
                                errorMessage.includes('Auth session missing')
          
          if (isSessionError) {
            // This is normal for public users - don't log as error
            console.log('No authenticated user (public user)')
            return
          }
          console.error('Error authenticating user:', error)
          throw error
        }
        
        console.log('User data:', user)
        if (user) {
          console.log('Current user:', user)
          setUserId(user.id)
        } else {
          console.log('No authenticated user')
        }

        // Set up auth state change listener
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event, session?.user)
          if (session?.user) {
            setUserId(session.user.id)
          } else {
            setUserId(undefined)
          }
        })

        return () => {
          subscription.unsubscribe()
        }
      } catch (err: any) {
        // Only log non-session errors
        const errorName = err?.name || err?.constructor?.name || ''
        const errorMessage = err?.message || String(err) || ''
        const isSessionError = errorName === 'AuthSessionMissingError' || 
                              errorMessage.includes('session') || 
                              errorMessage.includes('Auth session missing')
        
        if (!isSessionError) {
          console.error('Error initializing user:', err)
        }
      }
    }

    initializeUser()
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

  console.log('Group context state:', {
    userId,
    groupId,
    loading: permissionsLoading,
    error: permissionsError,
    isOwner: isOwner(),
    isAdmin: isAdmin(),
    isMember,
    group: group ? {
      id: group.id,
      name: group.name,
      created_by: group.created_by
    } : null
  })

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