"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { EntityHeader, TabConfig } from "@/components/entity-header"
import { FollowersList } from "@/components/followers-list"
import { PhotosList } from "@/components/photos-list"
import { Timeline, TimelineItem } from "@/components/timeline"
import { FollowButton } from '@/components/follow-button'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from "@/utils/dateUtils"
import { canUserEditEntity } from '@/lib/auth-utils'
import type { Group } from "@/types/group"
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
  Activity
} from "lucide-react"
import { EntityPhotoAlbums } from '@/components/user-photo-albums'
import EnterpriseTimelineActivities from '@/components/enterprise-timeline-activities'

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
  currentUser
}: ClientGroupPageProps) {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  // State management
  const [activeTab, setActiveTab] = useState("timeline")
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
    const validTabIds = validTabs.map(t => t.id)
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
          // Check if user is following this group
          // This would typically involve a database call
          setIsFollowing(false) // Placeholder
        } catch (error) {
          console.error("Error checking follow status:", error)
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
      text: `${membersCount} members`
    },
    {
      icon: <BookOpen className="h-4 w-4 mr-1" />,
      text: `${booksCount} books`
    },
    {
      icon: group.is_private ? <Info className="h-4 w-4 mr-1" /> : <Globe className="h-4 w-4 mr-1" />,
      text: group.is_private ? "Private" : "Public"
    }
  ]

  // Handle follow action
  const handleFollow = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to follow this group.",
        variant: "destructive"
      })
      return
    }

    setIsLoadingFollow(true)
    try {
      // Implement follow logic here
      setIsFollowing(!isFollowing)
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing ? "You've unfollowed this group." : "You're now following this group."
      })
    } catch (error) {
      console.error("Error following group:", error)
      toast({
        title: "Error",
        description: "Failed to follow group. Please try again.",
        variant: "destructive"
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
          <div className="space-y-6">
            <EnterpriseTimelineActivities
              entityId={group.id}
              entityType="group"
              isOwnEntity={canEdit}
              entityDisplayInfo={{
                id: group.id,
                name: group.name,
                type: 'group' as const,
                group_image: groupImageUrl ? { url: groupImageUrl } : undefined,
                member_count: membersCount,
                is_private: group.is_private
              }}
            />
          </div>
        )
      case 'about':
        return <AboutSection group={group} />
      case 'books':
        return <BooksSection books={books} />
      case 'members':
        return <MembersSection members={members} />
      case 'discussions':
        return <DiscussionsSection discussions={discussions} groupId={group.id} />
      case 'followers':
        return <FollowersList followers={followers || []} followersCount={followersCount} entityId={group.id} entityType="group" />
      case 'photos':
        return (
          <div className="space-y-6">
            <EntityPhotoAlbums
              entityId={group.id}
              entityType="group"
              isOwnEntity={canEdit}
            />
          </div>
        )
      default:
        return (
          <div className="space-y-6">
            <EnterpriseTimelineActivities
              entityId={group.id}
              entityType="group"
              isOwnEntity={canEdit}
              entityDisplayInfo={{
                id: group.id,
                name: group.name,
                type: 'group' as const,
                group_image: groupImageUrl ? { url: groupImageUrl } : undefined,
                member_count: membersCount,
                is_private: group.is_private
              }}
            />
          </div>
        )
    }
  }

  return (
    <div className="w-full">
      <EntityHeader
        entityType="group"
        name={group.name}
        coverImageUrl={coverImageUrl || ""}
        profileImageUrl={groupImageUrl || ""}
        stats={groupStats}
        isEditable={canEdit}
        onFollow={handleFollow}
        isFollowing={isFollowing}
        tabs={validTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        entityId={group.id}
        targetType="group"
        description={group.description}
        group={{
          id: group.id,
          name: group.name,
          group_image: groupImageUrl ? { url: groupImageUrl } : undefined,
          member_count: membersCount,
          is_private: group.is_private
        }}
      >
        <FollowButton entityId={group.id} targetType="group" />
        <Button variant="outline" className="ml-2">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite
        </Button>
      </EntityHeader>

      <main className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  )
}

// Tab content components
const GroupTimeline = ({ activities }: { activities: GroupActivity[] }) => {
  const timelineItems: TimelineItem[] = activities.map(activity => ({
    id: activity.id,
    avatarUrl: activity.user?.avatar_url,
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
          <CardContent className="p-6 text-center text-muted-foreground">
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
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Description</h3>
            <p className="text-muted-foreground">
              {group.description || "No description available."}
            </p>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Group Type</h4>
              <p className="text-sm text-muted-foreground">
                {group.is_private ? "Private Group" : "Public Group"}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Created</h4>
              <p className="text-sm text-muted-foreground">
                {formatDate(group.created_at)}
              </p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map((book) => (
          <Card key={book.id} className="overflow-hidden">
            <div className="aspect-[3/4] relative">
              <img
                src={book.cover_image_url || "/placeholder.svg?height=300&width=200"}
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
        <CardContent className="p-6 text-center text-muted-foreground">
          <Book className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No books added to this group yet.</p>
        </CardContent>
      </Card>
    )}
  </div>
)

const MembersSection = ({ members }: { members: GroupMember[] }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">Members</h2>
    </div>
    
    {members.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <Card key={member.user_id} className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={member.user.avatar_url || undefined} />
                <AvatarFallback>
                  {member.user.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {member.user.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Joined {formatDate(member.joined_at)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    ) : (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No members yet.</p>
        </CardContent>
      </Card>
    )}
  </div>
)

const DiscussionsSection = ({ discussions, groupId }: { discussions: GroupDiscussion[], groupId: string }) => (
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
              <Avatar className="h-8 w-8">
                <AvatarImage src={discussion.user.avatar_url || undefined} />
                <AvatarFallback>
                  {discussion.user.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="font-medium text-sm">
                    {discussion.user.name}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(discussion.created_at)}
                  </span>
                </div>
                <h3 className="font-semibold text-sm mb-2">{discussion.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {discussion.content}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    ) : (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No discussions yet. Start the conversation!</p>
        </CardContent>
      </Card>
    )}
  </div>
) 