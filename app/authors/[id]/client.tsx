"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  Info,
  User,
  Settings
} from "lucide-react"
import { BookCard } from "@/components/book-card"
import { Avatar } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import type { Author } from "@/types/database"
import { Timeline, TimelineItem } from "@/components/timeline"

interface ClientAuthorPageProps {
  author: Author
  authorImageUrl: string
  coverImageUrl: string
  params: {
    id: string
  }
  followers?: any[]
  followersCount?: number
  books?: any[]
  booksCount?: number
  activities?: any[]
}

// Add mockActivities array for the timeline
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
];

export function ClientAuthorPage({ 
  author: initialAuthor, 
  authorImageUrl, 
  coverImageUrl, 
  params, 
  followers = [], 
  followersCount = 0, 
  books = [], 
  booksCount = 0,
  activities = []
}: ClientAuthorPageProps) {
  const [activeTab, setActiveTab] = useState("timeline")
  const [author, setAuthor] = useState(initialAuthor)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  // Function to refresh author data
  const refreshAuthorData = async () => {
    setRefreshing(true)
    try {
      const response = await fetch(`/api/authors/${params.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch author data')
      }
      const updatedAuthor = await response.json()
      setAuthor(updatedAuthor)
    } catch (error) {
      console.error('Error refreshing author data:', error)
      toast({
        title: "Error",
        description: "Failed to refresh author data",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="author-page author-page__container py-6">
      {/* Cover Photo and Profile Section */}
      <div className="author-page__header bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="author-page__cover-image relative h-auto aspect-[1344/500]">
          <img
            src={coverImageUrl || "/placeholder.svg?height=400&width=1200"}
            alt="Cover"
            className="author-page__cover-image-content object-cover absolute inset-0 w-full h-full"
          />
          <Button variant="outline" size="sm" className="author-page__cover-image-button absolute bottom-4 right-4 bg-white/80 hover:bg-white">
            <Camera className="h-4 w-4 mr-2" />
            Change Cover
          </Button>
        </div>

        <div className="author-page__header-content px-6 pb-6">
          <div className="author-page__profile-section flex flex-col md:flex-row md:items-end -mt-10 relative z-10">
            <div className="author-page__avatar-container relative">
              <Avatar src={authorImageUrl || "/placeholder.svg?height=200&width=200"} alt={author?.name || "Author"} name={author?.name} size="lg" id={author?.id} />
              <Button variant="outline" size="icon" className="author-page__avatar-button absolute bottom-2 right-2 rounded-full h-8 w-8 bg-white/80 hover:bg-white">
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            <div className="author-page__profile-info mt-4 md:mt-0 md:ml-6 flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-[1.1rem] font-bold truncate">{author?.name}</h1>
                  <p className="text-muted-foreground">@{author?.name?.toLowerCase().replace(/\s+/g, '') || "author"}</p>
                </div>
                <div className="author-page__actions flex space-x-2 mt-4 md:mt-0">
                  <Button className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="outline" className="flex items-center">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Friend
                  </Button>
                  <Button variant="outline" size="icon">
                    <Ellipsis className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                <div className="flex items-center text-muted-foreground">
                  <BookOpen className="h-4 w-4 mr-1" />
                  <span>{booksCount} books written</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{followersCount} followers</span>
                </div>
                {author?.nationality && (
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{author.nationality}</span>
                </div>
                )}
                {author?.website && (
                <div className="flex items-center text-muted-foreground">
                  <a
                    href={author.website.startsWith('http') ? author.website : `https://${author.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="author-page__header-nav border-t">
          <div className="author-page__header-nav-container">
            <div className="author-page__header-tabs grid grid-cols-6 h-auto mt-0 bg-transparent">
              <button 
                className={`author-page__header-tab inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12 ${activeTab === "timeline" ? "border-b-2 border-primary" : ""}`}
                onClick={() => setActiveTab("timeline")}
              >
                Timeline
              </button>
              <button 
                className={`author-page__header-tab inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12 ${activeTab === "about" ? "border-b-2 border-primary" : ""}`}
                onClick={() => setActiveTab("about")}
              >
                About
              </button>
              <button 
                className={`author-page__header-tab inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12 ${activeTab === "books" ? "border-b-2 border-primary" : ""}`}
                onClick={() => setActiveTab("books")}
              >
                Books
              </button>
              <button 
                className={`author-page__header-tab inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12 ${activeTab === "followers" ? "border-b-2 border-primary" : ""}`}
                onClick={() => setActiveTab("followers")}
              >
                Followers ({followersCount})
              </button>
              <button 
                className={`author-page__header-tab inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12 ${activeTab === "photos" ? "border-b-2 border-primary" : ""}`}
                onClick={() => setActiveTab("photos")}
              >
                Photos
              </button>
              <button 
                className={`author-page__header-tab inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12 ${activeTab === "more" ? "border-b-2 border-primary" : ""}`}
                onClick={() => setActiveTab("more")}
              >
                More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section with Sidebar on Left + Main Content on Right */}
      {activeTab === "timeline" && (
      <div className="author-page__content">
        <div className="author-page__tab-content grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT SIDEBAR - 1 Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* About Section */}
            <Card className="timeline-about-section">
              <div className="timeline-about-section__header flex flex-col space-y-1.5 p-6">
                <div className="timeline-about-section__title-row flex justify-between items-center">
                  <div className="timeline-about-section__title text-2xl font-semibold leading-none tracking-tight">About</div>
                  <button className="timeline-about-section__view-more text-sm text-primary hover:underline">View More</button>
                </div>
              </div>
              <CardContent className="timeline-about-section__content p-6 pt-0 space-y-4">
                <div className="timeline-about-section__about-wrapper relative">
                  <p className="timeline-about-section__about-text line-clamp-10">
                    {author?.bio || "No biography available for this author."}
                  </p>
                  <div className="timeline-about-section__gradient absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent"></div>
                </div>
                <div className="timeline-about-section__details space-y-2">
                  {author?.nationality && (
                  <div className="timeline-about-section__location flex items-center">
                    <MapPin className="timeline-about-section__location-icon h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="timeline-about-section__location-text">
                      From {author.nationality}
                    </span>
                  </div>
                  )}
                  
                  {author?.website && (
                  <div className="timeline-about-section__website flex items-center">
                    <Globe className="timeline-about-section__website-icon h-4 w-4 mr-2 text-muted-foreground" />
                    <a 
                      href={author.website.startsWith('http') ? author.website : `https://${author.website}`}
                      className="timeline-about-section__website-link hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {author.website.startsWith('http') ? author.website : `https://${author.website}`}
                    </a>
                  </div>
                  )}
                </div>
                <Button variant="outline" className="timeline-about-section__about-tab-button w-full">
                  <Info className="h-4 w-4 mr-2" />
                  View Full About
                </Button>
              </CardContent>
            </Card>

            {/* Currently Reading Section */}
            <Card>
              <div className="space-y-1.5 p-6 flex flex-row items-center justify-between">
                <div className="text-2xl font-semibold leading-none tracking-tight">Currently Reading</div>
                <Link href="/my-books" className="text-sm text-primary hover:underline">See All</Link>
              </div>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className="flex gap-3">
                  <div className="relative h-20 w-14 flex-shrink-0">
                    <img 
                      src="/placeholder.svg?height=240&width=160"
                      alt="The Name of the Wind"
                      className="object-cover rounded-md absolute inset-0 w-full h-full"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium line-clamp-1">The Name of the Wind</h4>
                    <p className="text-sm text-muted-foreground">by Patrick Rothfuss</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>65%</span>
                      </div>
                      <div className="relative w-full overflow-hidden rounded-full bg-secondary h-1.5">
                        <div className="h-full w-full flex-1 bg-primary transition-all" style={{transform: 'translateX(-35%)'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="relative h-20 w-14 flex-shrink-0">
                    <img 
                      src="/placeholder.svg?height=240&width=160"
                      alt="Project Hail Mary"
                      className="object-cover rounded-md absolute inset-0 w-full h-full"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium line-clamp-1">Project Hail Mary</h4>
                    <p className="text-sm text-muted-foreground">by Andy Weir</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>23%</span>
                      </div>
                      <div className="relative w-full overflow-hidden rounded-full bg-secondary h-1.5">
                        <div className="h-full w-full flex-1 bg-primary transition-all" style={{transform: 'translateX(-77%)'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photos Section */}
            <Card>
              <div className="space-y-1.5 p-6 flex flex-row items-center justify-between">
                <div className="text-2xl font-semibold leading-none tracking-tight">Photos</div>
                <Link href={`/authors/${params.id}/photos`} className="text-sm text-primary hover:underline">See All</Link>
              </div>
              <CardContent className="p-6 pt-0">
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <div key={num} className="aspect-square relative rounded overflow-hidden">
                      <img 
                        src={`/placeholder.svg?height=300&width=300`}
                        alt={`Photo ${num}`}
                        className="object-cover hover:scale-105 transition-transform absolute inset-0 w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Friends/Followers Section */}
            <Card>
              <div className="space-y-1.5 p-6 flex flex-row items-center justify-between">
                <div className="text-2xl font-semibold leading-none tracking-tight">Followers</div>
                <Link href={`/authors/${params.id}/followers`} className="text-sm text-primary hover:underline">See All</Link>
              </div>
              <CardContent className="p-6 pt-0">
                <div className="grid grid-cols-3 gap-2">
                  {followers.length > 0 ? (
                    followers.slice(0, 9).map((follower, index) => (
                      <Link key={index} className="flex flex-col items-center text-center" href={`/profile/${follower.id}`}>
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-16 w-16 mb-1">
                            <Avatar src={follower.avatar_url || "/placeholder.svg?height=100&width=100"} alt={follower.name || `Follower ${index + 1}`} name={follower.name} size="md" id={follower.id} className="followers-list__avatar" />
                        </span>
                        <span className="text-xs line-clamp-1">{follower.name || `User ${index + 1}`}</span>
                      </Link>
                    ))
                  ) : (
                    // Placeholder followers if none provided
                    Array(9).fill(0).map((_, index) => (
                      <Link key={index} className="flex flex-col items-center text-center" href={`/profile/${index + 1}`}>
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-16 w-16 mb-1">
                            <Avatar src="/placeholder.svg?height=100&width=100" alt={`Follower ${index + 1}`} name={`Follower ${index + 1}`} size="md" id={index + 1} className="followers-list__avatar" />
                        </span>
                        <span className="text-xs line-clamp-1">{[
                          "Alex Thompson", "Maria Garcia", "James Wilson", 
                          "Emma Davis", "Michael Brown", "Sophia Martinez",
                          "Daniel Lee", "Olivia Johnson", "William Smith"
                        ][index]}</span>
                      </Link>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MAIN CONTENT - 2 Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post Form */}
            <Card>
              <div className="p-6 pt-6">
                <form>
                  <div className="flex gap-3">
                      <Avatar src={authorImageUrl || "/placeholder.svg?height=200&width=200"} alt={author?.name || "Author"} name={author?.name} size="sm" id={author?.id} />
                    <Textarea 
                      className="flex-1 resize-none"
                      placeholder={`What are you reading, ${author?.name?.split(' ')[0] || "Author"}?`}
                    />
                  </div>
                  <div className="flex justify-between mt-4">
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" className="h-9 rounded-md px-3">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Photo
                      </Button>
                      <Button type="button" variant="ghost" className="h-9 rounded-md px-3">
                        <Book className="h-4 w-4 mr-2" />
                        Book
                      </Button>
                      <Button type="button" variant="ghost" className="h-9 rounded-md px-3">
                        <Star className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </div>
                    <Button type="submit" disabled>Post</Button>
                  </div>
                </form>
              </div>
            </Card>

              {/* Timeline Feed */}
              <Timeline
                items={(activities.length > 0 ? activities : mockActivities).map((activity) => ({
                  id: activity.id,
                  avatarUrl: authorImageUrl,
                  name: author?.name || "Author",
                  profileUrl: `/authors/${author?.id}`,
                  timestamp: activity.timeAgo,
                  content: (() => {
                    switch (activity.type) {
                      case "rating":
                        return <span>Rated <Link href={`/books/${activity.books?.id || '#'}`} className="text-primary hover:underline font-medium">{activity.bookTitle}</Link> by {activity.bookAuthor} {activity.rating} stars</span>;
                      case "finished":
                        return <span>Finished reading <Link href={`/books/${activity.books?.id || '#'}`} className="text-primary hover:underline font-medium">{activity.bookTitle}</Link> by {activity.bookAuthor}</span>;
                      case "added":
                        return <span>Added <Link href={`/books/${activity.books?.id || '#'}`} className="text-primary hover:underline font-medium">{activity.bookTitle}</Link> by {activity.bookAuthor} to {activity.shelf}</span>;
                      case "reviewed":
                        return <span>Reviewed <Link href={`/books/${activity.books?.id || '#'}`} className="text-primary hover:underline font-medium">{activity.bookTitle}</Link> by {activity.bookAuthor}</span>;
                      default:
                        return <span>Activity with <Link href={`/books/${activity.books?.id || '#'}`} className="text-primary hover:underline font-medium">{activity.bookTitle}</Link> by {activity.bookAuthor}</span>;
                    }
                  })(),
                }))}
              />
            </div>
                      </div>
                    </div>
      )}

      {activeTab === "about" && (
        <div className="publisher-page__content">
          <div className="publisher-page__tab-content grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="about-navigation bg-white rounded-lg shadow overflow-hidden sticky top-20">
                <div className="about-navigation__header p-4 border-b flex justify-between items-center">
                  <h2 className="about-navigation__title text-lg font-medium">About</h2>
                  <div className="about-navigation__settings-wrapper relative">
                    <Button variant="ghost" size="icon" className="about-navigation__settings-button h-8 w-8 rounded-full">
                      <Settings className="about-navigation__settings-icon h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <nav className="about-navigation__nav p-2">
                  <a href="#overview" className="about-navigation__nav-link flex items-center px-3 py-2 rounded-md hover:bg-muted text-primary">Overview</a>
                  <a href="#contact-info" className="about-navigation__nav-link flex items-center px-3 py-2 rounded-md hover:bg-muted">Contact Information</a>
                  <a href="#location" className="about-navigation__nav-link flex items-center px-3 py-2 rounded-md hover:bg-muted">Location</a>
                  <a href="#books" className="about-navigation__nav-link flex items-center px-3 py-2 rounded-md hover:bg-muted">Published Books</a>
                </nav>
              </div>
                </div>
            <div className="lg:col-span-2">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm overview-section mb-6" id="overview">
                <div className="overview-section__header flex flex-col space-y-1.5 p-6 border-b">
                  <div className="overview-section__title-row flex justify-between items-center">
                    <h3 className="overview-section__title text-xl font-semibold">Overview</h3>
                    <Button variant="ghost" className="overview-section__edit-button h-8 gap-1 rounded-md px-3">
                      <SquarePen className="overview-section__edit-icon h-4 w-4" />
                      <span>Edit</span>
                    </Button>
                  </div>
                </div>
                <div className="overview-section__content p-6 space-y-4">
                  <div className="overview-section__about space-y-2">
                    <div className="overview-section__about-wrapper relative">
                      <div className="overview-section__about-text whitespace-pre-wrap text-base line-clamp-20 overflow-hidden" style={{ maxHeight: '500px', overflow: 'hidden' }}>
                        {author?.bio || `About ${author?.name || "the Author"}
                        
${author?.name || "The author"} is a renowned writer known for captivating storytelling and compelling characters. With a distinctive voice that resonates with readers across generations, ${author?.name?.split(' ')[0] || "they"} has established ${author?.name?.includes(' ') ? 'themselves' : 'themself'} as a significant figure in contemporary literature.

Born in ${author?.nationality || "their native country"}, ${author?.name?.split(' ')[0] || "the author"} began writing at an early age, influenced by the rich cultural heritage and literary traditions surrounding ${author?.name?.includes(' ') ? 'them' : 'them'}. After completing ${author?.name?.includes(' ') ? 'their' : 'their'} education, ${author?.name?.split(' ')[0] || "they"} devoted ${author?.name?.includes(' ') ? 'themselves' : 'themself'} to the craft of writing, publishing ${author?.name?.includes(' ') ? 'their' : 'their'} first work to critical acclaim.

Throughout ${author?.name?.includes(' ') ? 'their' : 'their'} career, ${author?.name?.split(' ')[0] || "the author"} has explored various themes including identity, belonging, human relationships, and the complexities of modern society. ${author?.name?.includes(' ') ? 'Their' : 'Their'} works often blend elements of realism with lyrical prose, creating immersive narratives that challenge readers to reflect on their own experiences and perspectives.

${author?.name || "The author"} has received numerous accolades for ${author?.name?.includes(' ') ? 'their' : 'their'} contributions to literature, including prestigious literary awards and recognition from peers in the industry. Beyond writing, ${author?.name?.split(' ')[0] || "they"} is passionate about promoting literacy and supporting emerging writers through workshops, mentorship programs, and public speaking engagements.

When not writing, ${author?.name?.split(' ')[0] || "the author"} enjoys reading widely across genres, traveling to gather inspiration for new stories, and engaging with readers through book tours and literary festivals. ${author?.name?.includes(' ') ? 'Their' : 'Their'} dedication to the craft and genuine connection with audiences have established ${author?.name || "the author"} as a beloved figure in the literary world.

${author?.name || "The author"} continues to push boundaries with each new work, exploring fresh narrative approaches while maintaining the distinctive voice that has captivated readers worldwide. With each publication, ${author?.name?.split(' ')[0] || "they"} reaffirms ${author?.name?.includes(' ') ? 'their' : 'their'} place as one of the most significant literary voices of our time.`}
                      </div>
                      <div className="overview-section__fade-gradient absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
                    </div>
                    <Button variant="outline" className="overview-section__toggle-button text-xs mt-2 h-9 rounded-md px-3">View More</Button>
                  </div>
                  {author?.birth_date && (
                    <div className="overview-section__founded flex items-center">
                      <Calendar className="overview-section__founded-icon h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="overview-section__founded-text">Born in {new Date(author.birth_date).getFullYear()}</span>
                    </div>
                  )}
                  {author?.website && (
                    <div className="overview-section__website flex items-start">
                      <Globe className="overview-section__website-icon h-4 w-4 mr-2 text-muted-foreground flex-shrink-0 mt-1" />
                      <a 
                        href={author.website.startsWith('http') ? author.website : `https://${author.website}`}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="overview-section__website-link text-primary hover:underline break-words"
                      >
                        {author.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm contact-section mb-6" id="contact-info">
                <div className="contact-section__header flex flex-col space-y-1.5 p-6 border-b">
                  <div className="contact-section__title-row flex justify-between items-center">
                    <h3 className="contact-section__title text-xl font-semibold">Contact Information</h3>
                    <Button variant="ghost" className="contact-section__edit-button h-8 gap-1 rounded-md px-3">
                      <SquarePen className="contact-section__edit-icon h-4 w-4" />
                      <span>Edit</span>
                    </Button>
                  </div>
                </div>
                <div className="contact-section__content p-6">
                  <div className="contact-section__grid grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(author?.email || author?.twitter_handle || author?.facebook_handle || author?.instagram_handle) ? (
                      <>
                        {author?.email && (
                          <div className="contact-section__email flex flex-col">
                            <span className="contact-section__label text-sm text-muted-foreground">Email</span>
                            <a href={`mailto:${author.email}`} className="contact-section__email-link text-primary hover:underline">
                              {author.email}
                            </a>
                          </div>
                        )}
                        {author?.twitter_handle && (
                          <div className="contact-section__twitter flex flex-col">
                            <span className="contact-section__label text-sm text-muted-foreground">Twitter</span>
                            <a 
                              href={`https://twitter.com/${author.twitter_handle}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="contact-section__twitter-link text-primary hover:underline"
                            >
                              @{author.twitter_handle}
                            </a>
                          </div>
                        )}
                        {author?.facebook_handle && (
                          <div className="contact-section__facebook flex flex-col">
                            <span className="contact-section__label text-sm text-muted-foreground">Facebook</span>
                            <a 
                              href={`https://facebook.com/${author.facebook_handle}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="contact-section__facebook-link text-primary hover:underline"
                            >
                              {author.facebook_handle}
                            </a>
                          </div>
                        )}
                        {author?.instagram_handle && (
                          <div className="contact-section__instagram flex flex-col">
                            <span className="contact-section__label text-sm text-muted-foreground">Instagram</span>
                            <a 
                              href={`https://instagram.com/${author.instagram_handle}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="contact-section__instagram-link text-primary hover:underline"
                            >
                              @{author.instagram_handle}
                            </a>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="contact-section__email flex flex-col">
                        <span className="contact-section__label text-sm text-muted-foreground">Email</span>
                        <a href="mailto:contact@author.com" className="contact-section__email-link text-primary hover:underline">
                          contact@author.com
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm location-section mb-6" id="location">
                <div className="location-section__header flex flex-col space-y-1.5 p-6 border-b">
                  <div className="location-section__title-row flex justify-between items-center">
                    <h3 className="location-section__title text-xl font-semibold">Location</h3>
                    <Button variant="ghost" className="location-section__edit-button h-8 gap-1 rounded-md px-3">
                      <SquarePen className="location-section__edit-icon h-4 w-4" />
                      <span>Edit</span>
                    </Button>
                  </div>
                </div>
                <div className="location-section__content p-6">
                  <div className="location-section__info space-y-2">
                    <div className="location-section__address flex items-start">
                      <MapPin className="location-section__map-icon h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                      <div className="location-section__address-details flex flex-col">
                        <span className="location-section__address-line">Author Residence</span>
                        <span className="location-section__country">{author?.nationality || "United States"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm books-section mb-6" id="books">
                <div className="books-section__header flex flex-col space-y-1.5 p-6 border-b">
                  <h3 className="books-section__title text-xl font-semibold">Published Books</h3>
                </div>
                <div className="books-section__content p-6">
                  <div className="books-section__with-content">
                    <p className="books-section__count mb-4">This author has published {books?.length || 3} books.</p>
                    <div className="books-section__grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {books && books.length > 0 ? (
                        books.slice(0, 3).map((book, index) => (
                          <a key={book.id || index} className="block" href={`/books/${book.id}`}>
                            <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden h-full transition-transform hover:scale-105">
                              <div className="relative w-full" style={{ aspectRatio: '2 / 3' }}>
                                <img 
                                  alt={book.title || `Book ${index + 1}`}
                                  loading="lazy"
                                  decoding="async"
                                  data-nimg="fill"
                                  className="object-cover"
                                  src={book.cover_image_url || `/placeholder.svg?height=300&width=200&text=Book+${index+1}`}
                                  style={{ position: 'absolute', height: '100%', width: '100%', inset: 0, color: 'transparent' }}
                                />
                              </div>
                              <div className="p-3 text-center">
                                <h3 className="font-medium text-sm line-clamp-1">{book.title || `Book Title ${index + 1}`}</h3>
                              </div>
                            </div>
                          </a>
                        ))
                      ) : (
                        // Placeholder books if none provided
                        Array(3).fill(0).map((_, index) => {
                          const titles = [
                            "Come As You Are: Revised and Updated: The Surprising New Science That Will Transform Your Sex Life",
                            "Days You Were Mine",
                            "Life Force: How New Breakthroughs in Precision Medicine Can Transform the Quality of Your Life & Those You Love"
                          ];
                          return (
                            <a key={index} className="block" href={`/books/${100 + index}`}>
                              <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden h-full transition-transform hover:scale-105">
                                <div className="relative w-full" style={{ aspectRatio: '2 / 3' }}>
                                  <img 
                                    alt={titles[index]}
                                    loading="lazy"
                                    decoding="async"
                                    data-nimg="fill"
                                    className="object-cover"
                                    src={`/placeholder.svg?height=300&width=200&text=Book+${index+1}`}
                                    style={{ position: 'absolute', height: '100%', width: '100%', inset: 0, color: 'transparent' }}
                                  />
                                </div>
                                <div className="p-3 text-center">
                                  <h3 className="font-medium text-sm line-clamp-1">{titles[index]}</h3>
                                </div>
                              </div>
                            </a>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "books" && (
        <div className="publisher-page__content">
          <div className="publisher-page__tab-content">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-semibold leading-none tracking-tight">Published Books · {books?.length || 3}</div>
                </div>
              </div>
              <div className="p-6 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {books && books.length > 0 ? (
                    books.map((book, index) => (
                      <a key={book.id || index} className="block" href={`/books/${book.id}`}>
                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden h-full transition-transform hover:scale-105">
                          <div className="relative w-full" style={{ aspectRatio: '2 / 3' }}>
                            <img 
                              alt={book.title || `Book ${index + 1}`}
                              loading="lazy"
                              decoding="async"
                              data-nimg="fill"
                              className="object-cover"
                              src={book.cover_image_url || `/placeholder.svg?height=300&width=200&text=Book+${index+1}`}
                              style={{ position: 'absolute', height: '100%', width: '100%', inset: 0, color: 'transparent' }}
                            />
                          </div>
                          <div className="p-3 text-center">
                            <h3 className="font-medium text-sm line-clamp-1">{book.title || `Book Title ${index + 1}`}</h3>
                          </div>
                        </div>
                      </a>
                    ))
                  ) : (
                    // Placeholder books if none provided
                    Array(3).fill(0).map((_, index) => {
                      const titles = [
                        "Come As You Are: Revised and Updated: The Surprising New Science That Will Transform Your Sex Life",
                        "Days You Were Mine",
                        "Life Force: How New Breakthroughs in Precision Medicine Can Transform the Quality of Your Life & Those You Love"
                      ];
                      return (
                        <a key={index} className="block" href={`/books/${100 + index}`}>
                          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden h-full transition-transform hover:scale-105">
                            <div className="relative w-full" style={{ aspectRatio: '2 / 3' }}>
                              <img 
                                alt={titles[index]}
                                loading="lazy"
                                decoding="async"
                                data-nimg="fill"
                                className="object-cover"
                                src={`/placeholder.svg?height=300&width=200&text=Book+${index+1}`}
                                style={{ position: 'absolute', height: '100%', width: '100%', inset: 0, color: 'transparent' }}
                              />
                            </div>
                            <div className="p-3 text-center">
                              <h3 className="font-medium text-sm line-clamp-1">{titles[index]}</h3>
                            </div>
                          </div>
                        </a>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "followers" && (
        <div className="author-page__content">
          <div className="author-page__tab-content space-y-6">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-semibold leading-none tracking-tight">Followers · {followersCount}</div>
                  <div className="flex items-center gap-2">
                    <Input 
                      className="w-[200px]" 
                      placeholder="Search followers..." 
                      type="search"
                    />
                    <Button variant="outline" size="icon" className="h-10 w-10">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {followers && followers.length > 0 ? (
                    followers.map((follower) => (
                      <div key={follower.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14 bg-muted">
                          <Avatar src={follower.avatar_url || "/placeholder.svg?height=100&width=100"} alt={follower.name || 'User'} name={follower.name} size="md" id={follower.id} className="followers-list__avatar" />
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
            </div>
          </div>
        </div>
      )}

      {activeTab === "photos" && (
        <div className="author-page__content">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <div className="space-y-1.5 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold leading-none tracking-tight">Photos</h2>
                <Button variant="outline">
                  <Camera className="h-4 w-4 mr-2" />
                  Add Photos
                </Button>
              </div>
              <CardContent className="p-6 pt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array(12).fill(0).map((_, index) => (
                    <div key={index} className="aspect-square relative rounded-md overflow-hidden">
                      <img 
                        src={`/placeholder.svg?height=300&width=300&text=Photo+${index+1}`}
                        alt={`Photo ${index + 1}`}
                        className="object-cover hover:scale-105 transition-transform absolute inset-0 w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "more" && (
        <div className="author-page__content">
          <div className="author-page__tab-content grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="publisher-groups__card rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="publisher-groups__header flex items-center justify-between p-6">
                <h2 className="publisher-groups__title text-2xl font-semibold leading-none tracking-tight">Groups</h2>
                <a href={`/groups/add?target_type=author&target_id=${params.id}`}>
                  <Button className="publisher-groups__create-button">
                    <Users className="h-4 w-4 mr-2" />
                    Create Group
                    </Button>
                </a>
              </div>
              <div className="publisher-groups__list p-6 pt-0 space-y-4">
                <div className="publisher-groups__item flex items-center gap-3 p-3 border rounded-lg">
                  <span className="publisher-groups__avatar relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                    <Avatar alt="Fantasy Book Club" name="Fantasy Book Club" size="md" id="1" />
                  </span>
                  <div className="publisher-groups__content flex-1 min-w-0">
                    <h3 className="publisher-groups__name font-medium truncate">Fantasy Book Club</h3>
                    <div className="publisher-groups__meta flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="publisher-groups__role inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">Moderator</div>
                      <span>·</span>
                      <span>1243 members</span>
                      <span>·</span>
                      <span>Joined January 2021</span>
                    </div>
                  </div>
                  <Button variant="outline" className="publisher-groups__view-button h-9 rounded-md px-3">View</Button>
                </div>
                <div className="publisher-groups__item flex items-center gap-3 p-3 border rounded-lg">
                  <span className="publisher-groups__avatar relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                    <Avatar alt="Science Fiction Readers" name="Science Fiction Readers" size="md" id="2" />
                  </span>
                  <div className="publisher-groups__content flex-1 min-w-0">
                    <h3 className="publisher-groups__name font-medium truncate">Science Fiction Readers</h3>
                    <div className="publisher-groups__meta flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="publisher-groups__role inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">Member</div>
                      <span>·</span>
                      <span>3567 members</span>
                      <span>·</span>
                      <span>Joined March 2021</span>
                    </div>
                  </div>
                  <Button variant="outline" className="publisher-groups__view-button h-9 rounded-md px-3">View</Button>
                </div>
                <div className="publisher-groups__item flex items-center gap-3 p-3 border rounded-lg">
                  <span className="publisher-groups__avatar relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                    <Avatar alt="Portland Book Lovers" name="Portland Book Lovers" size="md" id="3" />
                  </span>
                  <div className="publisher-groups__content flex-1 min-w-0">
                    <h3 className="publisher-groups__name font-medium truncate">Portland Book Lovers</h3>
                    <div className="publisher-groups__meta flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="publisher-groups__role inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">Member</div>
                      <span>·</span>
                      <span>567 members</span>
                      <span>·</span>
                      <span>Joined April 2020</span>
                    </div>
                  </div>
                  <Button variant="outline" className="publisher-groups__view-button h-9 rounded-md px-3">View</Button>
                </div>
                <div className="publisher-groups__item flex items-center gap-3 p-3 border rounded-lg">
                  <span className="publisher-groups__avatar relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                    <Avatar alt="Women Writers Book Club" name="Women Writers Book Club" size="md" id="4" />
                  </span>
                  <div className="publisher-groups__content flex-1 min-w-0">
                    <h3 className="publisher-groups__name font-medium truncate">Women Writers Book Club</h3>
                    <div className="publisher-groups__meta flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="publisher-groups__role inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">Member</div>
                      <span>·</span>
                      <span>892 members</span>
                      <span>·</span>
                      <span>Joined September 2022</span>
                    </div>
                  </div>
                  <Button variant="outline" className="publisher-groups__view-button h-9 rounded-md px-3">View</Button>
                </div>
                <div className="publisher-groups__item flex items-center gap-3 p-3 border rounded-lg">
                  <span className="publisher-groups__avatar relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                    <Avatar alt="Literary Fiction Fans" name="Literary Fiction Fans" size="md" id="5" />
                  </span>
                  <div className="publisher-groups__content flex-1 min-w-0">
                    <h3 className="publisher-groups__name font-medium truncate">Literary Fiction Fans</h3>
                    <div className="publisher-groups__meta flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="publisher-groups__role inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">Member</div>
                      <span>·</span>
                      <span>1456 members</span>
                      <span>·</span>
                      <span>Joined July 2021</span>
                    </div>
                  </div>
                  <Button variant="outline" className="publisher-groups__view-button h-9 rounded-md px-3">View</Button>
                </div>
                <div className="publisher-groups__item flex items-center gap-3 p-3 border rounded-lg">
                  <span className="publisher-groups__avatar relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                    <Avatar alt="Classic Literature Society" name="Classic Literature Society" size="md" id="6" />
                  </span>
                  <div className="publisher-groups__content flex-1 min-w-0">
                    <h3 className="publisher-groups__name font-medium truncate">Classic Literature Society</h3>
                    <div className="publisher-groups__meta flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="publisher-groups__role inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">Member</div>
                      <span>·</span>
                      <span>789 members</span>
                      <span>·</span>
                      <span>Joined February 2022</span>
                    </div>
                  </div>
                  <Button variant="outline" className="publisher-groups__view-button h-9 rounded-md px-3">View</Button>
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
                    <Avatar alt="Brandon Sanderson" name="Brandon Sanderson" size="md" id="7" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">Brandon Sanderson</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">Author</div>
                      <span>·</span>
                      <span>Following Since 2020</span>
                    </div>
                  </div>
                  <Button variant="outline" className="h-9 rounded-md px-3">View</Button>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                    <Avatar alt="Tor Books" name="Tor Books" size="md" id="8" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">Tor Books</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">Publisher</div>
                      <span>·</span>
                      <span>Following Since 2021</span>
                    </div>
                  </div>
                  <Button variant="outline" className="h-9 rounded-md px-3">View</Button>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                    <Avatar alt="Powell's Books" name="Powell's Books" size="md" id="9" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">Powell's Books</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">Bookstore</div>
                      <span>·</span>
                      <span>Following Since 2019</span>
                    </div>
                  </div>
                  <Button variant="outline" className="h-9 rounded-md px-3">View</Button>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                    <Avatar alt="Neil Gaiman" name="Neil Gaiman" size="md" id="10" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">Neil Gaiman</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">Author</div>
                      <span>·</span>
                      <span>Following Since 2020</span>
                    </div>
                  </div>
                  <Button variant="outline" className="h-9 rounded-md px-3">View</Button>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                    <Avatar alt="Penguin Random House" name="Penguin Random House" size="md" id="11" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">Penguin Random House</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">Publisher</div>
                      <span>·</span>
                      <span>Following Since 2022</span>
                    </div>
                  </div>
                  <Button variant="outline" className="h-9 rounded-md px-3">View</Button>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <span className="relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                    <Avatar alt="Barnes & Noble" name="Barnes & Noble" size="md" id="12" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">Barnes & Noble</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">Bookstore</div>
                      <span>·</span>
                      <span>Following Since 2021</span>
                    </div>
                  </div>
                  <Button variant="outline" className="h-9 rounded-md px-3">View</Button>
                </div>
                <Button className="h-10 px-4 py-2 w-full">
                  <Book className="h-4 w-4 mr-2" />
                  Discover More Pages
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 