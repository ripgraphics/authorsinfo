'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  BookOpen,
  Users,
  MapPin,
  Globe,
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
  Settings,
} from 'lucide-react'
import { BookCard } from '@/components/book-card'
import { useToast } from '@/components/ui/use-toast'
import type { Author } from '@/types/book'
import { Timeline, TimelineItem } from '@/components/timeline'
import { FollowersList } from '@/components/followers-list'
import { FollowersListTab } from '@/components/followers-list-tab'
import { PhotosList } from '@/components/photos-list'
import { PhotoAlbumManager } from '@/components/photo-album-manager'
import { PhotoAlbumsList } from '@/components/photo-albums-list'
import { CreateAlbumDialog } from '@/components/create-album-dialog'
import { EntityPhotoAlbums } from '@/components/user-photo-albums'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ExpandableSection } from '@/components/ui/expandable-section'
import { ViewFullDetailsButton } from '@/components/ui/ViewFullDetailsButton'
import { TimelineAboutSection } from '@/components/author/TimelineAboutSection'
import { EntityHoverCard } from '@/components/entity-hover-cards'
import { ContactInfo, ContactInfoInput } from '@/types/contact'
import { getContactInfo, upsertContactInfo } from '@/utils/contactInfo'
import { useAuth } from '@/hooks/useAuth'
import { FollowButton } from '@/components/follow-button'
import { canUserEditEntity } from '@/lib/auth-utils'
import { EntityTab } from '@/components/ui/entity-tabs'
import EnterpriseTimelineActivities from '@/components/enterprise/enterprise-timeline-activities-optimized'
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EntityHeader, TabConfig } from '@/components/entity-header'
import { deduplicatedRequest } from '@/lib/request-utils'

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
    id: '1',
    type: 'rating',
    bookTitle: 'Dune',
    bookAuthor: 'Frank Herbert',
    rating: 5,
    timeAgo: '2 days ago',
  },
  {
    id: '2',
    type: 'finished',
    bookTitle: 'The Hobbit',
    bookAuthor: 'J.R.R. Tolkien',
    timeAgo: '1 week ago',
  },
  {
    id: '3',
    type: 'added',
    bookTitle: 'The Way of Kings',
    bookAuthor: 'Brandon Sanderson',
    shelf: 'Want to Read',
    timeAgo: '2 weeks ago',
  },
  {
    id: '4',
    type: 'reviewed',
    bookTitle: 'Circe',
    bookAuthor: 'Madeline Miller',
    timeAgo: '3 weeks ago',
  },
]

