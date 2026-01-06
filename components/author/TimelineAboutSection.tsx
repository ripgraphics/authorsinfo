import * as React from 'react'
import { ExpandableSection } from '@/components/ui/expandable-section'
import { ViewFullDetailsButton } from '@/components/ui/ViewFullDetailsButton'
import { MapPin, Globe } from 'lucide-react'
import { SectionHeader } from '@/components/ui/SectionHeader'

interface TimelineAboutSectionProps {
  title?: string
  bio?: string
  nationality?: string
  website?: string
  onViewMore?: () => void
  onViewFullDetails?: () => void
  headerRight?: React.ReactNode
}

export function TimelineAboutSection({
  title = 'About',
  bio,
  nationality,
  website,
  onViewMore,
  onViewFullDetails,
  headerRight,
}: TimelineAboutSectionProps) {
  return (
    <div className="timeline-about-section rounded-lg border bg-card text-card-foreground shadow-xs">
      {/* Header Section */}
      <div className="timeline-about-section__header-section p-4 pb-2 border-b">
        <SectionHeader
          title={title}
          right={
            headerRight ?? (
              <button
                type="button"
                onClick={onViewMore}
                className="timeline-about-section__view-more-button followers-list__see-all-button inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md px-3 text-sm text-primary hover:bg-primary/10 hover:text-primary"
              >
                View More
              </button>
            )
          }
        />
      </div>
      {/* Main Section */}
      <div className="timeline-about-section__main-section p-4 pb-0 space-y-4">
        <ExpandableSection hideToggle sidePanelStyle>
          {bio || 'No biography available for this author.'}
        </ExpandableSection>
        {nationality && (
          <div className="timeline-about-section__location flex items-center">
            <MapPin className="timeline-about-section__location-icon h-4 w-4 mr-2 text-muted-foreground" />
            <span className="timeline-about-section__location-text">From {nationality}</span>
          </div>
        )}
        {website && (
          <div className="timeline-about-section__website flex items-center">
            <Globe className="timeline-about-section__website-icon h-4 w-4 mr-2 text-muted-foreground" />
            <a
              href={website.startsWith('http') ? website : `https://${website}`}
              className="timeline-about-section__website-link hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Website
            </a>
          </div>
        )}
      </div>
      {/* Footer Section */}
      <div className="timeline-about-section__footer-section p-4">
        <ViewFullDetailsButton onClick={onViewFullDetails} />
      </div>
    </div>
  )
}
