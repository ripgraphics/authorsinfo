'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, UserPlus, Heart } from 'lucide-react'
import { FollowButton } from '@/components/follow-button'
import { joinGroup } from '@/app/actions/groups/manage-members'
import { useAuth } from '@/hooks/useAuth'
import { useButtonOverflow } from '@/hooks/use-button-overflow'
import { ResponsiveActionButton } from '@/components/ui/responsive-action-button'

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
  onJoinChange,
}: GroupActionsProps) {
  const { user } = useAuth()
  const [isJoining, setIsJoining] = useState(false)
  const { toast } = useToast()
  const actionsContainerRef = useRef<HTMLDivElement>(null)
  const isCompact = useButtonOverflow(actionsContainerRef, 350, false)

  const handleJoin = async () => {
    setIsJoining(true)
    try {
      const result = await joinGroup(groupId)

      if (!result.success) {
        console.error('Join group failed:', result.error)
        toast({
          title: 'Error',
          description: result.error || 'Failed to join group',
          variant: 'destructive',
        })
        setIsJoining(false)
        return
      }

      // Show toast with sufficient delay to ensure it's visible before reload
      toast({
        title: 'Success',
        description:
          result.member?.status === 'pending'
            ? `Your request to join ${groupName} has been submitted and is pending approval`
            : `You have joined ${groupName}`,
      })

      // Call callback or reload after a delay to allow toast to display
      if (onJoinChange) {
        // Increased delay to ensure toast is visible
        setTimeout(() => {
          onJoinChange()
        }, 1500)
      } else {
        // Fallback to page reload with longer delay to show toast
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch (error: any) {
      console.error('Error joining group:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to join group',
        variant: 'destructive',
      })
      setIsJoining(false)
    }
  }

  // Don't show action buttons if user is not logged in
  if (!user) {
    return null
  }

  return (
    <div ref={actionsContainerRef} className="flex items-center gap-2">
      {!isMember && !isPrivate && (
        <ResponsiveActionButton
          icon={
            isJoining ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )
          }
          label={isJoining ? 'Joining...' : 'Join Group'}
          tooltip={isJoining ? 'Joining...' : 'Join Group'}
          compact={isCompact}
          variant="default"
          size="sm"
          onClick={handleJoin}
          disabled={isJoining}
        />
      )}
      <FollowButton
        entityId={groupId}
        targetType="group"
        entityName={groupName}
        variant="outline"
        showText={!isCompact}
      />
    </div>
  )
}
