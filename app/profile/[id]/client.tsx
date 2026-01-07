'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { EntityHeader } from '@/components/entity-header'
import { ContentSection } from '@/components/ui/content-section'
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
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { EntityPhotoAlbums } from '@/components/user-photo-albums'
import { FriendList } from '@/components/friend-list'
import { FollowersList } from '@/components/followers-list'
import { FollowersListTab } from '@/components/followers-list-tab'
import { TimelineActivities } from '@/components/timeline-activities'
import EnterpriseTimelineActivities from '@/components/enterprise/enterprise-timeline-activities-optimized'
import { BookCard } from '@/components/book-card'
import { EntityShelvesList } from '@/components/entity-shelves-list'
import { EntityAboutTab } from '@/components/entity/EntityAboutTab'
import { EntityMoreTab } from '@/components/entity/EntityMoreTab'
import { EntityMetadata } from '@/types/entity'
import { EntityTab } from '@/components/ui/entity-tabs'
import { ProfileBooksList } from '@/components/profile-books-list'

interface ClientProfilePageProps {
  user: any
  userStats: {
    booksRead: number
    friendsCount: number
    followersCount: number
    location: string | null
    website: string | null
    joinedDate: string
  }
  avatarUrl: string
  coverImageUrl: string
  followers?: any[]
  followersCount?: number
  friends?: any[]
  friendsCount?: number
  books?: any[]
  currentlyReadingBooks?: any[]
  params: {
    id: string
  }
}

