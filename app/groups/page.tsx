'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Users,
  Plus,
  Search,
  Filter,
  Star,
  Globe,
  Lock,
  BookOpen,
  TrendingUp,
  Award,
  Calendar,
  MessageSquare,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  getGroupCategories,
  getActivityLevelDefinitions,
} from '@/app/actions/groups/get-group-constants'
import { calculateMultipleGroupActivityLevels } from '@/app/actions/groups/calculate-activity-level'
import { CategorySelect } from '@/components/groups/CategorySelect'
import { ActivityLevelSelect } from '@/components/groups/ActivityLevelSelect'
import type {
  GroupCategory,
  ActivityLevelDefinition,
} from '@/app/actions/groups/get-group-constants'

interface Group {
  id: string
  name: string
  description: string | null
  member_count: number
  created_at: string
  is_private: boolean
  created_by: string
  cover_image_id?: number | null
  cover_image?: { url: string } | null
  // Optional properties for future enhancement
  is_discoverable?: boolean
  is_verified?: boolean
  category?: string | null
  tags?: string[]
  featured?: boolean
  activity_level?: string
  creator_name?: string
  creator_username?: string
  recent_activity_count?: number
  total_posts?: number
  activity_status?: string
}

// Constants moved to database - fetched via server actions

export default function GroupsPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [featuredGroups, setFeaturedGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('discover')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedActivity, setSelectedActivity] = useState('all')
  const [sortBy, setSortBy] = useState('recent')

  // Constants from database (single source of truth)
  const [categories, setCategories] = useState<GroupCategory[]>([])
  const [activityLevels, setActivityLevels] = useState<ActivityLevelDefinition[]>([])
  const [constantsLoading, setConstantsLoading] = useState(true)

  // Activity level cache for groups
  const [groupActivityLevels, setGroupActivityLevels] = useState<
    Record<string, { levelKey: string; activityCount: number }>
  >({})

  // Create group state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    is_private: false,
    category: '',
  })
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Load constants from database on mount
  useEffect(() => {
    async function loadConstants() {
      setConstantsLoading(true)
      try {
        const [categoriesResult, activityLevelsResult] = await Promise.all([
          getGroupCategories(),
          getActivityLevelDefinitions(),
        ])

        if (categoriesResult.success && categoriesResult.categories) {
          setCategories(categoriesResult.categories)
        }

        if (activityLevelsResult.success && activityLevelsResult.definitions) {
          setActivityLevels(activityLevelsResult.definitions)
        }
      } catch (error) {
        console.error('Error loading constants:', error)
      } finally {
        setConstantsLoading(false)
      }
    }

    loadConstants()
  }, [])

  useEffect(() => {
    loadGroups()
  }, [searchQuery, selectedCategory, selectedActivity, sortBy, activeTab])

  async function loadGroups() {
    try {
      setLoading(true)
      setError(null)

      // Check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/groups')
        return
      }

      // First, test if we can access groups table at all
      console.log('Testing basic groups table access...')
      const { data: testData, error: testError } = await supabase
        .from('groups')
        .select('id, name')
        .limit(1)

      if (testError) {
        console.error('Basic table access failed:', testError)
        throw new Error(`Cannot access groups table: ${testError.message || 'Unknown error'}`)
      }

      console.log('Basic table access successful. Found groups:', testData?.length || 0)

      // If no groups exist, create a sample one
      if (!testData || testData.length === 0) {
        console.log('No groups found, creating sample group...')
        const { error: insertError } = await supabase.from('groups').insert({
          name: 'Book Lovers Community',
          description: 'A place for book enthusiasts to share and discuss their favorite reads.',
          is_private: false,
          created_by: user.id,
          member_count: 1,
        })

        if (insertError) {
          console.error('Failed to create sample group:', insertError)
        } else {
          console.log('Sample group created successfully')
        }
      }

      // Build the base query - use basic columns that definitely exist
      // Optional columns (category, featured, is_verified) will be added after migrations are run
      let query = supabase.from('groups').select(`
          id,
          name,
          description,
          member_count,
          created_at,
          is_private,
          created_by,
          cover_image_id,
          cover_image:images!cover_image_id(url)
        `)

      // Track if optional columns exist (will be set if query with optional columns succeeds)
      const hasOptionalColumns = false

      // Apply filters based on tab
      if (activeTab === 'discover') {
        query = query.eq('is_private', false)
      } else if (activeTab === 'featured') {
        if (hasOptionalColumns) {
          query = query.eq('featured', true).eq('is_private', false)
        } else {
          // If featured column doesn't exist, show all public groups as fallback
          query = query.eq('is_private', false)
        }
      } else if (activeTab === 'my-groups') {
        // For my groups, we'll need to join with group_members
        // For now, show groups created by the user
        query = query.eq('created_by', user.id)
      }

      // Apply category filter (only if category column exists)
      if (selectedCategory && selectedCategory !== 'all' && hasOptionalColumns) {
        query = query.eq('category', selectedCategory)
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(
          `name.ilike.%${searchQuery.trim()}%,description.ilike.%${searchQuery.trim()}%`
        )
      }

      // Apply sorting
      switch (sortBy) {
        case 'recent':
          query = query.order('created_at', { ascending: false })
          break
        case 'popular':
          query = query.order('member_count', { ascending: false })
          break
        case 'alphabetical':
          query = query.order('name', { ascending: true })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      query = query.limit(50)

      console.log('Executing main groups query...')
      const { data, error: groupsError } = await query

      if (groupsError) {
        console.error('Supabase error details:', JSON.stringify(groupsError, null, 2))
        console.error('Error type:', typeof groupsError)
        console.error('Error keys:', Object.keys(groupsError || {}))

        // Try to extract meaningful error message
        let errorMessage = 'Database query failed'
        if (groupsError?.message) {
          errorMessage = groupsError.message
        } else if ((groupsError as any)?.error_description) {
          errorMessage = (groupsError as any).error_description
        } else if (groupsError?.details) {
          errorMessage = groupsError.details
        } else if (typeof groupsError === 'string') {
          errorMessage = groupsError
        }

        throw new Error(errorMessage)
      }

      console.log('Groups fetched successfully:', data?.length || 0)

      // Transform data to match Group interface (cover_image might be an array from join)
      let transformedData = (data || []).map((group: any) => ({
        ...group,
        cover_image: Array.isArray(group.cover_image) ? group.cover_image[0] : group.cover_image,
      }))

      // Calculate activity levels for all groups
      if (transformedData.length > 0) {
        const groupIds = transformedData.map((g) => g.id)
        const activityLevelsResult = await calculateMultipleGroupActivityLevels(groupIds)

        if (activityLevelsResult.success && activityLevelsResult.levels) {
          // Store activity levels in cache
          setGroupActivityLevels(activityLevelsResult.levels)

          // Add activity level to each group
          transformedData = transformedData.map((group) => ({
            ...group,
            activity_level: activityLevelsResult.levels![group.id]?.levelKey || 'inactive',
          }))
        }
      }

      // Filter by activity level if selected
      if (selectedActivity && selectedActivity !== 'all') {
        transformedData = transformedData.filter(
          (group) => group.activity_level === selectedActivity
        )
      }

      if (activeTab === 'featured') {
        setFeaturedGroups(transformedData as Group[])
      } else {
        setGroups(transformedData as Group[])
      }
    } catch (err: any) {
      console.error('Error loading groups:', err)
      setError(err.message || 'Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  function getGroupImageUrl(group: any): string | null {
    return group.cover_image?.url || null
  }

  function getActivityBadgeColor(activityStatus: string): string {
    switch (activityStatus) {
      case 'very_active':
        return 'bg-green-500'
      case 'active':
        return 'bg-blue-500'
      case 'moderate':
        return 'bg-yellow-500'
      case 'inactive':
        return 'bg-gray-500'
      default:
        return 'bg-gray-400'
    }
  }

  const GroupCard = ({ group }: { group: Group }) => {
    const imageUrl = getGroupImageUrl(group)

    return (
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group"
        onClick={() => router.push(`/groups/${group.id}`)}
      >
        {/* Group Image */}
        {imageUrl ? (
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={imageUrl}
              alt={group.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-200 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="h-48 w-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center relative">
            <Users className="h-16 w-16 text-muted-foreground" />
            {group.featured && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-amber-500 text-white">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Group Info */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="line-clamp-1 text-lg" title={group.name}>
                  {group.name}
                </CardTitle>
                {group.is_verified && (
                  <Badge variant="secondary" className="text-xs">
                    <Award className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              {group.category && (
                <Badge variant="outline" className="text-xs">
                  {group.category}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              {group.is_private ? (
                <Lock className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Globe className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-4">
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] mb-3">
            {group.description || 'No description available'}
          </p>

          {/* Tags */}
          {group.tags && group.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {group.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {group.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{group.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-3 border-t bg-muted/20">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{group.member_count || 0} members</span>
            </div>

            <div className="flex items-center gap-2">
              {group.activity_level && (
                <div className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${getActivityBadgeColor(group.activity_level)}`}
                  />
                  <span className="text-xs text-muted-foreground capitalize">
                    {group.activity_level.replace('_', ' ')}
                  </span>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {new Date(group.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    )
  }

  const LoadingSkeleton = () => (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-3" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-14" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-4 w-1/3" />
      </CardFooter>
    </Card>
  )

  const EmptyState = ({
    message,
    actionButton,
  }: {
    message: string
    actionButton?: React.ReactNode
  }) => (
    <div className="col-span-full text-center py-16">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <Users className="h-16 w-16" />
        <div>
          <h3 className="text-xl font-medium text-foreground mb-2">{message}</h3>
          <p className="text-sm max-w-md mx-auto">
            {searchQuery
              ? `No groups found matching "${searchQuery}"`
              : activeTab === 'my-groups'
                ? "You haven't joined or created any groups yet."
                : 'Discover amazing book communities and connect with fellow readers!'}
          </p>
        </div>
        {actionButton}
      </div>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Groups</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Join vibrant book communities, participate in reading challenges, and connect with
            fellow bibliophiles
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Create a new book community to share your reading journey and connect with fellow
                readers.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setCreateLoading(true)
                try {
                  const { createGroupWithValidation } =
                    await import('@/app/actions/groups/create-group-with-validation')
                  const result = await createGroupWithValidation({
                    name: newGroup.name,
                    description: newGroup.description || null,
                    is_private: newGroup.is_private,
                    category:
                      newGroup.category && newGroup.category !== 'all' ? newGroup.category : null,
                  })

                  if (result.success) {
                    setCreateDialogOpen(false)
                    setNewGroup({ name: '', description: '', is_private: false, category: '' })
                    await loadGroups()
                    if (result.group?.id) {
                      router.push(`/groups/${result.group.id}`)
                    }
                  } else {
                    setError(result.error || 'Failed to create group')
                  }
                } catch (err: any) {
                  setError(err.message || 'Failed to create group')
                } finally {
                  setCreateLoading(false)
                }
              }}
            >
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    className="col-span-3"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    className="col-span-3"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  />
                </div>
                {!constantsLoading && categories.length > 0 && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Category</Label>
                    <div className="col-span-3">
                      <CategorySelect
                        categories={categories}
                        value={newGroup.category || 'all'}
                        onChange={(value) => setNewGroup({ ...newGroup, category: value })}
                        label=""
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_private"
                    checked={newGroup.is_private}
                    onCheckedChange={(checked) => setNewGroup({ ...newGroup, is_private: checked })}
                  />
                  <Label htmlFor="is_private">Private Group</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false)
                    setNewGroup({ name: '', description: '', is_private: false, category: '' })
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createLoading || !newGroup.name.trim()}>
                  {createLoading ? 'Creating...' : 'Create Group'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="featured" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Featured
          </TabsTrigger>
          <TabsTrigger value="my-groups" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            My Groups
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Category Filter - Now functional with database-driven categories */}
          {!constantsLoading && (
            <CategorySelect
              categories={categories}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
          )}

          {/* Activity Level Filter - Now functional with database-driven definitions */}
          {!constantsLoading && (
            <ActivityLevelSelect
              activityLevels={activityLevels}
              value={selectedActivity}
              onChange={setSelectedActivity}
            />
          )}

          {/* Sort Filter */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="sort" className="text-sm">
              Sort By
            </Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              <Button variant="outline" size="sm" onClick={loadGroups} className="ml-4">
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Tab Content */}
        <TabsContent value="discover" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <LoadingSkeleton key={i} />)
            ) : groups.length === 0 ? (
              <EmptyState
                message="No groups found"
                actionButton={
                  !searchQuery &&
                  selectedCategory === 'all' && (
                    <Button onClick={() => setCreateDialogOpen(true)}>Create First Group</Button>
                  )
                }
              />
            ) : (
              groups.map((group) => <GroupCard key={group.id} group={group} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="featured" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <LoadingSkeleton key={i} />)
            ) : featuredGroups.length === 0 ? (
              <EmptyState message="No featured groups available" />
            ) : (
              featuredGroups.map((group) => <GroupCard key={group.id} group={group} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-groups" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <LoadingSkeleton key={i} />)
            ) : groups.length === 0 ? (
              <EmptyState
                message="You haven't joined any groups yet"
                actionButton={
                  <Button onClick={() => setActiveTab('discover')}>Discover Groups</Button>
                }
              />
            ) : (
              groups.map((group) => <GroupCard key={group.id} group={group} />)
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Load More Button */}
      {(groups.length >= 50 || featuredGroups.length >= 50) && (
        <div className="text-center">
          <Button variant="outline" onClick={loadGroups}>
            Load More Groups
          </Button>
        </div>
      )}
    </div>
  )
}
