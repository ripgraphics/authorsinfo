"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { PhotoAlbumCreator } from '@/components/photo-album-creator'
import { EnterpriseImageUpload } from '@/components/ui/enterprise-image-upload'
import {
  FolderPlus,
  Image as ImageIcon,
  Users,
  Globe,
  Lock,
  Calendar,
  Eye,
  Heart,
  Share2,
  MoreHorizontal,
  Upload,
  Grid3X3,
  List,
  Search,
  Filter,
  Settings
} from 'lucide-react'

interface PhotoAlbum {
  id: string
  name: string
  description: string | null
  cover_image_id: string | null
  owner_id: string
  is_public: boolean
  view_count: number | null
  like_count: number | null
  share_count: number | null
  entity_type: string | null
  entity_id: string | null
  metadata: any
  created_at: string
  updated_at: string
  image_count: number
  cover_image?: {
    url: string
  } | null
}

interface PublisherPhotoAlbumsProps {
  publisherId: string
  publisherName: string
  isOwner: boolean
}

export function PublisherPhotoAlbums({ publisherId, publisherName, isOwner }: PublisherPhotoAlbumsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [albums, setAlbums] = useState<PhotoAlbum[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all')
  const [selectedAlbum, setSelectedAlbum] = useState<PhotoAlbum | null>(null)
  const [uploadAlbumId, setUploadAlbumId] = useState<string | null>(null)

  // Load albums
  const loadAlbums = async () => {
    try {
      setLoading(true)
      
      // First, get albums
      let query = supabase
        .from('photo_albums')
        .select(`
          *,
          cover_image:images!cover_image_id(url)
        `)
        .eq('entity_type', 'publisher')
        .eq('entity_id', publisherId)
        .order('created_at', { ascending: false })

      // Apply privacy filter
      if (!isOwner) {
        query = query.eq('is_public', true)
      } else if (filterType !== 'all') {
        query = query.eq('is_public', filterType === 'public')
      }

      const { data: albumsData, error: albumsError } = await query

      if (albumsError) {
        console.error('Error loading albums:', albumsError)
        throw albumsError
      }

      // Get image counts for each album
      const albumsWithCounts = await Promise.all(
        (albumsData || []).map(async (album) => {
          const { count } = await supabase
            .from('album_images')
            .select('*', { count: 'exact', head: true })
            .eq('album_id', album.id)

          return {
            ...album,
            image_count: count || 0
          }
        })
      )

      setAlbums(albumsWithCounts)
    } catch (error) {
      console.error('Error loading albums:', error)
      toast({
        title: "Error",
        description: "Failed to load photo albums",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlbums()
  }, [publisherId, filterType, isOwner])

  // Handle album creation
  const handleAlbumCreated = async () => {
    await loadAlbums()
  }

  // Handle photo upload completion
  const handlePhotosUploaded = (photoIds: string[]) => {
    toast({
      title: "Success",
      description: `${photoIds.length} photos uploaded successfully`,
    })
    loadAlbums() // Refresh albums to update counts
  }

  // Open upload dialog for existing album
  const openUploadDialog = (album: PhotoAlbum) => {
    setUploadAlbumId(album.id)
  }

  // Filter albums based on search term
  const filteredAlbums = albums.filter(album =>
    album.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (album.description && album.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getPrivacyBadge = (isPublic: boolean) => {
    return isPublic ? (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Globe className="h-3 w-3" />
        Public
      </Badge>
    ) : (
      <Badge variant="outline" className="flex items-center gap-1">
        <Lock className="h-3 w-3" />
        Private
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Photo Albums</h2>
          <p className="text-muted-foreground">
            {isOwner ? 'Manage your photo albums' : `${publisherName}'s photo albums`}
          </p>
        </div>
        {isOwner && (
          <PhotoAlbumCreator
            onAlbumCreated={handleAlbumCreated}
            entityType="publisher"
            entityId={publisherId}
            redirectToUpload={true}
            trigger={
              <Button className="flex items-center gap-2">
                <FolderPlus className="h-4 w-4" />
                Create Album
              </Button>
            }
          />
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search albums..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <Tabs value={filterType} onValueChange={(value) => setFilterType(value as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="public">Public</TabsTrigger>
                <TabsTrigger value="private">Private</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Albums Display */}
      {filteredAlbums.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No photo albums found</h3>
          <p className="text-muted-foreground mb-4">
            {isOwner 
              ? "Create your first photo album to get started" 
              : "This publisher hasn't created any public photo albums yet"
            }
          </p>
          {isOwner && (
            <PhotoAlbumCreator
              onAlbumCreated={handleAlbumCreated}
              entityType="publisher"
              entityId={publisherId}
              redirectToUpload={true}
              trigger={
                <Button>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create Your First Album
                </Button>
              }
            />
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "space-y-4"
        }>
          {filteredAlbums.map((album) => (
            <Card key={album.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted relative">
                {album.cover_image?.url ? (
                  <img 
                    src={album.cover_image.url} 
                    alt={album.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  {getPrivacyBadge(album.is_public)}
                </div>
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{album.name}</CardTitle>
                    {album.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {album.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="h-4 w-4" />
                      {album.image_count} photos
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {album.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {album.like_count}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(album.created_at)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setSelectedAlbum(album)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  {isOwner && (
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openUploadDialog(album)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Add Photos
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Photo Upload Dialog */}
      {uploadAlbumId && (
        <EnterpriseImageUpload
          entityId={uploadAlbumId}
          entityType="publisher"
          context="album"
          albumId={uploadAlbumId}
          onUploadComplete={handlePhotosUploaded}
          buttonText="Add Photos"
          size="sm"
        />
      )}

      {/* Album Detail Dialog */}
      {selectedAlbum && (
        <Dialog open={!!selectedAlbum} onOpenChange={() => setSelectedAlbum(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedAlbum.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedAlbum.description && (
                <p className="text-muted-foreground">{selectedAlbum.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ImageIcon className="h-4 w-4" />
                  {selectedAlbum.image_count} photos
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {selectedAlbum.view_count} views
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {selectedAlbum.like_count} likes
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created {formatDate(selectedAlbum.created_at)}
                </span>
              </div>
              {/* TODO: Add photo grid display here */}
              <div className="bg-muted/50 p-8 rounded-lg text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Photo gallery view coming soon...</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 