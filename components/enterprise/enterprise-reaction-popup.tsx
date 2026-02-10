'use client'

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ThumbsUp,
  Heart,
  Smile,
  Star,
  AlertTriangle,
  Zap,
  MessageSquare,
  X,
  ChevronDown,
  TrendingUp,
} from 'lucide-react'
import type { ReactionType } from '@/lib/engagement/config'
import { REACTION_OPTIONS_METADATA } from '@/lib/engagement/config'
import { useEngagement, type EntityType } from '@/contexts/engagement-context'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

// ============================================================================
// ENTERPRISE-GRADE TYPE DEFINITIONS
// ============================================================================

export interface ReactionOption {
  type: ReactionType
  label: string
  icon: React.ReactNode
  color: string
  hoverColor: string
  bgColor: string
  hoverBgColor: string
  description: string
  emoji: string
  popularity?: number // For analytics
}

export interface ReactionPopupProps {
  entityId: string
  entityType: EntityType
  isVisible: boolean
  onClose: () => void
  className?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  currentReaction?: ReactionType | null
  showReactionCounts?: boolean
  showQuickReactions?: boolean
  maxQuickReactions?: number
  onReactionChange?: (reactionType: ReactionType | null) => void
  triggerRef?: React.RefObject<HTMLElement>
  autoPosition?: boolean
  theme?: 'light' | 'dark' | 'auto'
  size?: 'sm' | 'md' | 'lg'
  animation?: 'fade' | 'slide' | 'scale' | 'bounce'
  variant?: 'default' | 'facebook'
}

// ============================================================================
// REACTION CONFIGURATION (built from lib/engagement/config)
// ============================================================================

const REACTION_TYPE_ICONS: Record<ReactionType, React.ReactNode> = {
  like: <ThumbsUp className="h-5 w-5" />,
  love: <Heart className="h-5 w-5" />,
  care: <Heart className="h-5 w-5" />,
  haha: <Smile className="h-5 w-5" />,
  wow: <Star className="h-5 w-5" />,
  sad: <AlertTriangle className="h-5 w-5" />,
  angry: <Zap className="h-5 w-5" />,
}

function buildReactionOptions(): ReactionOption[] {
  return REACTION_OPTIONS_METADATA.map((meta) => ({
    type: meta.type,
    label: meta.label,
    icon: REACTION_TYPE_ICONS[meta.type],
    color: meta.color,
    hoverColor: meta.hoverColor,
    bgColor: meta.bgColor,
    hoverBgColor: meta.hoverBgColor,
    description: meta.description,
    emoji: meta.emoji,
    popularity: meta.popularity,
  }))
}

