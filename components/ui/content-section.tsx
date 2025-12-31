import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ExpandableSection } from '@/components/ui/expandable-section'

interface ContentSectionProps {
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

export function ContentSection({
  title,
  children,
  className,
  headerRight,
  footer,
  onViewMore,
  viewMoreText = 'View More',
  viewMoreLink,
  isExpandable = false,
  defaultExpanded = false,
  onExpand,
  contentClassName,
  headerClassName,
  footerClassName,
  hideToggle = false,
}: ContentSectionProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded)

  const handleExpand = () => {
    const newExpanded = !expanded
    setExpanded(newExpanded)
    onExpand?.(newExpanded)
  }

  return (
    <Card
      className={cn(
        'content-section__container rounded-lg border bg-card text-card-foreground shadow-xs',
        className
      )}
    >
      {/* Header Section */}
      <div className={cn('content-section__header-container p-6 pb-2 border-b', headerClassName)}>
        <div className="content-section__header-content flex items-center justify-between">
          <h3 className="content-section__title text-2xl font-semibold leading-none tracking-tight">
            {title}
          </h3>
          {headerRight ??
            ((onViewMore || viewMoreLink) && (
              <Button
                variant="ghost"
                size="sm"
                className="content-section__view-more-button h-8 text-sm text-primary hover:bg-primary/10 hover:text-primary"
                onClick={onViewMore}
                asChild={!!viewMoreLink}
              >
                {viewMoreLink ? <a href={viewMoreLink}>{viewMoreText}</a> : viewMoreText}
              </Button>
            ))}
        </div>
      </div>

      {/* Main Content Section */}
      <CardContent className={cn('content-section__content-container p-6 pt-4', contentClassName)}>
        {isExpandable ? (
          <ExpandableSection
            expanded={expanded}
            onToggle={handleExpand}
            hideToggle={hideToggle}
            contentClassName="content-section__expandable-content space-y-4"
            viewMoreText="Show More"
            viewLessText="Show Less"
            fadeGradientClassName="content-section__fade-gradient absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"
          >
            {children}
          </ExpandableSection>
        ) : (
          children
        )}
      </CardContent>

      {/* Footer Section */}
      {footer && (
        <div className={cn('content-section__footer-container px-6 pb-6', footerClassName)}>
          {footer}
        </div>
      )}
    </Card>
  )
}
