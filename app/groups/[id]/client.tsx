'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { EntityHeader, TabConfig } from '@/components/entity-header'
import { FollowersList } from '@/components/followers-list'
import { PhotosList } from '@/components/photos-list'
import { Timeline, TimelineItem } from '@/components/timeline'
import { FollowButton } from '@/components/follow-button'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/utils/dateUtils'
import { canUserEditEntity } from '@/lib/auth-utils'
import type { Group } from '@/types/group'
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
  Settings,
  MessageCircle,
  Activity,
} from 'lucide-react'
import { EntityPhotoAlbums } from '@/components/user-photo-albums'
import EnterpriseTimelineActivities from '@/components/enterprise/enterprise-timeline-activities-optimized'
import { ContentSection } from '@/components/ui/content-section'
import { UserListLayout } from '@/components/ui/user-list-layout'
import Link from 'next/link'

interface Follower {
  id: string
  name: string
  avatar_url?: string | null
  username?: string
}

interface GroupMember {
  user_id: string
  status: string
  joined_at: string
  user: {
    id: string
    name: string
    email: string
    avatar_url: string | null
  }
}

interface GroupBook {
  id: string
  title: string
  cover_image_url?: string
}

interface GroupDiscussion {
  id: string
  title: string
  content: string
  created_at: string
  user_id: string
  user: {
    id: string
    name: string
    email: string
    avatar_url: string | null
  }
}

interface GroupActivity {
  id: string
  activity_type: string
  created_at: string
  data: any
  user_id: string
  user: {
    id: string
    name: string
    email: string
    avatar_url: string | null
  }
}

interface ClientGroupPageProps {
  group: Group
  groupImageUrl: string | null
  coverImageUrl: string | null
  params: { id: string }
  followers: Follower[]
  followersCount: number
  members: GroupMember[]
  membersCount: number
  books: GroupBook[]
  booksCount: number
  discussions: GroupDiscussion[]
  activities: GroupActivity[]
  currentUser: any
}

