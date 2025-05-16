"use client"

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ExpandableTextProps {
  children: React.ReactNode;
  maxHeight?: number; // px
  className?: string;
  initiallyExpanded?: boolean;
  fadeGradientClassName?: string;
  viewMoreText?: string;
  viewLessText?: string;
}

export const ExpandableText: React.FC<ExpandableTextProps> = ({
  children,
  maxHeight = 300,
  className = "",
  initiallyExpanded = false,
  fadeGradientClassName = "absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none",
  viewMoreText = "View More",
  viewLessText = "View Less",
}) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [showToggle, setShowToggle] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setShowToggle(contentRef.current.scrollHeight > maxHeight);
    }
  }, [children, maxHeight]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={contentRef}
        className={`transition-all whitespace-pre-wrap ${!expanded && showToggle ? "overflow-hidden" : "overflow-visible"}`}
        style={{ maxHeight: !expanded && showToggle ? maxHeight : "none" }}
        aria-expanded={expanded}
      >
        {children}
      </div>
      {!expanded && showToggle && (
        <div className={fadeGradientClassName} style={{ zIndex: 1 }} />
      )}
      {showToggle && (
        <div className="relative z-10">
          <Button
            variant="outline"
            size="sm"
            className="text-xs mt-2 h-9 rounded-md px-3"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? viewLessText : viewMoreText}
          </Button>
        </div>
      )}
    </div>
  );
}; 