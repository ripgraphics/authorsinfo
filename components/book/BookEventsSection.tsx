'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ContentSection } from '@/components/ui/content-section'
import { Calendar, MapPin, Clock } from 'lucide-react'
import { formatDate } from '@/utils/dateUtils'
import type { Event } from '@/types/phase3'

interface BookEventsSectionProps {
  bookId: string
  className?: string
}

export function BookEventsSection({ bookId, className }: BookEventsSectionProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchBookEvents() {
      try {
        const response = await fetch(`/api/books/${bookId}/events`)
        if (response.ok) {
          const data = await response.json()
          setEvents(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching book events:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (bookId) {
      fetchBookEvents()
    }
  }, [bookId])

  if (isLoading) {
    return (
      <ContentSection title="Events" className={className}>
        <div className="text-sm text-muted-foreground">Loading events...</div>
      </ContentSection>
    )
  }

  if (events.length === 0) {
    return null // Don't show section if no events
  }

  return (
    <ContentSection title="Upcoming Events" className={className}>
      <div className="space-y-4">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${(event as any).slug || event.id}`}
            className="block"
          >
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardContent className="p-4 space-y-2">
                <h4 className="font-semibold text-sm line-clamp-2">{(event as any).title}</h4>
                {(event as any).description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {(event as any).description}
                  </p>
                )}
                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                  {(event as any).start_date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate((event as any).start_date)}</span>
                    </div>
                  )}
                  {(event as any).format && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      <span className="capitalize">{(event as any).format}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </ContentSection>
  )
}

