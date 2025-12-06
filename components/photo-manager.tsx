import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"
import { Trash2, GripVertical, Eye } from "lucide-react"
import { PhotoViewerModal } from "./photo-viewer-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PhotoManagerProps {
  photos: {
    id: string
    url: string
    alt?: string
    order?: number
  }[]
  albumId?: string
  onPhotosUpdated?: () => void
}

export function PhotoManager({
  photos,
  albumId,
  onPhotosUpdated
}: PhotoManagerProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index)
    setIsViewerOpen(true)
  }

  const handleDeleteClick = (photoId: string) => {
    setPhotoToDelete(photoId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!photoToDelete) return

    try {
      // Delete from album_images if in an album
      if (albumId) {
        const { error: albumError } = await supabase
          .from('album_images')
          .delete()
          .eq('album_id', albumId)
          .eq('image_id', photoToDelete)

        if (albumError) throw albumError
      }

      // Delete the image record
      const { error: imageError } = await supabase
        .from('images')
        .delete()
        .eq('id', photoToDelete)

      if (imageError) throw imageError

      toast({
        title: "Success",
        description: "Photo deleted successfully"
      })
      onPhotosUpdated?.()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete photo",
        variant: "destructive"
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setPhotoToDelete(null)
    }
  }

  const handleDragStart = (photoId: string) => {
    setIsDragging(true)
    setDraggedPhotoId(photoId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (targetPhotoId: string) => {
    if (!draggedPhotoId || !albumId) return

    try {
      // Get current order of both photos
      const draggedPhoto = photos.find(p => p.id === draggedPhotoId)
      const targetPhoto = photos.find(p => p.id === targetPhotoId)
      
      if (!draggedPhoto || !targetPhoto) return

      // Update the order in album_images
      const { error } = await supabase
        .from('album_images')
        .update({ order: targetPhoto.order })
        .eq('album_id', albumId)
        .eq('image_id', draggedPhotoId)

      if (error) throw error

      // Update the other photo's order
      const { error: error2 } = await supabase
        .from('album_images')
        .update({ order: draggedPhoto.order })
        .eq('album_id', albumId)
        .eq('image_id', targetPhotoId)

      if (error2) throw error2

      onPhotosUpdated?.()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reorder photos",
        variant: "destructive"
      })
    } finally {
      setIsDragging(false)
      setDraggedPhotoId(null)
    }
  }

  return (
    <>
      <div className="photo-manager-container h-full overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="group relative aspect-square rounded-lg overflow-hidden"
              draggable={!!albumId}
              onDragStart={() => handleDragStart(photo.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(photo.id)}
            >
              <img
                src={photo.url}
                alt={photo.alt || "Photo"}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => handlePhotoClick(index)}
                >
                  <Eye className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => handleDeleteClick(photo.id)}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
                {albumId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 cursor-grab"
                  >
                    <GripVertical className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <PhotoViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        photos={photos}
        initialPhotoIndex={selectedPhotoIndex}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 