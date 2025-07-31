"use client"

import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils"

const HoverCard = HoverCardPrimitive.Root

const HoverCardTrigger = HoverCardPrimitive.Trigger

// Enterprise-grade HoverCardContent with intelligent positioning
const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 8, ...props }, ref) => {
  const [position, setPosition] = React.useState({
    align: align as "start" | "center" | "end",
    side: "bottom" as "top" | "bottom" | "left" | "right"
  })

  const calculateOptimalPosition = React.useCallback(() => {
    // Get viewport dimensions
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Find the trigger element
    const triggerElement = document.querySelector('[data-radix-hover-card-trigger]')
    if (!triggerElement) return
    
    const rect = triggerElement.getBoundingClientRect()
    const triggerCenterX = rect.left + rect.width / 2
    const triggerCenterY = rect.top + rect.height / 2
    
    // Calculate available space in each direction
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    const spaceRight = viewportWidth - rect.right
    const spaceLeft = rect.left
    
    // Card dimensions (approximate)
    const cardWidth = 384 // w-96
    const cardHeight = 200 // Approximate height
    const minMargin = 5
    
    // Determine optimal side
    let optimalSide: "top" | "bottom" | "left" | "right" = "bottom"
    let optimalAlign: "start" | "center" | "end" = "center"
    
    // Check each side for sufficient space
    const sides = [
      { side: "bottom" as const, space: spaceBelow, required: cardHeight + minMargin },
      { side: "top" as const, space: spaceAbove, required: cardHeight + minMargin },
      { side: "right" as const, space: spaceRight, required: cardWidth + minMargin },
      { side: "left" as const, space: spaceLeft, required: cardWidth + minMargin }
    ]
    
    // Find the best side with sufficient space
    const bestSide = sides.find(side => side.space >= side.required) || 
                    sides.reduce((prev, current) => current.space > prev.space ? current : prev)
    
    optimalSide = bestSide.side
    
    // Calculate optimal alignment based on available space
    if (optimalSide === "bottom" || optimalSide === "top") {
      // For top/bottom sides, check horizontal alignment
      const centerOffset = cardWidth / 2
      const leftEdge = triggerCenterX - centerOffset
      const rightEdge = triggerCenterX + centerOffset
      
      if (leftEdge < minMargin) {
        optimalAlign = "start"
      } else if (rightEdge > viewportWidth - minMargin) {
        optimalAlign = "end"
      } else {
        optimalAlign = "center"
      }
    } else {
      // For left/right sides, check vertical alignment
      const centerOffset = cardHeight / 2
      const topEdge = triggerCenterY - centerOffset
      const bottomEdge = triggerCenterY + centerOffset
      
      if (topEdge < minMargin) {
        optimalAlign = "start"
      } else if (bottomEdge > viewportHeight - minMargin) {
        optimalAlign = "end"
      } else {
        optimalAlign = "center"
      }
    }
    
    setPosition({ align: optimalAlign, side: optimalSide })
  }, [])

  // Calculate position when component mounts and on window resize
  React.useEffect(() => {
    const handleResize = () => {
      calculateOptimalPosition()
    }
    
    // Initial calculation
    calculateOptimalPosition()
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [calculateOptimalPosition])

  // Watch for hovercard visibility and recalculate position
  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      const hoverCardContent = document.querySelector('[data-radix-hover-card-content]')
      if (hoverCardContent && hoverCardContent.getAttribute('data-state') === 'open') {
        // Small delay to ensure positioning is calculated after the card is rendered
        setTimeout(calculateOptimalPosition, 10)
      }
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-state'],
      subtree: true
    })

    return () => observer.disconnect()
  }, [calculateOptimalPosition])

  return (
    <HoverCardPrimitive.Content
      ref={ref}
      align={position.align}
      side={position.side}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-96 rounded-md border bg-popover p-4 text-popover-foreground shadow-xl outline-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        // Enterprise-grade positioning styles
        "max-w-[calc(100vw-10px)] max-h-[calc(100vh-10px)]",
        "overflow-hidden",
        className
      )}
      {...props}
    />
  )
})
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }
