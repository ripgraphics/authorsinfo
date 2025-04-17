"use client"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
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

interface ClientPublisherPageProps {
  publisher: any
  coverImageUrl: string
  publisherImageUrl: string
  params: {
    id: string
  }
}

export function ClientPublisherPage({ publisher, coverImageUrl, publisherImageUrl, params }: ClientPublisherPageProps) {
  const [activeTab, setActiveTab] = useState("timeline")

  // Mock data for the profile
  const mockName = publisher?.name || "Jane Reader"
  const mockUsername = publisher?.name ? publisher.name.replace(/\s+/g, "").toLowerCase() : "janereader"
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
    "/placeholder.svg?height=300&width=300",
    "/placeholder.svg?height=300&width=300",
    "/placeholder.svg?height=300&width=300",
  ]

  // Mock friends
  const mockFriends = [
    { id: "1", name: "Alex Thompson", avatar: "/placeholder.svg?height=100&width=100" },
    { id: "2", name: "Maria Garcia", avatar: "/placeholder.svg?height=100&width=100" },
    { id: "3", name: "James Wilson", avatar: "/placeholder.svg?height=100&width=100" },
    { id: "4", name: "Emma Davis", avatar: "/placeholder.svg?height=100&width=100" },
    { id: "5", name: "Michael Brown", avatar: "/placeholder.svg?height=100&width=100" },
    { id: "6", name: "Sophia Martinez", avatar: "/placeholder.svg?height=100&width=100" },
    { id: "7", name: "Daniel Lee", avatar: "/placeholder.svg?height=100&width=100" },
    { id: "8", name: "Olivia Johnson", avatar: "/placeholder.svg?height=100&width=100" },
    { id: "9", name: "William Smith", avatar: "/placeholder.svg?height=100&width=100" },
  ]

  // Mock activities
  const mockActivities = [
    {
      id: "1",
      type: "rating",
      bookTitle: "Dune",
      bookAuthor: "Frank Herbert",
      rating: 5,
      timeAgo: "2 days ago",
    },
    {
      id: "2",
      type: "finished",
      bookTitle: "The Hobbit",
      bookAuthor: "J.R.R. Tolkien",
      timeAgo: "1 week ago",
    },
    {
      id: "3",
      type: "added",
      bookTitle: "The Way of Kings",
      bookAuthor: "Brandon Sanderson",
      shelf: "Want to Read",
      timeAgo: "2 weeks ago",
    },
    {
      id: "4",
      type: "reviewed",
      bookTitle: "Circe",
      bookAuthor: "Madeline Miller",
      timeAgo: "3 weeks ago",
    },
  ]

  // Mock data for friends tab
  const mockFriendsTabData = [
    {
      id: "1",
      name: "Alex Thompson",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "Seattle, WA",
      mutualFriends: 15,
    },
    {
      id: "2",
      name: "Maria Garcia",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "Portland, OR",
      mutualFriends: 8,
    },
    {
      id: "3",
      name: "James Wilson",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "San Francisco, CA",
      mutualFriends: 12,
    },
    {
      id: "4",
      name: "Emma Davis",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "Chicago, IL",
      mutualFriends: 5,
    },
    {
      id: "5",
      name: "Michael Brown",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "New York, NY",
      mutualFriends: 10,
    },
    {
      id: "6",
      name: "Sophia Martinez",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "Los Angeles, CA",
      mutualFriends: 7,
    },
    {
      id: "7",
      name: "Daniel Lee",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "Boston, MA",
      mutualFriends: 9,
    },
    {
      id: "8",
      name: "Olivia Johnson",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "Austin, TX",
      mutualFriends: 6,
    },
    {
      id: "9",
      name: "William Smith",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "Denver, CO",
      mutualFriends: 11,
    },
  ]

  // Mock friend suggestions
  const mockFriendSuggestions = [
    { id: "101", name: "Mark Johnson", avatar: "/placeholder.svg?height=100&width=100", mutualFriends: 12 },
    { id: "102", name: "Sarah Williams", avatar: "/placeholder.svg?height=100&width=100", mutualFriends: 8 },
    { id: "103", name: "David Chen", avatar: "/placeholder.svg?height=100&width=100", mutualFriends: 5 },
  ]

  // Mock photos tab data
  const mockPhotosTabData = [
    { id: "1", title: "Reading at the park", date: "June 15, 2023", url: "/placeholder.svg?height=300&width=300" },
    { id: "2", title: "My bookshelf", date: "May 22, 2023", url: "/placeholder.svg?height=300&width=300" },
    { id: "3", title: "Book haul!", date: "April 10, 2023", url: "/placeholder.svg?height=300&width=300" },
    { id: "4", title: "Author signing event", date: "March 5, 2023", url: "/placeholder.svg?height=300&width=300" },
    { id: "5", title: "Reading nook", date: "February 18, 2023", url: "/placeholder.svg?height=300&width=300" },
    { id: "6", title: "Book club meeting", date: "January 30, 2023", url: "/placeholder.svg?height=300&width=300" },
    { id: "7", title: "Visiting the library", date: "December 12, 2022", url: "/placeholder.svg?height=300&width=300" },
    { id: "8", title: "New bookmarks", date: "November 5, 2022", url: "/placeholder.svg?height=300&width=300" },
    {
      id: "9",
      title: "Reading by the fireplace",
      date: "October 22, 2022",
      url: "/placeholder.svg?height=300&width=300",
    },
    { id: "10", title: "Book festival", date: "September 17, 2022", url: "/placeholder.svg?height=300&width=300" },
    { id: "11", title: "Author panel", date: "August 8, 2022", url: "/placeholder.svg?height=300&width=300" },
    { id: "12", title: "Book-themed cafe", date: "July 24, 2022", url: "/placeholder.svg?height=300&width=300" },
  ]

  return (
    <main className="container py-6">
      {/* Cover Photo and Profile Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="relative h-[300px]">
          <img
            src={coverImageUrl || "/placeholder.svg?height=400&width=1200"}
            alt="Cover"
            className="object-cover absolute inset-0 w-full h-full"
          />
          <Button variant="outline" size="sm" className="absolute bottom-4 right-4 bg-white/80 hover:bg-white">
            <Camera className="h-4 w-4 mr-2" />
            Change Cover
          </Button>
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end -mt-16 md:-mt-20 relative z-10">
            <div className="relative">
              <span className="relative flex shrink-0 overflow-hidden h-32 w-32 md:h-40 md:w-40 border-4 border-white rounded-full">
                <img
                  src={publisherImageUrl || "/placeholder.svg?height=200&width=200"}
                  alt={mockName}
                  className="aspect-square h-full w-full"
                />
              </span>
              <Button
                variant="outline"
                size="icon"
                className="absolute bottom-2 right-2 rounded-full h-8 w-8 bg-white/80 hover:bg-white"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 md:mt-0 md:ml-6 flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{mockName}</h1>
                  <p className="text-muted-foreground">@{mockUsername}</p>
                </div>

                <div className="flex space-x-2 mt-4 md:mt-0">
                  <Button className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="outline" className="flex items-center">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Friend
                  </Button>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                <div className="flex items-center text-muted-foreground">
                  <BookOpen className="h-4 w-4 mr-1" />
                  <span>{mockBooksRead} books read</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{mockFriendsCount} friends</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{mockLocation}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Globe className="h-4 w-4 mr-1" />
                  <a
                    href={`https://${mockWebsite}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {mockWebsite}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-t">
        <div className="w-full">
          <div className="container">
            <Tabs defaultValue="timeline" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-6 h-auto mt-0 bg-transparent">
                <TabsTrigger
                  value="timeline"
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-12"
                >
                  Timeline
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-12"
                >
                  About
                </TabsTrigger>
                <TabsTrigger
                  value="books"
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-12"
                >
                  Books
                </TabsTrigger>
                <TabsTrigger
                  value="friends"
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-12"
                >
                  Friends
                </TabsTrigger>
                <TabsTrigger
                  value="photos"
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-12"
                >
                  Photos
                </TabsTrigger>
                <TabsTrigger
                  value="more"
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-12"
                >
                  More
                </TabsTrigger>
              </TabsList>

              {/* Timeline Tab Content */}
              <TabsContent value="timeline">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                              {mockWebsite}
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
                        <Link href="/profile/janereader/photos" className="text-sm text-primary hover:underline">
                          See All
                        </Link>
                      </div>
                      <CardContent className="p-6 pt-0">
                        <div className="grid grid-cols-3 gap-2">
                          {mockPhotos.map((photoUrl, index) => (
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

                    {/* Friends Section */}
                    <Card>
                      <div className="space-y-1.5 p-6 flex flex-row items-center justify-between">
                        <div className="text-2xl font-semibold leading-none tracking-tight">Friends</div>
                        <Link href="/profile/janereader/friends" className="text-sm text-primary hover:underline">
                          See All
                        </Link>
                      </div>
                      <CardContent className="p-6 pt-0">
                        <div className="grid grid-cols-3 gap-2">
                          {mockFriends.map((friend) => (
                            <Link
                              key={friend.id}
                              href={`/profile/${friend.id}`}
                              className="flex flex-col items-center text-center"
                            >
                              <span className="relative flex shrink-0 overflow-hidden rounded-full h-16 w-16 mb-1">
                                <img
                                  src={friend.avatar || "/placeholder.svg"}
                                  alt={friend.name}
                                  className="aspect-square h-full w-full"
                                />
                              </span>
                              <span className="text-xs line-clamp-1">{friend.name}</span>
                            </Link>
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
                                src={publisherImageUrl || "/placeholder.svg?height=200&width=200"}
                                alt={mockName}
                                className="aspect-square h-full w-full"
                              />
                            </span>
                            <Textarea
                              placeholder={`What are you reading, ${mockName.split(" ")[0]}?`}
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
                    <div className="space-y-6">
                      {mockActivities.map((activity) => (
                        <Card key={activity.id}>
                          <div className="flex flex-col space-y-1.5 p-6 pb-3">
                            <div className="flex justify-between">
                              <div className="flex items-center gap-3">
                                <span className="relative flex shrink-0 overflow-hidden rounded-full h-10 w-10">
                                  <img
                                    src={publisherImageUrl || "/placeholder.svg?height=200&width=200"}
                                    alt={mockName}
                                    className="aspect-square h-full w-full"
                                  />
                                </span>
                                <div>
                                  <div className="font-medium">{mockName}</div>
                                  <div className="text-xs text-muted-foreground">{activity.timeAgo}</div>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon">
                                <Ellipsis className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="p-6 pt-0 pb-3">
                            {activity.type === "rating" && (
                              <p>
                                Rated{" "}
                                <Link href="#" className="text-primary hover:underline font-medium">
                                  {activity.bookTitle}
                                </Link>{" "}
                                by {activity.bookAuthor} {activity.rating} stars
                              </p>
                            )}
                            {activity.type === "finished" && (
                              <p>
                                Finished reading{" "}
                                <Link href="#" className="text-primary hover:underline font-medium">
                                  {activity.bookTitle}
                                </Link>{" "}
                                by {activity.bookAuthor}
                              </p>
                            )}
                            {activity.type === "added" && (
                              <p>
                                Added{" "}
                                <Link href="#" className="text-primary hover:underline font-medium">
                                  {activity.bookTitle}
                                </Link>{" "}
                                by {activity.bookAuthor} to {activity.shelf}
                              </p>
                            )}
                            {activity.type === "reviewed" && (
                              <p>
                                Reviewed{" "}
                                <Link href="#" className="text-primary hover:underline font-medium">
                                  {activity.bookTitle}
                                </Link>{" "}
                                by {activity.bookAuthor}
                              </p>
                            )}
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
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* About Tab Content */}
              <TabsContent value="about">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow overflow-hidden sticky top-20">
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
                        <a href="#interests" className="flex items-center px-3 py-2 rounded-md hover:bg-muted">
                          Interests
                        </a>
                        <a href="#favorite-quotes" className="flex items-center px-3 py-2 rounded-md hover:bg-muted">
                          Favorite Quotes
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
                        <p className="text-muted-foreground">
                          Book lover, coffee addict, and aspiring writer. I read mostly fantasy, sci-fi, and literary
                          fiction.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3">
                            <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <h3 className="font-medium">Website</h3>
                              <a
                                href="https://janereader.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                janereader.com
                              </a>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <h3 className="font-medium">Joined</h3>
                              <p className="text-muted-foreground">March 2020</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm" id="work-education">
                      <div className="flex flex-col space-y-1.5 p-6">
                        <div className="text-2xl font-semibold leading-none tracking-tight">Work and Education</div>
                      </div>
                      <div className="p-6 pt-0 space-y-6">
                        <div>
                          <h3 className="font-medium text-lg mb-3 flex items-center">
                            <Globe className="h-5 w-5 mr-2 text-muted-foreground" />
                            Work
                          </h3>
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="bg-muted h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Globe className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <h4 className="font-medium">Book Specialist</h4>
                                <p className="text-muted-foreground">Powell&apos;s Books</p>
                                <p className="text-sm text-muted-foreground">2018-Present</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="bg-muted h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Globe className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <h4 className="font-medium">Assistant Librarian</h4>
                                <p className="text-muted-foreground">Portland Library</p>
                                <p className="text-sm text-muted-foreground">2016-2018</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-lg mb-3 flex items-center">
                            <Globe className="h-5 w-5 mr-2 text-muted-foreground" />
                            Education
                          </h3>
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="bg-muted h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Globe className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <h4 className="font-medium">University of Oregon</h4>
                                <p className="text-muted-foreground">Bachelor of Arts in English Literature</p>
                                <p className="text-sm text-muted-foreground">2012-2016</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="bg-muted h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Globe className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <h4 className="font-medium">Portland Community College</h4>
                                <p className="text-muted-foreground">Associate&apos;s Degree in Creative Writing</p>
                                <p className="text-sm text-muted-foreground">2010-2012</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm" id="contact-info">
                      <div className="flex flex-col space-y-1.5 p-6">
                        <div className="text-2xl font-semibold leading-none tracking-tight">Contact Information</div>
                      </div>
                      <div className="p-6 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3">
                            <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <h3 className="font-medium">Email</h3>
                              <a href="mailto:jane.reader@example.com" className="text-primary hover:underline">
                                jane.reader@example.com
                              </a>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <h3 className="font-medium">Phone</h3>
                              <p className="text-muted-foreground">(503) 555-1234</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <h3 className="font-medium">Website</h3>
                              <a
                                href="https://janereader.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                janereader.com
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm" id="interests">
                      <div className="flex flex-col space-y-1.5 p-6">
                        <div className="text-2xl font-semibold leading-none tracking-tight">Interests</div>
                      </div>
                      <div className="p-6 pt-0">
                        <div className="flex flex-wrap gap-2">
                          <div className="inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1 text-sm">
                            Fantasy Fiction
                          </div>
                          <div className="inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1 text-sm">
                            Science Fiction
                          </div>
                          <div className="inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1 text-sm">
                            Literary Criticism
                          </div>
                          <div className="inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1 text-sm">
                            Book Clubs
                          </div>
                          <div className="inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1 text-sm">
                            Writing
                          </div>
                          <div className="inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1 text-sm">
                            Coffee
                          </div>
                          <div className="inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1 text-sm">
                            Hiking
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm" id="favorite-quotes">
                      <div className="flex flex-col space-y-1.5 p-6">
                        <div className="text-2xl font-semibold leading-none tracking-tight">Favorite Quotes</div>
                      </div>
                      <div className="p-6 pt-0">
                        <div className="space-y-4">
                          <div className="border-l-4 border-muted pl-4 italic">
                            <p className="text-muted-foreground">
                              A reader lives a thousand lives before he dies. The man who never reads lives only one. -
                              George R.R. Martin
                            </p>
                          </div>
                          <div className="border-l-4 border-muted pl-4 italic">
                            <p className="text-muted-foreground">Books are a uniquely portable magic. - Stephen King</p>
                          </div>
                          <div className="border-l-4 border-muted pl-4 italic">
                            <p className="text-muted-foreground">I cannot live without books. - Thomas Jefferson</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Books Tab Content */}
              <TabsContent value="books">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow overflow-hidden sticky top-20">
                      <div className="p-4 border-b">
                        <h2 className="text-lg font-medium">Books</h2>
                      </div>
                      <nav className="p-2">
                        <a
                          href="#currently-reading"
                          className="flex items-center px-3 py-2 rounded-md hover:bg-muted text-primary"
                        >
                          Currently Reading
                        </a>
                        <a href="#favorite-books" className="flex items-center px-3 py-2 rounded-md hover:bg-muted">
                          Favorite Books
                        </a>
                        <a href="#recently-read" className="flex items-center px-3 py-2 rounded-md hover:bg-muted">
                          Recently Read
                        </a>
                        <a href="#bookshelves" className="flex items-center px-3 py-2 rounded-md hover:bg-muted">
                          Bookshelves
                        </a>
                      </nav>
                      <div className="p-4 border-t">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">Reading Stats</h3>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Books Read</span>
                              <span className="font-medium">127</span>
                            </div>
                            <div
                              aria-valuemax="100"
                              aria-valuemin="0"
                              role="progressbar"
                              data-state="indeterminate"
                              data-max="100"
                              className="relative w-full overflow-hidden rounded-full bg-secondary h-2"
                            >
                              <div
                                data-state="indeterminate"
                                data-max="100"
                                className="h-full w-full flex-1 bg-primary transition-all"
                                style={{ transform: "translateX(-36.5%)" }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>To Read</span>
                              <span className="font-medium">342</span>
                            </div>
                            <div
                              aria-valuemax="100"
                              aria-valuemin="0"
                              role="progressbar"
                              data-state="indeterminate"
                              data-max="100"
                              className="relative w-full overflow-hidden rounded-full bg-secondary h-2"
                            >
                              <div
                                data-state="indeterminate"
                                data-max="100"
                                className="h-full w-full flex-1 bg-primary transition-all"
                                style={{ transform: "translateX(-31.6%)" }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>2023 Reading Goal</span>
                              <span className="font-medium">24/50 books</span>
                            </div>
                            <div
                              aria-valuemax="100"
                              aria-valuemin="0"
                              role="progressbar"
                              data-state="indeterminate"
                              data-max="100"
                              className="relative w-full overflow-hidden rounded-full bg-secondary h-2"
                            >
                              <div
                                data-state="indeterminate"
                                data-max="100"
                                className="h-full w-full flex-1 bg-primary transition-all"
                                style={{ transform: "translateX(-52%)" }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm" id="currently-reading">
                      <div className="flex flex-col space-y-1.5 p-6">
                        <div className="text-2xl font-semibold leading-none tracking-tight">Currently Reading</div>
                      </div>
                      <div className="p-6 pt-0 space-y-6">
                        <div className="flex gap-4 p-4 border rounded-lg">
                          <div className="relative h-32 w-20 flex-shrink-0">
                            <img
                              src="/placeholder.svg?height=240&width=160"
                              alt="The Name of the Wind"
                              className="object-cover rounded-md"
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <h3 className="font-medium">The Name of the Wind</h3>
                              <p className="text-sm text-muted-foreground">by Patrick Rothfuss</p>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>65%</span>
                              </div>
                              <div
                                aria-valuemax="100"
                                aria-valuemin="0"
                                role="progressbar"
                                data-state="indeterminate"
                                data-max="100"
                                className="relative w-full overflow-hidden rounded-full bg-secondary h-1.5"
                              >
                                <div
                                  data-state="indeterminate"
                                  data-max="100"
                                  className="h-full w-full flex-1 bg-primary transition-all"
                                  style={{ transform: "translateX(-35%)" }}
                                ></div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3">
                                Update Progress
                              </Button>
                              <Button variant="outline" className="h-9 rounded-md px-3">
                                Finished
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-4 p-4 border rounded-lg">
                          <div className="relative h-32 w-20 flex-shrink-0">
                            <img
                              src="/placeholder.svg?height=240&width=160"
                              alt="Project Hail Mary"
                              className="object-cover rounded-md"
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <h3 className="font-medium">Project Hail Mary</h3>
                              <p className="text-sm text-muted-foreground">by Andy Weir</p>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>23%</span>
                              </div>
                              <div
                                aria-valuemax="100"
                                aria-valuemin="0"
                                role="progressbar"
                                data-state="indeterminate"
                                data-max="100"
                                className="relative w-full overflow-hidden rounded-full bg-secondary h-1.5"
                              >
                                <div
                                  data-state="indeterminate"
                                  data-max="100"
                                  className="h-full w-full flex-1 bg-primary transition-all"
                                  style={{ transform: "translateX(-77%)" }}
                                ></div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3">
                                Update Progress
                              </Button>
                              <Button variant="outline" className="h-9 rounded-md px-3">
                                Finished
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm" id="favorite-books">
                      <div className="flex flex-col space-y-1.5 p-6">
                        <div className="text-2xl font-semibold leading-none tracking-tight">Favorite Books</div>
                      </div>
                      <div className="p-6 pt-0">
                        <div className="space-y-6">
                          <div className="flex gap-4 p-4 border rounded-lg">
                            <div className="relative h-40 w-24 flex-shrink-0">
                              <img
                                src="/placeholder.svg?height=240&width=160"
                                alt="The Way of Kings"
                                className="object-cover rounded-md shadow-md hover:shadow-lg transition-shadow"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-lg">The Way of Kings</h3>
                              <p className="text-muted-foreground">by Brandon Sanderson</p>
                              <div className="flex items-center mt-2 mb-3">
                                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                              </div>
                              <p className="text-sm">
                                Absolutely incredible world-building and character development. One of my all-time
                                favorites.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-4 p-4 border rounded-lg">
                            <div className="relative h-40 w-24 flex-shrink-0">
                              <img
                                src="/placeholder.svg?height=240&width=160"
                                alt="Pride and Prejudice"
                                className="object-cover rounded-md shadow-md hover:shadow-lg transition-shadow"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-lg">Pride and Prejudice</h3>
                              <p className="text-muted-foreground">by Jane Austen</p>
                              <div className="flex items-center mt-2 mb-3">
                                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                              </div>
                              <p className="text-sm">A timeless classic that I return to again and again.</p>
                            </div>
                          </div>
                          <div className="flex gap-4 p-4 border rounded-lg">
                            <div className="relative h-40 w-24 flex-shrink-0">
                              <img
                                src="/placeholder.svg?height=240&width=160"
                                alt="The Hitchhiker's Guide to the Galaxy"
                                className="object-cover rounded-md shadow-md hover:shadow-lg transition-shadow"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-lg">The Hitchhiker&apos;s Guide to the Galaxy</h3>
                              <p className="text-muted-foreground">by Douglas Adams</p>
                              <div className="flex items-center mt-2 mb-3">
                                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                              </div>
                              <p className="text-sm">
                                Hilarious and thought-provoking. The perfect blend of sci-fi and comedy.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm" id="recently-read">
                      <div className="flex flex-col space-y-1.5 p-6">
                        <div className="text-2xl font-semibold leading-none tracking-tight">Recently Read</div>
                      </div>
                      <div className="p-6 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex gap-3 p-3 border rounded-lg">
                            <div className="relative h-24 w-16 flex-shrink-0">
                              <img
                                src="/placeholder.svg?height=240&width=160"
                                alt="Circe"
                                className="object-cover rounded-md"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">Circe</h3>
                              <p className="text-sm text-muted-foreground">by Madeline Miller</p>
                              <div className="flex items-center mt-1">
                                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">Read in June 2023</p>
                            </div>
                          </div>
                          <div className="flex gap-3 p-3 border rounded-lg">
                            <div className="relative h-24 w-16 flex-shrink-0">
                              <img
                                src="/placeholder.svg?height=240&width=160"
                                alt="The Invisible Life of Addie LaRue"
                                className="object-cover rounded-md"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">The Invisible Life of Addie LaRue</h3>
                              <p className="text-sm text-muted-foreground">by V.E. Schwab</p>
                              <div className="flex items-center mt-1">
                                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">Read in May 2023</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Friends Tab Content */}
              <TabsContent value="friends">
                <div className="space-y-6">
                  <Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col space-y-1.5 p-6">
                      <div className="flex justify-between items-center">
                        <div className="text-2xl font-semibold leading-none tracking-tight">
                          Friends · {mockFriendsCount}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input className="w-[200px]" placeholder="Search friends..." type="search" />
                          <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-6 pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mockFriendsTabData.map((friend) => (
                          <div key={friend.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                              <img
                                src={friend.avatar || "/placeholder.svg"}
                                alt={friend.name}
                                className="aspect-square h-full w-full"
                              />
                            </span>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">{friend.name}</h3>
                              <p className="text-xs text-muted-foreground">{friend.location}</p>
                              <p className="text-xs text-muted-foreground">{friend.mutualFriends} mutual friends</p>
                            </div>
                            <Button variant="ghost" size="icon">
                              <Ellipsis className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col space-y-1.5 p-6">
                      <div className="text-2xl font-semibold leading-none tracking-tight">Friend Suggestions</div>
                    </div>
                    <CardContent className="p-6 pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {mockFriendSuggestions.map((friend) => (
                          <div key={friend.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                              <img
                                src={friend.avatar || "/placeholder.svg"}
                                alt={friend.name}
                                className="aspect-square h-full w-full"
                              />
                            </span>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">{friend.name}</h3>
                              <p className="text-xs text-muted-foreground">{friend.mutualFriends} mutual friends</p>
                              <Button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 mt-2">
                                Add Friend
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Photos Tab Content */}
              <TabsContent value="photos">
                <div className="space-y-6">
                  <Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col space-y-1.5 p-6">
                      <div className="flex justify-between items-center">
                        <div className="text-2xl font-semibold leading-none tracking-tight">Photos</div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            role="combobox"
                            aria-controls="radix-:rk:"
                            aria-expanded="false"
                            aria-autocomplete="none"
                            dir="ltr"
                            data-state="closed"
                            className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-[180px]"
                          >
                            <span style={{ pointerEvents: "none" }}>All Photos</span>
                            <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
                          </Button>
                          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Add Photos
                          </Button>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-6 pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {mockPhotosTabData.map((photo) => (
                          <div key={photo.id} className="group relative">
                            <div className="aspect-square relative rounded-lg overflow-hidden">
                              <img
                                alt={photo.title}
                                src={photo.url || "/placeholder.svg"}
                                className="object-cover group-hover:scale-105 transition-transform absolute inset-0 w-full h-full"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                              <div className="p-3 text-white w-full">
                                <p className="text-sm truncate">{photo.title}</p>
                                <p className="text-xs opacity-80">{photo.date}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* More Tab Content */}
              <TabsContent value="more">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col space-y-1.5 p-6">
                      <div className="text-2xl font-semibold leading-none tracking-tight">Groups</div>
                    </div>
                    <div className="p-6 pt-0 space-y-4">
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Fantasy Book Club"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Fantasy Book Club</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Moderator
                            </div>
                            <span>·</span>
                            <span>1243 members</span>
                            <span>·</span>
                            <span>Joined January 2021</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Science Fiction Readers"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Science Fiction Readers</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Member
                            </div>
                            <span>·</span>
                            <span>3567 members</span>
                            <span>·</span>
                            <span>Joined March 2021</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Portland Book Lovers"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Portland Book Lovers</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Member
                            </div>
                            <span>·</span>
                            <span>567 members</span>
                            <span>·</span>
                            <span>Joined April 2020</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Women Writers Book Club"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Women Writers Book Club</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Member
                            </div>
                            <span>·</span>
                            <span>892 members</span>
                            <span>·</span>
                            <span>Joined September 2022</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Literary Fiction Fans"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Literary Fiction Fans</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Member
                            </div>
                            <span>·</span>
                            <span>1456 members</span>
                            <span>·</span>
                            <span>Joined July 2021</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Classic Literature Society"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Classic Literature Society</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Member
                            </div>
                            <span>·</span>
                            <span>789 members</span>
                            <span>·</span>
                            <span>Joined February 2022</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <Button className="h-10 px-4 py-2 w-full">
                        <Users className="h-4 w-4 mr-2" />
                        Find More Groups
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col space-y-1.5 p-6">
                      <div className="text-2xl font-semibold leading-none tracking-tight">Pages</div>
                    </div>
                    <div className="p-6 pt-0 space-y-4">
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Brandon Sanderson"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Brandon Sanderson</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Author
                            </div>
                            <span>·</span>
                            <span>Following Since 2020</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Tor Books"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Tor Books</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Publisher
                            </div>
                            <span>·</span>
                            <span>Following Since 2021</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Powell's Books"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Powell&apos;s Books</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Bookstore
                            </div>
                            <span>·</span>
                            <span>Following Since 2019</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Neil Gaiman"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Neil Gaiman</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Author
                            </div>
                            <span>·</span>
                            <span>Following Since 2020</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Penguin Random House"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Penguin Random House</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Publisher
                            </div>
                            <span>·</span>
                            <span>Following Since 2022</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                          <img
                            src="/placeholder.svg?height=100&width=100"
                            alt="Barnes & Noble"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">Barnes & Noble</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                              Bookstore
                            </div>
                            <span>·</span>
                            <span>Following Since 2021</span>
                          </div>
                        </div>
                        <Button variant="outline" className="h-9 rounded-md px-3">
                          View
                        </Button>
                      </div>
                      <Button className="h-10 px-4 py-2 w-full">
                        <Book className="h-4 w-4 mr-2" />
                        Discover More Pages
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  )
}
