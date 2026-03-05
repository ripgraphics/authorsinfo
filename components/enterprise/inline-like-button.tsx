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
  /** Label content displayed on the button (default: "Like") */
  label?: React.ReactNode
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
  /** Auto-close popup when mouse leaves trigger/popup (default: true) */
  autoCloseOnMouseLeave?: boolean
  /** Optional trigger button type (default: "button") */
  buttonType?: 'button' | 'submit' | 'reset'
  /** Additional trigger button accessibility label */
  ariaLabel?: string
  /** Whether the trigger is disabled */
  disabled?: boolean
  /** ARIA busy state for loading transitions */
  ariaBusy?: boolean
  /** Reaction popup position preference */
  popupPosition?: 'top' | 'bottom' | 'left' | 'right'
  /** Whether the popup should auto-position (default: true) */
  autoPosition?: boolean
  /** Popup animation style (default: "scale") */
  popupAnimation?: 'fade' | 'slide' | 'scale' | 'bounce'
  /** Whether to show reaction counts in popup (default: true) */
  showReactionCounts?: boolean
  /** Whether to show quick reactions in popup (default: true) */
  showQuickReactions?: boolean
  /** Max quick reactions shown (default: 3) */
  maxQuickReactions?: number
  /** Current selected reaction to display in popup */
  currentReaction?: ReactionType | null
  /** Guard hook before opening popup; return false to prevent opening */
  onBeforeOpen?: (trigger: 'hover' | 'click') => boolean
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
  autoCloseOnMouseLeave = true,
  buttonType = 'button',
  ariaLabel,
  disabled = false,
  ariaBusy,
  popupPosition = 'top',
  autoPosition = true,
  popupAnimation = 'scale',
  showReactionCounts = true,
  showQuickReactions = true,
  maxQuickReactions = 3,
  currentReaction,
  onBeforeOpen,
}: InlineLikeButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isClickOpenRef = useRef(false)
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

  useEffect(() => {
    if (!showPopup) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const clickedTrigger = !!buttonRef.current && !!target && buttonRef.current.contains(target)
      const clickedPopup = !!target?.closest(`[data-reaction-popup-id="${popupId}"]`)

      if (!clickedTrigger && !clickedPopup) {
        isClickOpenRef.current = false
        setShowPopup(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown, true)
    return () => document.removeEventListener('mousedown', handlePointerDown, true)
  }, [showPopup, popupId])

  const openReactionPopup = useCallback(
    (e?: React.SyntheticEvent, trigger: 'hover' | 'click' = 'click') => {
      e?.preventDefault?.()
      e?.stopPropagation?.()
      if (disabled) return
      if (onBeforeOpen && !onBeforeOpen(trigger)) return

      if (trigger === 'click') {
        if (showPopup && isClickOpenRef.current) {
          isClickOpenRef.current = false
          setShowPopup(false)
          return
        }
        isClickOpenRef.current = true
      } else {
        isButtonHoveredRef.current = true
      }

      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
      setShowPopup(true)
    },
    [disabled, onBeforeOpen, showPopup]
  )

  const schedulePopupClose = useCallback(() => {
    if (!autoCloseOnMouseLeave) {
      return
    }
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = setTimeout(() => {
      if (isButtonHoveredRef.current || isPopupHoveredRef.current) {
        return
      }
      setShowPopup(false)
    }, closeDelayMs)
  }, [closeDelayMs, autoCloseOnMouseLeave])

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
      isClickOpenRef.current = false
      setTimeout(() => setShowPopup(false), 500)
    },
    [onReactionChangeProp, onReactionBroadcast, entityId, entityType]
  )

  return (
    <div className={`inline-block ${className ?? ''}`}>
      <button
        type={buttonType}
        ref={buttonRef}
        onMouseEnter={(event) => openReactionPopup(event, 'hover')}
        onMouseLeave={handleMouseLeave}
        onClick={(event) => openReactionPopup(event, 'click')}
        aria-label={ariaLabel}
        aria-busy={ariaBusy}
        aria-haspopup="menu"
        aria-expanded={showPopup}
        disabled={disabled}
        className={buttonClassName}
      >
        {label}
      </button>

      <EnterpriseReactionPopup
        entityId={entityId}
        entityType={entityType}
        isVisible={showPopup}
        onClose={() => {
          isClickOpenRef.current = false
          setShowPopup(false)
        }}
        position={popupPosition}
        currentReaction={currentReaction}
        showReactionCounts={showReactionCounts}
        showQuickReactions={showQuickReactions}
        maxQuickReactions={maxQuickReactions}
        triggerRef={buttonRef as unknown as React.RefObject<HTMLElement>}
        autoPosition={autoPosition}
        size={popupSize}
        animation={popupAnimation}
        onReactionChange={handleReactionChange}
        onMouseEnter={handlePopupMouseEnter}
        onMouseLeave={handlePopupMouseLeave}
        popupId={popupId}
      />
    </div>
  )
}

export default InlineLikeButton
