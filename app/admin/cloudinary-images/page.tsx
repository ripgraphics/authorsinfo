'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Folder,
  Image as ImageIcon,
  Calendar,
  FileText,
  Trash2,
  RefreshCw,
  Download,
  Eye,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/utils/dateUtils'

interface CloudinaryResource {
  public_id: string
  secure_url: string
  created_at: string
  bytes: number
  width: number
  height: number
  format: string
  resource_type: string
  folder?: string
}

interface CloudinaryResponse {
  success: boolean
  data: {
    resources: CloudinaryResource[]
    next_cursor?: string
    total_count: number
  }
}

export default function CloudinaryImagesPage() {
  const [images, setImages] = useState<CloudinaryResource[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [folder, setFolder] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [nextCursor, setNextCursor] = useState<string | undefined>()
  const [hasMore, setHasMore] = useState(false)
  const { toast } = useToast()

  const fetchImages = async (cursor?: string) => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        max_results: '50',
      })

      if (folder) {
        params.append('folder', folder)
      }

      if (cursor) {
        params.append('next_cursor', cursor)
      }

      const response = await fetch(`/api/cloudinary/list?${params}`)
      const result: CloudinaryResponse = await response.json()

      if (!result.success) {
        throw new Error('Failed to fetch images')
      }

      if (cursor) {
        setImages((prev) => [...prev, ...result.data.resources])
      } else {
        setImages(result.data.resources)
      }

      setNextCursor(result.data.next_cursor)
      setHasMore(!!result.data.next_cursor)
    } catch (err) {
      console.error('Error fetching images:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch images')
      toast({
        title: 'Error',
        description: 'Failed to fetch Cloudinary images',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteImage = async (publicId: string) => {
    if (!confirm(`Are you sure you want to delete ${publicId}?`)) {
      return
    }

    try {
      const response = await fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicId }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete image')
      }

      // Remove the image from the list
      setImages((prev) => prev.filter((img) => img.public_id !== publicId))

      toast({
        title: 'Success',
        description: 'Image deleted successfully',
      })
    } catch (err) {
      console.error('Error deleting image:', err)
      toast({
        title: 'Error',
        description: 'Failed to delete image',
        variant: 'destructive',
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredImages = images.filter((img) =>
    img.public_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    fetchImages()
  }, [folder])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cloudinary Images</h1>
          <p className="text-muted-foreground">Manage and view your Cloudinary images</p>
        </div>
        <Button onClick={() => fetchImages()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="folder">Folder</Label>
              <Input
                id="folder"
                placeholder="Enter folder name (optional)"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="search">Search Images</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by public ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredImages.map((image) => (
          <Card key={image.public_id} className="overflow-hidden">
            <div className="aspect-square relative bg-muted">
              <img
                src={image.secure_url}
                alt={image.public_id}
                className="object-cover w-full h-full"
                loading="lazy"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(image.secure_url, '_blank')}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteImage(image.public_id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">{image.format.toUpperCase()}</Badge>
                </div>

                <div className="text-sm space-y-1">
                  <p className="font-medium truncate" title={image.public_id}>
                    {image.public_id.split('/').pop()}
                  </p>
                  <p className="text-muted-foreground text-xs truncate" title={image.public_id}>
                    {image.public_id}
                  </p>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(image.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>{formatFileSize(image.bytes)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    <span>
                      {image.width} × {image.height}
                    </span>
                  </div>
                </div>

                {image.folder && (
                  <div className="flex items-center gap-1">
                    <Folder className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="secondary" className="text-xs">
                      {image.folder}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <Button onClick={() => fetchImages(nextCursor)} disabled={loading} variant="outline">
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Images'
            )}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredImages.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No images found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search terms' : 'No images in this folder'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && images.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium mb-2">Loading images...</h3>
            <p className="text-muted-foreground">
              Please wait while we fetch your Cloudinary images
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
