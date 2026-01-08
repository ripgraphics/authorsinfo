'use client'

import * as React from 'react'
import * as HoverCardPrimitive from '@radix-ui/react-hover-card'

import { cn } from '@/lib/utils'

const HoverCard = HoverCardPrimitive.Root

const HoverCardTrigger = HoverCardPrimitive.Trigger

// Enterprise-grade HoverCardContent with intelligent positioning
const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = 'center', sideOffset = 8, collisionPadding = 5, avoidCollisions = true, collisionBoundary, ...props }, ref) => {
  // Function to dynamically find the application content container
  // This finds the container that defines the actual content area boundaries
  const findContentContainer = React.useCallback((): Element | null => {
    // Check if we're on the client side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return null
    }

    // If explicit boundary provided, use it (handled by Radix)
    if (collisionBoundary) return null

    // Try to find the root content wrapper first (most reliable)
    const rootWrapper = document.querySelector('.root-layout__content-wrapper')
    if (rootWrapper) {
      const rect = rootWrapper.getBoundingClientRect()
      // Verify it's visible and has dimensions
      if (rect.width > 0 && rect.height > 0) {
        return rootWrapper
      }
    }

    // Find container elements more efficiently using attribute selectors
    // Look for elements with class containing "container" or "max-w-"
    const containersWithMaxWidth = document.querySelectorAll('[class*="max-w-"]')
    
    // Prefer containers with max-w-* classes as they define actual content boundaries
    for (const container of containersWithMaxWidth) {
      const rect = container.getBoundingClientRect()
      const computedStyle = window.getComputedStyle(container)
      
      // Verify it's visible and has width constraints (narrower than viewport)
      if (
        rect.width > 0 &&
        rect.width < window.innerWidth &&
        computedStyle.display !== 'none' &&
        computedStyle.visibility !== 'hidden'
      ) {
        return container
      }
    }

    // Fallback: find elements with "container" class
    const containerElements = document.querySelectorAll('.container')
    for (const container of containerElements) {
      const rect = container.getBoundingClientRect()
      if (rect.width > 0 && rect.width < window.innerWidth) {
        return container
      }
    }

    // Fallback to viewport (returning null/undefined means use viewport as default)
    return null
  }, [collisionBoundary])

  // Memoize the collision boundary so it's recalculated when needed
  const dynamicCollisionBoundary = React.useMemo(() => {
    if (collisionBoundary) return collisionBoundary
    const container = findContentContainer()
    return container || undefined
  }, [collisionBoundary, findContentContainer])

  return (
    <HoverCardPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      avoidCollisions={avoidCollisions}
      collisionBoundary={dynamicCollisionBoundary}
      className={cn(
        'z-50 w-[28rem] rounded-md border bg-popover p-4 text-popover-foreground shadow-xl outline-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        'max-w-[calc(100vw-10px)] max-h-[calc(100vh-10px)]',
        'overflow-hidden',
        className
      )}
      {...props}
    />
  )
})
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }
