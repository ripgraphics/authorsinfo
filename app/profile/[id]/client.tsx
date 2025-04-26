"use client"

import React, { useState } from "react"
import Image from "next/image"
import type { User } from "@/types/database"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface ClientProfilePageProps {
  user: User
  avatarUrl: string
  coverImageUrl: string
  params: {
    id: string
  }
}

export function ClientProfilePage({ user, avatarUrl, coverImageUrl }: ClientProfilePageProps) {
  const [activeTab, setActiveTab] = useState<string>("timeline")

  return (
    <div className="profile-page bg-gray-100 min-h-screen">
      {/* Cover Image */}
      <div className="profile-cover relative w-full h-[300px]">
        <Image
          src={coverImageUrl}
          alt={`Cover for ${user.username}`}
          fill
          className="object-cover"
        />
      </div>

      {/* Avatar & Info */}
      <div className="profile-header container mx-auto flex items-center space-x-6 px-6 -mt-16">
        <div className="profile-avatar w-32 h-32 relative">
          <Avatar className="w-full h-full">
            <AvatarImage src={avatarUrl} alt={user.full_name || user.username} />
            <AvatarFallback>{(user.username || user.full_name || "").charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
        <div className="profile-info flex-1">
          <h1 className="profile-name text-2xl font-bold leading-snug">
            {user.full_name || user.username}
          </h1>
          <p className="profile-username text-muted-foreground">@{user.username}</p>
        </div>
        <div className="profile-actions">
          <Button>Follow</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs container mx-auto px-6 mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white p-1 rounded-lg">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="bookshelf">Bookshelf</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          <TabsContent value="timeline" className="mt-4">
            <p className="text-muted-foreground">User activity timeline will appear here.</p>
          </TabsContent>
          <TabsContent value="bookshelf" className="mt-4">
            <p className="text-muted-foreground">User's bookshelf content goes here.</p>
          </TabsContent>
          <TabsContent value="friends" className="mt-4">
            <p className="text-muted-foreground">User's friends list will appear here.</p>
          </TabsContent>
          <TabsContent value="about" className="mt-4">
            <p className="text-muted-foreground">{user.bio || "No bio available."}</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 