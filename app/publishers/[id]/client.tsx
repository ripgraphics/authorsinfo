"use client"

import { Input } from "@/components/ui/input"

import { useState } from "react"
import Link from "next/link"
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
  Building,
} from "lucide-react"
import { BookCard } from "@/components/book-card"
import Image from "next/image"
import { 
  AboutNavigation, 
  OverviewSection, 
  ContactSection, 
  LocationSection, 
  BooksSection 
} from "./components/AboutSections"

interface ClientPublisherPageProps {
  publisher: any
  coverImageUrl: string
  publisherImageUrl: string
  params: {
    id: string
  }
  followers?: any[]
  followersCount?: number
  books?: any[]
  booksCount?: number
}

export function ClientPublisherPage({ publisher, coverImageUrl, publisherImageUrl, params, followers = [], followersCount = 0, books = [], booksCount = 0 }: ClientPublisherPageProps) {
  const [activeTab, setActiveTab] = useState("timeline")

  // Mock data for the profile
  const mockName = publisher?.name || "Jane Reader"
  const mockUsername = publisher?.name ? publisher.name.replace(/\s+/g, "").toLowerCase() : "janereader"
  const mockBooksRead = 127
  const mockFriendsCount = followersCount || 248
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
    <div className="publisher-page publisher-page__container container py-6">
      {/* Cover Photo and Profile Section */}
      <div className="publisher-page__header bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="publisher-page__cover-image relative h-auto aspect-[1344/500]">
          <img
            src={coverImageUrl || "/placeholder.svg?height=400&width=1200"}
            alt="Cover"
            className="publisher-page__cover-image-content object-cover absolute inset-0 w-full h-full"
          />
          <Button variant="outline" size="sm" className="publisher-page__cover-image-button absolute bottom-4 right-4 bg-white/80 hover:bg-white">
            <Camera className="h-4 w-4 mr-2" />
            Change Cover
          </Button>
        </div>

        <div className="publisher-page__header-content px-6 pb-6">
          <div className="publisher-page__profile-section flex flex-col md:flex-row md:items-end -mt-10 relative z-10">
            <div className="publisher-page__avatar-container relative">
              <span className="publisher-page__avatar relative flex shrink-0 overflow-hidden h-32 w-32 md:h-40 md:w-40 border-4 border-white rounded-full">
                <img
                  src={publisherImageUrl || "/placeholder.svg?height=200&width=200"}
                  alt={mockName}
                  className="publisher-page__avatar-image aspect-square h-full w-full"
                />
              </span>
              <Button
                variant="outline"
                size="icon"
                className="publisher-page__avatar-button absolute bottom-2 right-2 rounded-full h-8 w-8 bg-white/80 hover:bg-white"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            <div className="publisher-page__profile-info mt-4 md:mt-0 md:ml-6 flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-[1.1rem] font-bold truncate">{mockName}</h1>
                  <p className="text-muted-foreground">@{mockUsername}</p>
                </div>

                <div className="publisher-page__actions flex space-x-2 mt-4 md:mt-0">
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
                  <span>{booksCount} books published</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{followersCount} followers</span>
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
        
        {/* Tabs Navigation moved inside header */}
        <div className="publisher-page__header-nav border-t">
          <div className="publisher-page__header-nav-container">
            <div className="publisher-page__header-tabs grid grid-cols-6 h-auto mt-0 bg-transparent">
              <button 
                className={`publisher-page__header-tab inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12 ${activeTab === "timeline" ? "border-b-2 border-primary" : ""}`}
                onClick={() => setActiveTab("timeline")}
              >
                Timeline
              </button>
              <button 
                className={`publisher-page__header-tab inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12 ${activeTab === "about" ? "border-b-2 border-primary" : ""}`}
                onClick={() => setActiveTab("about")}
              >
                About
              </button>
              <button 
                className={`publisher-page__header-tab inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12 ${activeTab === "books" ? "border-b-2 border-primary" : ""}`}
                onClick={() => setActiveTab("books")}
              >
                Books
              </button>
              <button 
                className={`publisher-page__header-tab inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12 ${activeTab === "followers" ? "border-b-2 border-primary" : ""}`}
                onClick={() => setActiveTab("followers")}
              >
                Followers
              </button>
              <button 
                className={`publisher-page__header-tab inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12 ${activeTab === "photos" ? "border-b-2 border-primary" : ""}`}
                onClick={() => setActiveTab("photos")}
              >
                Photos
              </button>
              <button 
                className={`publisher-page__header-tab inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12 ${activeTab === "more" ? "border-b-2 border-primary" : ""}`}
                onClick={() => setActiveTab("more")}
              >
                More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Replace the Tabs component with content based on activeTab state */}
      <div className="publisher-page__content">
        {activeTab === "timeline" && (
          <div className="publisher-page__tab-content grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        )}

        {activeTab === "about" && (
          <div className="publisher-page__tab-content grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <AboutNavigation />
            </div>
            <div className="lg:col-span-2">
              <OverviewSection publisher={publisher} />
              <ContactSection publisher={publisher} />
              <LocationSection publisher={publisher} />
              <BooksSection 
                books={books} 
                booksCount={booksCount} 
                onViewAllBooks={() => setActiveTab("books")} 
              />
            </div>
          </div>
        )}

        {activeTab === "books" && (
          <div className="publisher-page__tab-content">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-semibold leading-none tracking-tight">
                    Published Books · {booksCount}
                  </div>
                </div>
              </div>
              <CardContent className="p-6 pt-0">
                {books && books.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {books.map((book) => (
                      <BookCard
                        key={book.id}
                        id={book.id.toString()}
                        title={book.title}
                        coverImageUrl={book.cover_image_url}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">No books found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">This publisher hasn't published any books yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "followers" && (
          <div className="publisher-page__tab-content space-y-6">
            <Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-semibold leading-none tracking-tight">
                    Followers · {followersCount}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input className="w-[200px]" placeholder="Search followers..." type="search" />
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {followers.length > 0 ? (
                    followers.map((follower) => (
                      <div key={follower.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14 bg-muted">
                          <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(follower.name || 'User')}`}
                            alt={follower.name || 'User'}
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{follower.name || 'Unknown User'}</h3>
                          <p className="text-xs text-muted-foreground">{follower.email || 'No email available'}</p>
                          <p className="text-xs text-muted-foreground">
                            Following since {follower.followSince ? new Date(follower.followSince).toLocaleDateString() : 'unknown date'}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Ellipsis className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center p-6">
                      <p className="text-muted-foreground">No followers yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "photos" && (
          <div className="publisher-page__tab-content space-y-6">
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
        )}

        {activeTab === "more" && (
          <div className="publisher-page__tab-content grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="publisher-groups__card rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="publisher-groups__header flex items-center justify-between p-6">
                <h2 className="publisher-groups__title text-2xl font-semibold leading-none tracking-tight">Groups</h2>
                <Link href={`/groups/add?target_type=publisher&target_id=${params.id}`}>
                  <Button className="publisher-groups__create-button">
                    <Users className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                </Link>
              </div>
              <div className="publisher-groups__list p-6 pt-0 space-y-4">
                <div className="publisher-groups__item flex items-center gap-3 p-3 border rounded-lg">
                  <span className="publisher-groups__avatar relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                    <img
                      src="/placeholder.svg?height=100&width=100"
                      alt="Fantasy Book Club"
                      className="aspect-square h-full w-full"
                    />
                  </span>
                  <div className="publisher-groups__content flex-1 min-w-0">
                    <h3 className="publisher-groups__name font-medium truncate">Fantasy Book Club</h3>
                    <div className="publisher-groups__meta flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="publisher-groups__role inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                        Moderator
                      </div>
                      <span>·</span>
                      <span>1243 members</span>
                      <span>·</span>
                      <span>Joined January 2021</span>
                    </div>
                  </div>
                  <Button variant="outline" className="publisher-groups__view-button h-9 rounded-md px-3">
                    View
                  </Button>
                </div>
                <div className="publisher-groups__item flex items-center gap-3 p-3 border rounded-lg">
                  <span className="publisher-groups__avatar relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                    <img
                      src="/placeholder.svg?height=100&width=100"
                      alt="Science Fiction Readers"
                      className="aspect-square h-full w-full"
                    />
                  </span>
                  <div className="publisher-groups__content flex-1 min-w-0">
                    <h3 className="publisher-groups__name font-medium truncate">Science Fiction Readers</h3>
                    <div className="publisher-groups__meta flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="publisher-groups__role inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                        Member
                      </div>
                      <span>·</span>
                      <span>3567 members</span>
                      <span>·</span>
                      <span>Joined March 2021</span>
                    </div>
                  </div>
                  <Button variant="outline" className="publisher-groups__view-button h-9 rounded-md px-3">
                    View
                  </Button>
                </div>
                <div className="publisher-groups__item flex items-center gap-3 p-3 border rounded-lg">
                  <span className="publisher-groups__avatar relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                    <img
                      src="/placeholder.svg?height=100&width=100"
                      alt="Portland Book Lovers"
                      className="aspect-square h-full w-full"
                    />
                  </span>
                  <div className="publisher-groups__content flex-1 min-w-0">
                    <h3 className="publisher-groups__name font-medium truncate">Portland Book Lovers</h3>
                    <div className="publisher-groups__meta flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="publisher-groups__role inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                        Member
                      </div>
                      <span>·</span>
                      <span>567 members</span>
                      <span>·</span>
                      <span>Joined April 2020</span>
                    </div>
                  </div>
                  <Button variant="outline" className="publisher-groups__view-button h-9 rounded-md px-3">
                    View
                  </Button>
                </div>
                <div className="publisher-groups__item flex items-center gap-3 p-3 border rounded-lg">
                  <span className="publisher-groups__avatar relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                    <img
                      src="/placeholder.svg?height=100&width=100"
                      alt="Women Writers Book Club"
                      className="aspect-square h-full w-full"
                    />
                  </span>
                  <div className="publisher-groups__content flex-1 min-w-0">
                    <h3 className="publisher-groups__name font-medium truncate">Women Writers Book Club</h3>
                    <div className="publisher-groups__meta flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="publisher-groups__role inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                        Member
                      </div>
                      <span>·</span>
                      <span>892 members</span>
                      <span>·</span>
                      <span>Joined September 2022</span>
                    </div>
                  </div>
                  <Button variant="outline" className="publisher-groups__view-button h-9 rounded-md px-3">
                    View
                  </Button>
                </div>
                <div className="publisher-groups__item flex items-center gap-3 p-3 border rounded-lg">
                  <span className="publisher-groups__avatar relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                    <img
                      src="/placeholder.svg?height=100&width=100"
                      alt="Literary Fiction Fans"
                      className="aspect-square h-full w-full"
                    />
                  </span>
                  <div className="publisher-groups__content flex-1 min-w-0">
                    <h3 className="publisher-groups__name font-medium truncate">Literary Fiction Fans</h3>
                    <div className="publisher-groups__meta flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="publisher-groups__role inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                        Member
                      </div>
                      <span>·</span>
                      <span>1456 members</span>
                      <span>·</span>
                      <span>Joined July 2021</span>
                    </div>
                  </div>
                  <Button variant="outline" className="publisher-groups__view-button h-9 rounded-md px-3">
                    View
                  </Button>
                </div>
                <div className="publisher-groups__item flex items-center gap-3 p-3 border rounded-lg">
                  <span className="publisher-groups__avatar relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                    <img
                      src="/placeholder.svg?height=100&width=100"
                      alt="Classic Literature Society"
                      className="aspect-square h-full w-full"
                    />
                  </span>
                  <div className="publisher-groups__content flex-1 min-w-0">
                    <h3 className="publisher-groups__name font-medium truncate">Classic Literature Society</h3>
                    <div className="publisher-groups__meta flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="publisher-groups__role inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                        Member
                      </div>
                      <span>·</span>
                      <span>789 members</span>
                      <span>·</span>
                      <span>Joined February 2022</span>
                    </div>
                  </div>
                  <Button variant="outline" className="publisher-groups__view-button h-9 rounded-md px-3">
                    View
                  </Button>
                </div>
                <Button className="publisher-groups__find-more h-10 px-4 py-2 w-full">
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
        )}
      </div>
    </div>
  )
}