export function ClientAuthorPage({
  author: initialAuthor,
  authorImageUrl,
  coverImageUrl,
  params,
  followers = [],
  followersCount = 0,
  books = [],
  booksCount = 0,
  photos = [],
  photosCount = 0,
  albums = [],
}: ClientAuthorPageProps) {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const validTabs: EntityTab[] = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'about', label: 'About' },
    { id: 'books', label: 'Books' },
    { id: 'followers', label: `Followers (${followersCount})` },
    { id: 'photos', label: 'Photos' },
    { id: 'more', label: 'More' },
  ]
  const tabParam = searchParams?.get('tab')
  const validTabIds = validTabs.map((t) => t.id)
  const initialTab = tabParam && validTabIds.includes(tabParam) ? tabParam : 'timeline'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [author, setAuthor] = useState(initialAuthor)
  const [refreshing, setRefreshing] = useState(false)
  const [bioDialogOpen, setBioDialogOpen] = useState(false)
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [editedBio, setEditedBio] = useState(initialAuthor?.bio || '')
  const [showFullBio, setShowFullBio] = useState(false)
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null)
  const [editedContact, setEditedContact] = useState<ContactInfoInput>({
    entity_type: 'author',
    entity_id: params.id,
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(false)
  const [showFullTimelineAbout, setShowFullTimelineAbout] = useState(false)
  const [needsTimelineTruncation, setNeedsTimelineTruncation] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [coverImageUrlState, setCoverImageUrlState] = useState(coverImageUrl)
  const [authorImageUrlState, setAuthorImageUrlState] = useState(authorImageUrl)

  // Convert tabs to TabConfig format for EntityHeader
  const tabs: TabConfig[] = validTabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    disabled: tab.disabled,
  }))

  // Create stats array for EntityHeader
  const stats = [
    {
      icon: <BookOpen className="h-4 w-4 mr-1" />,
      text: `${booksCount} books written`,
    },
    {
      icon: <Users className="h-4 w-4 mr-1" />,
      text: `${followersCount} followers`,
    },
  ]

  // Follow handler
  const handleFollow = async () => {
    // FollowButton component handles this internally, but we need the handler for EntityHeader
    // The actual follow logic is in FollowButton component
  }

  // Check edit permissions
  useEffect(() => {
    const checkEditPermissions = async () => {
      if (!user?.id) {
        setCanEdit(false)
        return
      }

      // For authors (catalog entities), only admins can edit
      const isAdmin =
        user.role === 'admin' || user.role === 'super_admin' || user.role === 'super-admin'
      setCanEdit(isAdmin)
    }

    checkEditPermissions()
  }, [user])

  // Check initial data on mount
  useEffect(() => {
    console.log('Component mounted with initial author:', {
      id: initialAuthor?.id,
      name: initialAuthor?.name,
      hasBio: !!initialAuthor?.bio,
      bioLength: initialAuthor?.bio?.length || 0,
    })

    // If we don't have author data or bio data, fetch it
    if (!initialAuthor?.bio && initialAuthor?.id) {
      refreshAuthorData()
    }
  }, [])

  // Debug: Log state changes
  useEffect(() => {
    console.log('Author state updated:', {
      authorId: author?.id,
      authorName: author?.name,
      hasBio: !!author?.bio,
      bioLength: author?.bio?.length || 0,
      bioPreview: author?.bio?.substring(0, 50),
    })
  }, [author])

  useEffect(() => {
    console.log('EditedBio state updated:', {
      length: editedBio?.length || 0,
      preview: editedBio?.substring(0, 50),
    })
  }, [editedBio])

  // Update edited states when author data changes
  useEffect(() => {
    if (author) {
      setEditedBio(author.bio || '')
    }
  }, [author])

  // Add useEffect to fetch contact info
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        console.log('Fetching contact info for author:', {
          authorId: params.id,
          authorName: author?.name,
        })

        const info = await getContactInfo('author', params.id)

        console.log('Contact info fetch result:', {
          success: !!info,
          hasEmail: !!info?.email,
          hasPhone: !!info?.phone,
          hasWebsite: !!info?.website,
        })

        if (info) {
          setContactInfo(info)
          setEditedContact({
            entity_type: 'author',
            entity_id: params.id,
            email: info.email,
            phone: info.phone,
            website: info.website,
            address_line1: info.address_line1,
            address_line2: info.address_line2,
            city: info.city,
            state: info.state,
            postal_code: info.postal_code,
            country: info.country,
          })
        } else {
          // Initialize with empty values if no contact info exists
          setContactInfo(null)
          setEditedContact({
            entity_type: 'author',
            entity_id: params.id,
          })
        }
      } catch (error) {
        console.error('Error in fetchContactInfo:', {
          error,
          authorId: params.id,
          authorName: author?.name,
          stack: error instanceof Error ? error.stack : undefined,
        })

        // Show error toast to user
        toast({
          title: 'Error',
          description: 'Failed to load contact information. Please try again later.',
          variant: 'destructive',
        })
      }
    }
    fetchContactInfo()
  }, [params.id, author?.name, toast])

  // Fetch entity images from photo albums
  const fetchEntityImages = useCallback(async () => {
    if (!params.id) {
      console.log('❌ Missing author ID, skipping entity image fetch')
      return
    }

    try {
      console.log('📡 Fetching entity images for author...')

      // Use deduplicated requests with shorter cache for entity images
      // Shorter cache ensures fresh data after image uploads
      const [headerData, avatarData] = await Promise.all([
        deduplicatedRequest(
          `entity-header-author-${params.id}`,
          () =>
            fetch(
              `/api/entity-images?entityId=${params.id}&entityType=author&albumPurpose=entity_header`
            ).then((r) => r.json()),
          30 * 1000 // 30 seconds cache - shorter for entity header images
        ),
        deduplicatedRequest(
          `entity-avatar-author-${params.id}`,
          () =>
            fetch(
              `/api/entity-images?entityId=${params.id}&entityType=author&albumPurpose=avatar`
            ).then((r) => r.json()),
          30 * 1000 // 30 seconds cache - shorter for entity avatar images
        ),
      ])

      // Process header images - FIRST PRIORITY: entity header image
      let foundEntityHeaderImage = false

      console.log('🔍 Header data response:', {
        success: headerData.success,
        albumsCount: headerData.albums?.length || 0,
        albums: headerData.albums?.map((a: any) => ({
          id: a.id,
          name: a.name,
          imagesCount: a.images?.length || 0,
        })),
      })

      if (headerData.success && headerData.albums && headerData.albums.length > 0) {
        const headerAlbum = headerData.albums[0]
        console.log('🔍 Header album details:', {
          id: headerAlbum.id,
          name: headerAlbum.name,
          imagesCount: headerAlbum.images?.length || 0,
          images: headerAlbum.images?.map((img: any) => ({
            id: img.id,
            is_cover: img.is_cover,
            hasImage: !!img.image,
            imageUrl: img.image?.url || 'NO URL',
            imageId: img.image?.id || 'NO ID',
          })),
        })

        if (headerAlbum.images && headerAlbum.images.length > 0) {
          // Filter out images with null image objects
          const validImages = headerAlbum.images.filter((img: any) => img.image && img.image.url)
          console.log(
            `🔍 Filtered ${validImages.length} valid images from ${headerAlbum.images.length} total`
          )

          if (validImages.length > 0) {
            let headerImage = validImages.find((img: any) => img.is_cover)

            if (!headerImage) {
              headerImage = validImages.reduce((latest: any, current: any) => {
                if (!latest) return current
                const latestDate = new Date(latest.image?.created_at || 0)
                const currentDate = new Date(current.image?.created_at || 0)
                return currentDate > latestDate ? current : latest
              })
            }

            if (headerImage && headerImage.image) {
              console.log('✅ Found entity header image, setting:', headerImage.image.url)
              setCoverImageUrlState(headerImage.image.url)
              foundEntityHeaderImage = true
            } else {
              console.warn('⚠️ Header image found but missing image object:', headerImage)
            }
          } else {
            console.warn(
              '⚠️ No valid images found in header album (all images have null image objects)'
            )
          }
        } else {
          console.warn('⚠️ Header album has no images array or empty images array')
        }
      } else {
        console.warn('⚠️ No header albums found or request failed:', {
          success: headerData.success,
          error: headerData.error,
          albumsCount: headerData.albums?.length || 0,
        })
      }

      // FALLBACK: Only use original coverImageUrl if no entity header image was found
      if (!foundEntityHeaderImage) {
        console.log('⚠️ No entity header image found, falling back to original cover image')
        setCoverImageUrlState(coverImageUrl)
      }

      // Process avatar images
      console.log('🔍 Avatar data response:', {
        success: avatarData.success,
        albumsCount: avatarData.albums?.length || 0,
        albums: avatarData.albums?.map((a: any) => ({
          id: a.id,
          name: a.name,
          imagesCount: a.images?.length || 0,
        })),
      })

      if (avatarData.success && avatarData.albums && avatarData.albums.length > 0) {
        const avatarAlbum = avatarData.albums[0]
        console.log('🔍 Avatar album details:', {
          id: avatarAlbum.id,
          name: avatarAlbum.name,
          imagesCount: avatarAlbum.images?.length || 0,
          images: avatarAlbum.images?.map((img: any) => ({
            id: img.id,
            is_cover: img.is_cover,
            hasImage: !!img.image,
            imageUrl: img.image?.url || 'NO URL',
            imageId: img.image?.id || 'NO ID',
          })),
        })

        if (avatarAlbum.images && avatarAlbum.images.length > 0) {
          // Filter out images with null image objects
          const validImages = avatarAlbum.images.filter((img: any) => img.image && img.image.url)
          console.log(
            `🔍 Filtered ${validImages.length} valid images from ${avatarAlbum.images.length} total`
          )

          if (validImages.length > 0) {
            let avatarImage = validImages.find((img: any) => img.is_cover)

            if (!avatarImage) {
              avatarImage = validImages.reduce((latest: any, current: any) => {
                if (!latest) return current
                const latestDate = new Date(latest.image?.created_at || 0)
                const currentDate = new Date(current.image?.created_at || 0)
                return currentDate > latestDate ? current : latest
              })
            }

            if (avatarImage && avatarImage.image) {
              console.log('✅ Setting avatar image:', avatarImage.image.url)
              setAuthorImageUrlState(avatarImage.image.url)
            } else {
              console.warn('⚠️ Avatar image found but missing image object:', avatarImage)
              // Fallback to original avatar image
              setAuthorImageUrlState(authorImageUrl)
            }
          } else {
            console.warn(
              '⚠️ No valid images found in avatar album (all images have null image objects)'
            )
            // Fallback to original avatar image
            setAuthorImageUrlState(authorImageUrl)
          }
        } else {
          console.warn('⚠️ Avatar album has no images array or empty images array')
          // Fallback to original avatar image
          setAuthorImageUrlState(authorImageUrl)
        }
      } else {
        console.warn('⚠️ No avatar albums found or request failed:', {
          success: avatarData.success,
          error: avatarData.error,
          albumsCount: avatarData.albums?.length || 0,
        })
        // Fallback to original avatar image if no album images found
        setAuthorImageUrlState(authorImageUrl)
      }
    } catch (error) {
      console.error('❌ Error fetching entity images:', error)
      // On error, fall back to original images
      setCoverImageUrlState(coverImageUrl)
      setAuthorImageUrlState(authorImageUrl)
    }
  }, [params.id, coverImageUrl, authorImageUrl])

  // Fetch entity images from photo albums when component mounts
  useEffect(() => {
    console.log('🚀 useEffect triggered, calling fetchEntityImages')
    fetchEntityImages()
  }, [fetchEntityImages])

  // Listen for entity image changes (when user sets new cover in photos tab)
  useEffect(() => {
    const handleEntityImageChanged = () => {
      console.log('🔄 Entity image changed event received, refreshing images...')
      fetchEntityImages()
    }

    window.addEventListener('entityImageChanged', handleEntityImageChanged)

    return () => {
      window.removeEventListener('entityImageChanged', handleEntityImageChanged)
    }
  }, [fetchEntityImages])

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
        title: 'Error',
        description: 'Failed to refresh author data',
        variant: 'destructive',
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
    console.log('Opening bio dialog with author bio:', author?.bio)
    // Force set the bio directly from the current author state
    setEditedBio(author?.bio || '')
    setBioDialogOpen(true)
  }

  const openContactDialog = () => {
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
      setAuthor((prev: any) => (prev ? { ...prev, bio: editedBio } : null))
      setBioDialogOpen(false)

      toast({
        title: 'Success',
        description: 'Author bio updated successfully',
      })
    } catch (error) {
      console.error('Error updating author bio:', error)
      toast({
        title: 'Error',
        description: 'Failed to update author bio',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Add handleUpdateContact function
  const handleUpdateContact = async () => {
    try {
      const updatedContact = await upsertContactInfo({
        entity_type: 'author',
        entity_id: params.id,
        email: editedContact.email || undefined,
        phone: editedContact.phone || undefined,
        website: editedContact.website || undefined,
        address_line1: editedContact.address_line1 || undefined,
        address_line2: editedContact.address_line2 || undefined,
        city: editedContact.city || undefined,
        state: editedContact.state || undefined,
        postal_code: editedContact.postal_code || undefined,
        country: editedContact.country || undefined,
      })

      if (updatedContact) {
        setContactInfo(updatedContact)
        setContactDialogOpen(false)
        toast({
          title: 'Success',
          description: 'Contact information updated successfully',
        })
      }
    } catch (error) {
      console.error('Error updating contact info:', error)
      toast({
        title: 'Error',
        description: 'Failed to update contact information',
        variant: 'destructive',
      })
    }
  }

  // Toggle bio display
  const toggleBioDisplay = () => {
    setShowFullBio((prev: boolean) => !prev)
  }

  // Keep activeTab in sync with URL
  useEffect(() => {
    if (tabParam && validTabIds.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [tabParam, validTabIds, activeTab])

  return (
    <div className="author-page author-page__container py-6">
      <EntityHeader
        entityType="author"
        name={author?.name || 'Author'}
        username={`@${author?.name?.toLowerCase().replace(/\s+/g, '') || 'author'}`}
        coverImageUrl={coverImageUrlState || '/placeholder.svg?height=400&width=1200'}
        profileImageUrl={authorImageUrlState || '/placeholder.svg?height=200&width=200'}
        stats={stats}
        location={author?.nationality || undefined}
        website={author?.website || undefined}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isEditable={canEdit}
        entityId={params.id}
        targetType="author"
        author={{
          id: author.id,
          name: author.name,
          author_image: author.author_image || undefined,
        }}
        authorBookCount={booksCount}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        isMessageable={true}
        onCoverImageChange={() => {
          // EntityHeader handles this internally
          window.dispatchEvent(new CustomEvent('entityImageChanged'))
        }}
        onProfileImageChange={() => {
          // EntityHeader handles this internally
          window.dispatchEvent(new CustomEvent('entityImageChanged'))
        }}
      />

      {/* Content Section with Sidebar on Left + Main Content on Right */}
      {activeTab === 'timeline' && (
        <div className="author-page__content">
          <div className="author-page__tab-content grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT SIDEBAR - 1 Column */}
            <div className="lg:col-span-1 space-y-6 self-end sticky bottom-0">
              {/* About Section */}
              <TimelineAboutSection
                bio={author?.bio}
                nationality={author?.nationality || undefined}
                website={author?.website || undefined}
                onViewMore={() => setActiveTab('about')}
                onViewFullDetails={() => setActiveTab('about')}
              />

              {/* Currently Reading Section */}
              <Card>
                <div className="space-y-1.5 p-6 flex flex-row items-center justify-between">
                  <div className="text-2xl font-semibold leading-none tracking-tight">
                    Currently Reading
                  </div>
                  <Link href="/my-books" className="text-sm text-primary hover:underline">
                    See All
                  </Link>
                </div>
                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="flex gap-3">
                    <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-md">
                      <Image
                        src="/placeholder.svg?height=240&width=160"
                        alt="The Name of the Wind"
                        fill
                        sizes="56px"
                        className="object-cover"
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
                          <div
                            className="h-full w-full flex-1 bg-primary transition-all"
                            style={{ transform: 'translateX(-35%)' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-md">
                      <Image
                        src="/placeholder.svg?height=240&width=160"
                        alt="Project Hail Mary"
                        fill
                        sizes="56px"
                        className="object-cover"
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
                          <div
                            className="h-full w-full flex-1 bg-primary transition-all"
                            style={{ transform: 'translateX(-77%)' }}
                          ></div>
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
                  <Link
                    href={`/authors/${params.id}/photos`}
                    className="text-sm text-primary hover:underline"
                  >
                    See All
                  </Link>
                </div>
                <CardContent className="p-6 pt-0">
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <div key={num} className="aspect-square relative rounded-sm overflow-hidden">
                        <Image
                          src={`/placeholder.svg?height=100&width=100&text=${num}`}
                          alt={`Photo ${num}`}
                          fill
                          sizes="(max-width: 768px) 33vw, 120px"
                          className="object-cover"
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
                onViewMore={() => setActiveTab('followers')}
              />
            </div>

            {/* MAIN CONTENT - 2 Columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Timeline Feed - This has full posting functionality */}
              <EnterpriseTimelineActivities
                entityType="author"
                entityId={params.id}
                enableReadingProgress={true}
                enablePrivacyControls={true}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="publisher-page__content">
          <div className="publisher-page__tab-content grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="about-navigation bg-white rounded-lg shadow-sm overflow-hidden sticky top-20">
                <div className="about-navigation__header p-4 border-b flex justify-between items-center">
                  <h2 className="about-navigation__title text-lg font-medium">About</h2>
                  <div className="about-navigation__settings-wrapper relative">
                    {user && user.role === 'admin' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="about-navigation__settings-button h-8 w-8 rounded-full"
                      >
                        <Settings className="about-navigation__settings-icon h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <nav className="about-navigation__nav p-2">
                  <a
                    href="#overview"
                    className="about-navigation__nav-link flex items-center px-3 py-2 rounded-md hover:bg-muted text-primary"
                  >
                    Overview
                  </a>
                  <a
                    href="#contact-info"
                    className="about-navigation__nav-link flex items-center px-3 py-2 rounded-md hover:bg-muted"
                  >
                    Contact Information
                  </a>
                  <a
                    href="#location"
                    className="about-navigation__nav-link flex items-center px-3 py-2 rounded-md hover:bg-muted"
                  >
                    Location
                  </a>
                  <a
                    href="#books"
                    className="about-navigation__nav-link flex items-center px-3 py-2 rounded-md hover:bg-muted"
                  >
                    Published Books
                  </a>
                </nav>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div
                className="rounded-lg border bg-card text-card-foreground shadow-xs overview-section mb-6"
                id="overview"
              >
                <div className="overview-section__header flex flex-col space-y-1.5 p-6 border-b">
                  <div className="overview-section__title-row flex justify-between items-center">
                    <h3 className="overview-section__title text-xl font-semibold">Overview</h3>
                    {user &&
                      (user.role === 'admin' ||
                        user.role === 'super_admin' ||
                        user.role === 'super-admin') && (
                        <Button
                          variant="ghost"
                          className="overview-section__edit-button h-8 gap-1 rounded-md px-3"
                          onClick={openBioDialog}
                        >
                          <SquarePen className="overview-section__edit-icon h-4 w-4" />
                          <span>Edit</span>
                        </Button>
                      )}
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
                      {author?.bio ||
                        `About ${author?.name || 'the Author'}
                        
${author?.name || 'The author'} is a renowned writer known for captivating storytelling and compelling characters. With a distinctive voice that resonates with readers across generations, ${author?.name?.split(' ')[0] || 'they'} has established ${author?.name?.includes(' ') ? 'themselves' : 'themself'} as a significant figure in contemporary literature.

Born in ${author?.nationality || 'their native country'}, ${author?.name?.split(' ')[0] || 'the author'} began writing at an early age, influenced by the rich cultural heritage and literary traditions surrounding ${author?.name?.includes(' ') ? 'them' : 'them'}. After completing ${author?.name?.includes(' ') ? 'their' : 'their'} education, ${author?.name?.split(' ')[0] || 'they'} devoted ${author?.name?.includes(' ') ? 'themselves' : 'themself'} to the craft of writing, publishing ${author?.name?.includes(' ') ? 'their' : 'their'} first work to critical acclaim.

Throughout ${author?.name?.includes(' ') ? 'their' : 'their'} career, ${author?.name?.split(' ')[0] || 'the author'} has explored various themes including identity, belonging, human relationships, and the complexities of modern society. ${author?.name?.includes(' ') ? 'Their' : 'Their'} works often blend elements of realism with lyrical prose, creating immersive narratives that challenge readers to reflect on their own experiences and perspectives.

${author?.name || 'The author'} has received numerous accolades for ${author?.name?.includes(' ') ? 'their' : 'their'} contributions to literature, including prestigious literary awards and recognition from peers in the industry. Beyond writing, ${author?.name?.split(' ')[0] || 'they'} is passionate about promoting literacy and supporting emerging writers through workshops, mentorship programs, and public speaking engagements.

When not writing, ${author?.name?.split(' ')[0] || 'the author'} enjoys reading widely across genres, traveling to gather inspiration for new stories, and engaging with readers through book tours and literary festivals. ${author?.name?.includes(' ') ? 'Their' : 'Their'} dedication to the craft and genuine connection with audiences have established ${author?.name || 'the author'} as a beloved figure in the literary world.

${author?.name || 'The author'} continues to push boundaries with each new work, exploring fresh narrative approaches while maintaining the distinctive voice that has captivated readers worldwide. With each publication, ${author?.name?.split(' ')[0] || 'they'} reaffirms ${author?.name?.includes(' ') ? 'their' : 'their'} place as one of the most significant literary voices of our time.`}
                    </ExpandableSection>
                  </div>
                  {author?.birth_date && (
                    <div className="overview-section__founded flex items-center">
                      <Calendar className="overview-section__founded-icon h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="overview-section__founded-text">
                        Born in {new Date(author.birth_date).getFullYear()}
                      </span>
                    </div>
                  )}
                  {author?.website && (
                    <div className="overview-section__website flex items-start">
                      <Globe className="overview-section__website-icon h-4 w-4 mr-2 text-muted-foreground flex-shrink-0 mt-1" />
                      <a
                        href={
                          author.website.startsWith('http')
                            ? author.website
                            : `https://${author.website}`
                        }
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

              {/* Contact Information Section */}
              <div
                className="rounded-lg border bg-card text-card-foreground shadow-xs contact-section mb-6"
                id="contact-info"
              >
                <div className="contact-section__header flex flex-col space-y-1.5 p-6 border-b">
                  <div className="contact-section__title-row flex justify-between items-center">
                    <h3 className="contact-section__title text-xl font-semibold">
                      Contact Information
                    </h3>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        className="contact-section__edit-button h-8 gap-1 rounded-md px-3"
                        onClick={() => setContactDialogOpen(true)}
                      >
                        <SquarePen className="contact-section__edit-icon h-4 w-4" />
                        <span>Edit</span>
                      </Button>
                    )}
                  </div>
                </div>
                <div className="contact-section__content p-6">
                  <div className="contact-section__grid grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contactInfo?.email && (
                      <div className="contact-section__email flex flex-col">
                        <span className="contact-section__label text-sm text-muted-foreground">
                          Email
                        </span>
                        <a
                          href={`mailto:${contactInfo.email}`}
                          className="text-primary hover:underline"
                        >
                          {contactInfo.email}
                        </a>
                      </div>
                    )}
                    {contactInfo?.phone && (
                      <div className="contact-section__phone flex flex-col">
                        <span className="contact-section__label text-sm text-muted-foreground">
                          Phone
                        </span>
                        <a
                          href={`tel:${contactInfo.phone}`}
                          className="text-primary hover:underline"
                        >
                          {contactInfo.phone}
                        </a>
                      </div>
                    )}
                    {contactInfo?.website && (
                      <div className="contact-section__website flex flex-col">
                        <span className="contact-section__label text-sm text-muted-foreground">
                          Website
                        </span>
                        <a
                          href={
                            contactInfo.website.startsWith('http')
                              ? contactInfo.website
                              : `https://${contactInfo.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {contactInfo.website}
                        </a>
                      </div>
                    )}
                    {(contactInfo?.address_line1 ||
                      contactInfo?.address_line2 ||
                      contactInfo?.city ||
                      contactInfo?.state ||
                      contactInfo?.postal_code ||
                      contactInfo?.country) && (
                      <div className="contact-section__address flex flex-col">
                        <span className="contact-section__label text-sm text-muted-foreground">
                          Address
                        </span>
                        <div className="flex flex-col">
                          {contactInfo.address_line1 && <span>{contactInfo.address_line1}</span>}
                          {contactInfo.address_line2 && <span>{contactInfo.address_line2}</span>}
                          <span>
                            {[contactInfo.city, contactInfo.state, contactInfo.postal_code]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                          {contactInfo.country && <span>{contactInfo.country}</span>}
                        </div>
                      </div>
                    )}
                    {!contactInfo?.email &&
                      !contactInfo?.phone &&
                      !contactInfo?.website &&
                      !contactInfo?.address_line1 &&
                      !contactInfo?.address_line2 &&
                      !contactInfo?.city &&
                      !contactInfo?.state &&
                      !contactInfo?.postal_code &&
                      !contactInfo?.country && (
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
          <Dialog
            open={bioDialogOpen}
            onOpenChange={(open) => {
              if (open) {
                // When opening, ensure we have the latest bio
                setEditedBio(author?.bio || '')
                console.log('Dialog opening, setting bio to:', author?.bio)
              }
              setBioDialogOpen(open)
            }}
          >
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
                <Button
                  variant="outline"
                  onClick={() => setBioDialogOpen(false)}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveBio}
                  disabled={saving}
                  className="w-full sm:w-auto order-1 sm:order-2 mb-2 sm:mb-0"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={editedContact.email || ''}
                    onChange={(e) =>
                      setEditedContact((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Enter email address"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editedContact.phone || ''}
                    onChange={(e) =>
                      setEditedContact((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={editedContact.website || ''}
                    onChange={(e) =>
                      setEditedContact((prev) => ({ ...prev, website: e.target.value }))
                    }
                    placeholder="Enter website URL"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input
                    id="address_line1"
                    value={editedContact.address_line1 || ''}
                    onChange={(e) =>
                      setEditedContact((prev) => ({ ...prev, address_line1: e.target.value }))
                    }
                    placeholder="Enter address line 1"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    value={editedContact.address_line2 || ''}
                    onChange={(e) =>
                      setEditedContact((prev) => ({ ...prev, address_line2: e.target.value }))
                    }
                    placeholder="Enter address line 2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={editedContact.city || ''}
                      onChange={(e) =>
                        setEditedContact((prev) => ({ ...prev, city: e.target.value }))
                      }
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={editedContact.state || ''}
                      onChange={(e) =>
                        setEditedContact((prev) => ({ ...prev, state: e.target.value }))
                      }
                      placeholder="Enter state"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={editedContact.postal_code || ''}
                      onChange={(e) =>
                        setEditedContact((prev) => ({ ...prev, postal_code: e.target.value }))
                      }
                      placeholder="Enter postal code"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={editedContact.country || ''}
                      onChange={(e) =>
                        setEditedContact((prev) => ({ ...prev, country: e.target.value }))
                      }
                      placeholder="Enter country"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setContactDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateContact}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {activeTab === 'books' && (
        <div className="books-section">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {books.map((book) => (
              <BookCard
                key={book.id}
                id={book.id}
                title={book.title}
                coverImageUrl={book.cover_image_url}
                author={
                  author
                    ? {
                        id: author.id,
                        name: author.name,
                        author_image: author.author_image
                          ? { url: author.author_image.url }
                          : undefined,
                      }
                    : undefined
                }
                authorBookCount={booksCount}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'followers' && (
        <FollowersListTab
          followers={followers}
          followersCount={followersCount}
          entityId={params.id}
          entityType="author"
        />
      )}

      {activeTab === 'photos' && (
        <div className="author-page__photos-tab">
          <div className="author-page__tab-content space-y-6">
            <EntityPhotoAlbums
              entityId={params.id}
              entityType="author"
              isOwnEntity={canEdit}
              entityDisplayInfo={{
                id: params.id,
                name: author.name,
                type: 'author' as const,
                author_image: author.author_image || undefined,
                bookCount: booksCount || 0,
              }}
            />
          </div>
        </div>
      )}

      {activeTab === 'more' && (
        <div className="more-section">
          <h2 className="text-2xl font-semibold mb-4">More</h2>
          {/* Add more content here */}
        </div>
      )}
    </div>
  )
}
