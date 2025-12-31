'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { FollowersList } from '@/components/followers-list'

interface ClientEventPageProps {
  event?: any
  params: {
    id: string
  }
  setActiveTab?: (tab: string) => void
}

export function ClientEventPage({ event, params, setActiveTab }: ClientEventPageProps) {
  const [activeTab, setActiveTabState] = useState('timeline')
  const handleSetActiveTab = setActiveTab || setActiveTabState

  return (
    <>
      {/* About Section */}
      <Card className="timeline-about-section">
        <div className="timeline-about-section__header flex flex-col space-y-1.5 p-6">
          <div className="timeline-about-section__title-row flex justify-between items-center">
            <div className="timeline-about-section__title text-2xl font-semibold leading-none tracking-tight">
              About
            </div>
            <button
              className="timeline-about-section__view-more text-sm text-primary hover:underline"
              onClick={() => handleSetActiveTab('about')}
            >
              View More
            </button>
          </div>
        </div>
        <CardContent className="p-6 pt-0">
          <p className="line-clamp-4">{event?.description || 'No description available.'}</p>
        </CardContent>
      </Card>

      {/* Friends/Followers Section */}
      <FollowersList
        followers={event?.followers || []}
        followersCount={event?.followers?.length || 0}
        entityId={params.id}
        entityType="event"
        onViewMore={() => handleSetActiveTab('followers')}
      />
    </>
  )
}
