"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Edit3,
  Trash2,
  Star,
  StarOff,
  Maximize2,
  Minimize2,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Copy,
  Heart,
  HeartOff,
  MessageSquare,
  Tag,
  Calendar,
  MapPin,
  User,
  Camera,
  Aperture,
  Timer,
  Palette,
  Info,
  Settings,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  MoreHorizontal,
  ExternalLink,
  Archive,
  Eye,
  EyeOff
} from "lucide-react"

interface Photo {
  id: string
  url: string
  thumbnail_url: string
  alt_text: string
  file_size: number
  file_type: string
  width: number
  height: number
  metadata?: {
    title?: string
    description?: string
    tags?: string[]
    location?: string
    date_taken?: string
    camera_make?: string
    camera_model?: string
    aperture?: string
    shutter_speed?: string
    iso?: string
    focal_length?: string
  }
  is_featured: boolean
  display_order: number
  created_at: string
  like_count?: number
  comment_count?: number
  view_count?: number
  is_liked?: boolean
}

interface EnterprisePhotoViewerProps {
  photos: Photo[]
  initialPhotoIndex?: number
  isOpen: boolean
  onClose: () => void
  albumId: string
  isEditable?: boolean
  onPhotoUpdate?: (photo: Photo) => void
  onPhotoDelete?: (photoId: string) => void
}

