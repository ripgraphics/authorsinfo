'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  ThumbsUp,
  Heart,
  Smile,
  Star,
  AlertTriangle,
  Zap,
  MessageSquare
} from 'lucide-react'

export type ReactionType = 'like' | 'love' | 'care' | 'haha' | 'wow' | 'sad' | 'angry'

export interface ReactionOption {
  type: ReactionType
  label: string
  icon: React.ReactNode
  color: string
  hoverColor: string
  bgColor: string
  hoverBgColor: string
}

export interface ReactionPopupProps {
  isVisible: boolean
  onReactionSelect: (reactionType: ReactionType) => void
  onClose: () => void
  className?: string
  position?: 'top' | 'bottom'
  currentReaction?: ReactionType | null
}

const REACTION_OPTIONS: ReactionOption[] = [
  {
    type: 'like',
    label: 'Like',
    icon: <ThumbsUp className="h-5 w-5" />,
    color: 'text-blue-600',
    hoverColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    hoverBgColor: 'hover:bg-blue-100'
  },
  {
    type: 'love',
    label: 'Love',
    icon: <Heart className="h-5 w-5" />,
    color: 'text-red-500',
    hoverColor: 'text-red-600',
    bgColor: 'bg-red-50',
    hoverBgColor: 'hover:bg-red-100'
  },
  {
    type: 'care',
    label: 'Care',
    icon: <Heart className="h-5 w-5" />,
    color: 'text-yellow-500',
    hoverColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    hoverBgColor: 'hover:bg-yellow-100'
  },
  {
    type: 'haha',
    label: 'Haha',
    icon: <Smile className="h-5 w-5" />,
    color: 'text-yellow-500',
    hoverColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    hoverBgColor: 'hover:bg-yellow-100'
  },
  {
    type: 'wow',
    label: 'Wow',
    icon: <Star className="h-5 w-5" />,
    color: 'text-purple-500',
    hoverColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    hoverBgColor: 'hover:bg-purple-100'
  },
  {
    type: 'sad',
    label: 'Sad',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'text-blue-500',
    hoverColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    hoverBgColor: 'hover:bg-blue-100'
  },
  {
    type: 'angry',
    label: 'Angry',
    icon: <Zap className="h-5 w-5" />,
    color: 'text-red-600',
    hoverColor: 'text-red-700',
    bgColor: 'bg-red-50',
    hoverBgColor: 'hover:bg-red-100'
  }
]

export function ReactionPopup({
  isVisible,
  onReactionSelect,
  onClose,
  className,
  position = 'bottom',
  currentReaction
}: ReactionPopupProps) {
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null)

  const handleReactionClick = useCallback((reactionType: ReactionType) => {
    onReactionSelect(reactionType)
    onClose()
  }, [onReactionSelect, onClose])

  const handleMouseEnter = useCallback((reactionType: ReactionType) => {
    setHoveredReaction(reactionType)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredReaction(null)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div 
        className={cn(
          "absolute z-10 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2",
          "transform transition-all duration-200 ease-out",
          position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Reaction Options Grid */}
        <div className="flex items-center gap-1">
          {REACTION_OPTIONS.map((reaction) => {
            const isCurrentReaction = currentReaction === reaction.type
            const isHovered = hoveredReaction === reaction.type
            
            return (
              <div
                key={reaction.type}
                className="relative group"
                onMouseEnter={() => handleMouseEnter(reaction.type)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Reaction Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReactionClick(reaction.type)}
                  className={cn(
                    "w-12 h-12 p-0 rounded-full transition-all duration-200 ease-out",
                    "flex items-center justify-center",
                    isCurrentReaction 
                      ? `${reaction.color} ${reaction.bgColor}` 
                      : "text-gray-600 hover:text-gray-800",
                    isHovered && !isCurrentReaction && `${reaction.hoverColor} ${reaction.hoverBgColor}`,
                    "transform hover:scale-110 active:scale-95"
                  )}
                >
                  {reaction.icon}
                </Button>
                
                {/* Tooltip */}
                {isHovered && (
                  <div className={cn(
                    "absolute z-20 bg-gray-900 text-white text-xs px-2 py-1 rounded-sm",
                    "whitespace-nowrap pointer-events-none",
                    "transform transition-all duration-200 ease-out",
                    position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
                    "left-1/2 transform -translate-x-1/2"
                  )}>
                    {reaction.label}
                    {/* Tooltip Arrow */}
                    <div className={cn(
                      "absolute w-2 h-2 bg-gray-900 transform rotate-45",
                      position === 'top' ? 'top-full -mt-1' : 'bottom-full -mb-1',
                      "left-1/2 transform -translate-x-1/2"
                    )} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
