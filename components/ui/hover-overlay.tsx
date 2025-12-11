"use client"

import { useState, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface HoverOverlayProps {
  children: ReactNode
  isVisible?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  overlayClassName?: string
  contentClassName?: string
  className?: string
}

export function HoverOverlay({
  children,
  isVisible: controlledVisible,
  onMouseEnter: onMouseEnterProp,
  onMouseLeave: onMouseLeaveProp,
  overlayClassName,
  contentClassName,
  className,
}: HoverOverlayProps) {
  const [isHovering, setIsHovering] = useState(false)

  // Use controlled visibility if provided, otherwise use internal hover state
  const isVisible = controlledVisible !== undefined ? controlledVisible : isHovering

  const handleMouseEnter = () => {
    if (controlledVisible === undefined) {
      setIsHovering(true)
    }
    onMouseEnterProp?.()
  }

  const handleMouseLeave = () => {
    if (controlledVisible === undefined) {
      setIsHovering(false)
    }
    onMouseLeaveProp?.()
  }

  if (!isVisible) {
    return null
  }

  return (
    <div
      className={cn(
        "absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center",
        overlayClassName,
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={cn("flex items-center justify-center", contentClassName)}>
        {children}
      </div>
    </div>
  )
}

