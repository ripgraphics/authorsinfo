'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { ResponsiveActionButton } from '@/components/ui/responsive-action-button'
import { useToast } from '@/hooks/use-toast'

export interface MessageButtonProps {
  targetUserId?: string
  targetUserPermalink?: string
  label?: string
  tooltip?: string
  compact?: boolean
  variant?: React.ComponentProps<typeof ResponsiveActionButton>['variant']
  size?: React.ComponentProps<typeof ResponsiveActionButton>['size']
  className?: string
  onClick?: () => void
  onConversationCreated?: (conversationId: string) => void
}

export function MessageButton({
  targetUserId,
  targetUserPermalink,
  label = 'Message',
  tooltip = 'Message',
  compact = false,
  variant = 'default',
  size = 'sm',
  className,
  onClick,
  onConversationCreated,
}: MessageButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const openConversation = async () => {
    if (onClick) {
      onClick()
      return
    }
    if ((!targetUserId && !targetUserPermalink) || loading) return
    setLoading(true)
    try {
      const response = await fetch('/api/messages/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(targetUserId ? { user_id: targetUserId } : {}),
          ...(targetUserPermalink ? { user_permalink: targetUserPermalink } : {}),
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        toast({
          title: 'Unable to open messages',
          description: data.error || 'Please try again.',
        })
        return
      }
      onConversationCreated?.(data.id)
      router.push(`/messages/direct/${data.id}`)
    } catch {
      toast({ title: 'Unable to open messages', description: 'Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveActionButton
      icon={<MessageSquare className="message-button__icon h-4 w-4" />}
      label={loading ? 'Opening...' : label}
      tooltip={tooltip}
      compact={compact}
      variant={variant}
      size={size}
      className={className}
      onClick={() => void openConversation()}
      disabled={loading}
      aria-label={label}
    />
  )
}
