'use client'

import { EntityMetadata, EntityMoreTabConfig } from '@/types/entity'
import { useEffect, useState } from 'react'

interface EntityMoreTabProps {
  entity: EntityMetadata
  config?: EntityMoreTabConfig
  isOwnEntity?: boolean
}

interface ReadingStats {
  totalBooksRead: number
  totalPagesRead: number
  averageRating: number
  reviewsWritten: number
}

interface Event {
  id: string
  title: string
  description: string
  date: string
  type: string
}

export function EntityMoreTab({
  entity,
  config = {
    sections: {
      stats: true,
      preferences: true,
      events: true,
      recommendations: true,
    },
  },
  isOwnEntity = false,
}: EntityMoreTabProps) {
  const [readingStats, setReadingStats] = useState<ReadingStats | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMoreTabData = async () => {
      try {
        const response = await fetch(
          `/api/entities/${entity.entityType}/${entity.entityId}/more-tab`
        )
        if (response.ok) {
          const data = await response.json()
          setReadingStats(data.stats)
          setEvents(data.events)
        }
      } catch (error) {
        console.error('Failed to fetch more tab content:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMoreTabData()
  }, [entity.entityType, entity.entityId])

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-8">
      {/* Reading Stats Section */}
      {config.sections.stats && readingStats && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Reading Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm">Books Read</p>
              <p className="text-2xl font-bold">{readingStats.totalBooksRead}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm">Pages Read</p>
              <p className="text-2xl font-bold">{readingStats.totalPagesRead}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm">Avg. Rating</p>
              <p className="text-2xl font-bold">
                {readingStats.averageRating.toFixed(1)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm">Reviews</p>
              <p className="text-2xl font-bold">{readingStats.reviewsWritten}</p>
            </div>
          </div>
        </div>
      )}

      {/* Events Section */}
      {config.sections.events && events.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Events</h3>
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium">{event.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                <p className="text-xs text-gray-500 mt-2">{event.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Sections */}
      {config.customSections &&
        Object.entries(config.customSections).map(([sectionKey, sectionContent]) => (
          <div key={sectionKey}>
            <h3 className="text-lg font-semibold mb-4 capitalize">
              {sectionKey.replace(/_/g, ' ')}
            </h3>
            <div className="prose prose-sm max-w-none">{sectionContent}</div>
          </div>
        ))}

      {/* Empty State */}
      {!readingStats && events.length === 0 && !config.customSections && (
        <div className="text-center py-8 text-gray-500">
          <p>No additional information available</p>
        </div>
      )}
    </div>
  )
}
