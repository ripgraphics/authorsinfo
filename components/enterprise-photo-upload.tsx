"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import {
  Upload,
  Image as ImageIcon,
  X,
  Check,
  AlertCircle,
  Camera,
  FolderOpen,
  Grid3X3,
  List,
  Star,
  Download,
  Share2,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Tag,
  Calendar,
  MapPin,
  Users,
  Settings,
  Zap,
  Filter,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  RotateCw,
  Crop,
  Palette,
  Move,
  Copy,
  Archive
} from "lucide-react"

interface PhotoFile {
  id: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
  metadata?: {
    title?: string
    description?: string
    tags?: string[]
    location?: string
    dateTaken?: string
    isPrivate?: boolean
    isFeatured?: boolean
  }
}

interface EnterprisePhotoUploadProps {
  albumId: string
  albumName: string
  isOpen: boolean
  onClose: () => void
  onPhotosUploaded: (photoIds: string[]) => void
  maxFiles?: number
  maxFileSize?: number
  allowedTypes?: string[]
}

export function EnterprisePhotoUpload({
  albumId,
  albumName,
  isOpen,
  onClose,
  onPhotosUploaded,
  maxFiles = 50,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
}: EnterprisePhotoUploadProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [photos, setPhotos] = useState<PhotoFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("upload")
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoFile | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'error'>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Drag and drop functionality
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (photos.length + acceptedFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive"
      })
      return
    }

    const newPhotos: PhotoFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
      metadata: {
        title: file.name.replace(/\.[^/.]+$/, ""),
        tags: [],
        isPrivate: false,
        isFeatured: false
      }
    }))

    setPhotos(prev => [...prev, ...newPhotos])
  }, [photos.length, maxFiles, toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': allowedTypes
    },
    maxSize: maxFileSize,
    multiple: true,
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(rejection => {
        const { file, errors } = rejection
        errors.forEach(error => {
          toast({
            title: "File rejected",
            description: `${file.name}: ${error.message}`,
            variant: "destructive"
          })
        })
      })
    }
  })

  // Remove photo
  const removePhoto = (photoId: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === photoId)
      if (photo?.preview) {
        URL.revokeObjectURL(photo.preview)
      }
      return prev.filter(p => p.id !== photoId)
    })
  }

  // Update photo metadata
  const updatePhotoMetadata = (photoId: string, metadata: Partial<PhotoFile['metadata']>) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === photoId 
        ? { ...photo, metadata: { ...photo.metadata, ...metadata } }
        : photo
    ))
  }

  // Upload photos to Supabase
  const uploadPhotos = async () => {
    if (!user || photos.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    const uploadedPhotoIds: string[] = []
    const totalPhotos = photos.filter(p => p.status === 'pending').length

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      if (photo.status !== 'pending') continue

      try {
        // Update status to uploading
        setPhotos(prev => prev.map(p => 
          p.id === photo.id ? { ...p, status: 'uploading' as const } : p
        ))

        // Upload to Supabase Storage
        const fileExt = photo.file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        const filePath = `album-${albumId}/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, photo.file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath)

        // Create thumbnail URL (assuming you have a thumbnail generation service)
        const thumbnailUrl = publicUrl.replace('/photos/', '/photos/thumbnails/')

        // Update status to processing
        setPhotos(prev => prev.map(p => 
          p.id === photo.id ? { ...p, status: 'processing' as const } : p
        ))

        // Insert into images table
        const { data: imageData, error: imageError } = await supabase
          .from('images')
          .insert({
            url: publicUrl,
            thumbnail_url: thumbnailUrl,
            alt_text: photo.metadata?.title || photo.file.name,
            file_size: photo.file.size,
            file_type: photo.file.type,
            width: 0, // You'd extract this from the image
            height: 0, // You'd extract this from the image
            metadata: {
              ...photo.metadata,
              original_name: photo.file.name,
              upload_date: new Date().toISOString()
            }
          })
          .select()
          .single()

        if (imageError) throw imageError

        // Link to album
        const { error: albumLinkError } = await supabase
          .from('album_images')
          .insert({
            album_id: albumId,
            image_id: imageData.id,
            display_order: i,
            is_cover: i === 0 && photos.length === 1,
            is_featured: photo.metadata?.isFeatured || false,
            metadata: photo.metadata
          })

        if (albumLinkError) throw albumLinkError

        // Update status to completed
        setPhotos(prev => prev.map(p => 
          p.id === photo.id ? { ...p, status: 'completed' as const, progress: 100 } : p
        ))

        uploadedPhotoIds.push(imageData.id)

        // Update overall progress
        const completedCount = uploadedPhotoIds.length
        setUploadProgress((completedCount / totalPhotos) * 100)

      } catch (error) {
        console.error('Error uploading photo:', error)
        setPhotos(prev => prev.map(p => 
          p.id === photo.id 
            ? { 
                ...p, 
                status: 'error' as const, 
                error: error instanceof Error ? error.message : 'Upload failed'
              } 
            : p
        ))
      }
    }

    setIsUploading(false)
    
    if (uploadedPhotoIds.length > 0) {
      toast({
        title: "Photos uploaded successfully",
        description: `${uploadedPhotoIds.length} photos added to ${albumName}`
      })
      onPhotosUploaded(uploadedPhotoIds)
    }
  }

  // Retry failed uploads
  const retryFailedUploads = () => {
    setPhotos(prev => prev.map(photo => 
      photo.status === 'error' 
        ? { ...photo, status: 'pending' as const, error: undefined }
        : photo
    ))
  }

  // Bulk operations
  const selectAllPhotos = () => {
    // Implementation for bulk selection
  }

  const deleteSelectedPhotos = () => {
    // Implementation for bulk deletion
  }

  // Filter photos
  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = photo.metadata?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.file.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || photo.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      photos.forEach(photo => {
        if (photo.preview) {
          URL.revokeObjectURL(photo.preview)
        }
      })
    }
  }, [])

  const getStatusColor = (status: PhotoFile['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-500'
      case 'uploading': return 'bg-blue-500'
      case 'processing': return 'bg-yellow-500'
      case 'completed': return 'bg-green-500'
      case 'error': return 'bg-red-500'
    }
  }

  const getStatusIcon = (status: PhotoFile['status']) => {
    switch (status) {
      case 'pending': return <Upload className="h-4 w-4" />
      case 'uploading': return <Zap className="h-4 w-4" />
      case 'processing': return <Settings className="h-4 w-4 animate-spin" />
      case 'completed': return <Check className="h-4 w-4" />
      case 'error': return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Add Photos to "{albumName}"
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload Photos</TabsTrigger>
            <TabsTrigger value="organize">Organize & Edit</TabsTrigger>
            <TabsTrigger value="settings">Batch Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="flex-1 flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
              {/* Upload Area */}
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        isDragActive 
                          ? 'border-primary bg-primary/10' 
                          : 'border-muted-foreground/25 hover:border-primary/50'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-lg font-medium">
                            {isDragActive ? 'Drop photos here' : 'Drag & drop photos'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            or click to browse files
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <Badge variant="secondary">JPEG</Badge>
                          <Badge variant="secondary">PNG</Badge>
                          <Badge variant="secondary">WebP</Badge>
                          <Badge variant="secondary">HEIC</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Max {maxFiles} files, {Math.round(maxFileSize / 1024 / 1024)}MB each
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Upload Progress */}
                {isUploading && (
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Uploading photos...</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <Progress value={uploadProgress} />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="flex-1"
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Browse Files
                  </Button>
                  <Button
                    onClick={uploadPhotos}
                    disabled={isUploading || photos.filter(p => p.status === 'pending').length === 0}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload All
                  </Button>
                </div>
              </div>

              {/* Photo Preview */}
              <div className="space-y-4">
                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    >
                      {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                    </Button>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search photos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-40"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {filteredPhotos.length} photos
                    </Badge>
                    {photos.some(p => p.status === 'error') && (
                      <Button size="sm" variant="outline" onClick={retryFailedUploads}>
                        Retry Failed
                      </Button>
                    )}
                  </div>
                </div>

                {/* Photo Grid */}
                <div className={`
                  ${viewMode === 'grid' 
                    ? 'grid grid-cols-3 gap-2' 
                    : 'space-y-2'
                  } 
                  max-h-96 overflow-y-auto
                `}>
                  {filteredPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className={`
                        relative group border rounded-lg overflow-hidden
                        ${viewMode === 'grid' ? 'aspect-square' : 'flex items-center p-2'}
                        ${photo.status === 'error' ? 'border-red-500' : 'border-border'}
                      `}
                    >
                      {viewMode === 'grid' ? (
                        <>
                          <img
                            src={photo.preview}
                            alt={photo.metadata?.title || photo.file.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setSelectedPhoto(photo)}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removePhoto(photo.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="absolute top-1 right-1">
                            <Badge
                              variant="secondary"
                              className={`${getStatusColor(photo.status)} text-white`}
                            >
                              {getStatusIcon(photo.status)}
                            </Badge>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-3 w-full">
                          <img
                            src={photo.preview}
                            alt={photo.metadata?.title || photo.file.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {photo.metadata?.title || photo.file.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {(photo.file.size / 1024 / 1024).toFixed(1)}MB
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={`${getStatusColor(photo.status)} text-white`}
                            >
                              {getStatusIcon(photo.status)}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedPhoto(photo)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removePhoto(photo.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="organize" className="flex-1">
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Photo Organization</p>
              <p className="text-muted-foreground">
                Advanced photo editing and organization tools coming soon
              </p>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="flex-1">
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Batch Settings</p>
              <p className="text-muted-foreground">
                Bulk operations and settings coming soon
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Photo Detail Modal */}
        {selectedPhoto && (
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Photo Details</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedPhoto.preview}
                    alt={selectedPhoto.metadata?.title || selectedPhoto.file.name}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={selectedPhoto.metadata?.title || ''}
                      onChange={(e) => updatePhotoMetadata(selectedPhoto.id, { title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={selectedPhoto.metadata?.description || ''}
                      onChange={(e) => updatePhotoMetadata(selectedPhoto.id, { description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={selectedPhoto.metadata?.tags?.join(', ') || ''}
                      onChange={(e) => updatePhotoMetadata(selectedPhoto.id, { 
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                      })}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedPhoto.metadata?.isFeatured || false}
                        onChange={(e) => updatePhotoMetadata(selectedPhoto.id, { isFeatured: e.target.checked })}
                      />
                      <Star className="h-4 w-4" />
                      Featured
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedPhoto.metadata?.isPrivate || false}
                        onChange={(e) => updatePhotoMetadata(selectedPhoto.id, { isPrivate: e.target.checked })}
                      />
                      <EyeOff className="h-4 w-4" />
                      Private
                    </label>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={(e) => {
            if (e.target.files) {
              onDrop(Array.from(e.target.files))
            }
          }}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  )
} 