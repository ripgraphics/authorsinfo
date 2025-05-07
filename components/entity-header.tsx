"use client"

import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, BookOpen, Users, MapPin, Globe, User, MoreHorizontal, MessageSquare, UserPlus } from "lucide-react"
import Link from "next/link"

export interface TabConfig {
  id: string
  label: string
}

interface EntityHeaderProps {
  entityType: 'author' | 'publisher' | 'book' | 'group' | 'photo'
  name: string
  username?: string
  coverImageUrl: string
  profileImageUrl: string
  stats?: Array<{
    icon: React.ReactNode
    text: string
  }>
  location?: string
  website?: string
  tabs: TabConfig[]
  activeTab: string
  onTabChange: (tabId: string) => void
  children?: React.ReactNode
}

export function EntityHeader({
  entityType,
  name,
  username,
  coverImageUrl,
  profileImageUrl,
  stats = [],
  location,
  website,
  tabs,
  activeTab,
  onTabChange,
  children
}: EntityHeaderProps) {
  return (
    <div className="entity-header bg-white rounded-lg shadow overflow-hidden mb-6">
      {/* Cover Image */}
      <div className="entity-header__cover-image relative h-auto aspect-[1344/500]">
        <img
          src={coverImageUrl || "/placeholder.svg?height=400&width=1200"}
          alt={`${entityType} cover`}
          className="entity-header__cover-image-content object-cover absolute inset-0 w-full h-full"
        />
        <Button 
          variant="outline" 
          size="sm" 
          className="entity-header__cover-image-button absolute bottom-4 right-4 bg-white/80 hover:bg-white"
        >
          <Camera className="h-4 w-4 mr-2" />
          Change Cover
        </Button>
      </div>

      {/* Header Content */}
      <div className="entity-header__content px-3 sm:px-6 pb-6">
        <div className="entity-header__profile-section flex flex-col md:flex-row md:items-end -mt-10 relative z-10">
          {/* Profile Image */}
          <div className="entity-header__avatar-container relative">
            <span className="entity-header__avatar relative flex shrink-0 overflow-hidden h-28 w-28 md:h-40 md:w-40 border-4 border-white rounded-full">
              <img
                src={profileImageUrl || "/placeholder.svg?height=200&width=200"}
                alt={name}
                className="entity-header__avatar-image h-full w-full object-cover"
                style={{ aspectRatio: '1 / 1', minWidth: 0, minHeight: 0 }}
              />
            </span>
            <Button
              variant="outline"
              size="icon"
              className="entity-header__avatar-button absolute bottom-2 right-2 rounded-full h-8 w-8 bg-white/80 hover:bg-white"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          {/* Entity Info */}
          <div className="entity-header__info mt-4 md:mt-0 md:ml-6 flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="max-w-full md:max-w-[calc(100%-240px)] min-w-0">
                <h1 className="text-base sm:text-[1.1rem] font-bold truncate">{name}</h1>
                {username && (
                  <p className="text-muted-foreground truncate text-sm">
                    {username.startsWith('@') || username.startsWith('by ') ? username : `@${username}`}
                  </p>
                )}
              </div>

              <div className="entity-header__actions flex flex-wrap gap-2 mt-2 md:mt-0 shrink-0 md:flex-nowrap">
                <Button className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Message</span>
                </Button>
                <Button variant="outline" className="flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{entityType === 'book' ? 'Add to Shelf' : 'Follow'}</span>
                </Button>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Stats and Info */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center text-muted-foreground">
                  {stat.icon}
                  <span>{stat.text}</span>
                </div>
              ))}
              
              {location && (
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{location}</span>
              </div>
              )}
              
              {website && (
              <div className="flex items-center text-muted-foreground">
                <a
                  href={website.startsWith('http') ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-primary hover:underline"
                >
                  <Globe className="h-4 w-4 mr-1" />
                  <span>Website</span>
                </a>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="entity-header__nav border-t">
        <div className="entity-header__nav-container">
          <div className="entity-header__tabs grid grid-cols-6 h-auto mt-0 bg-transparent">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`entity-header__tab inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12 ${
                  activeTab === tab.id ? "border-b-2 border-primary" : ""
                }`}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {children}
    </div>
  )
} 