const REACTION_OPTIONS: ReactionOption[] = buildReactionOptions()

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EnterpriseReactionPopup({
  entityId,
  entityType,
  isVisible,
  onClose,
  className,
  position = 'bottom',
  currentReaction = null,
  showReactionCounts = true,
  showQuickReactions = true,
  maxQuickReactions = 3,
  onReactionChange,
  triggerRef,
  autoPosition = true,
  theme = 'auto',
  size = 'md',
  animation = 'fade',
  variant = 'facebook',
}: ReactionPopupProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { setReaction, getEngagement } = useEngagement()

  // State management
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null)
  const [selectedReaction, setSelectedReaction] = useState<ReactionType | null>(currentReaction)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [popupPosition, setPopupPosition] = useState(position)
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>(
    {} as Record<ReactionType, number>
  )
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Refs
  const popupRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ============================================================================
  // EFFECTS AND INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (isVisible && showReactionCounts) {
      fetchReactionCounts()
    }
  }, [isVisible, showReactionCounts, entityId, entityType])

  useEffect(() => {
    setSelectedReaction(currentReaction)
  }, [currentReaction])

  useEffect(() => {
    if (autoPosition && triggerRef?.current && isVisible) {
      calculateOptimalPosition()
    }
  }, [isVisible, autoPosition, triggerRef])

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const fetchReactionCounts = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/engagement/reactions/counts?entity_id=${entityId}&entity_type=${entityType}`
      )
      if (response.ok) {
        const data = await response.json()
        setReactionCounts(data.counts || {})
      }
    } catch (error) {
      console.error('Error fetching reaction counts:', error)
    }
  }, [entityId, entityType])

  const calculateOptimalPosition = useCallback(() => {
    if (!triggerRef?.current || !popupRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Calculate available space in each direction
    const spaceBelow = viewportHeight - triggerRect.bottom
    const spaceAbove = triggerRect.top
    const spaceRight = viewportWidth - triggerRect.right
    const spaceLeft = triggerRect.left

    // Determine optimal position
    let optimalPosition = position

    if (spaceBelow < 120 && spaceAbove > 120) {
      optimalPosition = 'top'
    } else if (spaceRight < 400 && spaceLeft > 400) {
      optimalPosition = 'left'
    } else if (spaceLeft < 400 && spaceRight > 400) {
      optimalPosition = 'right'
    } else {
      optimalPosition = 'bottom'
    }

    setPopupPosition(optimalPosition)
  }, [position, triggerRef])

  const getPositionClasses = useCallback(() => {
    const baseClasses = 'absolute z-50'

    switch (popupPosition) {
      case 'top':
        return `${baseClasses} bottom-full mb-2 left-1/2 transform -translate-x-1/2`
      case 'bottom':
        return `${baseClasses} top-full mt-2 left-1/2 transform -translate-x-1/2`
      case 'left':
        return `${baseClasses} right-full mr-2 top-1/2 transform -translate-y-1/2`
      case 'right':
        return `${baseClasses} left-full ml-2 top-1/2 transform -translate-y-1/2`
      default:
        return `${baseClasses} top-full mt-2 left-1/2 transform -translate-x-1/2`
    }
  }, [popupPosition])

  const getSizeClasses = useCallback(() => {
    if (variant === 'facebook') {
      return 'p-1.5 gap-1.5'
    }

    switch (size) {
      case 'sm':
        return 'p-2 gap-1'
      case 'lg':
        return 'p-4 gap-2'
      default:
        return 'p-3 gap-1.5'
    }
  }, [size, variant])

  const getAnimationClasses = useCallback(() => {
    const baseClasses = 'transition-all duration-200 ease-out animate-in'

    switch (animation) {
      case 'slide':
        return `${baseClasses} slide-in-from-bottom-2`
      case 'scale':
        return `${baseClasses} zoom-in-95`
      case 'bounce':
        return `${baseClasses} zoom-in-95 animate-bounce`
      default:
        return `${baseClasses} fade-in`
    }
  }, [animation])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleReactionClick = useCallback(
    async (reactionType: ReactionType) => {
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to react to content',
          variant: 'destructive',
        })
        return
      }

      if (isSubmitting) return

      setIsSubmitting(true)

      try {
        const success = await setReaction(entityId, entityType, reactionType)

        if (success) {
          const newReaction = selectedReaction === reactionType ? null : reactionType
          setSelectedReaction(newReaction)

          if (onReactionChange) {
            onReactionChange(newReaction)
          }

          // Update local counts
          if (newReaction) {
            setReactionCounts((prev) => ({
              ...prev,
              [reactionType]: (prev[reactionType] || 0) + 1,
            }))
          } else {
            setReactionCounts((prev) => ({
              ...prev,
              [reactionType]: Math.max(0, (prev[reactionType] || 0) - 1),
            }))
          }

          // Auto-close after successful reaction
          if (newReaction) {
            timeoutRef.current = setTimeout(() => {
              onClose()
            }, 1000)
          }
        }
      } catch (error) {
        console.error('Error setting reaction:', error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      user,
      entityId,
      entityType,
      selectedReaction,
      isSubmitting,
      setReaction,
      onReactionChange,
      onClose,
      toast,
    ]
  )

  const handleMouseEnter = useCallback((reactionType: ReactionType) => {
    setHoveredReaction(reactionType)

    // Clear auto-close timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredReaction(null)
  }, [])

  const handleClose = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    onClose()
  }, [onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    },
    [handleClose]
  )

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderReactionButton = useCallback(
    (reaction: ReactionOption) => {
      const isCurrentReaction = selectedReaction === reaction.type
      const isHovered = hoveredReaction === reaction.type
      const count = reactionCounts[reaction.type] || 0

      return (
        <Tooltip key={reaction.type}>
          <TooltipTrigger asChild>
            <div
              className="relative group"
              onMouseEnter={() => handleMouseEnter(reaction.type)}
              onMouseLeave={handleMouseLeave}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReactionClick(reaction.type)}
                disabled={isSubmitting}
                className={cn(
                  'relative rounded-full transition-all duration-300 ease-out',
                  'flex flex-col items-center justify-center',
                  'transform hover:scale-150 hover:-translate-y-2 active:scale-95',
                  variant === 'facebook' ? 'w-10 h-10 text-2xl' : 'w-12 h-12 text-lg gap-1',
                  isCurrentReaction
                    ? `${reaction.color} ${reaction.bgColor} shadow-sm`
                    : 'text-gray-600 hover:text-gray-800',
                  isHovered &&
                  !isCurrentReaction &&
                  `${reaction.hoverColor} ${reaction.hoverBgColor}`,
                  getAnimationClasses()
                )}
              >
                {/* Reaction Icon */}
                <div>{reaction.emoji}</div>

                {/* Reaction Count (if enabled and not facebook variant) */}
                {variant !== 'facebook' && showReactionCounts && count > 0 && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs',
                      'bg-white border border-gray-200 text-gray-700'
                    )}
                  >
                    {count > 99 ? '99+' : count}
                  </Badge>
                )}
              </Button>
            </div>
          </TooltipTrigger>

          <TooltipContent
            side={popupPosition === 'top' ? 'top' : 'bottom'}
            sideOffset={variant === 'facebook' ? 20 : 5}
            className="rounded-full text-white border-0 px-3 py-1 shadow-lg"
            style={{ backgroundColor: '#40A3D8' }}
          >
            <div className="text-center">
              <div className="font-bold text-xs">{reaction.label}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      )
    },
    [
      selectedReaction,
      hoveredReaction,
      reactionCounts,
      isSubmitting,
      showReactionCounts,
      popupPosition,
      variant,
      handleReactionClick,
      handleMouseEnter,
      handleMouseLeave,
      getAnimationClasses,
    ]
  )

  const renderQuickReactions = useCallback(() => {
    if (!showQuickReactions) return null

    const quickReactions = REACTION_OPTIONS.sort(
      (a, b) => (b.popularity || 0) - (a.popularity || 0)
    ).slice(0, maxQuickReactions)

    return (
      <div className="flex items-center gap-1 mb-2">
        {quickReactions.map((reaction) => (
          <Button
            key={reaction.type}
            variant="ghost"
            size="sm"
            onClick={() => handleReactionClick(reaction.type)}
            disabled={isSubmitting}
            className={cn(
              'w-8 h-8 p-0 rounded-full text-sm transition-all duration-200',
              'hover:scale-110 active:scale-95',
              selectedReaction === reaction.type
                ? `${reaction.color} ${reaction.bgColor}`
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            )}
          >
            {reaction.emoji}
          </Button>
        ))}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-8 h-8 p-0 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              showAdvanced && 'rotate-180'
            )}
          />
        </Button>
      </div>
    )
  }, [
    showQuickReactions,
    maxQuickReactions,
    selectedReaction,
    isSubmitting,
    showAdvanced,
    handleReactionClick,
  ])

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  const totalReactionCount = Object.values(reactionCounts).reduce((a, b) => a + b, 0)
  const reactionSummaryText = selectedReaction
    ? `You reacted with ${selectedReaction}. ${totalReactionCount} ${totalReactionCount === 1 ? 'reaction' : 'reactions'} total.`
    : `${totalReactionCount} ${totalReactionCount === 1 ? 'reaction' : 'reactions'}.`

  if (!isVisible) return null

  return (
    <TooltipProvider>
      <div
        ref={popupRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reaction-popup-title"
        className={cn(
          'absolute z-50 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-gray-100',
          'backdrop-blur-md bg-white/98',
          variant === 'facebook' ? 'rounded-full px-1 py-1' : 'rounded-2xl p-4',
          getPositionClasses(),
          getAnimationClasses(),
          className
        )}
        data-reaction-popup
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Live region for screen readers: reaction summary */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {reactionSummaryText}
        </div>

        {variant === 'facebook' ? (
          <div className="flex items-center gap-0.5">
            {REACTION_OPTIONS.map(renderReactionButton)}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 id="reaction-popup-title" className="text-sm font-semibold text-gray-700">
                React to this {entityType}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="w-6 h-6 p-0 text-gray-400 hover:text-gray-600"
                aria-label="Close reaction menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Reactions */}
            {renderQuickReactions()}

            {/* Full Reaction Grid */}
            {showAdvanced && (
              <div className="grid grid-cols-4 gap-2">
                {REACTION_OPTIONS.map(renderReactionButton)}
              </div>
            )}

            {/* Footer */}
            <div className="mt-3 pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500 text-center">
                Click to {selectedReaction ? 'change or remove' : 'add'} your reaction
              </div>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}

// ============================================================================
// SPECIALIZED COMPONENTS FOR DIFFERENT USE CASES
// ============================================================================

export function QuickReactionButton({
  entityId,
  entityType,
  reactionType,
  className,
  showCount = true,
  size = 'sm',
}: {
  entityId: string
  entityType: EntityType
  reactionType: ReactionType
  className?: string
  showCount?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const { setReaction, getEngagement } = useEngagement()
  const { user } = useAuth()
  const { toast } = useToast()

  const engagement = getEngagement(entityId, entityType)
  const isSelected = engagement?.userReaction === reactionType
  const count = engagement?.reactionCount || 0

  const handleClick = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to react to content',
        variant: 'destructive',
      })
      return
    }

    await setReaction(entityId, entityType, reactionType)
  }

  const reaction = REACTION_OPTIONS.find((r) => r.type === reactionType)
  if (!reaction) return null

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(
        'relative rounded-full transition-all duration-200',
        'hover:scale-110 active:scale-95',
        sizeClasses[size],
        isSelected
          ? `${reaction.color} ${reaction.bgColor} shadow-md`
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
        className
      )}
    >
      {reaction.emoji}

      {showCount && count > 0 && (
        <Badge
          variant="secondary"
          className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs bg-white border border-gray-200 text-gray-700"
        >
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </Button>
  )
}

export function ReactionSummary({
  entityId,
  entityType,
  className,
  maxReactions = 5,
}: {
  entityId: string
  entityType: EntityType
  className?: string
  maxReactions?: number
}) {
  const { getEngagement } = useEngagement()
  const engagement = getEngagement(entityId, entityType)
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>(
    {} as Record<ReactionType, number>
  )

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await fetch(
          `/api/engagement/reactions/counts?entity_id=${entityId}&entity_type=${entityType}`
        )
        if (response.ok) {
          const data = await response.json()
          setReactionCounts(data.counts || {})
        }
      } catch (error) {
        console.error('Error fetching reaction counts:', error)
      }
    }
    fetchCounts()
  }, [entityId, entityType])

  // Check if we have any reactions at all from the fetched counts
  const totalReactionCount = Object.values(reactionCounts || {}).reduce((a, b) => a + b, 0)
  if (totalReactionCount === 0) return null

  const topReactions = Object.entries(reactionCounts || {})
    .filter(([_, count]) => count > 0)
    .sort(([_, a], [__, b]) => (b as number) - (a as number))
    .slice(0, maxReactions)

  if (topReactions.length === 0) return null

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {topReactions.map(([reactionType, count]) => {
        const reaction = REACTION_OPTIONS.find((r) => r.type === (reactionType as ReactionType))
        if (!reaction) return null

        return (
          <div key={reactionType} className="flex items-center gap-1">
            <span className="text-sm">{reaction.emoji}</span>
            <span className="text-xs text-gray-600">{count}</span>
          </div>
        )
      })}

      {engagement && engagement.reactionCount > maxReactions && (
        <span className="text-xs text-gray-500">
          +{engagement.reactionCount - maxReactions} more
        </span>
      )}
    </div>
  )
}
