import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ExpandableSection } from "@/components/ui/expandable-section"

interface SidebarSectionProps {
  title: string
  children: React.ReactNode
  className?: string
  headerRight?: React.ReactNode
  footer?: React.ReactNode
  onViewMore?: () => void
  viewMoreText?: string
  viewMoreLink?: string
  isExpandable?: boolean
  defaultExpanded?: boolean
  onExpand?: (expanded: boolean) => void
  contentClassName?: string
  headerClassName?: string
  footerClassName?: string
  hideToggle?: boolean
}

export function SidebarSection({
  title,
  children,
  className,
  headerRight,
  footer,
  onViewMore,
  viewMoreText = "View More",
  viewMoreLink,
  isExpandable = false,
  defaultExpanded = false,
  onExpand,
  contentClassName,
  headerClassName,
  footerClassName,
  hideToggle = false,
}: SidebarSectionProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded)

  const handleExpand = () => {
    const newExpanded = !expanded
    setExpanded(newExpanded)
    onExpand?.(newExpanded)
  }

  return (
    <Card className={cn("sidebar-section rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      {/* Header Section */}
      <div className={cn("sidebar-section__header p-6 pb-2 border-b", headerClassName)}>
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">{title}</h3>
          {headerRight ?? (
            (onViewMore || viewMoreLink) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-sm text-primary hover:bg-primary/10 hover:text-primary"
                onClick={onViewMore}
                asChild={!!viewMoreLink}
              >
                {viewMoreLink ? (
                  <a href={viewMoreLink}>{viewMoreText}</a>
                ) : (
                  viewMoreText
                )}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Main Content Section */}
      <CardContent className={cn("p-6 pt-0", contentClassName)}>
        {isExpandable ? (
          <ExpandableSection
            expanded={expanded}
            onToggle={handleExpand}
            hideToggle={hideToggle}
            contentClassName="space-y-4"
            viewMoreText="Show More"
            viewLessText="Show Less"
            fadeGradientClassName="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"
          >
            {children}
          </ExpandableSection>
        ) : (
          children
        )}
      </CardContent>

      {/* Footer Section */}
      {footer && (
        <div className={cn("sidebar-section__footer p-6 pt-0", footerClassName)}>
          {footer}
        </div>
      )}
    </Card>
  )
} 