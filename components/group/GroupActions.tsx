"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, UserPlus, Heart } from 'lucide-react'
import { FollowButton } from '@/components/follow-button'

interface GroupActionsProps {
  groupId: string
  groupName: string
  isPrivate: boolean
  isMember: boolean
  onJoinChange?: () => void
}

export function GroupActions({ 
  groupId, 
  groupName, 
  isPrivate, 
  isMember,
  onJoinChange 
}: GroupActionsProps) {
  const [isJoining, setIsJoining] = useState(false)
  const { toast } = useToast()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const handleJoin = async () => {
    setIsJoining(true)
    try {
      // Get the default member role
      const { data: defaultRole } = await supabase
        .from('group_roles')
        .select('id')
        .eq('group_id', groupId)
        .eq('is_default', true)
        .single()

      if (!defaultRole) {
        throw new Error('Default role not found')
      }

      // Add user as member
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          role_id: defaultRole.id,
          status: 'active',
          joined_at: new Date().toISOString()
        })

      if (error) throw error

      toast({
        title: "Success",
        description: `You have joined ${groupName}`
      })

      onJoinChange?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to join group',
        variant: "destructive"
      })
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!isMember && !isPrivate && (
        <Button
          variant="default"
          onClick={handleJoin}
          disabled={isJoining}
        >
          {isJoining ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Join Group
            </>
          )}
        </Button>
      )}
      <FollowButton
        entityId={groupId}
        targetType="group"
        entityName={groupName}
        variant="outline"
      />
    </div>
  )
} 