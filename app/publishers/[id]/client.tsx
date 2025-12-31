'use client'

import { Input } from '@/components/ui/input'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { EntityHeader, TabConfig } from '@/components/entity-header'
import { EntityPhotoAlbums } from '@/components/user-photo-albums'
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
} from 'lucide-react'
import { BookCard } from '@/components/book-card'
import Image from 'next/image'
import {
  AboutNavigation,
  OverviewSection,
  ContactSection,
  LocationSection,
  BooksSection,
} from './components/AboutSections'
import { useToast } from '@/components/ui/use-toast'
import { FollowersList } from '@/components/followers-list'
import { FollowersListTab } from '@/components/followers-list-tab'
import { ExpandableSection } from '@/components/ui/expandable-section'
import { ViewFullDetailsButton } from '@/components/ui/ViewFullDetailsButton'
import { TimelineAboutSection } from '@/components/author/TimelineAboutSection'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import EnterpriseTimelineActivities from '@/components/enterprise/enterprise-timeline-activities-optimized'

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

export function ClientPublisherPage({
  publisher: initialPublisher,
  coverImageUrl,
  publisherImageUrl,
  params,
  followers = [],
  followersCount = 0,
  books = [],
  booksCount = 0,
}: ClientPublisherPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tabs: TabConfig[] = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'about', label: 'About' },
    { id: 'books', label: 'Books' },
    { id: 'followers', label: 'Followers' },
    { id: 'photos', label: 'Photos' },
    { id: 'more', label: 'More' },
  ]
  const tabIds = tabs.map((t) => t.id)
  const activeTab = tabIds.includes(tabParam || '') ? tabParam! : tabs[0].id
  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.replace(`?${params.toString()}`)
  }
  const [publisher, setPublisher] = useState(initialPublisher)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Function to refresh publisher data
  const refreshPublisherData = async () => {
    setRefreshing(true)
    try {
      const response = await fetch(`/api/publishers/${params.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch publisher data')
      }
      const updatedPublisher = await response.json()
      setPublisher(updatedPublisher)
    } catch (error) {
      console.error('Error refreshing publisher data:', error)
      toast({
        title: 'Error',
        description: 'Failed to refresh publisher data',
        variant: 'destructive',
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Configure tabs for the EntityHeader
  const publisherStats = [
    {
      icon: <BookOpen className="h-4 w-4 mr-1" />,
      text: `${booksCount} books published`,
    },
    {
      icon: <Users className="h-4 w-4 mr-1" />,
      text: `${followersCount} followers`,
    },
  ]

  // Extract location information
  const location =
    publisher?.state && publisher?.country_details?.code
      ? `${publisher.state}, ${publisher.country_details.code}`
      : publisher?.state ||
        publisher?.country ||
        (publisher?.country_details ? publisher.country_details.name : '')

  // Mock data for the profile
  const mockName = publisher?.name || 'Jane Reader'
  const mockUsername = publisher?.name
    ? publisher.name.replace(/\s+/g, '').toLowerCase()
    : 'janereader'
  const mockBooksRead = 127
  const mockFriendsCount = followersCount || 248
  const mockLocation = 'Portland, OR'
  const mockWebsite = mockUsername + '.com'
  const mockAbout =
    'Book lover, coffee addict, and aspiring writer. I read mostly fantasy, sci-fi, and literary fiction.'
  const mockJoinedDate = 'March 2020'

  // Mock currently reading books
  const mockCurrentlyReading = [
    {
      title: 'The Name of the Wind',
      author: 'Patrick Rothfuss',
      progress: 65,
      coverUrl: '/placeholder.svg?height=240&width=160',
    },
    {
      title: 'Project Hail Mary',
      author: 'Andy Weir',
      progress: 23,
      coverUrl: '/placeholder.svg?height=240&width=160',
    },
  ]

  // Mock photos
  const mockPhotos = [
    '/placeholder.svg?height=300&width=300',
    '/placeholder.svg?height=300&width=300',
    '/placeholder.svg?height=300&width=300',
    '/placeholder.svg?height=300&width=300',
    '/placeholder.svg?height=300&width=300',
    '/placeholder.svg?height=300&width=300',
    '/placeholder.svg?height=300&width=300',
    '/placeholder.svg?height=300&width=300',
    '/placeholder.svg?height=300&width=300',
  ]

  // Mock friends
  const mockFriends = [
    { id: '1', name: 'Alex Thompson', avatar: '/placeholder.svg?height=100&width=100' },
    { id: '2', name: 'Maria Garcia', avatar: '/placeholder.svg?height=100&width=100' },
    { id: '3', name: 'James Wilson', avatar: '/placeholder.svg?height=100&width=100' },
    { id: '4', name: 'Emma Davis', avatar: '/placeholder.svg?height=100&width=100' },
    { id: '5', name: 'Michael Brown', avatar: '/placeholder.svg?height=100&width=100' },
    { id: '6', name: 'Sophia Martinez', avatar: '/placeholder.svg?height=100&width=100' },
    { id: '7', name: 'Daniel Lee', avatar: '/placeholder.svg?height=100&width=100' },
    { id: '8', name: 'Olivia Johnson', avatar: '/placeholder.svg?height=100&width=100' },
    { id: '9', name: 'William Smith', avatar: '/placeholder.svg?height=100&width=100' },
  ]

  // Mock activities
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

  // Mock data for friends tab
  const mockFriendsTabData = [
    {
      id: '1',
      name: 'Alex Thompson',
      avatar: '/placeholder.svg?height=100&width=100',
      location: 'Seattle, WA',
      mutualFriends: 15,
    },
    {
      id: '2',
      name: 'Maria Garcia',
      avatar: '/placeholder.svg?height=100&width=100',
      location: 'Portland, OR',
      mutualFriends: 8,
    },
    {
      id: '3',
      name: 'James Wilson',
      avatar: '/placeholder.svg?height=100&width=100',
      location: 'San Francisco, CA',
      mutualFriends: 12,
    },
    {
      id: '4',
      name: 'Emma Davis',
      avatar: '/placeholder.svg?height=100&width=100',
      location: 'Chicago, IL',
      mutualFriends: 5,
    },
    {
      id: '5',
      name: 'Michael Brown',
      avatar: '/placeholder.svg?height=100&width=100',
      location: 'New York, NY',
      mutualFriends: 10,
    },
    {
      id: '6',
      name: 'Sophia Martinez',
      avatar: '/placeholder.svg?height=100&width=100',
      location: 'Los Angeles, CA',
      mutualFriends: 7,
    },
    {
      id: '7',
      name: 'Daniel Lee',
      avatar: '/placeholder.svg?height=100&width=100',
      location: 'Boston, MA',
      mutualFriends: 9,
    },
    {
      id: '8',
      name: 'Olivia Johnson',
      avatar: '/placeholder.svg?height=100&width=100',
      location: 'Austin, TX',
      mutualFriends: 6,
    },
    {
      id: '9',
      name: 'William Smith',
      avatar: '/placeholder.svg?height=100&width=100',
      location: 'Denver, CO',
      mutualFriends: 11,
    },
  ]

  // Mock friend suggestions
  const mockFriendSuggestions = [
    {
      id: '101',
      name: 'Mark Johnson',
      avatar: '/placeholder.svg?height=100&width=100',
      mutualFriends: 12,
    },
    {
      id: '102',
      name: 'Sarah Williams',
      avatar: '/placeholder.svg?height=100&width=100',
      mutualFriends: 8,
    },
    {
      id: '103',
      name: 'David Chen',
      avatar: '/placeholder.svg?height=100&width=100',
      mutualFriends: 5,
    },
  ]

  // Mock photos tab data
  const mockPhotosTabData = [
    {
      id: '1',
      title: 'Reading at the park',
      date: 'June 15, 2023',
      url: '/placeholder.svg?height=300&width=300',
    },
    {
      id: '2',
      title: 'My bookshelf',
      date: 'May 22, 2023',
      url: '/placeholder.svg?height=300&width=300',
    },
    {
      id: '3',
      title: 'Book haul!',
      date: 'April 10, 2023',
      url: '/placeholder.svg?height=300&width=300',
    },
    {
      id: '4',
      title: 'Author signing event',
      date: 'March 5, 2023',
      url: '/placeholder.svg?height=300&width=300',
    },
    {
      id: '5',
      title: 'Reading nook',
      date: 'February 18, 2023',
      url: '/placeholder.svg?height=300&width=300',
    },
    {
      id: '6',
      title: 'Book club meeting',
      date: 'January 30, 2023',
      url: '/placeholder.svg?height=300&width=300',
    },
    {
      id: '7',
      title: 'Visiting the library',
      date: 'December 12, 2022',
      url: '/placeholder.svg?height=300&width=300',
    },
    {
      id: '8',
      title: 'New bookmarks',
      date: 'November 5, 2022',
      url: '/placeholder.svg?height=300&width=300',
    },
    {
      id: '9',
      title: 'Reading by the fireplace',
      date: 'October 22, 2022',
      url: '/placeholder.svg?height=300&width=300',
    },
    {
      id: '10',
      title: 'Book festival',
      date: 'September 17, 2022',
      url: '/placeholder.svg?height=300&width=300',
    },
    {
      id: '11',
      title: 'Author panel',
      date: 'August 8, 2022',
      url: '/placeholder.svg?height=300&width=300',
    },
    {
      id: '12',
      title: 'Book-themed cafe',
      date: 'July 24, 2022',
      url: '/placeholder.svg?height=300&width=300',
    },
  ]

  return (
    <div className="publisher-page publisher-page__container py-6">
      <EntityHeader
        entityType="publisher"
        name={publisher?.name || 'Publisher Name'}
        username={publisher?.name ? publisher.name.replace(/\s+/g, '').toLowerCase() : 'publisher'}
        coverImageUrl={coverImageUrl}
        profileImageUrl={publisherImageUrl}
        stats={publisherStats}
        location={location}
        website={publisher?.website}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isEditable={user && user.role === 'admin' ? true : undefined}
        entityId={publisher?.id}
        targetType="publisher"
        isMessageable={true}
      />

      {/* Conditionally render content based on active tab */}
      {activeTab === 'timeline' && (
        <div className="publisher-page__content">
          <div className="publisher-page__tab-content grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6 self-end sticky bottom-0">
              {/* About Section */}
              <TimelineAboutSection
                bio={publisher?.about || undefined}
                nationality={
                  publisher?.state ||
                  publisher?.country ||
                  (publisher?.country_details ? publisher.country_details.name : undefined)
                }
                website={publisher?.website || undefined}
                onViewMore={() => handleTabChange('about')}
                onViewFullDetails={() => handleTabChange('about')}
              />
              {/* Friends/Followers Section */}
              <FollowersList
                followers={followers}
                followersCount={followersCount}
                entityId={params.id}
                entityType="publisher"
                onViewMore={() => handleTabChange('followers')}
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
                  {mockCurrentlyReading.map((book, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="relative h-20 w-14 flex-shrink-0">
                        <img
                          src={book.coverUrl || '/placeholder.svg'}
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
                  <Link
                    href="/profile/janereader/photos"
                    className="text-sm text-primary hover:underline"
                  >
                    See All
                  </Link>
                </div>
                <CardContent className="p-6 pt-0">
                  <div className="grid grid-cols-3 gap-2">
                    {mockPhotos.map((photoUrl, index) => (
                      <div
                        key={index}
                        className="aspect-square relative rounded-sm overflow-hidden"
                      >
                        <img
                          src={photoUrl || '/placeholder.svg'}
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
              {/* Activity Feed */}
              <div className="space-y-6">
                <EnterpriseTimelineActivities
                  entityId={params.id}
                  entityType="publisher"
                  isOwnEntity={user && user.role === 'admin' ? true : undefined}
                  entityDisplayInfo={
                    publisher
                      ? {
                          id: params.id,
                          name: publisher.name,
                          type: 'publisher' as const,
                          bookCount: booksCount || 0,
                        }
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="publisher-page__tab-content grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <AboutNavigation publisherId={publisher?.id} />
          </div>
          <div className="lg:col-span-2">
            <OverviewSection publisher={publisher} onRefresh={refreshPublisherData} />
            <ContactSection publisher={publisher} onRefresh={refreshPublisherData} />
            <LocationSection publisher={publisher} onRefresh={refreshPublisherData} />
            <BooksSection
              books={books}
              booksCount={booksCount}
              onViewAllBooks={() => handleTabChange('books')}
            />
          </div>
        </div>
      )}

      {activeTab === 'books' && (
        <div className="publisher-page__tab-content">
          <Card className="rounded-lg border bg-card text-card-foreground shadow-xs">
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
                  <p className="mt-1 text-sm text-muted-foreground">
                    This publisher hasn't published any books yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'followers' && (
        <div className="publisher-page__tab-content space-y-6">
          <FollowersListTab
            followers={followers}
            followersCount={followersCount}
            entityId={params.id}
            entityType="publisher"
          />
        </div>
      )}

      {activeTab === 'photos' && (
        <div className="publisher-page__tab-content space-y-6">
          <EntityPhotoAlbums
            entityId={params.id}
            entityType="publisher"
            isOwnEntity={user && user.role === 'admin' ? true : undefined}
            entityDisplayInfo={
              publisher
                ? {
                    id: params.id,
                    name: publisher.name,
                    type: 'publisher' as const,
                    publisher_image: publisher.publisher_image,
                    bookCount: booksCount || 0,
                  }
                : undefined
            }
          />
        </div>
      )}

      {activeTab === 'more' && (
        <div className="publisher-page__tab-content grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="publisher-groups__card rounded-lg border bg-card text-card-foreground shadow-xs">
            <div className="publisher-groups__header flex items-center justify-between p-6">
              <h2 className="publisher-groups__title text-2xl font-semibold leading-none tracking-tight">
                Groups
              </h2>
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
                <Button
                  variant="outline"
                  className="publisher-groups__view-button h-9 rounded-md px-3"
                >
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
                  <h3 className="publisher-groups__name font-medium truncate">
                    Science Fiction Readers
                  </h3>
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
                <Button
                  variant="outline"
                  className="publisher-groups__view-button h-9 rounded-md px-3"
                >
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
                  <h3 className="publisher-groups__name font-medium truncate">
                    Portland Book Lovers
                  </h3>
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
                <Button
                  variant="outline"
                  className="publisher-groups__view-button h-9 rounded-md px-3"
                >
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
                  <h3 className="publisher-groups__name font-medium truncate">
                    Women Writers Book Club
                  </h3>
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
                <Button
                  variant="outline"
                  className="publisher-groups__view-button h-9 rounded-md px-3"
                >
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
                  <h3 className="publisher-groups__name font-medium truncate">
                    Literary Fiction Fans
                  </h3>
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
                <Button
                  variant="outline"
                  className="publisher-groups__view-button h-9 rounded-md px-3"
                >
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
                  <h3 className="publisher-groups__name font-medium truncate">
                    Classic Literature Society
                  </h3>
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
                <Button
                  variant="outline"
                  className="publisher-groups__view-button h-9 rounded-md px-3"
                >
                  View
                </Button>
              </div>
              <Button className="publisher-groups__find-more h-10 px-4 py-2 w-full">
                <Users className="h-4 w-4 mr-2" />
                Find More Groups
              </Button>
            </div>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-xs">
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
  )
}
