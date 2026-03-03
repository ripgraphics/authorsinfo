'use client'

import React, { useState, useCallback, useEffect, useRef, useId } from 'react'
import { EnterpriseReactionPopup } from '@/components/enterprise/enterprise-reaction-popup'
import type { ReactionType } from '@/contexts/engagement-context'
import type { EntityType } from '@/lib/engagement/config'

/**
 * InlineLikeButton
 *
 * A fully reusable inline "Like" button with a reaction popup on hover/click.
 * Uses delayed-close pattern so users can move their cursor to the popup.
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
  /** Optional callback to broadcast reaction updates to external listeners */
  onReactionBroadcast?: (payload: {
    entityId: string
    entityType: EntityType
    reactionType: ReactionType | null
  }) => void
  /** Popup close delay in milliseconds (default: 1000) */
  closeDelayMs?: number
  /** Optional trigger button type (default: "button") */
  buttonType?: 'button' | 'submit' | 'reset'
  /** Additional trigger button accessibility label */
  ariaLabel?: string
}

export function InlineLikeButton({
  entityId,
  entityType,
  label = 'Like',
  className,
  buttonClassName = 'hover-app-theme action-small-pad',
  popupSize = 'sm',
  onReactionChange: onReactionChangeProp,
  onReactionBroadcast,
  closeDelayMs = 1000,
  buttonType = 'button',
  ariaLabel,
}: InlineLikeButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const popupId = useId()
  const isButtonHoveredRef = useRef(false)
  const isPopupHoveredRef = useRef(false)
  const [showPopup, setShowPopup] = useState(false)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  const openReactionPopup = useCallback((e?: React.SyntheticEvent) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    isButtonHoveredRef.current = true
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setShowPopup(true)
  }, [])

  const schedulePopupClose = useCallback(() => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = setTimeout(() => {
      if (isButtonHoveredRef.current || isPopupHoveredRef.current) {
        return
      }
      setShowPopup(false)
    }, closeDelayMs)
  }, [closeDelayMs])

  const handleMouseLeave = useCallback(() => {
    isButtonHoveredRef.current = false
    schedulePopupClose()
  }, [schedulePopupClose])

  const handlePopupMouseEnter = useCallback(() => {
    isPopupHoveredRef.current = true
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  const handlePopupMouseLeave = useCallback(() => {
    isPopupHoveredRef.current = false
    schedulePopupClose()
  }, [schedulePopupClose])

  const handleReactionChange = useCallback(
    async (rt: ReactionType | null) => {
      // The reaction has already been set/removed by the EnterpriseReactionPopup
      // using the engagement context. This callback is for notification/UI cleanup.
      onReactionChangeProp?.(rt)
      onReactionBroadcast?.({ entityId, entityType, reactionType: rt })
      // Auto-close after a short delay
      setTimeout(() => setShowPopup(false), 500)
    },
    [onReactionChangeProp, onReactionBroadcast, entityId, entityType]
  )

  return (
    <div className={`inline-block ${className ?? ''}`}>
      <button
        type={buttonType}
        ref={buttonRef}
        onMouseEnter={openReactionPopup}
        onMouseLeave={handleMouseLeave}
        onClick={openReactionPopup}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={showPopup}
        className={buttonClassName}
      >
        {label}
      </button>

      <EnterpriseReactionPopup
        entityId={entityId}
        entityType={entityType}
        isVisible={showPopup}
        onClose={() => setShowPopup(false)}
        triggerRef={buttonRef as unknown as React.RefObject<HTMLElement>}
        autoPosition={true}
        size={popupSize}
        animation="scale"
        onReactionChange={handleReactionChange}
        onMouseEnter={handlePopupMouseEnter}
        onMouseLeave={handlePopupMouseLeave}
        popupId={popupId}
      />
    </div>
  )
}

export default InlineLikeButton
