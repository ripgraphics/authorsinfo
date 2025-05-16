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
  hideToggle = false,
  clipLines = 10,
  title,
  headerButton,
  sidePanelStyle = false,
}) => {
  const [internalExpanded, setInternalExpanded] = React.useState(false)
  const expanded = controlledExpanded ?? internalExpanded
  const onToggle = controlledOnToggle ?? (() => setInternalExpanded((v) => !v))

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
      {/* Toggle button below content, unless headerButton is present or hideToggle is true */}
      {!headerButton && !hideToggle && (
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={onToggle}
            className="followers-list__see-all-button inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md px-3 text-sm text-primary hover:bg-primary/10 hover:text-primary"
          >
            {expanded ? viewLessText : viewMoreText}
          </button>
        </div>
      )}
    </div>
  )
} 