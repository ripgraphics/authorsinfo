"use client"

import React, { useState } from "react"
import { EntityHeader, TabConfig } from "@/components/entity-header"
import { BookOpen, Users } from "lucide-react"
import { useAuth } from '@/hooks/useAuth'

interface ClientProfilePageProps {
  user: any
  avatarUrl: string
  coverImageUrl: string
  params: {
    id: string
  }
}

export function ClientProfilePage({ user, avatarUrl, coverImageUrl, params }: ClientProfilePageProps) {
  const { user: authUser } = useAuth()
  const [activeTab, setActiveTab] = useState("timeline")

  // Mock data for the profile
  const mockName = user?.name || "Jane Reader"
  const mockUsername = user?.name ? user.name.split(" ").join("").toLowerCase() : "janereader"
  const mockBooksRead = 127
  const mockFriendsCount = 248
  const mockLocation = "Portland, OR"
  const mockWebsite = mockUsername + ".com"

  // Set up stats for the EntityHeader
  const userStats = [
    { 
      icon: <BookOpen className="h-4 w-4 mr-1" />, 
      text: `${mockBooksRead} books read` 
    },
    { 
      icon: <Users className="h-4 w-4 mr-1" />, 
      text: `${mockFriendsCount} friends` 
    }
  ]

  // Configure tabs for the EntityHeader
  const tabs: TabConfig[] = [
    { id: "timeline", label: "Timeline" },
    { id: "about", label: "About" },
    { id: "books", label: "Books" },
    { id: "friends", label: "Friends" },
    { id: "photos", label: "Photos" },
    { id: "more", label: "More" }
  ]

  return (
    <>
      <EntityHeader
        entityType="photo"
        name={mockName}
        username={mockUsername}
        coverImageUrl={coverImageUrl}
        profileImageUrl={avatarUrl}
        stats={userStats}
        location={mockLocation}
        website={mockWebsite}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isEditable={authUser && (authUser.role === 'admin' || authUser.role === 'super_admin')}
      />
      
      {/* Tab Content */}
      {activeTab === "timeline" && (
        <div className="p-6">Timeline content would go here</div>
      )}
      
      {activeTab === "about" && (
        <div className="p-6">About content would go here</div>
      )}
      
      {activeTab === "books" && (
        <div className="p-6">Books content would go here</div>
      )}
      
      {activeTab === "friends" && (
        <div className="p-6">Friends content would go here</div>
      )}
      
      {activeTab === "photos" && (
        <div className="p-6">Photos content would go here</div>
      )}
      
      {activeTab === "more" && (
        <div className="p-6">More content would go here</div>
      )}
    </>
  )
} 