export function EnterprisePhotoViewer({
  photos,
  initialPhotoIndex = 0,
  isOpen,
  onClose,
  albumId,
  isEditable = false,
  onPhotoUpdate,
  onPhotoDelete
}: EnterprisePhotoViewerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // State management
  const [currentIndex, setCurrentIndex] = useState(initialPhotoIndex)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isSlideshow, setIsSlideshow] = useState(false)
  const [slideshowInterval, setSlideshowInterval] = useState(3000)
  const [showInfo, setShowInfo] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    tags: '',
    location: '',
    is_featured: false,
    is_private: false
  })

  const currentPhoto = photos[currentIndex]

  // Navigation
  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : photos.length - 1)
    setZoom(1)
    setRotation(0)
  }, [photos.length])

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => prev < photos.length - 1 ? prev + 1 : 0)
    setZoom(1)
    setRotation(0)
  }, [photos.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
          goToNext()
          break
        case 'Escape':
          onClose()
          break
        case ' ':
          e.preventDefault()
          setIsSlideshow(prev => !prev)
          break
        case 'f':
          setIsFullscreen(prev => !prev)
          break
        case 'i':
          setShowInfo(prev => !prev)
          break
        case '+':
        case '=':
          setZoom(prev => Math.min(prev + 0.25, 3))
          break
        case '-':
          setZoom(prev => Math.max(prev - 0.25, 0.25))
          break
        case 'r':
          setRotation(prev => (prev + 90) % 360)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, goToPrevious, goToNext, onClose])

  // Slideshow
  useEffect(() => {
    if (!isSlideshow) return
    
    const interval = setInterval(() => {
      goToNext()
    }, slideshowInterval)
    
    return () => clearInterval(interval)
  }, [isSlideshow, slideshowInterval, goToNext])

  // Initialize edit form
  useEffect(() => {
    if (currentPhoto) {
      setEditForm({
        title: currentPhoto.metadata?.title || '',
        description: currentPhoto.metadata?.description || '',
        tags: currentPhoto.metadata?.tags?.join(', ') || '',
        location: currentPhoto.metadata?.location || '',
        is_featured: currentPhoto.is_featured,
        is_private: false // You'd get this from the actual photo privacy settings
      })
    }
  }, [currentPhoto])

  // Like/Unlike photo
  const toggleLike = async () => {
    if (!user || !currentPhoto) return
    
    try {
      const { error } = await supabase
        .from('photo_likes')
        .upsert({
          photo_id: currentPhoto.id,
          user_id: user.id,
          liked: !currentPhoto.is_liked
        }, {
          onConflict: 'photo_id,user_id'
        })

      if (error) throw error

      // Update local state
      const updatedPhoto = {
        ...currentPhoto,
        is_liked: !currentPhoto.is_liked,
        like_count: currentPhoto.is_liked 
          ? (currentPhoto.like_count || 0) - 1
          : (currentPhoto.like_count || 0) + 1
      }

      onPhotoUpdate?.(updatedPhoto)
    } catch (error) {
      console.error('Error toggling like:', error)
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      })
    }
  }

  // Save photo edits
  const savePhotoEdits = async () => {
    if (!currentPhoto) return
    
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('album_images')
        .update({
          is_featured: editForm.is_featured,
          metadata: {
            title: editForm.title,
            description: editForm.description,
            tags: editForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
            location: editForm.location
          }
        })
        .eq('album_id', albumId)
        .eq('image_id', currentPhoto.id)

      if (error) throw error

      // Update the images table as well
      const { error: imageError } = await supabase
        .from('images')
        .update({
          alt_text: editForm.title || currentPhoto.alt_text,
          metadata: {
            ...currentPhoto.metadata,
            title: editForm.title,
            description: editForm.description,
            tags: editForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
            location: editForm.location
          }
        })
        .eq('id', currentPhoto.id)

      if (imageError) throw imageError

      const updatedPhoto = {
        ...currentPhoto,
        is_featured: editForm.is_featured,
        metadata: {
          ...currentPhoto.metadata,
          title: editForm.title,
          description: editForm.description,
          tags: editForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          location: editForm.location
        }
      }

      onPhotoUpdate?.(updatedPhoto)
      setShowEditDialog(false)
      
      toast({
        title: "Photo updated",
        description: "Changes saved successfully"
      })
    } catch (error) {
      console.error('Error saving photo edits:', error)
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Delete photo
  const deletePhoto = async () => {
    if (!currentPhoto) return
    
    try {
      // Remove from album
      const { error } = await supabase
        .from('album_images')
        .delete()
        .eq('album_id', albumId)
        .eq('image_id', currentPhoto.id)

      if (error) throw error

      onPhotoDelete?.(currentPhoto.id)
      
      // Navigate to next photo or close if last one
      if (photos.length > 1) {
        if (currentIndex >= photos.length - 1) {
          setCurrentIndex(0)
        }
      } else {
        onClose()
      }
      
      toast({
        title: "Photo deleted",
        description: "Photo removed from album"
      })
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast({
        title: "Error",
        description: "Failed to delete photo",
        variant: "destructive"
      })
    }
  }

  // Download photo
  const downloadPhoto = () => {
    if (!currentPhoto) return
    
    const link = document.createElement('a')
    link.href = currentPhoto.url
    link.download = `${currentPhoto.metadata?.title || 'photo'}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Share photo
  const sharePhoto = async () => {
    if (!currentPhoto) return
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentPhoto.metadata?.title || 'Photo',
          text: currentPhoto.metadata?.description || 'Check out this photo',
          url: currentPhoto.url
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(currentPhoto.url)
      toast({
        title: "Link copied",
        description: "Photo link copied to clipboard"
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!currentPhoto) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-7xl h-[95vh] p-0 overflow-hidden ${isFullscreen ? 'max-w-full h-screen' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold truncate">
              {currentPhoto.metadata?.title || currentPhoto.alt_text}
            </h2>
            <Badge variant="secondary">
              {currentIndex + 1} of {photos.length}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Slideshow Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSlideshow(!isSlideshow)}
            >
              {isSlideshow ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            {/* Info Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
            >
              <Info className="h-4 w-4" />
            </Button>
            
            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            
            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={downloadPhoto}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={sharePhoto}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                {isEditable && (
                  <>
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={deletePhoto} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Photo Area */}
          <div className="flex-1 relative bg-black flex items-center justify-center">
            {/* Navigation Buttons */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={goToPrevious}
              disabled={photos.length <= 1}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={goToNext}
              disabled={photos.length <= 1}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            {/* Photo */}
            <img
              src={currentPhoto.url}
              alt={currentPhoto.alt_text}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                cursor: zoom > 1 ? 'grab' : 'default'
              }}
            />

            {/* Zoom Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-lg p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.25))}
                className="text-white hover:bg-white/20"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-white text-sm min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
                className="text-white hover:bg-white/20"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <div className="w-px h-4 bg-white/30 mx-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="text-white hover:bg-white/20"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Photo Actions */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLike}
                className="bg-black/50 hover:bg-black/70 text-white"
              >
                {currentPhoto.is_liked ? (
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                ) : (
                  <Heart className="h-4 w-4" />
                )}
                {currentPhoto.like_count || 0}
              </Button>
              
              {currentPhoto.is_featured && (
                <Badge className="bg-yellow-500">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
          </div>

          {/* Info Panel */}
          {showInfo && (
            <div className="w-80 border-l bg-background overflow-y-auto">
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Photo Details</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Title</Label>
                      <p className="font-medium">{currentPhoto.metadata?.title || 'Untitled'}</p>
                    </div>
                    
                    {currentPhoto.metadata?.description && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <p>{currentPhoto.metadata.description}</p>
                      </div>
                    )}
                    
                    {currentPhoto.metadata?.tags && currentPhoto.metadata.tags.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Tags</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {currentPhoto.metadata.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">Uploaded</Label>
                      <p>{formatDate(currentPhoto.created_at)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">File Size</Label>
                      <p>{formatFileSize(currentPhoto.file_size)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">Dimensions</Label>
                      <p>{currentPhoto.width} × {currentPhoto.height}</p>
                    </div>
                    
                    {currentPhoto.metadata?.location && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Location</Label>
                        <p>{currentPhoto.metadata.location}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* EXIF Data */}
                {(currentPhoto.metadata?.camera_make || currentPhoto.metadata?.camera_model) && (
                  <div>
                    <h4 className="font-medium mb-2">Camera Info</h4>
                    <div className="space-y-2 text-sm">
                      {currentPhoto.metadata.camera_make && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Make</Label>
                          <p>{currentPhoto.metadata.camera_make}</p>
                        </div>
                      )}
                      {currentPhoto.metadata.camera_model && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Model</Label>
                          <p>{currentPhoto.metadata.camera_model}</p>
                        </div>
                      )}
                      {currentPhoto.metadata.aperture && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Aperture</Label>
                          <p>f/{currentPhoto.metadata.aperture}</p>
                        </div>
                      )}
                      {currentPhoto.metadata.shutter_speed && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Shutter Speed</Label>
                          <p>{currentPhoto.metadata.shutter_speed}</p>
                        </div>
                      )}
                      {currentPhoto.metadata.iso && (
                        <div>
                          <Label className="text-xs text-muted-foreground">ISO</Label>
                          <p>{currentPhoto.metadata.iso}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Statistics */}
                <div>
                  <h4 className="font-medium mb-2">Statistics</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center p-2 bg-muted rounded">
                      <Eye className="h-4 w-4 mx-auto mb-1" />
                      <p className="font-medium">{currentPhoto.view_count || 0}</p>
                      <p className="text-xs text-muted-foreground">Views</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <Heart className="h-4 w-4 mx-auto mb-1" />
                      <p className="font-medium">{currentPhoto.like_count || 0}</p>
                      <p className="text-xs text-muted-foreground">Likes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        {showEditDialog && (
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Photo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter photo title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this photo"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-tags">Tags (comma separated)</Label>
                  <Input
                    id="edit-tags"
                    value={editForm.tags}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="nature, landscape, sunset"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Where was this taken?"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-featured">Featured Photo</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditForm(prev => ({ ...prev, is_featured: !prev.is_featured }))}
                  >
                    {editForm.is_featured ? (
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={savePhotoEdits}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowEditDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
} 