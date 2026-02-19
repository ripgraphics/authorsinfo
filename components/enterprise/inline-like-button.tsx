'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { EnterpriseReactionPopup } from '@/components/enterprise/enterprise-reaction-popup'
import { useEngagement, ReactionType } from '@/contexts/engagement-context'
import type { EntityType } from '@/lib/engagement/config'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/**
 * InlineLikeButton
 *
 * A fully reusable inline "Like" button with a reaction popup on hover/click.
 * Uses an 800ms delayed-close pattern so users can move their cursor to the popup.
 *
 * Drop this component anywhere an entity can be liked — comment threads,
 * feed cards, media items, etc.
 *
 * Uses the global `.hover-app-theme` and `.action-small-pad` CSS utility classes.
 */

export interface InlineLikeButtonProps {
  /** Entity ID for the reaction */
  entityId: string
  /** Entity type for the engagement system */
  entityType: EntityType
  /** Label text displayed on the button (default: "Like") */
  label?: string
  /** Extra className applied to the wrapper div */
  className?: string
  /** Extra className applied to the button element */
  buttonClassName?: string
  /** Reaction popup size (default: "sm") */
  popupSize?: 'sm' | 'md' | 'lg'
  /** Callback fired after a reaction is successfully set or removed */
  onReactionChange?: (reactionType: ReactionType | null) => void
}

export function InlineLikeButton({
  entityId,
  entityType,
  label = 'Like',
  className,
  buttonClassName = 'hover-app-theme action-small-pad',
  popupSize = 'sm',
  onReactionChange: onReactionChangeProp,
}: InlineLikeButtonProps) {
  const { setReaction, removeReaction } = useEngagement()
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showPopup, setShowPopup] = useState(false)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  const handleMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setShowPopup(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = setTimeout(() => {
      const popup = document.querySelector('[data-reaction-popup]')
      if (popup && popup.matches(':hover')) return
      if (buttonRef.current?.matches(':hover')) return
      setShowPopup(false)
    }, 800)
  }, [])

  const handlePopupMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  const handlePopupMouseLeave = useCallback(() => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = setTimeout(() => {
      if (buttonRef.current?.matches(':hover')) return
      setShowPopup(false)
    }, 800)
  }, [])

  const handleLikeClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      // Toggle the default 'like' reaction directly on click
      await setReaction(entityId, entityType, 'like')
      setShowPopup(false)
    },
    [entityId, entityType, setReaction]
  )

  const handleReactionChange = useCallback(
    async (rt: ReactionType | null) => {
      // The reaction has already been set/removed by the EnterpriseReactionPopup
      // using the engagement context. This callback is for notification/UI cleanup.
      onReactionChangeProp?.(rt)
      // Auto-close after a short delay
      setTimeout(() => setShowPopup(false), 500)
    },
    [onReactionChangeProp]
  )

  return (
    <div className={`inline-block ${className ?? ''}`}>
      <Popover open={showPopup} onOpenChange={setShowPopup}>
        <PopoverTrigger asChild>
          <button
            ref={buttonRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleLikeClick}
            className={buttonClassName}
          >
            {label}
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 border-none bg-transparent shadow-none" 
          side="top" 
          sideOffset={8}
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
        >
          <EnterpriseReactionPopup
            entityId={entityId}
            entityType={entityType}
            isVisible={showPopup}
            onClose={() => setShowPopup(false)}
            triggerRef={buttonRef as unknown as React.RefObject<HTMLElement>}
            autoPosition={false} // Popover handles positioning
            size={popupSize}
            animation="scale"
            onReactionChange={handleReactionChange}
            className="static translate-x-0 translate-y-0" // Reset internal positioning
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default InlineLikeButton
