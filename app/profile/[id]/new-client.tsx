'use client'

import React, { useState } from 'react'
import { EntityHeader, TabConfig } from '@/components/entity-header'
import { BookOpen, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface ClientProfilePageProps {
  user: any
  userStats?: {
    booksRead: number
    friendsCount: number
    followersCount?: number
    location: string | null
    website: string | null
    joinedDate: string
  }
  avatarUrl: string
  coverImageUrl: string
  params: {
    id: string
  }
}

export function ClientProfilePage({
  user,
  userStats: propStats,
  avatarUrl,
  coverImageUrl,
  params,
}: ClientProfilePageProps) {
  const { user: authUser } = useAuth()
  const [activeTab, setActiveTab] = useState('timeline')

  // Use real data from props
  const realName = user?.name || 'Unknown User'
  const realUsername = user?.permalink || user?.name?.split(' ').join('').toLowerCase() || 'user'
  const realBooksRead = propStats?.booksRead ?? 0
  const realFriendsCount = propStats?.friendsCount ?? 0
  const realLocation = propStats?.location || user?.location || null
  const realWebsite = propStats?.website || user?.website || null

  // Set up stats for the EntityHeader
  const displayStats = [
    {
      icon: <BookOpen className="h-4 w-4 mr-1" />,
      text: `${realBooksRead} books read`,
    },
    {
      icon: <Users className="h-4 w-4 mr-1" />,
      text: `${realFriendsCount} friends`,
    },
  ]

  // Configure tabs for the EntityHeader
  const tabs: TabConfig[] = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'about', label: 'About' },
    { id: 'books', label: 'Books' },
    { id: 'friends', label: 'Friends' },
    { id: 'photos', label: 'Photos' },
    { id: 'more', label: 'More' },
  ]

  return (
    <>
      <EntityHeader
        entityType="photo"
        name={realName}
        username={realUsername}
        coverImageUrl={coverImageUrl}
        profileImageUrl={avatarUrl}
        stats={displayStats}
        location={realLocation}
        website={realWebsite}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isEditable={
          authUser && (authUser.role === 'admin' || authUser.role === 'super_admin')
            ? true
            : undefined
        }
      />

      {/* Tab Content */}
      {activeTab === 'timeline' && <div className="p-4">Timeline content would go here</div>}

      {activeTab === 'about' && <div className="p-4">About content would go here</div>}

      {activeTab === 'books' && <div className="p-4">Books content would go here</div>}

      {activeTab === 'friends' && <div className="p-4">Friends content would go here</div>}

      {activeTab === 'photos' && <div className="p-4">Photos content would go here</div>}

      {activeTab === 'more' && <div className="p-4">More content would go here</div>}
    </>
  )
}