export function ClientGroupPage({
  group,
  groupImageUrl,
  coverImageUrl,
  params,
  followers = [],
  followersCount = 0,
  members = [],
  membersCount = 0,
  books = [],
  booksCount = 0,
  discussions = [],
  activities = [],
  currentUser,
}: ClientGroupPageProps) {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  // State management
  const [activeTab, setActiveTab] = useState('timeline')
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoadingFollow, setIsLoadingFollow] = useState(false)
  const [canEdit, setCanEdit] = useState(false)

  // Tab configuration
  const validTabs: TabConfig[] = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'about', label: 'About' },
    { id: 'books', label: 'Books' },
    { id: 'members', label: 'Members' },
    { id: 'discussions', label: 'Discussions' },
    { id: 'followers', label: 'Followers' },
    { id: 'photos', label: 'Photos' },
  ]

  // Handle tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    router.push(`/groups/${params.id}?tab=${tabId}`)
  }

  // Initialize tab from URL
  useEffect(() => {
    const tabParam = searchParams?.get('tab')
    const validTabIds = validTabs.map((t) => t.id)
    if (tabParam && validTabIds.includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams, validTabs])

  // Check permissions and follow status
  useEffect(() => {
    const checkPermissions = async () => {
      if (user && group) {
        const isCreator = user.id === group.created_by
        const hasEditPermission = await canUserEditEntity(user.id, 'group', group.id)
        setCanEdit(isCreator || hasEditPermission)
      }
    }

    const checkFollowStatus = async () => {
      if (user && group) {
        try {
          const { getGroupFollowStatus } = await import('@/app/actions/groups/get-follow-status')
          const result = await getGroupFollowStatus(group.id, user.id)
          if (result.success) {
            setIsFollowing(result.isFollowing || false)
          }
        } catch (error) {
          console.error('Error checking follow status:', error)
        }
      }
    }

    checkPermissions()
    checkFollowStatus()
  }, [user, group])

  // Group statistics
  const groupStats = [
    {
      icon: <Users className="h-4 w-4 mr-1" />,
      text: `${membersCount} members`,
    },
    {
      icon: <BookOpen className="h-4 w-4 mr-1" />,
      text: `${booksCount} books`,
    },
    {
      icon: group.is_private ? (
        <Info className="h-4 w-4 mr-1" />
      ) : (
        <Globe className="h-4 w-4 mr-1" />
      ),
      text: group.is_private ? 'Private' : 'Public',
    },
  ]

  // Handle follow action
  const handleFollow = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to follow this group.',
        variant: 'destructive',
      })
      return
    }

    setIsLoadingFollow(true)
    try {
      // Implement follow logic here
      setIsFollowing(!isFollowing)
      toast({
        title: isFollowing ? 'Unfollowed' : 'Following',
        description: isFollowing
          ? "You've unfollowed this group."
          : "You're now following this group.",
      })
    } catch (error) {
      console.error('Error following group:', error)
      toast({
        title: 'Error',
        description: 'Failed to follow group. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingFollow(false)
    }
  }

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'timeline':
        return (
          <div className="group-page__timeline-tab">
            <div className="group-page__tab-content grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Sidebar */}
              <div className="group-page__sidebar lg:col-span-1 space-y-6 self-end sticky bottom-0">
                {/* About Section */}
                <ContentSection
                  title="About"
                  onViewMore={() => handleTabChange('about')}
                  className="group-page__about-section"
                >
                  <div className="space-y-2">
                    {group.description ? (
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {group.description}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No description available.</p>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Info className="h-4 w-4 mr-2" />
                      <span>{group.is_private ? 'Private Group' : 'Public Group'}</span>
                    </div>
                  </div>
                </ContentSection>

                {/* Followers Section */}
                <FollowersList
                  followers={followers || []}
                  followersCount={followersCount}
                  entityId={group.id}
                  entityType="group"
                  onViewMore={() => handleTabChange('followers')}
                  className="group-page__followers-section"
                />
              </div>

              {/* Main Content Area */}
              <div className="group-page__main-content lg:col-span-2 space-y-6">
                <EnterpriseTimelineActivities
                  entityId={group.id}
                  entityType="group"
                  isOwnEntity={canEdit}
                  entityDisplayInfo={{
                    id: group.id,
                    name: group.name,
                    type: 'group' as const,
                  }}
                />
              </div>
            </div>
          </div>
        )
      case 'about':
        return (
          <div className="group-page__about-tab">
            <div className="group-page__tab-content space-y-6">
              <AboutSection group={group} />
            </div>
          </div>
        )
      case 'books':
        return (
          <div className="group-page__books-tab">
            <div className="group-page__tab-content space-y-6">
              <BooksSection books={books} />
            </div>
          </div>
        )
      case 'members':
        return (
          <div className="group-page__members-tab">
            <div className="group-page__tab-content space-y-6">
              <MembersSection members={members} membersCount={membersCount} />
            </div>
          </div>
        )
      case 'discussions':
        return (
          <div className="group-page__discussions-tab">
            <div className="group-page__tab-content space-y-6">
              <DiscussionsSection discussions={discussions} groupId={group.id} />
            </div>
          </div>
        )
      case 'followers':
        return (
          <div className="group-page__followers-tab">
            <div className="group-page__tab-content space-y-6">
              <FollowersList
                followers={followers || []}
                followersCount={followersCount}
                entityId={group.id}
                entityType="group"
                onViewMore={() => handleTabChange('followers')}
              />
            </div>
          </div>
        )
      case 'photos':
        return (
          <div className="group-page__photos-tab">
            <div className="group-page__tab-content space-y-6">
              <EntityPhotoAlbums entityId={group.id} entityType="group" isOwnEntity={canEdit} />
            </div>
          </div>
        )
      default:
        return (
          <div className="group-page__timeline-tab">
            <div className="group-page__tab-content grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Sidebar */}
              <div className="group-page__sidebar lg:col-span-1 space-y-6 self-end sticky bottom-0">
                {/* About Section */}
                <ContentSection
                  title="About"
                  onViewMore={() => handleTabChange('about')}
                  className="group-page__about-section"
                >
                  <div className="space-y-2">
                    {group.description ? (
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {group.description}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No description available.</p>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Info className="h-4 w-4 mr-2" />
                      <span>{group.is_private ? 'Private Group' : 'Public Group'}</span>
                    </div>
                  </div>
                </ContentSection>

                {/* Followers Section */}
                <FollowersList
                  followers={followers || []}
                  followersCount={followersCount}
                  entityId={group.id}
                  entityType="group"
                  onViewMore={() => handleTabChange('followers')}
                  className="group-page__followers-section"
                />
              </div>

              {/* Main Content Area */}
              <div className="group-page__main-content lg:col-span-2 space-y-6">
                <EnterpriseTimelineActivities
                  entityId={group.id}
                  entityType="group"
                  isOwnEntity={canEdit}
                  entityDisplayInfo={{
                    id: group.id,
                    name: group.name,
                    type: 'group' as const,
                  }}
                />
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="group-page group-page__container py-4">
      <EntityHeader
        entityType="group"
        name={group.name}
        coverImageUrl={coverImageUrl || ''}
        profileImageUrl={groupImageUrl || ''}
        stats={groupStats}
        isEditable={canEdit}
        onFollow={handleFollow}
        isFollowing={isFollowing}
        tabs={validTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        entityId={group.id}
        targetType="group"
        description={group.description ?? undefined}
        group={{
          id: group.id,
          name: group.name,
          group_image: groupImageUrl ? { url: groupImageUrl } : undefined,
          member_count: membersCount,
          is_private: group.is_private,
        }}
        isMessageable={true}
      />

      <div className="group-page__content">{renderContent()}</div>
    </div>
  )
}

// Tab content components
const GroupTimeline = ({ activities }: { activities: GroupActivity[] }) => {
  const timelineItems: TimelineItem[] = activities.map((activity) => ({
    id: activity.id,
    avatarUrl: activity.user?.avatar_url || undefined,
    name: activity.user?.name || 'System',
    timestamp: formatDate(activity.created_at),
    content: (
      <div>
        <p className="font-semibold">{activity.activity_type.replace(/_/g, ' ')}</p>
        {activity.data?.bookTitle && <p>Book: {activity.data.bookTitle}</p>}
        {activity.data?.discussionTitle && <p>Discussion: {activity.data.discussionTitle}</p>}
      </div>
    ),
    actions: true,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Group Activity</h2>
      </div>
      {activities.length > 0 ? (
        <Timeline items={timelineItems} />
      ) : (
        <Card>
          <CardContent className="p-4 text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activity yet. Be the first to start something!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

const AboutSection = ({ group }: { group: Group }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">About</h2>
    </div>

    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Description</h3>
            <p className="text-muted-foreground">
              {group.description || 'No description available.'}
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Group Type</h4>
              <p className="text-sm text-muted-foreground">
                {group.is_private ? 'Private Group' : 'Public Group'}
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Created</h4>
              <p className="text-sm text-muted-foreground">{formatDate(group.created_at)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)

const BooksSection = ({ books }: { books: GroupBook[] }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">Group Books</h2>
    </div>

    {books.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {books.map((book) => (
          <Card key={book.id} className="overflow-hidden">
            <div className="aspect-[3/4] relative">
              <img
                src={book.cover_image_url || '/placeholder.svg?height=300&width=200'}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm line-clamp-2">{book.title}</h3>
            </CardContent>
          </Card>
        ))}
      </div>
    ) : (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          <Book className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No books added to this group yet.</p>
        </CardContent>
      </Card>
    )}
  </div>
)

const MembersSection = ({
  members,
  membersCount,
}: {
  members: GroupMember[]
  membersCount: number
}) => {
  // Transform members to match the format expected by UserListLayout
  const membersForList = members.map((member) => ({
    id: member.user.id,
    name: member.user.name,
    email: member.user.email,
    avatar_url: member.user.avatar_url,
    joined_at: member.joined_at,
    followSince: member.joined_at, // For sorting compatibility (UserListLayout sorts by followSince or friendshipDate)
    friendshipDate: member.joined_at, // For sorting compatibility
  }))

  const sortOptions = [
    { value: 'recent', label: 'Recently Joined' },
    { value: 'oldest', label: 'Oldest Members' },
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
  ]

  return (
    <UserListLayout
      title={`Members · ${membersCount}`}
      items={membersForList}
      searchPlaceholder="Search members..."
      sortOptions={sortOptions}
      defaultSort="recent"
      emptyMessage="No members yet"
      emptySearchMessage="No members found matching your search"
      renderItem={(member) => (
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar src={member.avatar_url || undefined} name={member.name || 'User'} size="sm" />
            <div className="flex-1 min-w-0">
              <Link
                href={`/profile/${member.id}`}
                className="font-medium text-sm truncate block hover:underline"
              >
                {member.name || member.email}
              </Link>
              <p className="text-xs text-muted-foreground">Joined {formatDate(member.joined_at)}</p>
            </div>
          </div>
        </Card>
      )}
    />
  )
}

const DiscussionsSection = ({
  discussions,
  groupId,
}: {
  discussions: GroupDiscussion[]
  groupId: string
}) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">Discussions</h2>
      <Button>
        <MessageCircle className="h-4 w-4 mr-2" />
        Start Discussion
      </Button>
    </div>

    {discussions.length > 0 ? (
      <div className="space-y-4">
        {discussions.map((discussion) => (
          <Card key={discussion.id} className="p-4">
            <div className="flex items-start space-x-3">
              <Avatar
                src={discussion.user.avatar_url || undefined}
                name={discussion.user.name || 'User'}
                size="sm"
                className="h-8 w-8"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="font-medium text-sm">{discussion.user.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(discussion.created_at)}
                  </span>
                </div>
                <h3 className="font-semibold text-sm mb-2">{discussion.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{discussion.content}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    ) : (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No discussions yet. Start the conversation!</p>
        </CardContent>
      </Card>
    )}
  </div>
)