export function ClientProfilePage({
  user,
  userStats,
  avatarUrl,
  coverImageUrl,
  followers = [],
  followersCount = 0,
  friends = [],
  friendsCount = 0,
  books = [],
  currentlyReadingBooks = [],
  params,
}: ClientProfilePageProps) {
  const { user: authUser } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('timeline')
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoadingFollow, setIsLoadingFollow] = useState(false)

  // Note: Permalink redirect is handled on the server side in page.tsx
  // No need for client-side redirect as the server already resolves permalinks to UUIDs

  // Set initial tab based on URL search parameters
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (
      tabParam &&
      ['timeline', 'about', 'books', 'shelves', 'friends', 'followers', 'photos', 'more'].includes(tabParam)
    ) {
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

  // Use real data from props
  const realName = user?.name || 'Unknown User'
  const realUsername = user?.permalink || user?.name?.split(' ').join('').toLowerCase() || 'user'
  const realBooksRead = userStats.booksRead
  const realFriendsCount = userStats.friendsCount
  const realFollowersCount = userStats.followersCount || 0
  const realLocation = userStats.location
  const realWebsite = userStats.website
  const realAbout =
    'Book lover, coffee addict, and aspiring writer. I read mostly fantasy, sci-fi, and literary fiction.'
  const realJoinedDate = userStats.joinedDate
    ? new Date(userStats.joinedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
    : 'Unknown'

  // Set up stats for the EntityHeader using real data
  const profileUrl = `/profile/${params.id}`
  const userStatsForHeader = [
    {
      icon: <BookOpen className="h-4 w-4 mr-1" />,
      text: `${realBooksRead} books read`,
      href: `${profileUrl}?tab=books`,
    },
    {
      icon: <Users className="h-4 w-4 mr-1" />,
      text: `${realFriendsCount} friends`,
      href: `${profileUrl}?tab=friends`,
    },
    {
      icon: <UserPlus className="h-4 w-4 mr-1" />,
      text: `${realFollowersCount} ${realFollowersCount === 1 ? 'follower' : 'followers'}`,
      href: `${profileUrl}?tab=followers`,
    },
  ]

  // Configure tabs for the profile using EntityTab interface
  const validTabs: EntityTab[] = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'about', label: 'About' },
    { id: 'books', label: 'Books' },
    { id: 'shelves', label: 'Shelves' },
    { id: 'friends', label: 'Friends' },
    { id: 'followers', label: `Followers (${realFollowersCount})` },
    { id: 'photos', label: 'Photos' },
    { id: 'more', label: 'More' },
  ]

  // Determine if the current user can edit this profile
  const canEdit =
    authUser &&
    (authUser.id === user.id ||
      (authUser as any)?.role === 'admin' ||
      (authUser as any)?.role === 'super_admin')

  return (
    <div className="profile-page">
      <EntityHeader
        entityType="user"
        name={realName}
        profileImageUrl={avatarUrl}
        coverImageUrl={coverImageUrl}
        stats={userStatsForHeader}
        tabs={validTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        entityId={user.id}
        targetType="user"
        userStats={userStats}
        isEditable={canEdit ? true : undefined}
        isMessageable={true}
      />

      <div className="profile-page__content">
        {activeTab === 'timeline' && (
          <div className="profile-page__timeline-tab mt-6">
            <div className="profile-page__tab-content grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Sidebar */}
              <div className="profile-page__sidebar lg:col-span-1 space-y-6 self-end sticky bottom-0">
                {/* About Section */}
                <ContentSection title="About">
                  <div className="space-y-4">
                    <p>{realAbout}</p>
                    <div className="space-y-2">
                      {realLocation && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Lives in {realLocation}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Joined {realJoinedDate}</span>
                      </div>
                      {realWebsite && (
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                          <a
                            href={
                              realWebsite.startsWith('http')
                                ? realWebsite
                                : `https://${realWebsite}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {realWebsite}
                          </a>
                        </div>
                      )}
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
                  {currentlyReadingBooks.length > 0 ? (
                    <div className="space-y-4">
                      {currentlyReadingBooks.slice(0, 3).map((book: any) => (
                        <Link key={book.id} href={`/books/${book.id}`} className="block">
                          <div className="flex gap-3">
                            <div className="relative h-20 w-14 flex-shrink-0">
                              <Image
                                src={book.coverImageUrl || '/placeholder.svg?height=80&width=56'}
                                alt={book.title}
                                fill
                                className="object-cover rounded-md"
                              />
                            </div>
                            <div className="flex-1 space-y-1">
                              <h4 className="font-medium line-clamp-1">{book.title}</h4>
                              {book.author && (
                                <p className="text-sm text-muted-foreground">by {book.author.name}</p>
                              )}
                              {book.progress_percentage != null && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span>Progress</span>
                                    <span>{book.progress_percentage}%</span>
                                  </div>
                                  <div className="relative w-full overflow-hidden rounded-full bg-secondary h-1.5">
                                    <div
                                      className="h-full w-full flex-1 bg-primary transition-all"
                                      style={{ transform: `translateX(-${100 - book.progress_percentage}%)` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No books currently being read
                    </p>
                  )}
                </ContentSection>

                {/* Photos Section */}
                <ContentSection
                  title="Photos"
                  onViewMore={() => setActiveTab('photos')}
                  viewMoreText="See All"
                >
                  <p className="text-sm text-muted-foreground text-center py-4">
                    View photos in the Photos tab
                  </p>
                </ContentSection>

                {/* Followers Section */}
                <FollowersList
                  followers={followers}
                  followersCount={followersCount}
                  entityId={user.id}
                  entityType="user"
                  onViewMore={() => setActiveTab('followers')}
                />
              </div>

              {/* Main Content Area */}
              <div className="profile-page__main-content lg:col-span-2 space-y-6">
                {/* Enterprise Timeline Activities - Only render when we have a valid UUID */}
                {/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id) ? (
                  <EnterpriseTimelineActivities
                    entityType="user"
                    entityId={user.id}
                    showAnalytics={true}
                    enableModeration={false}
                    enableAI={false}
                    enableAudit={false}
                    enableReadingProgress={true}
                    enablePrivacyControls={true}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Loading timeline...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="profile-page__about-tab mt-6">
            <div className="profile-page__tab-content">
              <EntityAboutTab
                entity={{
                  entityType: 'user',
                  entityId: user.id,
                  title: user.name,
                  bio: user.bio,
                  website: user.website,
                  contact: {
                    entity_type: 'user',
                    entity_id: user.id,
                    email: user.email,
                    phone: user.phone,
                  },
                  entityData: {
                    location: user.location,
                    occupation: user.occupation,
                  },
                  createdAt: user.created_at || new Date().toISOString(),
                  updatedAt: user.updated_at || new Date().toISOString(),
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'books' && (
          <div className="profile-page__books-tab mt-6">
            <div className="profile-page__tab-content">
              <ProfileBooksList
                books={books}
                title={`My Books (${realBooksRead})`}
                emptyMessage="No books yet"
                emptySearchMessage="No books found matching your search"
                showFilterStatus={true}
              />
            </div>
          </div>
        )}

        {activeTab === 'shelves' && (
          <div className="profile-page__shelves-tab mt-6">
            <div className="profile-page__tab-content">
              <EntityShelvesList
                profileOwnerId={user.id}
                profileOwnerName={user.name}
                profileOwnerPermalink={user.permalink}
                isOwnEntity={authUser?.id === params.id}
              />
            </div>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="profile-page__friends-tab mt-6">
            <div className="profile-page__tab-content">
              <FriendList
                userId={params.id}
                profileOwnerId={user.id}
                profileOwnerName={user.name}
                profileOwnerPermalink={user.permalink}
                initialFriends={friends}
                initialCount={friendsCount || userStats.friendsCount}
              />
            </div>
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="profile-page__followers-tab mt-6">
            <div className="profile-page__tab-content">
              <FollowersListTab
                followers={followers}
                followersCount={followersCount || userStats.followersCount}
                entityId={params.id}
                entityType="user"
                profileOwnerId={user.id}
                profileOwnerName={user.name}
                profileOwnerPermalink={user.permalink}
              />
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="profile-page__photos-tab mt-6">
            <div className="profile-page__tab-content space-y-6">
              <EntityPhotoAlbums
                entityId={params.id}
                entityType="user"
                isOwnEntity={authUser?.id === params.id}
              />
            </div>
          </div>
        )}

        {activeTab === 'more' && (
          <div className="mt-6">
            <EntityMoreTab
              entity={{
                entityType: 'user',
                entityId: params.id,
                title: user.name,
                bio: user.bio,
                createdAt: user.created_at || new Date().toISOString(),
                updatedAt: user.updated_at || new Date().toISOString(),
              }}
              isOwnEntity={authUser?.id === params.id}
            />
          </div>
        )}
      </div>
    </div>
  )
}
