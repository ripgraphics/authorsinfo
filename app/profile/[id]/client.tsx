"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EntityHeader, TabConfig } from "@/components/entity-header"
import { ContentSection } from "@/components/ui/content-section"
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
  Search,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { EntityPhotoAlbums } from '@/components/user-photo-albums'

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
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("timeline")
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoadingFollow, setIsLoadingFollow] = useState(false)

  // Set initial tab based on URL search parameters
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['timeline', 'about', 'books', 'friends', 'photos', 'more'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Check follow status on mount
  React.useEffect(() => {
    const checkFollowStatus = async () => {
      if (!authUser) {
        setIsFollowing(false)
        return
      }
      try {
        const response = await fetch(`/api/follow?entityId=${params.id}&targetType=user`)
        if (response.ok) {
          const data = await response.json()
          setIsFollowing(data.isFollowing)
        } else if (response.status === 401) {
          setIsFollowing(false)
        }
      } catch (error) {
        setIsFollowing(false)
      }
    }
    checkFollowStatus()
  }, [authUser, params.id])

  // Follow/unfollow handler
  const handleFollow = () => {
    // This callback can be used to update UI state if needed
  }

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
    },
    {
      icon: <MapPin className="h-4 w-4 mr-1" />,
      text: mockLocation
    },
    {
      icon: <Globe className="h-4 w-4 mr-1" />,
      text: "Website",
      href: `https://${mockWebsite}`
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

  // Mock books for the user's library
  const mockBooks = [
    {
      id: "1",
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      cover_url: "/placeholder.svg?text=Gatsby&width=200&height=300",
      status: "Read",
      rating: 5
    },
    {
      id: "2",
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      cover_url: "/placeholder.svg?text=Mockingbird&width=200&height=300",
      status: "Read",
      rating: 5
    },
    {
      id: "3",
      title: "1984",
      author: "George Orwell",
      cover_url: "/placeholder.svg?text=1984&width=200&height=300",
      status: "Read",
      rating: 4
    },
    {
      id: "4",
      title: "Pride and Prejudice",
      author: "Jane Austen",
      cover_url: "/placeholder.svg?text=Pride&width=200&height=300",
      status: "Reading",
      rating: 4
    },
    {
      id: "5",
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      cover_url: "/placeholder.svg?text=Hobbit&width=200&height=300",
      status: "Read",
      rating: 5
    },
    {
      id: "6",
      title: "Harry Potter and the Sorcerer's Stone",
      author: "J.K. Rowling",
      cover_url: "/placeholder.svg?text=Harry&width=200&height=300",
      status: "Read",
      rating: 5
    },
    {
      id: "7",
      title: "The Catcher in the Rye",
      author: "J.D. Salinger",
      cover_url: "/placeholder.svg?text=Catcher&width=200&height=300",
      status: "Want to Read",
      rating: null
    },
    {
      id: "8",
      title: "Lord of the Flies",
      author: "William Golding",
      cover_url: "/placeholder.svg?text=LOTF&width=200&height=300",
      status: "Read",
      rating: 3
    }
  ]

  return (
    <div className="profile-page">
      <EntityHeader
        entityType="user"
        name={user?.name || "Jane Reader"}
        profileImageUrl={avatarUrl}
        coverImageUrl={coverImageUrl}
        stats={userStats}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        entityId={authUser?.id === params.id ? undefined : params.id}
        targetType={authUser?.id === params.id ? undefined : "user"}
      />
      
      <div className="profile-page__content">
        {activeTab === "timeline" && (
          <div className="profile-page__timeline-tab">
            <div className="profile-page__tab-content grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Sidebar */}
              <div className="profile-page__sidebar lg:col-span-1 space-y-6">
                {/* About Section */}
                <ContentSection title="About">
                  <div className="space-y-4">
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
                  </div>
                </ContentSection>

                {/* Currently Reading Section */}
                <ContentSection 
                  title="Currently Reading"
                  viewMoreLink="/my-books"
                  viewMoreText="See All"
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
                  viewMoreLink={`/profile/${mockUsername}/photos`}
                  viewMoreText="See All"
                >
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
                </ContentSection>
              </div>

              {/* Main Content Area */}
              <div className="profile-page__main-content lg:col-span-2 space-y-6">
                {/* Post Creation Form */}
                <ContentSection title="Create Post">
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
                </ContentSection>

                {/* Activity Feed */}
                <ContentSection title="Recent Activity">
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-10 w-10">
                          <img
                            src={avatarUrl || "/placeholder.svg?height=200&width=200"}
                            alt={user.name}
                            className="aspect-square h-full w-full"
                          />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">2 days ago</div>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Ellipsis className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="mt-2">
                          Rated{" "}
                          <Link href="#" className="text-primary hover:underline font-medium">
                            Dune
                          </Link>{" "}
                          by Frank Herbert 5 stars
                        </p>
                        <div className="flex items-center gap-6 mt-4">
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
                    </div>
                  </div>
                </ContentSection>
              </div>
            </div>
          </div>
        )}

        {activeTab === "about" && (
          <div className="profile-page__about-tab">
            <div className="profile-page__tab-content">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <ContentSection title="Overview" id="overview">
                    <p className="text-muted-foreground">{mockAbout}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                  </ContentSection>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "books" && (
          <div className="profile-page__books-tab">
            <div className="profile-page__tab-content">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold">My Books ({mockBooksRead})</h2>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search books..."
                      className="w-full pl-9"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-full sm:w-36">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Books</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="reading">Reading</SelectItem>
                        <SelectItem value="want">Want to Read</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button variant="outline" className="flex items-center gap-1">
                      <Filter className="h-4 w-4" />
                      <span className="hidden sm:inline">Filter</span>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-6">
                {mockBooks.map((book) => (
                  <Link href={`/books/${book.id}`} key={book.id} className="group">
                    <Card className="h-full overflow-hidden transition-all hover:shadow-md">
                      <div className="relative aspect-[2/3] overflow-hidden">
                        <img 
                          src={book.cover_url} 
                          alt={book.title}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                        {book.status && (
                          <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-xs font-medium py-1 px-2 rounded">
                            {book.status}
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium line-clamp-1 text-sm">{book.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
                        {book.rating && (
                          <div className="flex items-center mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-3 w-3 ${i < book.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"}`} 
                              />
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              
              <div className="mt-8 text-center">
                <Button>Load More Books</Button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "friends" && (
          <div className="profile-page__friends-tab">
            <div className="profile-page__tab-content">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Friends ({mockFriendsCount})</h2>
                
                <div className="flex gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search friends..."
                      className="w-full pl-9"
                    />
                  </div>
                  <Button variant="outline">Find Friends</Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <img 
                          src={`/placeholder.svg?text=${String.fromCharCode(65 + i)}&width=100&height=100`} 
                          alt={`Friend ${i + 1}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-medium">Friend {i + 1}</h3>
                          <p className="text-sm text-muted-foreground">{Math.floor(Math.random() * 300)} books</p>
                        </div>
                      </div>
                      <div className="flex justify-between mt-4">
                        <Button variant="secondary" size="sm">Message</Button>
                        <Button variant="ghost" size="sm">View Profile</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="mt-8 text-center">
                <Button>View All Friends</Button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "photos" && (
          <div className="profile-page__photos-tab">
            <div className="profile-page__tab-content space-y-6">
              <ContentSection
                className="profile-page__photos-section"
              >
                <EntityPhotoAlbums 
                  entityId={params.id} 
                  entityType="user"
                  isOwnEntity={authUser?.id === params.id} 
                />
              </ContentSection>
            </div>
          </div>
        )}
        
        {activeTab === "more" && (
          <div className="profile-page__more-tab">
            <div className="profile-page__tab-content">
              <h2 className="text-2xl font-bold mb-6">More</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4">Reading Stats</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span>Total Books Read</span>
                          <span className="font-medium">{mockBooksRead}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span>Pages Read</span>
                          <span className="font-medium">32,845</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span>Average Rating</span>
                          <span className="font-medium">4.2</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span>Reviews Written</span>
                          <span className="font-medium">94</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4">Reading Preferences</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Fiction</span>
                          <span className="text-sm text-muted-foreground">67%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: "67%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Non-Fiction</span>
                          <span className="text-sm text-muted-foreground">33%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: "33%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Paperback</span>
                          <span className="text-sm text-muted-foreground">45%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: "45%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">E-book</span>
                          <span className="text-sm text-muted-foreground">40%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: "40%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Audiobook</span>
                          <span className="text-sm text-muted-foreground">15%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: "15%" }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4">Events</h3>
                    <div className="space-y-4">
                      {[
                        { name: "Portland Book Fair", date: "June 15, 2023" },
                        { name: "Author Meet & Greet: J.K. Rowling", date: "July 8, 2023" },
                        { name: "Book Club Meeting - The Great Gatsby", date: "August 3, 2023" }
                      ].map((event, i) => (
                        <div key={i} className="border-b pb-3 last:border-0">
                          <h4 className="font-medium">{event.name}</h4>
                          <p className="text-sm text-muted-foreground">{event.date}</p>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full mt-4">View All Events</Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4">Settings</h3>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        Edit Profile
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Privacy Settings
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Notification Preferences
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Connected Accounts
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Reading Preferences
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 