import { Button } from "@/components/ui/button"
import { Camera } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { usePhotoGalleryUpload } from "@/components/photo-gallery/hooks/use-photo-gallery-upload"

interface PhotoUploadProps {
  entityId: string
  entityType: string
  onUploadComplete?: () => void
}

export function PhotoUpload({
  entityId,
  entityType,
  onUploadComplete
}: PhotoUploadProps) {
  const { uploadState, uploadFile } = usePhotoGalleryUpload({
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    storagePath: 'images'
  })
  const { toast } = useToast()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await uploadFile(file, undefined, entityType, entityId)
      
      toast({
        title: "Success",
        description: "Photo uploaded successfully"
      })

      onUploadComplete?.()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload photo",
        variant: "destructive"
      })
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleFileSelect}
        className="hidden"
        id="photo-upload"
        disabled={uploadState.isUploading}
      />
      <label htmlFor="photo-upload">
        <Button 
          variant="outline" 
          className="cursor-pointer"
          disabled={uploadState.isUploading}
        >
          <Camera className="h-4 w-4 mr-2" />
          {uploadState.isUploading ? "Uploading..." : "Add Photos"}
        </Button>
      </label>
    </div>
  )
} 