"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EntityHeader, TabConfig } from "@/components/entity-header"
import {
  BookOpen,
  Users,
  MapPin,
  Globe,
  Camera,
  MessageSquare,
  UserPlus,
  MoreHorizontal,
  Calendar,
  SquarePen,
  ImageIcon,
  Book,
  Star,
  Heart,
  Share2,
  Ellipsis,
  Filter,
  ChevronDown,
} from "lucide-react"
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
  const mockAbout =
    "Book lover, coffee addict, and aspiring writer. I read mostly fantasy, sci-fi, and literary fiction."
  const mockJoinedDate = "March 2020"

  // Mock currently reading books
  const mockCurrentlyReading = [
    {
      title: "The Name of the Wind",
      author: "Patrick Rothfuss",
      progress: 65,
      coverUrl: "/placeholder.svg?height=240&width=160",
    },
    {
      title: "Project Hail Mary",
      author: "Andy Weir",
      progress: 23,
      coverUrl: "/placeholder.svg?height=240&width=160",
    },
  ]

  // Mock photos
  const mockPhotos = [
    "/placeholder.svg?height=300&width=300",
    "/placeholder.svg?height=300&width=300",
    "/placeholder.svg?height=300&width=300",
    "/placeholder.svg?height=300&width=300",
    "/placeholder.svg?height=300&width=300",
    "/placeholder.svg?height=300&width=300",
  ]

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
        isEditable={authUser && (authUser.role === 'admin' || authUser.role === 'super_admin' || authUser.role === 'super-admin') ? true : undefined}
      />
      
      {/* Timeline Tab Content */}
      {activeTab === "timeline" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* About Section */}
            <Card>
              <div className="flex flex-col space-y-1.5 p-6">
                <div className="text-2xl font-semibold leading-none tracking-tight">About</div>
              </div>
              <CardContent className="p-6 pt-0 space-y-4">
                <p>{mockAbout}</p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Lives in {mockLocation}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Joined {mockJoinedDate}</span>
                  </div>
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a
                      href={`https://${mockWebsite}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Website
                    </a>
                  </div>
                </div>
                <Link href="/profile/edit" className="w-full">
                  <Button variant="outline" className="w-full">
                    <SquarePen className="h-4 w-4 mr-2" />
                    Edit Details
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Currently Reading Section */}
            <Card>
              <div className="space-y-1.5 p-6 flex flex-row items-center justify-between">
                <div className="text-2xl font-semibold leading-none tracking-tight">Currently Reading</div>
                <Link href="/my-books" className="text-sm text-primary hover:underline">
                  See All
                </Link>
              </div>
              <CardContent className="p-6 pt-0 space-y-4">
                {mockCurrentlyReading.map((book, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="relative h-20 w-14 flex-shrink-0">
                      <img
                        src={book.coverUrl || "/placeholder.svg"}
                        alt={book.title}
                        className="object-cover rounded-md absolute inset-0 w-full h-full"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium line-clamp-1">{book.title}</h4>
                      <p className="text-sm text-muted-foreground">by {book.author}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{book.progress}%</span>
                        </div>
                        <div className="relative w-full overflow-hidden rounded-full bg-secondary h-1.5">
                          <div
                            className="h-full w-full flex-1 bg-primary transition-all"
                            style={{ transform: `translateX(-${100 - book.progress}%)` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Photos Section */}
            <Card>
              <div className="space-y-1.5 p-6 flex flex-row items-center justify-between">
                <div className="text-2xl font-semibold leading-none tracking-tight">Photos</div>
                <Link href={`/profile/${mockUsername}/photos`} className="text-sm text-primary hover:underline">
                  See All
                </Link>
              </div>
              <CardContent className="p-6 pt-0">
                <div className="grid grid-cols-3 gap-2">
                  {mockPhotos.slice(0, 6).map((photoUrl, index) => (
                    <div key={index} className="aspect-square relative rounded overflow-hidden">
                      <img
                        src={photoUrl || "/placeholder.svg"}
                        alt={`Photo ${index + 1}`}
                        className="object-cover hover:scale-105 transition-transform absolute inset-0 w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post Creation Form */}
            <Card>
              <CardContent className="p-6 pt-6">
                <form>
                  <div className="flex gap-3">
                    <span className="relative flex shrink-0 overflow-hidden rounded-full h-10 w-10">
                      <img
                        src={avatarUrl || "/placeholder.svg?height=200&width=200"}
                        alt={user.name}
                        className="aspect-square h-full w-full"
                      />
                    </span>
                    <Textarea
                      placeholder={`What are you reading, ${user.name?.split(" ")[0] || "there"}?`}
                      className="flex-1 resize-none"
                    />
                  </div>
                  <div className="flex justify-between mt-4">
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" size="sm">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Photo
                      </Button>
                      <Button type="button" variant="ghost" size="sm">
                        <Book className="h-4 w-4 mr-2" />
                        Book
                      </Button>
                      <Button type="button" variant="ghost" size="sm">
                        <Star className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </div>
                    <Button type="submit" disabled>
                      Post
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card>
              <div className="flex flex-col space-y-1.5 p-6 pb-3">
                <div className="flex justify-between">
                  <div className="flex items-center gap-3">
                    <span className="relative flex shrink-0 overflow-hidden rounded-full h-10 w-10">
                      <img
                        src={avatarUrl || "/placeholder.svg?height=200&width=200"}
                        alt={user.name}
                        className="aspect-square h-full w-full"
                      />
                    </span>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">2 days ago</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Ellipsis className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-6 pt-0 pb-3">
                <p>
                  Rated{" "}
                  <Link href="#" className="text-primary hover:underline font-medium">
                    Dune
                  </Link>{" "}
                  by Frank Herbert 5 stars
                </p>
              </div>
              <div className="p-6 flex items-center justify-between py-3">
                <div className="flex items-center gap-6">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Heart className="h-4 w-4" />
                    <span>Like</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>Comment</span>
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4" />
                    <span className="ml-1">Share</span>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* About Tab Content */}
      {activeTab === "about" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow overflow-hidden sticky top-20 border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-medium">About</h2>
              </div>
              <nav className="p-2">
                <a
                  href="#overview"
                  className="flex items-center px-3 py-2 rounded-md hover:bg-muted text-primary"
                >
                  Overview
                </a>
                <a href="#work-education" className="flex items-center px-3 py-2 rounded-md hover:bg-muted">
                  Work and Education
                </a>
                <a href="#contact-info" className="flex items-center px-3 py-2 rounded-md hover:bg-muted">
                  Contact Information
                </a>
              </nav>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm" id="overview">
              <div className="flex flex-col space-y-1.5 p-6">
                <div className="text-2xl font-semibold leading-none tracking-tight">Overview</div>
              </div>
              <div className="p-6 pt-0 space-y-4">
                <p className="text-muted-foreground">{mockAbout}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="font-medium">Website</h3>
                      <a
                        href={`https://${mockWebsite}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {mockWebsite}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="font-medium">Joined</h3>
                      <p className="text-muted-foreground">{mockJoinedDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Books Tab Content */}
      {activeTab === "books" && (
        <div className="p-6">
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="font-semibold text-xl mb-4">Your Books</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border p-4 flex flex-col items-center justify-center">
                  <BookOpen className="h-8 w-8 text-primary mb-2" />
                  <h3 className="text-lg font-semibold">{mockBooksRead}</h3>
                  <p className="text-sm text-muted-foreground">Books Read</p>
                </div>
                <div className="rounded-lg border p-4 flex flex-col items-center justify-center">
                  <Book className="h-8 w-8 text-amber-500 mb-2" />
                  <h3 className="text-lg font-semibold">2</h3>
                  <p className="text-sm text-muted-foreground">Currently Reading</p>
                </div>
                <div className="rounded-lg border p-4 flex flex-col items-center justify-center">
                  <Star className="h-8 w-8 text-yellow-500 mb-2" />
                  <h3 className="text-lg font-semibold">4.2</h3>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <h3 className="text-lg font-medium mb-4">Currently Reading</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {mockCurrentlyReading.map((book, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="aspect-[2/3] relative">
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h4 className="font-medium line-clamp-1">{book.title}</h4>
                  <p className="text-sm text-muted-foreground">by {book.author}</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{book.progress}%</span>
                    </div>
                    <div className="relative w-full overflow-hidden rounded-full bg-secondary h-1.5">
                      <div
                        className="h-full w-full flex-1 bg-primary transition-all"
                        style={{ transform: `translateX(-${100 - book.progress}%)` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Friends Tab Content */}
      {activeTab === "friends" && (
        <div className="p-6">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-xl">Friends</h2>
                <Input 
                  type="search"
                  placeholder="Search friends..." 
                  className="max-w-xs"
                />
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="p-4 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    <img 
                      src="/placeholder.svg?height=100&width=100" 
                      alt={`Friend ${i+1}`}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Friend Name {i+1}</h3>
                    <p className="text-sm text-muted-foreground">12 mutual friends</p>
                    <Button size="sm" variant="outline" className="mt-2">
                      <UserPlus className="h-3 w-3 mr-1" />
                      View Profile
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Photos Tab Content */}
      {activeTab === "photos" && (
        <div className="p-6">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-xl">Photos</h2>
                <Button size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mockPhotos.map((photo, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden border">
                <img 
                  src={photo}
                  alt={`Photo ${i+1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform" 
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* More Tab Content */}
      {activeTab === "more" && (
        <div className="p-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">More Options</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start">
                  <SquarePen className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline" className="justify-start">
                  <Camera className="h-4 w-4 mr-2" />
                  Change Profile Picture
                </Button>
                <Button variant="outline" className="justify-start">
                  <Filter className="h-4 w-4 mr-2" />
                  Preferences
                </Button>
                <Button variant="outline" className="justify-start">
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Account Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
} 