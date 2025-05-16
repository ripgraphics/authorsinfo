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
import { FollowersList } from "@/components/followers-list"
import { FollowersListTab } from "@/components/followers-list-tab"
import { PhotosList } from "@/components/photos-list"
import { PhotoAlbumManager } from "@/components/photo-album-manager"
import { PhotoAlbumsList } from "@/components/photo-albums-list"
import { CreateAlbumDialog } from '@/components/create-album-dialog'
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ExpandableSection } from "@/components/ui/expandable-section"

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
  photos?: {
    id: string
    url: string
    alt: string
    uploadedAt?: string
  }[]
  photosCount?: number
  albums?: {
    id: string
    name: string
    description?: string
    cover_image_url?: string
    photo_count: number
    created_at: string
  }[]
}

interface BookCardProps {
  book: {
    id: string
    title: string
    cover_image_url?: string
  }
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
  activities = [],
  photos = [],
  photosCount = 0,
  albums = []
}: ClientAuthorPageProps) {
  const [activeTab, setActiveTab] = useState("timeline")
  const [author, setAuthor] = useState(initialAuthor)
  const [refreshing, setRefreshing] = useState(false)
  const [bioDialogOpen, setBioDialogOpen] = useState(false)
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [editedBio, setEditedBio] = useState(initialAuthor?.bio || "")
  const [showFullBio, setShowFullBio] = useState(false)
  const [editedContact, setEditedContact] = useState({
    website: initialAuthor?.website || "",
    twitter_handle: initialAuthor?.twitter_handle || "",
    facebook_handle: initialAuthor?.facebook_handle || "",
    instagram_handle: initialAuthor?.instagram_handle || "",
    goodreads_url: initialAuthor?.goodreads_url || ""
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Check initial data on mount
  useEffect(() => {
    console.log("Component mounted with initial author:", {
      id: initialAuthor?.id,
      name: initialAuthor?.name,
      hasBio: !!initialAuthor?.bio,
      bioLength: initialAuthor?.bio?.length || 0
    });
    
    // If we don't have author data or bio data, fetch it
    if (!initialAuthor?.bio && initialAuthor?.id) {
      refreshAuthorData();
    }
  }, []);

  // Debug: Log state changes
  useEffect(() => {
    console.log("Author state updated:", {
      authorId: author?.id,
      authorName: author?.name,
      hasBio: !!author?.bio,
      bioLength: author?.bio?.length || 0,
      bioPreview: author?.bio?.substring(0, 50)
    });
  }, [author]);

  useEffect(() => {
    console.log("EditedBio state updated:", {
      length: editedBio?.length || 0,
      preview: editedBio?.substring(0, 50)
    });
  }, [editedBio]);

  // Update edited states when author data changes
  useEffect(() => {
    if (author) {
      setEditedBio(author.bio || "")
      setEditedContact({
        website: author.website || "",
        twitter_handle: author.twitter_handle || "",
        facebook_handle: author.facebook_handle || "",
        instagram_handle: author.instagram_handle || "",
        goodreads_url: author.goodreads_url || ""
      })
    }
  }, [author])

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

  const handlePhotoUploadComplete = () => {
    refreshAuthorData()
  }

  const handleAlbumCreated = () => {
    setRefreshing(true)
    router.refresh()
  }

  const openBioDialog = () => {
    console.log("Opening bio dialog with author bio:", author?.bio);
    // Force set the bio directly from the current author state
    setEditedBio(author?.bio || "");
    setBioDialogOpen(true);
  }

  const openContactDialog = () => {
    setEditedContact({
      website: author?.website || "",
      twitter_handle: author?.twitter_handle || "",
      facebook_handle: author?.facebook_handle || "",
      instagram_handle: author?.instagram_handle || "",
      goodreads_url: author?.goodreads_url || ""
    })
    setContactDialogOpen(true)
  }

  const saveBio = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/authors/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bio: editedBio }),
      })

      if (!response.ok) {
        throw new Error('Failed to update author bio')
      }

      // Update local state
      setAuthor(prev => prev ? { ...prev, bio: editedBio } : null)
      setBioDialogOpen(false)
      
      toast({
        title: "Success",
        description: "Author bio updated successfully",
      })
    } catch (error) {
      console.error('Error updating author bio:', error)
      toast({
        title: "Error",
        description: "Failed to update author bio",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const saveContact = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/authors/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedContact),
      })

      if (!response.ok) {
        throw new Error('Failed to update contact information')
      }

      // Update local state
      setAuthor(prev => prev ? { ...prev, ...editedContact } : null)
      setContactDialogOpen(false)
      
      toast({
        title: "Success",
        description: "Contact information updated successfully",
      })
    } catch (error) {
      console.error('Error updating contact information:', error)
      toast({
        title: "Error",
        description: "Failed to update contact information",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Toggle bio display
  const toggleBioDisplay = () => {
    setShowFullBio(prev => !prev);
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
              <CardContent className="timeline-about-section__content p-6 pt-0 space-y-4">
                <ExpandableSection
                  title="About"
                  headerButton={
                    <button
                      type="button"
                      onClick={() => setActiveTab("about")}
                      className="followers-list__see-all-button inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md px-3 text-sm text-primary hover:bg-primary/10 hover:text-primary"
                    >
                      View More
                    </button>
                  }
                  hideToggle
                  sidePanelStyle
                >
                  {author?.bio || "No biography available for this author."}
                </ExpandableSection>
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
            <FollowersList
              followers={followers}
              followersCount={followersCount}
              entityId={params.id}
              entityType="author"
            />
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
                      case "book_added":
                        return <span>New book added: <Link href={`/books/${activity.books?.id || '#'}`} className="text-primary hover:underline font-medium">{activity.bookTitle}</Link> by {activity.bookAuthor}</span>;
                      case "author_created":
                        return <span>Author profile was created</span>;
                      case "author_profile_updated":
                        return <span>Author profile was updated</span>;
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
                    <Button 
                      variant="ghost" 
                      className="overview-section__edit-button h-8 gap-1 rounded-md px-3"
                      onClick={openBioDialog}
                    >
                      <SquarePen className="overview-section__edit-icon h-4 w-4" />
                      <span>Edit</span>
                    </Button>
                  </div>
                </div>
                <div className="overview-section__content p-6 space-y-4">
                  <div className="overview-section__about space-y-2">
                    <ExpandableSection
                      expanded={showFullBio}
                      onToggle={() => setShowFullBio((v) => !v)}
                      maxHeight={500}
                      className="overview-section__about-wrapper relative"
                      contentClassName="overview-section__about-text whitespace-pre-wrap text-base"
                    >
                      {author?.bio || `About ${author?.name || "the Author"}
                        
${author?.name || "The author"} is a renowned writer known for captivating storytelling and compelling characters. With a distinctive voice that resonates with readers across generations, ${author?.name?.split(' ')[0] || "they"} has established ${author?.name?.includes(' ') ? 'themselves' : 'themself'} as a significant figure in contemporary literature.

Born in ${author?.nationality || "their native country"}, ${author?.name?.split(' ')[0] || "the author"} began writing at an early age, influenced by the rich cultural heritage and literary traditions surrounding ${author?.name?.includes(' ') ? 'them' : 'them'}. After completing ${author?.name?.includes(' ') ? 'their' : 'their'} education, ${author?.name?.split(' ')[0] || "they"} devoted ${author?.name?.includes(' ') ? 'themselves' : 'themself'} to the craft of writing, publishing ${author?.name?.includes(' ') ? 'their' : 'their'} first work to critical acclaim.

Throughout ${author?.name?.includes(' ') ? 'their' : 'their'} career, ${author?.name?.split(' ')[0] || "the author"} has explored various themes including identity, belonging, human relationships, and the complexities of modern society. ${author?.name?.includes(' ') ? 'Their' : 'Their'} works often blend elements of realism with lyrical prose, creating immersive narratives that challenge readers to reflect on their own experiences and perspectives.

${author?.name || "The author"} has received numerous accolades for ${author?.name?.includes(' ') ? 'their' : 'their'} contributions to literature, including prestigious literary awards and recognition from peers in the industry. Beyond writing, ${author?.name?.split(' ')[0] || "they"} is passionate about promoting literacy and supporting emerging writers through workshops, mentorship programs, and public speaking engagements.

When not writing, ${author?.name?.split(' ')[0] || "the author"} enjoys reading widely across genres, traveling to gather inspiration for new stories, and engaging with readers through book tours and literary festivals. ${author?.name?.includes(' ') ? 'Their' : 'Their'} dedication to the craft and genuine connection with audiences have established ${author?.name || "the author"} as a beloved figure in the literary world.

${author?.name || "The author"} continues to push boundaries with each new work, exploring fresh narrative approaches while maintaining the distinctive voice that has captivated readers worldwide. With each publication, ${author?.name?.split(' ')[0] || "they"} reaffirms ${author?.name?.includes(' ') ? 'their' : 'their'} place as one of the most significant literary voices of our time.`}
                    </ExpandableSection>
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
                    <Button 
                      variant="ghost" 
                      className="contact-section__edit-button h-8 gap-1 rounded-md px-3"
                      onClick={openContactDialog}
                    >
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
                            <a href={`mailto:${author.email}`} className="text-primary hover:underline">
                              {author.email}
                            </a>
                          </div>
                        )}
                        {author?.twitter_handle && (
                          <div className="contact-section__twitter flex flex-col">
                            <span className="contact-section__label text-sm text-muted-foreground">Twitter</span>
                            <a href={`https://twitter.com/${author.twitter_handle}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              @{author.twitter_handle}
                            </a>
                          </div>
                        )}
                        {author?.facebook_handle && (
                          <div className="contact-section__facebook flex flex-col">
                            <span className="contact-section__label text-sm text-muted-foreground">Facebook</span>
                            <a href={`https://facebook.com/${author.facebook_handle}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              {author.facebook_handle}
                            </a>
                          </div>
                        )}
                        {author?.instagram_handle && (
                          <div className="contact-section__instagram flex flex-col">
                            <span className="contact-section__label text-sm text-muted-foreground">Instagram</span>
                            <a href={`https://instagram.com/${author.instagram_handle}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              @{author.instagram_handle}
                            </a>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="col-span-2 text-center text-muted-foreground py-4">
                        No contact information available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bio Edit Dialog */}
          <Dialog open={bioDialogOpen} onOpenChange={(open) => {
            if (open) {
              // When opening, ensure we have the latest bio
              setEditedBio(author?.bio || "");
              console.log("Dialog opening, setting bio to:", author?.bio);
            }
            setBioDialogOpen(open);
          }}>
            <DialogContent className="w-[95vw] max-w-[800px] h-auto max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Author Biography</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="bio">Biography</Label>
                  <Textarea
                    id="bio"
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    rows={12}
                    className="w-full min-h-[200px]"
                    placeholder="Enter author biography here..."
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
                <Button variant="outline" onClick={() => setBioDialogOpen(false)} className="w-full sm:w-auto order-2 sm:order-1">Cancel</Button>
                <Button onClick={saveBio} disabled={saving} className="w-full sm:w-auto order-1 sm:order-2 mb-2 sm:mb-0">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Contact Edit Dialog */}
          <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
            <DialogContent className="w-[95vw] max-w-[600px] h-auto max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Contact Information</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={editedContact.website}
                    onChange={(e) => setEditedContact({...editedContact, website: e.target.value})}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    value={editedContact.twitter_handle}
                    onChange={(e) => setEditedContact({...editedContact, twitter_handle: e.target.value})}
                    placeholder="username (without @)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={editedContact.facebook_handle}
                    onChange={(e) => setEditedContact({...editedContact, facebook_handle: e.target.value})}
                    placeholder="username or page name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={editedContact.instagram_handle}
                    onChange={(e) => setEditedContact({...editedContact, instagram_handle: e.target.value})}
                    placeholder="username (without @)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="goodreads">Goodreads URL</Label>
                  <Input
                    id="goodreads"
                    value={editedContact.goodreads_url}
                    onChange={(e) => setEditedContact({...editedContact, goodreads_url: e.target.value})}
                    placeholder="https://www.goodreads.com/author/..."
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
                <Button variant="outline" onClick={() => setContactDialogOpen(false)} className="w-full sm:w-auto order-2 sm:order-1">Cancel</Button>
                <Button onClick={saveContact} disabled={saving} className="w-full sm:w-auto order-1 sm:order-2 mb-2 sm:mb-0">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {activeTab === "books" && (
        <div className="books-section">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book) => (
              <BookCard
                key={book.id}
                id={book.id}
                title={book.title}
                coverImageUrl={book.cover_image_url}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === "followers" && (
        <FollowersListTab
          followers={followers}
          followersCount={followersCount}
          entityId={params.id}
          entityType="author"
        />
      )}

      {activeTab === "photos" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Photo Albums</h2>
            <CreateAlbumDialog
              entityId={params.id}
              entityType="author"
              onAlbumCreated={handleAlbumCreated}
            />
          </div>
          <PhotoAlbumsList
            albums={albums}
            onAlbumUpdated={handleAlbumCreated}
          />
        </div>
      )}

      {activeTab === "more" && (
        <div className="more-section">
          <h2 className="text-2xl font-semibold mb-4">More</h2>
          {/* Add more content here */}
        </div>
      )}
    </div>
  )
}