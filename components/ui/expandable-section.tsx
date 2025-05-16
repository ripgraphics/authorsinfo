"use client"

import React from "react"
import { Button } from "@/components/ui/button"

interface ExpandableSectionProps {
  expanded?: boolean
  onToggle?: () => void
  maxHeight?: number
  className?: string
  children: React.ReactNode
  viewMoreText?: string
  viewLessText?: string
  fadeGradientClassName?: string
  contentClassName?: string
  hideToggle?: boolean
  clipLines?: number
  title?: React.ReactNode
  headerButton?: React.ReactNode
  /**
   * If true, applies extra padding to header and content for side-panel About sections.
   */
  sidePanelStyle?: boolean
}

export const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  expanded: controlledExpanded,
  onToggle: controlledOnToggle,
  maxHeight,
  className = "",
  children,
  viewMoreText = "View More",
  viewLessText = "View Less",
  fadeGradientClassName = "overview-section__fade-gradient absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent",
  contentClassName = "overview-section__about-text whitespace-pre-wrap text-base",
  hideToggle,
  clipLines = 10,
  title,
  headerButton,
  sidePanelStyle = false,
}) => {
  const [internalExpanded, setInternalExpanded] = React.useState(false)
  const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded
  const onToggle = controlledOnToggle !== undefined ? controlledOnToggle : () => setInternalExpanded((v) => !v)

  const showHeaderButton = !!headerButton
  const showToggleBelow = !showHeaderButton && !hideToggle

  return (
    <div className={`relative ${className}`}>
      {(title || headerButton) && (
        <div className={`flex justify-between items-center mb-2${sidePanelStyle ? ' pb-2 pt-6' : ''}`}>
          <div className="text-2xl font-semibold leading-none tracking-tight">{title}</div>
          {headerButton && <div>{headerButton}</div>}
        </div>
      )}
      <div
        className={
          contentClassName +
          (sidePanelStyle ? " pt-6" : "") +
          (expanded ? "" : ` line-clamp-${clipLines} overflow-hidden relative`)
        }
        style={
          expanded
            ? { overflow: "visible" }
            : maxHeight
              ? { maxHeight, overflow: "hidden" }
              : { overflow: "hidden" }
        }
        aria-expanded={expanded}
      >
        {children}
        {!expanded && (
          <div className={fadeGradientClassName} />
        )}
      </div>
      {showToggleBelow && (
        <Button
          variant="outline"
          className="overview-section__toggle-button text-xs mt-2 h-9 rounded-md px-3"
          onClick={onToggle}
        >
          {expanded ? viewLessText : viewMoreText}
        </Button>
      )}
    </div>
  )
} 