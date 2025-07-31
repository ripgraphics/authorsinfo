"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { EnterpriseImageUpload } from "./ui/enterprise-image-upload"
import {
  Plus,
  Image as ImageIcon,
  Settings,
  Share2,
  Download,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  Star,
  Grid3X3,
  List,
  Filter,
  Search,
  MoreHorizontal,
  FolderPlus,
  Camera,
  Users,
  Globe,
  Lock,
  Calendar,
  TrendingUp,
  Heart,
  MessageSquare,
  ExternalLink,
  Copy,
  Archive,
  RefreshCw,
  SortAsc,
  SortDesc,
  Zap,
  Award,
  Target,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react"

interface Album {
  id: string
  name: string
  description?: string
  is_public: boolean
  cover_image_url?: string
  photo_count: number
  view_count: number | null
  like_count: number | null
  share_count: number | null
  created_at: string
  updated_at: string
  metadata?: {
    privacy_level?: string
    show_in_feed?: boolean
    allowed_viewers?: string[]
    tags?: string[]
    featured?: boolean
    category?: string
  }
}

interface Photo {
  id: string
  url: string
  thumbnail_url: string
  alt_text: string
  metadata?: any
  is_featured: boolean
  display_order: number
  created_at: string
}

interface EnterpriseAlbumManagerProps {
  userId: string
  isOwnProfile?: boolean
  entityType?: 'user' | 'publisher' | 'author' | 'group'
  entityId?: string
}

export function EnterpriseAlbumManager({ 
  userId, 
  isOwnProfile = false,
  entityType = 'user',
  entityId
}: EnterpriseAlbumManagerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // State management
  const [albums, setAlbums] = useState<Album[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [albumPhotos, setAlbumPhotos] = useState<Photo[]>([])
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [newAlbum, setNewAlbum] = useState({
    name: '',
    description: '',
    privacy_level: 'public' as 'public' | 'private',
    show_in_feed: true,
    category: '',
    tags: [] as string[]
  })

  // Load albums
  const loadAlbums = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('photo_albums')
        .select(`
          id,
          name,
          description,
          is_public,
          cover_image_id,
          view_count,
          like_count,
          share_count,
          created_at,
          updated_at,
          metadata
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      // Get album image counts and cover images separately
      const albumIds = (data || []).map(album => album.id)
      let albumImageCounts: { [key: string]: number } = {}
      let albumCoverImages: { [key: string]: string } = {}

      if (albumIds.length > 0) {
        const { data: imageCounts } = await supabase
          .from('album_images')
          .select('album_id, images(id, url, thumbnail_url)')
          .in('album_id', albumIds)

        if (imageCounts) {
          imageCounts.forEach((item: any) => {
            const albumId = item.album_id
            albumImageCounts[albumId] = (albumImageCounts[albumId] || 0) + 1
            
            if (!albumCoverImages[albumId] && item.images) {
              albumCoverImages[albumId] = item.images.thumbnail_url || item.images.url
            }
          })
        }
      }

      const formattedAlbums: Album[] = (data || []).map((album: any) => ({
        id: album.id,
        name: album.name,
        description: album.description,
        is_public: album.is_public,
        cover_image_url: albumCoverImages[album.id],
        photo_count: albumImageCounts[album.id] || 0,
        view_count: album.view_count || 0,
        like_count: album.like_count || 0,
        share_count: album.share_count || 0,
        created_at: album.created_at,
        updated_at: album.updated_at,
        metadata: album.metadata
      }))

      setAlbums(formattedAlbums)
    } catch (error) {
      console.error('Error loading albums:', error)
      toast({
        title: "Error",
        description: "Failed to load albums",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load album photos
  const loadAlbumPhotos = async (albumId: string) => {
    try {
      const { data, error } = await supabase
        .from('album_images')
        .select(`
          id,
          display_order,
          is_featured,
          metadata,
          created_at,
          images (
            id,
            url,
            thumbnail_url,
            alt_text,
            metadata
          )
        `)
        .eq('album_id', albumId)
        .order('display_order', { ascending: true })

      if (error) throw error

      const photos: Photo[] = (data || []).map((item: any) => ({
        id: item.images.id,
        url: item.images.url,
        thumbnail_url: item.images.thumbnail_url,
        alt_text: item.images.alt_text,
        metadata: item.images.metadata,
        is_featured: item.is_featured,
        display_order: item.display_order,
        created_at: item.created_at
      }))

      setAlbumPhotos(photos)
    } catch (error) {
      console.error('Error loading album photos:', error)
    }
  }

  // Create album
  const createAlbum = async () => {
    if (!user || !newAlbum.name.trim()) return

    setIsCreatingAlbum(true)
    try {
      const { data: album, error } = await supabase
        .from('photo_albums')
        .insert({
          name: newAlbum.name.trim(),
          description: newAlbum.description.trim() || null,
          is_public: newAlbum.privacy_level === 'public',
          owner_id: user.id,
          entity_type: entityType,
          entity_id: entityId || user.id,
          view_count: 0,
          like_count: 0,
          share_count: 0,
          metadata: {
            show_in_feed: newAlbum.show_in_feed,
            privacy_level: newAlbum.privacy_level,
            category: newAlbum.category,
            tags: newAlbum.tags,
            featured: false
          }
        })
        .select()
        .single()

      if (error) throw error

      // Reset form
      setNewAlbum({
        name: '',
        description: '',
        privacy_level: 'public',
        show_in_feed: true,
        category: '',
        tags: []
      })

      // Reload albums
      await loadAlbums()

      // Immediately open upload dialog for new album
      setSelectedAlbum({
        id: album.id,
        name: album.name,
        description: album.description,
        is_public: album.is_public,
        cover_image_url: undefined,
        photo_count: 0,
        view_count: album.view_count || 0,
        like_count: album.like_count || 0,
        share_count: album.share_count || 0,
        created_at: album.created_at,
        updated_at: album.updated_at,
        metadata: album.metadata
      })
      // setIsUploadOpen(true) // This state variable was removed

      toast({
        title: "Album created successfully",
        description: "Now add some photos to your new album!"
      })

    } catch (error) {
      console.error('Error creating album:', error)
      toast({
        title: "Error",
        description: "Failed to create album",
        variant: "destructive"
      })
    } finally {
      setIsCreatingAlbum(false)
    }
  }

  // Handle photo upload completion
  const handlePhotosUploaded = (photoIds: string[]) => {
    // setIsUploadOpen(false) // This state variable was removed
    loadAlbums() // Refresh album counts
    if (selectedAlbum) {
      loadAlbumPhotos(selectedAlbum.id) // Refresh album photos
    }
  }

  // Filter and sort albums
  const filteredAndSortedAlbums = albums
    .filter(album => {
      const matchesSearch = album.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           album.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      let matchesFilter = true
      switch (filterCategory) {
        case 'public':
          matchesFilter = album.is_public
          break
        case 'private':
          matchesFilter = !album.is_public
          break
        case 'featured':
          matchesFilter = album.metadata?.featured || false
          break
      }
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'popularity':
          comparison = (a.view_count || 0) - (b.view_count || 0)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Calculate statistics
  const totalPhotos = albums.reduce((sum, album) => sum + album.photo_count, 0)
  const totalViews = albums.reduce((sum, album) => sum + (album.view_count || 0), 0)
  const totalLikes = albums.reduce((sum, album) => sum + (album.like_count || 0), 0)
  const publicAlbums = albums.filter(album => album.is_public).length

  useEffect(() => {
    loadAlbums()
  }, [userId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPrivacyIcon = (album: Album) => {
    return album.is_public ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Photo Albums</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="aspect-square bg-muted rounded-lg mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Photo Albums</h2>
          {isOwnProfile && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <FolderPlus className="h-4 w-4" />
                  Create Album
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Album</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="album-name">Album Name *</Label>
                    <Input
                      id="album-name"
                      value={newAlbum.name}
                      onChange={(e) => setNewAlbum(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter album name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="album-description">Description</Label>
                    <Textarea
                      id="album-description"
                      value={newAlbum.description}
                      onChange={(e) => setNewAlbum(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your album (optional)"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="privacy-level">Privacy</Label>
                    <Select
                      value={newAlbum.privacy_level}
                      onValueChange={(value) => setNewAlbum(prev => ({ ...prev, privacy_level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Public - Everyone can see
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Private - Only you can see
                          </div>
                        </SelectItem>
                        <SelectItem value="friends">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Friends Only
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-in-feed">Show in Feed</Label>
                    <Switch
                      id="show-in-feed"
                      checked={newAlbum.show_in_feed}
                      onCheckedChange={(checked) => setNewAlbum(prev => ({ ...prev, show_in_feed: checked }))}
                    />
                  </div>
                  <Button
                    onClick={createAlbum}
                    disabled={isCreatingAlbum || !newAlbum.name.trim()}
                    className="w-full"
                  >
                    {isCreatingAlbum ? "Creating..." : "Create Album"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{albums.length}</p>
                  <p className="text-sm text-muted-foreground">Albums</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{totalPhotos}</p>
                  <p className="text-sm text-muted-foreground">Photos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{totalViews}</p>
                  <p className="text-sm text-muted-foreground">Views</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{totalLikes}</p>
                  <p className="text-sm text-muted-foreground">Likes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search albums..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <Select value={filterCategory} onValueChange={(value: any) => setFilterCategory(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="popularity">Popular</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Albums Grid/List */}
      {albums.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                <Camera className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">No albums yet</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile 
                    ? "Create your first photo album to get started"
                    : "This user hasn't created any albums yet"
                  }
                </p>
              </div>
              {isOwnProfile && (
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <FolderPlus className="h-4 w-4" />
                      Create Your First Album
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create Your First Album</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="first-album-name">Album Name *</Label>
                        <Input
                          id="first-album-name"
                          value={newAlbum.name}
                          onChange={(e) => setNewAlbum(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="My First Album"
                        />
                      </div>
                      <Button
                        onClick={createAlbum}
                        disabled={isCreatingAlbum || !newAlbum.name.trim()}
                        className="w-full"
                      >
                        {isCreatingAlbum ? "Creating..." : "Create Album"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={`
          ${viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'space-y-4'
          }
        `}>
          {filteredAndSortedAlbums.map((album) => (
            <Card key={album.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
              {viewMode === 'grid' ? (
                <>
                  <div className="aspect-square relative overflow-hidden">
                    {album.cover_image_url ? (
                      <img
                        src={album.cover_image_url}
                        alt={album.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <ImageIcon className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Overlay with quick actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedAlbum(album)
                            loadAlbumPhotos(album.id)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isOwnProfile && (
                          <EnterpriseImageUpload
                            entityId={album.id}
                            entityType={entityType}
                            context="album"
                            albumId={album.id}
                            onUploadComplete={handlePhotosUploaded}
                            buttonText="Add Photos"
                            size="sm"
                          />
                        )}
                      </div>
                    </div>

                    {/* Status badges */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {getPrivacyIcon(album)}
                        {album.is_public ? 'Public' : 'Private'}
                      </Badge>
                      {album.metadata?.featured && (
                        <Badge variant="default" className="bg-yellow-500">
                          <Star className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>

                    {/* Photo count */}
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="default" className="bg-black/70 text-white">
                        {album.photo_count} {album.photo_count === 1 ? 'photo' : 'photos'}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg truncate">{album.name}</h3>
                      {album.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {album.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(album.created_at)}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {album.view_count || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {album.like_count || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isOwnProfile && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedAlbum(album)
                            // setIsUploadOpen(true) // This state variable was removed
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Photos
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit Album
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </CardContent>
                </>
              ) : (
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 relative overflow-hidden rounded-lg flex-shrink-0">
                      {album.cover_image_url ? (
                        <img
                          src={album.cover_image_url}
                          alt={album.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg truncate">{album.name}</h3>
                          {album.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {album.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>{album.photo_count} photos</span>
                            <span>{album.view_count || 0} views</span>
                            <span>{album.like_count || 0} likes</span>
                            <span>{formatDate(album.created_at)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            {getPrivacyIcon(album)}
                          </Badge>
                          {isOwnProfile && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedAlbum(album)
                                // setIsUploadOpen(true) // This state variable was removed
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Photos
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Enterprise Photo Upload Modal */}
      {selectedAlbum && (
        <EnterpriseImageUpload
          entityId={selectedAlbum.id}
          entityType={entityType}
          context="album"
          albumId={selectedAlbum.id}
          onUploadComplete={handlePhotosUploaded}
          buttonText="Add Photos"
          size="sm"
        />
      )}
    </div>
  )
} 