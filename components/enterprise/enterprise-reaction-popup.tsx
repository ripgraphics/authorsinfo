'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
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
  TrendingUp
} from 'lucide-react'
import { useEngagement, ReactionType, EntityType } from '@/contexts/engagement-context'
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
}

// ============================================================================
// REACTION CONFIGURATION
// ============================================================================

const REACTION_OPTIONS: ReactionOption[] = [
  {
    type: 'like',
    label: 'Like',
    icon: <ThumbsUp className="h-5 w-5" />,
    color: 'text-blue-600',
    hoverColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    hoverBgColor: 'hover:bg-blue-100',
    description: 'Show appreciation',
    emoji: '👍',
    popularity: 85
  },
  {
    type: 'love',
    label: 'Love',
    icon: <Heart className="h-5 w-5" />,
    color: 'text-red-500',
    hoverColor: 'text-red-600',
    bgColor: 'bg-red-50',
    hoverBgColor: 'hover:bg-red-100',
    description: 'Express love and affection',
    emoji: '❤️',
    popularity: 78
  },
  {
    type: 'care',
    label: 'Care',
    icon: <Heart className="h-5 w-5" />,
    color: 'text-yellow-500',
    hoverColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    hoverBgColor: 'hover:bg-yellow-100',
    description: 'Show care and support',
    emoji: '🤗',
    popularity: 65
  },
  {
    type: 'haha',
    label: 'Haha',
    icon: <Smile className="h-5 w-5" />,
    color: 'text-yellow-500',
    hoverColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    hoverBgColor: 'hover:bg-yellow-100',
    description: 'Find it funny',
    emoji: '😂',
    popularity: 72
  },
  {
    type: 'wow',
    label: 'Wow',
    icon: <Star className="h-5 w-5" />,
    color: 'text-purple-500',
    hoverColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    hoverBgColor: 'hover:bg-purple-100',
    description: 'Be amazed',
    emoji: '😮',
    popularity: 58
  },
  {
    type: 'sad',
    label: 'Sad',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'text-blue-500',
    hoverColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    hoverBgColor: 'hover:bg-blue-100',
    description: 'Feel sad about it',
    emoji: '😢',
    popularity: 45
  },
  {
    type: 'angry',
    label: 'Angry',
    icon: <Zap className="h-5 w-5" />,
    color: 'text-red-600',
    hoverColor: 'text-red-700',
    bgColor: 'bg-red-50',
    hoverBgColor: 'hover:bg-red-100',
    description: 'Feel angry about it',
    emoji: '😠',
    popularity: 32
  }
]

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
  animation = 'fade'
}: ReactionPopupProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { setReaction, getEngagement } = useEngagement()
  
  // State management
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null)
  const [selectedReaction, setSelectedReaction] = useState<ReactionType | null>(currentReaction)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [popupPosition, setPopupPosition] = useState(position)
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>({} as Record<ReactionType, number>)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Refs
  const popupRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  
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
      const response = await fetch(`/api/engagement/reactions/counts?entity_id=${entityId}&entity_type=${entityType}`)
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
    const baseClasses = "absolute z-50"
    
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
    switch (size) {
      case 'sm':
        return 'p-2 gap-1'
      case 'lg':
        return 'p-4 gap-2'
      default:
        return 'p-3 gap-1.5'
    }
  }, [size])
  
  const getAnimationClasses = useCallback(() => {
    const baseClasses = "transition-all duration-200 ease-out"
    
    switch (animation) {
      case 'slide':
        return `${baseClasses} transform`
      case 'scale':
        return `${baseClasses} transform scale-95 hover:scale-100`
      case 'bounce':
        return `${baseClasses} transform hover:animate-bounce`
      default:
        return `${baseClasses} opacity-0 hover:opacity-100`
    }
  }, [animation])
  
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  const handleReactionClick = useCallback(async (reactionType: ReactionType) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to react to content",
        variant: "destructive"
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
          setReactionCounts(prev => ({
            ...prev,
            [reactionType]: (prev[reactionType] || 0) + 1
          }))
        } else {
          setReactionCounts(prev => ({
            ...prev,
            [reactionType]: Math.max(0, (prev[reactionType] || 0) - 1)
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
  }, [user, entityId, entityType, selectedReaction, isSubmitting, setReaction, onReactionChange, onClose, toast])
  
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
  
  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================
  
  const renderReactionButton = useCallback((reaction: ReactionOption) => {
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
                "relative w-12 h-12 p-0 rounded-full transition-all duration-200 ease-out",
                "flex flex-col items-center justify-center gap-1",
                "transform hover:scale-110 active:scale-95",
                isCurrentReaction 
                  ? `${reaction.color} ${reaction.bgColor} shadow-md` 
                  : "text-gray-600 hover:text-gray-800",
                isHovered && !isCurrentReaction && `${reaction.hoverColor} ${reaction.hoverBgColor}`,
                getAnimationClasses()
              )}
            >
              {/* Reaction Icon */}
              <div className="text-lg">
                {reaction.emoji}
              </div>
              
              {/* Reaction Count (if enabled) */}
              {showReactionCounts && count > 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs",
                    "bg-white border border-gray-200 text-gray-700"
                  )}
                >
                  {count > 99 ? '99+' : count}
                </Badge>
              )}
              
              {/* Selection Indicator */}
              {isCurrentReaction && (
                <div className={cn(
                  "absolute inset-0 rounded-full border-2",
                  "border-current opacity-20"
                )} />
              )}
            </Button>
          </div>
        </TooltipTrigger>
        
        <TooltipContent 
          side={popupPosition === 'top' ? 'bottom' : 'top'}
          className="max-w-xs"
        >
          <div className="text-center">
            <div className="font-semibold text-sm">{reaction.label}</div>
            <div className="text-xs text-gray-500">{reaction.description}</div>
            {showReactionCounts && count > 0 && (
              <div className="text-xs text-gray-400 mt-1">
                {count} {count === 1 ? 'person' : 'people'} reacted
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }, [
    selectedReaction, 
    hoveredReaction, 
    reactionCounts, 
    isSubmitting, 
    showReactionCounts, 
    popupPosition,
    handleReactionClick, 
    handleMouseEnter, 
    handleMouseLeave, 
    getAnimationClasses
  ])
  
  const renderQuickReactions = useCallback(() => {
    if (!showQuickReactions) return null
    
    const quickReactions = REACTION_OPTIONS
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, maxQuickReactions)
    
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
              "w-8 h-8 p-0 rounded-full text-sm transition-all duration-200",
              "hover:scale-110 active:scale-95",
              selectedReaction === reaction.type 
                ? `${reaction.color} ${reaction.bgColor}` 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform duration-200",
            showAdvanced && "rotate-180"
          )} />
        </Button>
      </div>
    )
  }, [
    showQuickReactions, 
    maxQuickReactions, 
    selectedReaction, 
    isSubmitting, 
    showAdvanced, 
    handleReactionClick
  ])
  
  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  
  if (!isVisible) return null
  
  return (
    <TooltipProvider>
      <div className="fixed inset-0 z-50" onClick={handleClose}>
        <div 
          ref={popupRef}
          className={cn(
            "bg-white rounded-2xl shadow-2xl border border-gray-200",
            "backdrop-blur-sm bg-white/95",
            getPositionClasses(),
            getSizeClasses(),
            getAnimationClasses(),
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              React to this {entityType}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="w-6 h-6 p-0 text-gray-400 hover:text-gray-600"
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
        </div>
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
  size = 'sm'
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
        title: "Authentication required",
        description: "Please log in to react to content",
        variant: "destructive"
      })
      return
    }
    
    await setReaction(entityId, entityType, reactionType)
  }
  
  const reaction = REACTION_OPTIONS.find(r => r.type === reactionType)
  if (!reaction) return null
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  }
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(
        "relative rounded-full transition-all duration-200",
        "hover:scale-110 active:scale-95",
        sizeClasses[size],
        isSelected 
          ? `${reaction.color} ${reaction.bgColor} shadow-md` 
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
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
  maxReactions = 5
}: {
  entityId: string
  entityType: EntityType
  className?: string
  maxReactions?: number
}) {
  const { getEngagement } = useEngagement()
  const engagement = getEngagement(entityId, entityType)
  
  if (!engagement || engagement.reactionCount === 0) return null
  
  const topReactions = Object.entries(reactionCounts || {})
    .filter(([_, count]) => count > 0)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, maxReactions)
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {topReactions.map(([reactionType, count]) => {
        const reaction = REACTION_OPTIONS.find(r => r.type === reactionType as ReactionType)
        if (!reaction) return null
        
        return (
          <div key={reactionType} className="flex items-center gap-1">
            <span className="text-sm">{reaction.emoji}</span>
            <span className="text-xs text-gray-600">{count}</span>
          </div>
        )
      })}
      
      {engagement.reactionCount > maxReactions && (
        <span className="text-xs text-gray-500">
          +{engagement.reactionCount - maxReactions} more
        </span>
      )}
    </div>
  )
}
