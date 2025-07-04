"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { AuthorAvatar } from "@/components/author-avatar"
import { AuthorHoverCard } from "@/components/author-hover-card"
import { PublisherHoverCard } from "@/components/publisher-hover-card"
import { EntityHeader, TabConfig } from "@/components/entity-header"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Book as BookType, Author, Review, BindingType, FormatType } from '@/types/book'
import { useAuth } from '@/hooks/useAuth'
import {
  BookOpen,
  Calendar,
  User,
  ThumbsUp,
  MessageSquare,
  Share2,
  Star,
  Clock,
  BookMarked,
  Heart,
  Globe,
  Tag,
  FileText,
  Pencil,
  Ruler,
  Weight,
  BookText,
  ChevronDown,
  Filter,
  MoreHorizontal as Ellipsis,
  Users,
  ImageIcon,
  Info,
  Book,
  MapPin,
  Camera,
  UserPlus
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { FollowersList } from "@/components/followers-list"
import { FollowersListTab } from "@/components/followers-list-tab"
import { ExpandableSection } from "@/components/ui/expandable-section"
import { ViewFullDetailsButton } from "@/components/ui/ViewFullDetailsButton"
import { TimelineAboutSection } from "@/components/author/TimelineAboutSection"
import { EntityHoverCard } from "@/components/entity-hover-cards"
import { ContentSection } from "@/components/ui/content-section"
import { formatDate } from "@/utils/dateUtils"

interface Follower {
  id: string
  name: string
  avatar_url?: string | null
  username?: string
}

interface ClientBookPageProps {
  book: BookType & { website?: string | null }
  authors: Author[]
  publisher: any | null
  reviews: Review[]
  publisherBooksCount: number
  authorBookCounts: Record<string, number>
  bindingType: BindingType | null
  formatType: FormatType | null
  readingProgress: any | null
  followers?: Follower[]
  followersCount: number
  params: { id: string }
}

export function ClientBookPage({
  book,
  authors,
  publisher,
  reviews,
  publisherBooksCount,
  authorBookCounts,
  bindingType,
  formatType,
  readingProgress,
  followers = [],
  followersCount = 0,
  params
}: ClientBookPageProps) {
  const { user } = useAuth()
  
  // Default reading status for display purposes when no user is logged in
  const defaultStatus = "want_to_read"
  
  // Update tab state
  const [activeTab, setActiveTab] = useState("details")
  const [showFullAbout, setShowFullAbout] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoadingFollow, setIsLoadingFollow] = useState(false)
  
  // Mock photos for the Photos tab
  const mockPhotosTabData = [
    { id: "1", title: "Reading at the park", date: "June 15, 2023", url: "/placeholder.svg?height=300&width=300" },
    { id: "2", title: "My bookshelf", date: "May 22, 2023", url: "/placeholder.svg?height=300&width=300" },
    { id: "3", title: "Book haul!", date: "April 10, 2023", url: "/placeholder.svg?height=300&width=300" },
    { id: "4", title: "Author signing event", date: "March 5, 2023", url: "/placeholder.svg?height=300&width=300" },
    { id: "5", title: "Reading nook", date: "February 18, 2023", url: "/placeholder.svg?height=300&width=300" },
    { id: "6", title: "Book club meeting", date: "January 30, 2023", url: "/placeholder.svg?height=300&width=300" },
    { id: "7", title: "Visiting the library", date: "December 12, 2022", url: "/placeholder.svg?height=300&width=300" },
    { id: "8", title: "New bookmarks", date: "November 5, 2022", url: "/placeholder.svg?height=300&width=300" },
    { id: "9", title: "Reading by the fireplace", date: "October 22, 2022", url: "/placeholder.svg?height=300&width=300" }
  ]
  
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

  // Mock photos for timeline
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

  // Follow/unfollow handlers
  const handleFollow = async () => {
    console.log('handleFollow called, user:', user, 'isFollowing:', isFollowing)
    
    if (!user) {
      // Show a simple alert for now - in a real app you'd redirect to login
      alert('Please log in to follow books')
      return
    }

    setIsLoadingFollow(true)
    try {
      const method = isFollowing ? 'DELETE' : 'POST'
      console.log('Making request:', method, 'to /api/follow')
      const response = await fetch('/api/follow', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityId: params.id,
          targetType: 'book'
        })
      })

      if (response.ok) {
        setIsFollowing(!isFollowing)
        // Optionally refresh the page or update followers count
        window.location.reload()
      } else {
        let errorMessage = 'Failed to follow/unfollow. Please try again.'
        try {
          const error = await response.json()
          console.error('Follow error:', error)
          if (error.error) {
            errorMessage = error.error
          }
        } catch (parseError) {
          console.error('Follow error (could not parse response):', response.status, response.statusText)
          if (response.status === 401) {
            errorMessage = 'Please log in to follow books'
          }
        }
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsLoadingFollow(false)
    }
  }

  // Check follow status on component mount
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user) {
        setIsFollowing(false)
        return
      }

      try {
        const response = await fetch(`/api/follow?entityId=${params.id}&targetType=book`)
        if (response.ok) {
          const data = await response.json()
          setIsFollowing(data.isFollowing)
        } else if (response.status === 401) {
          // User not authenticated, set to false
          setIsFollowing(false)
        }
      } catch (error) {
        console.error('Error checking follow status:', error)
        setIsFollowing(false)
      }
    }

    checkFollowStatus()
  }, [user, params.id])

  // Configure tabs for the EntityHeader
  const tabs: TabConfig[] = [
    { id: "details", label: "Details" },
    { id: "timeline", label: "Timeline" },
    { id: "reviews", label: "Reviews" },
    { id: "photos", label: "Photos" },
    { id: "followers", label: "Followers" },
    { id: "more", label: "More" }
  ]

  // Set up stats for the EntityHeader
  const bookStats = [
    { 
      icon: <BookOpen className="h-4 w-4 mr-1" />, 
      text: `${book.pages || book.page_count || 0} pages` 
    },
    { 
      icon: <Users className="h-4 w-4 mr-1" />, 
      text: `${followers.length} followers` 
    }
  ]

  // Get main author
  const mainAuthor = authors && authors.length > 0 ? authors[0] : undefined

  const bookLink = book.website || undefined
  const publishDate = book.publish_date || book.publication_date || undefined
  const language = book.language || undefined

  return (
    <div className="book-page">
        <EntityHeader
          entityType="book"
          name={book.title}
          bookId={params.id}
          username={authors && authors.length > 0 ? (
            <EntityHoverCard
              type="author"
              entity={{
              id: authors[0].id,
              name: authors[0].name,
              author_image: authors[0].author_image,
              bookCount: authorBookCounts[authors[0].id] || 0
              }}
            >
            <span className="text-muted-foreground">{authors[0].name}</span>
            </EntityHoverCard>
          ) : undefined}
          coverImageUrl={book.cover_image_url || book.original_image_url || "/placeholder.svg?height=400&width=1200"}
        profileImageUrl={book.cover_image_url || book.original_image_url || "/placeholder.svg?height=200&width=200"}
        stats={[
          { 
            icon: <BookOpen className="h-4 w-4 mr-1" />, 
            text: `${book.pages || book.page_count || 0} pages` 
          },
          { 
            icon: <Users className="h-4 w-4 mr-1" />, 
            text: `${followersCount} followers` 
          }
        ]}
        location={book.language}
        website={book.website}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        author={authors && authors.length > 0 ? {
          id: authors[0].id,
          name: authors[0].name,
          author_image: authors[0].author_image
          } : undefined}
        authorBookCount={authors && authors.length > 0 ? authorBookCounts[authors[0].id] : 0}
          publisher={publisher ? {
          id: publisher.id,
            name: publisher.name,
            publisher_image: publisher.publisher_image,
            logo_url: publisher.logo_url
          } : undefined}
          publisherBookCount={publisherBooksCount}
        isMessageable={false}
        isEditable={user && user.role === 'admin'}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        />

      <div className="book-page__content">
        {activeTab === "timeline" && (
          <div className="book-page__timeline-tab">
            <div className="book-page__tab-content grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Sidebar */}
              <div className="book-page__sidebar lg:col-span-1 space-y-6">
                {/* About Section */}
                <ContentSection
                  title="About"
                  onViewMore={() => setActiveTab("details")}
                  isExpandable
                  defaultExpanded={false}
                  className="book-page__about-section"
                >
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {book.synopsis || book.overview || "No description available."}
                    </p>
                    {book.language && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Language: {book.language}</span>
                      </div>
                    )}
                    {book.website && (
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                        <a
                          href={book.website.startsWith('http') ? book.website : `https://${book.website}`}
                          className="hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </ContentSection>

                {/* Friends/Followers Section */}
                <ContentSection
                  title="Followers"
                  viewMoreLink={`/books/${params.id}/followers`}
                  viewMoreText="See All"
                  className="book-page__followers-section"
                >
                  <FollowersList
                    followers={followers}
                    followersCount={followersCount}
                    entityId={params.id}
                    entityType="book"
                    hideContainer={true}
                  />
                </ContentSection>

                {/* Currently Reading Section */}
                <ContentSection
                  title="Currently Reading"
                  viewMoreLink="/my-books"
                  viewMoreText="See All"
                  className="book-page__currently-reading-section"
                >
                  <div className="space-y-4">
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
                  </div>
                </ContentSection>

                {/* Photos Section */}
                <ContentSection
                  title="Photos"
                  onViewMore={() => setActiveTab("photos")}
                  className="book-page__photos-section"
                >
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
                </ContentSection>
              </div>

              {/* Main Content Area */}
              <div className="book-page__main-content lg:col-span-2 space-y-6">
                {/* Post Creation Form */}
                <div className="book-page__post-form">
                <Card>
                  <CardContent className="p-6 pt-6">
                    <form>
                      <div className="flex gap-3">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-10 w-10">
                          <img
                              src="/placeholder.svg?height=200&width=200"
                              alt="User"
                            className="aspect-square h-full w-full"
                          />
                        </span>
                        <Textarea
                            placeholder={`What are you reading, there?`}
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
                </div>

                {/* Activity Feed */}
                <div className="book-page__activity-feed space-y-6">
                  {mockActivities.map((activity) => (
                    <Card key={activity.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex flex-col space-y-1.5 p-6 pb-3">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-3">
                            <span className="relative flex shrink-0 overflow-hidden rounded-full h-10 w-10">
                              <img
                                src="/placeholder.svg?height=200&width=200"
                                alt="User"
                                className="aspect-square h-full w-full"
                              />
                            </span>
                            <div>
                              <div className="font-medium">User</div>
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
          </div>
        )}
        
        {activeTab === "details" && (
          <div className="book-page__details-tab">
            <div className="book-detail-layout grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Book Cover (1/3 width) */}
              <div className="book-page__details-sidebar lg:col-span-1">
              {/* Book Cover (full width) */}
                <Card className="book-page__cover-card overflow-hidden">
                {(book.cover_image_url || book.original_image_url) ? (
                    <div className="book-page__cover-image w-full h-full">
                    <Image
                      src={book.cover_image_url ?? book.original_image_url ?? "/placeholder.svg"}
                      alt={book.title}
                      width={400}
                      height={600}
                      className="w-full aspect-[2/3] object-cover"
                    />
                  </div>
                ) : (
                    <div className="book-page__cover-placeholder w-full aspect-[2/3] bg-muted flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </Card>

              {/* Add to Shelf Section */}
                <div className="book-page__shelf-section space-y-4 w-full mt-6">
                <Dialog>
                  <DialogTrigger asChild>
                      <button className="book-page__shelf-button inline-flex items-center justify-center gap-2 w-full rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 px-4 py-2">
                      <BookMarked className="mr-2 h-4 w-4" />
                      Add to Shelf
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg p-6">
                    <DialogHeader>
                      <DialogTitle>Add Book to Shelf</DialogTitle>
                    </DialogHeader>
                    <div role="menuitem" className="shelf-menu-item flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer">
                      ✓ Want to Read
                    </div>
                    <div role="menuitem" className="shelf-menu-item flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer">
                      Currently Reading
                    </div>
                    <div role="menuitem" className="shelf-menu-item flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer">
                      Read
                    </div>
                    <div role="separator" className="shelf-separator my-2 h-px bg-muted" />
                    <button type="button" className="shelf-manage-button w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                      Manage shelves...
                    </button>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

              {/* Right Column - Book Details (2/3 width) */}
              <div className="book-page__details-content lg:col-span-2 space-y-6">
              {/* Book Details at the top */}
                <ContentSection
                  title="Book Details"
                  headerRight={
                    user && user.role === 'admin' ? (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                        <Link href={`/books/${book.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit Book</span>
                        </Link>
                      </Button>
                    ) : null
                  }
                  className="book-page__book-details-section"
                >
                  <div className="book-details-layout space-y-6">
                    {/* Title - Full Width */}
                    <div className="book-details__title-section">
                      <h3 className="font-medium text-lg">Title</h3>
                      <p className="text-muted-foreground text-xl font-semibold">{book.title}</p>
                    </div>

                    {/* Author(s) - Full Width */}
                    {authors && authors.length > 0 && (
                      <div className="book-details__authors-section">
                        <h3 className="font-medium text-lg">Author(s)</h3>
                        <div className="text-muted-foreground">
                          {authors.map((author, index) => (
                            <span key={author.id}>
                            <EntityHoverCard
                              type="author"
                              entity={{
                                  id: author.id,
                                  name: author.name,
                                  author_image: author.author_image,
                                  bookCount: authorBookCounts[author.id] || 0
                              }}
                            >
                                <span className="text-muted-foreground hover:text-primary transition-colors">
                                  {author.name}
                                </span>
                            </EntityHoverCard>
                              {index < authors.length - 1 && <span className="mx-2">•</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Publisher(s) - Full Width */}
                    {publisher && (
                      <div className="book-details__publishers-section">
                        <h3 className="font-medium text-lg">Publisher(s)</h3>
                        <div className="text-muted-foreground">
                            <EntityHoverCard
                              type="publisher"
                              entity={{
                                id: publisher.id,
                                name: publisher.name,
                                publisher_image: publisher.publisher_image,
                                logo_url: publisher.logo_url,
                                bookCount: publisherBooksCount
                              }}
                            >
                            <span className="text-muted-foreground hover:text-primary transition-colors">
                              {publisher.name}
                            </span>
                            </EntityHoverCard>
                        </div>
                      </div>
                    )}

                    {/* Other Details - 3 Column Grid */}
                    <div className="book-details__other-details">
                      <h3 className="font-medium text-lg mb-4">Other Details</h3>
                      <div className="book-details-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {/* Display book data based on the actual schema, excluding specified fields */}
                        {book.isbn && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">ISBN</h4>
                            <p className="text-muted-foreground">{book.isbn}</p>
                        </div>
                        )}

                        {book.isbn10 && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">ISBN-10</h4>
                            <p className="text-muted-foreground">{book.isbn10}</p>
                          </div>
                        )}

                        {book.isbn13 && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">ISBN-13</h4>
                            <p className="text-muted-foreground">{book.isbn13}</p>
                      </div>
                    )}

                    {book.publish_date && (
                      <div className="book-detail-item">
                            <h4 className="font-medium">Publish Date</h4>
                        <p className="text-muted-foreground flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(book.publish_date)}
                        </p>
                      </div>
                    )}

                    {book.publication_date && (
                      <div className="book-detail-item">
                            <h4 className="font-medium">Publication Date</h4>
                        <p className="text-muted-foreground flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(book.publication_date)}
                        </p>
                      </div>
                    )}

                    {(bindingType || book.binding) && (
                      <div className="book-detail-item">
                            <h4 className="font-medium">Binding</h4>
                        <p className="text-muted-foreground flex items-center">
                          <BookText className="h-4 w-4 mr-2" />
                          {bindingType?.name || book.binding}
                        </p>
                      </div>
                    )}

                    {/* Only show page_count if it's a valid number */}
                    {book.page_count !== undefined && book.page_count !== null && !isNaN(Number(book.page_count)) && (
                      <div className="book-detail-item">
                            <h4 className="font-medium">Page Count</h4>
                        <p className="text-muted-foreground flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          {book.page_count}
                        </p>
                      </div>
                    )}

                    {/* Only show pages if it's a valid number */}
                    {book.pages !== undefined && book.pages !== null && !isNaN(Number(book.pages)) && (
                      <div className="book-detail-item">
                            <h4 className="font-medium">Pages</h4>
                        <p className="text-muted-foreground flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          {book.pages}
                        </p>
                      </div>
                    )}

                    {book.dimensions && (
                      <div className="book-detail-item">
                            <h4 className="font-medium">Dimensions</h4>
                        <p className="text-muted-foreground flex items-center">
                          <Ruler className="h-4 w-4 mr-2" />
                          {book.dimensions}
                        </p>
                      </div>
                    )}

                    {book.weight !== null && book.weight !== undefined && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">Weight</h4>
                            <p className="text-muted-foreground">
                          {typeof book.weight === 'number' ? Number(book.weight).toFixed(2) : book.weight} kg
                            </p>
                      </div>
                    )}

                    {book.genre && (
                      <div className="book-detail-item">
                            <h4 className="font-medium">Genre</h4>
                        <p className="text-muted-foreground flex items-center">
                          <Tag className="h-4 w-4 mr-2" />
                          {book.genre}
                        </p>
                      </div>
                    )}

                    {book.language && (
                      <div className="book-detail-item">
                            <h4 className="font-medium">Language</h4>
                        <p className="text-muted-foreground flex items-center">
                          <Globe className="h-4 w-4 mr-2" />
                          {book.language}
                        </p>
                      </div>
                    )}

                    {book.average_rating !== undefined &&
                      book.average_rating !== null &&
                      !isNaN(Number(book.average_rating)) && (
                        <div className="book-detail-item">
                              <h4 className="font-medium">Average Rating</h4>
                          <p className="text-muted-foreground flex items-center">
                            <Star className="h-4 w-4 mr-2 fill-yellow-400 text-yellow-400" />
                            {Number(book.average_rating).toFixed(1)} / 5
                          </p>
                        </div>
                      )}

                    {(formatType || book.format) && (
                      <div className="book-detail-item">
                            <h4 className="font-medium">Format</h4>
                        <p className="text-muted-foreground">{formatType?.name || book.format}</p>
                      </div>
                    )}

                    {book.edition && (
                      <div className="book-detail-item">
                            <h4 className="font-medium">Edition</h4>
                        <p className="text-muted-foreground">{book.edition}</p>
                      </div>
                    )}

                    {book.series && (
                      <div className="book-detail-item">
                            <h4 className="font-medium">Series</h4>
                        <p className="text-muted-foreground">{book.series}</p>
                      </div>
                    )}

                        {book.website && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">Website</h4>
                            <p className="text-muted-foreground flex items-center">
                              <Globe className="h-4 w-4 mr-2" />
                              <a
                                href={book.website.startsWith('http') ? book.website : `https://${book.website}`}
                                className="hover:underline text-primary"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Visit Website
                              </a>
                            </p>
                          </div>
                        )}

                    {book.created_at && (
                      <div className="book-detail-item">
                            <h4 className="font-medium">Created At</h4>
                        <p className="text-muted-foreground">
                          {formatDate(book.created_at)}
                        </p>
                      </div>
                    )}

                    {book.updated_at && (
                      <div className="book-detail-item">
                            <h4 className="font-medium">Updated At</h4>
                        <p className="text-muted-foreground">
                          {formatDate(book.updated_at)}
                        </p>
                      </div>
                    )}
                      </div>
                    </div>

                    {/* Synopsis and Overview - Full Width */}
                    {book.synopsis && (
                      <div className="book-details__synopsis-section">
                        <h3 className="font-medium text-lg">Synopsis</h3>
                        <ExpandableSection
                          expanded={showFullAbout}
                          onToggle={() => setShowFullAbout((v) => !v)}
                        >
                          <p className="text-muted-foreground">{book.synopsis}</p>
                        </ExpandableSection>
                      </div>
                    )}

                    {book.overview && (
                      <div className="book-details__overview-section">
                        <h3 className="font-medium text-lg">Overview</h3>
                        <p className="text-muted-foreground">{book.overview}</p>
                      </div>
                    )}
                  </div>
                </ContentSection>

              {/* More Books By Author Section */}
              {authors && authors.length > 0 && (
                  <ContentSection
                    title={`More Books By ${authors[0].name}`}
                    footer={
                      <div className="mt-4 text-center">
                        <Button variant="outline" asChild>
                          <Link href={`/authors/${authors[0].id}`}>View All Books</Link>
                        </Button>
                      </div>
                    }
                    className="book-page__more-books-section"
                  >
                    {authorBookCounts[authors[0].id] && authorBookCounts[authors[0].id] > 1 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {/* This is a placeholder for book cards. In a real implementation, 
                            you would fetch and map over actual books by this author */}
                        {Array.from({ length: Math.min(4, authorBookCounts[authors[0].id] - 1) }).map((_, index) => (
                          <div key={index} className="book-card-container">
                            <div className="aspect-[2/3] relative rounded-md overflow-hidden bg-muted">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <BookOpen className="h-10 w-10 text-muted-foreground" />
                              </div>
                            </div>
                            <div className="mt-2">
                              <h4 className="text-sm font-medium line-clamp-2">Another Book Title</h4>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No other books found by this author</p>
                      </div>
                    )}
                  </ContentSection>
              )}

              {/* Similar Books */}
                <ContentSection 
                  title="Similar Books"
                  className="book-page__similar-books-section"
                >
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Recommendations coming soon</p>
                  </div>
                </ContentSection>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "reviews" && (
          <div className="book-page__reviews-tab">
            <ContentSection 
              title="Reviews"
              className="book-page__reviews-section"
            >
              <div className="space-y-6">
              {/* Add Review Form */}
              <div className="review-form space-y-4">
                <div className="flex items-center gap-2">
                  <Avatar
                    src="/placeholder.svg"
                    alt="User"
                    name="User"
                    size="sm"
                  />
                  <div className="flex-1">
                    <Input placeholder="Write a review..." />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="rating-selector flex items-center">
                    <span className="mr-2">Rate:</span>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-gray-300 cursor-pointer hover:text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <Button>Post Review</Button>
                </div>
              </div>

              <Separator />

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div className="reviews-list space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="review-item space-y-2">
                      <div className="flex items-start gap-3">
                        <Avatar
                          src="/placeholder.svg"
                          alt="User"
                          name="User"
                          size="sm"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">User</h4>
                              <div className="flex items-center">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                    }`}
                                  />
                                ))}
                                {/* Only show date if created_at exists */}
                                {review.created_at && (
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    {formatDate(review.created_at)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="mt-2">{review.content}</p>
                          <div className="review-actions flex items-center gap-4 mt-2">
                            <Button variant="ghost" size="sm" className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              <span>Like</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>Reply</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-reviews text-center py-6">
                  <p className="text-muted-foreground">No reviews yet. Be the first to review this book!</p>
                </div>
              )}
              </div>
            </ContentSection>
          </div>
        )}
        
        {activeTab === "photos" && (
          <div className="book-page__photos-tab">
          <div className="book-page__tab-content space-y-6">
              <ContentSection
                title="Photos"
                headerRight={
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      role="combobox"
                      aria-expanded="false"
                      aria-autocomplete="none"
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
                }
                className="book-page__photos-section"
              >
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
              </ContentSection>
            </div>
          </div>
        )}
        
        {activeTab === "followers" && (
          <div className="book-page__followers-tab">
          <div className="book-page__tab-content space-y-6">
            <FollowersListTab
              followers={followers}
              followersCount={followers.length}
              entityId={params.id}
              entityType="book"
            />
            </div>
          </div>
        )}
        
        {activeTab === "more" && (
          <div className="book-page__more-tab">
          <div className="book-page__tab-content grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ContentSection
                title="Groups"
                headerRight={
                <Link href={`/groups/add?target_type=book&target_id=${params.id}`}>
                  <Button className="book-groups__create-button">
                    <Users className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                </Link>
                }
                className="book-page__groups-section"
              >
                <div className="book-groups__list space-y-4">
                <div className="book-groups__item flex items-center gap-3 p-3 border rounded-lg">
                  <span className="book-groups__avatar relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                    <img
                      src="/placeholder.svg?height=100&width=100"
                      alt="Fantasy Book Club"
                      className="aspect-square h-full w-full"
                    />
                  </span>
                  <div className="book-groups__content flex-1 min-w-0">
                    <h3 className="book-groups__name font-medium truncate">Fantasy Book Club</h3>
                    <div className="book-groups__meta flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="book-groups__role inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                        Moderator
                      </div>
                      <span>·</span>
                      <span>1243 members</span>
                      <span>·</span>
                      <span>Joined January 2021</span>
                    </div>
                  </div>
                  <Button variant="outline" className="book-groups__view-button h-9 rounded-md px-3">
                    View
                  </Button>
                </div>
                <div className="book-groups__item flex items-center gap-3 p-3 border rounded-lg">
                  <span className="book-groups__avatar relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                    <img
                      src="/placeholder.svg?height=100&width=100"
                      alt="Science Fiction Readers"
                      className="aspect-square h-full w-full"
                    />
                  </span>
                  <div className="book-groups__content flex-1 min-w-0">
                    <h3 className="book-groups__name font-medium truncate">Science Fiction Readers</h3>
                    <div className="book-groups__meta flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="book-groups__role inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                        Member
                      </div>
                      <span>·</span>
                      <span>3567 members</span>
                      <span>·</span>
                      <span>Joined March 2021</span>
                    </div>
                  </div>
                  <Button variant="outline" className="book-groups__view-button h-9 rounded-md px-3">
                    View
                  </Button>
                </div>
                  <div className="book-groups__item flex items-center gap-3 p-3 border rounded-lg">
                    <span className="book-groups__avatar relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                      <img
                        src="/placeholder.svg?height=100&width=100"
                        alt="Portland Book Lovers"
                        className="aspect-square h-full w-full"
                      />
                    </span>
                    <div className="book-groups__content flex-1 min-w-0">
                      <h3 className="book-groups__name font-medium truncate">Portland Book Lovers</h3>
                      <div className="book-groups__meta flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="book-groups__role inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                          Member
                        </div>
                        <span>·</span>
                        <span>892 members</span>
                        <span>·</span>
                        <span>Joined May 2021</span>
                      </div>
                    </div>
                    <Button variant="outline" className="book-groups__view-button h-9 rounded-md px-3">
                      View
                </Button>
              </div>
            </div>
              </ContentSection>
              
              <ContentSection 
                title="Pages"
                className="book-page__pages-section"
              >
                <div className="space-y-4">
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
                      <span>Following Since 2022</span>
                    </div>
                  </div>
                  <Button variant="outline" className="h-9 rounded-md px-3">
                    View
                  </Button>
                </div>
              </div>
              </ContentSection>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 