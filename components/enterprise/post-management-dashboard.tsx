'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Post, PostVisibility, PostPublishStatus } from '@/types/post'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Filter, 
  Calendar, 
  BarChart3, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  Lock,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Plus,
  Download,
  Upload,
  Settings
} from 'lucide-react'
import PostEditor from './post-editor'
import PostManager from './post-manager'

interface PostManagementDashboardProps {
  className?: string
}

interface PostFilters {
  search: string
  visibility: PostVisibility | 'all'
  publishStatus: PostPublishStatus | 'all'
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year'
  contentType: string | 'all'
}

interface PostAnalytics {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  scheduledPosts: number
  totalViews: number
  totalLikes: number
  totalComments: number
  totalShares: number
  averageEngagement: number
  trendingPosts: number
}

export default function PostManagementDashboard({ className }: PostManagementDashboardProps) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [filters, setFilters] = useState<PostFilters>({
    search: '',
    visibility: 'all',
    publishStatus: 'all',
    dateRange: 'all',
    contentType: 'all'
  })
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPostEditor, setShowPostEditor] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [currentTab, setCurrentTab] = useState('overview')
  const [analytics, setAnalytics] = useState<PostAnalytics>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    scheduledPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    averageEngagement: 0,
    trendingPosts: 0
  })

  // Fetch posts from API
  const fetchPosts = useCallback(async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/posts?user_id=${user.id}&limit=100`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }
      
      const data = await response.json()
      setPosts(data.posts || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Calculate analytics from posts data
  const calculateAnalytics = useCallback((postsData: Post[]) => {
    const analytics: PostAnalytics = {
      totalPosts: postsData.length,
      publishedPosts: postsData.filter(p => p.publish_status === 'published').length,
      draftPosts: postsData.filter(p => p.publish_status === 'draft').length,
      scheduledPosts: postsData.filter(p => p.publish_status === 'scheduled').length,
      totalViews: postsData.reduce((sum, p) => sum + (p.view_count || 0), 0),
      totalLikes: postsData.reduce((sum, p) => sum + (p.like_count || 0), 0),
      totalComments: postsData.reduce((sum, p) => sum + (p.comment_count || 0), 0),
      totalShares: postsData.reduce((sum, p) => sum + (p.share_count || 0), 0),
      averageEngagement: postsData.length > 0 
        ? postsData.reduce((sum, p) => sum + (p.engagement_score || 0), 0) / postsData.length
        : 0,
      trendingPosts: postsData.filter(p => (p.engagement_score || 0) > 10).length
    }
    setAnalytics(analytics)
  }, [])

  // Apply filters to posts
  const applyFilters = useCallback((postsData: Post[], filterSettings: PostFilters) => {
    return postsData.filter(post => {
      // Search filter
      if (filterSettings.search && !post.content?.text?.toLowerCase().includes(filterSettings.search.toLowerCase())) {
        return false
      }
      
      // Visibility filter
      if (filterSettings.visibility !== 'all' && post.visibility !== filterSettings.visibility) {
        return false
      }
      
      // Publish status filter
      if (filterSettings.publishStatus !== 'all' && post.publish_status !== filterSettings.publishStatus) {
        return false
      }
      
      // Date range filter
      if (filterSettings.dateRange !== 'all') {
        const postDate = new Date(post.created_at)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - postDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        switch (filterSettings.dateRange) {
          case 'today':
            if (diffDays > 1) return false
            break
          case 'week':
            if (diffDays > 7) return false
            break
          case 'month':
            if (diffDays > 30) return false
            break
          case 'year':
            if (diffDays > 365) return false
            break
        }
      }
      
      // Content type filter
      if (filterSettings.contentType !== 'all' && post.content_type !== filterSettings.contentType) {
        return false
      }
      
      return true
    })
  }, [])

  // Update filtered posts when filters or posts change
  useEffect(() => {
    const filtered = applyFilters(posts, filters)
    setFilteredPosts(filtered)
    calculateAnalytics(filtered)
  }, [posts, filters, applyFilters, calculateAnalytics])

  // Initial data fetch
  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Handle filter changes
  const handleFilterChange = (key: keyof PostFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Handle post selection
  const handlePostSelection = (postId: string, selected: boolean) => {
    const newSelection = new Set(selectedPosts)
    if (selected) {
      newSelection.add(postId)
    } else {
      newSelection.delete(postId)
    }
    setSelectedPosts(newSelection)
  }

  // Handle bulk operations
  const handleBulkOperation = async (operation: 'delete' | 'publish' | 'archive') => {
    if (selectedPosts.size === 0) return
    
    const confirmed = confirm(`Are you sure you want to ${operation} ${selectedPosts.size} selected posts?`)
    if (!confirmed) return
    
    try {
      const promises = Array.from(selectedPosts).map(postId => {
        switch (operation) {
          case 'delete':
            return fetch(`/api/posts/${postId}`, { method: 'DELETE' })
          case 'publish':
            return fetch(`/api/posts/${postId}`, { 
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ publish_status: 'published' })
            })
          case 'archive':
            return fetch(`/api/posts/${postId}`, { 
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ publish_status: 'archived' })
            })
        }
      })
      
      await Promise.all(promises)
      await fetchPosts() // Refresh data
      setSelectedPosts(new Set()) // Clear selection
    } catch (error) {
      console.error(`Bulk ${operation} failed:`, error)
      setError(`Failed to ${operation} posts`)
    }
  }

  // Handle post updates
  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p))
    setEditingPost(null)
  }

  // Handle post deletion
  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
    setSelectedPosts(prev => {
      const newSet = new Set(prev)
      newSet.delete(postId)
      return newSet
    })
  }

  // Get visibility icon
  const getVisibilityIcon = (visibility: PostVisibility) => {
    switch (visibility) {
      case 'public': return <Eye className="h-4 w-4" />
      case 'friends': return <Users className="h-4 w-4" />
      case 'private': return <Lock className="h-4 w-4" />
      case 'followers': return <Users className="h-4 w-4" />
      default: return <Eye className="h-4 w-4" />
    }
  }

  // Get publish status icon
  const getPublishStatusIcon = (status: PostPublishStatus) => {
    switch (status) {
      case 'published': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'draft': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'scheduled': return <Calendar className="h-4 w-4 text-blue-600" />
      case 'archived': return <AlertCircle className="h-4 w-4 text-gray-600" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please log in to access the post management dashboard.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Post Management Dashboard</h1>
          <p className="text-muted-foreground">Manage all your posts, track performance, and optimize engagement</p>
        </div>
        <Button onClick={() => setShowPostEditor(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Post
        </Button>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Posts</p>
                <p className="text-2xl font-bold">{analytics.totalPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Views</p>
                <p className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Avg Engagement</p>
                <p className="text-2xl font-bold">{analytics.averageEngagement.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Published</p>
                <p className="text-2xl font-bold">{analytics.publishedPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Drafts</p>
                <p className="text-2xl font-bold">{analytics.draftPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>Filters & Search</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Input
                  placeholder="Search posts..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="md:col-span-2"
                />
                <select
                  value={filters.visibility}
                  onChange={(e) => handleFilterChange('visibility', e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Visibility</option>
                  <option value="public">Public</option>
                  <option value="friends">Friends</option>
                  <option value="private">Private</option>
                  <option value="followers">Followers</option>
                </select>
                <select
                  value={filters.publishStatus}
                  onChange={(e) => handleFilterChange('publishStatus', e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Operations */}
          {selectedPosts.size > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedPosts.size} post(s) selected
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkOperation('publish')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Publish
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkOperation('archive')}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBulkOperation('delete')}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts List */}
          <Card>
            <CardHeader>
              <CardTitle>Posts ({filteredPosts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p>Loading posts...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  <p>{error}</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No posts found matching your filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPosts.has(post.id)}
                        onChange={(e) => handlePostSelection(post.id, e.target.checked)}
                        className="h-4 w-4"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          {getPublishStatusIcon(post.publish_status)}
                          {getVisibilityIcon(post.visibility)}
                          <Badge variant="secondary">{post.content_type}</Badge>
                          {post.is_featured && (
                            <Badge variant="default">Featured</Badge>
                          )}
                        </div>
                        
                        <p className="font-medium truncate">
                          {post.content?.text || 'No content'}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          <span>Views: {post.view_count || 0}</span>
                          <span>Likes: {post.like_count || 0}</span>
                          <span>Comments: {post.comment_count || 0}</span>
                          <span>Engagement: {post.engagement_score?.toFixed(1) || 0}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPost(post)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/posts/${post.id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handlePostDeleted(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Post Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Detailed analytics and insights coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Content calendar and scheduling interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Dashboard configuration and preferences coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Post Editor Modal */}
      {showPostEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <PostEditor
              onPostCreated={(newPost) => {
                setPosts(prev => [newPost, ...prev])
                setShowPostEditor(false)
              }}
              onCancel={() => setShowPostEditor(false)}
            />
          </div>
        </div>
      )}

      {/* Post Manager Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <PostManager
              post={editingPost}
              onPostUpdated={handlePostUpdated}
              onPostDeleted={handlePostDeleted}
              onCancel={() => setEditingPost(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
