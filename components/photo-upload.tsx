import { Button } from '@/components/ui/button'
import { Camera } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { uploadImage } from '@/app/actions/upload'

interface PhotoUploadProps {
  entityId: string
  entityType: string
  onUploadComplete?: () => void
}

export function PhotoUpload({ entityId, entityType, onUploadComplete }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 5MB',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)

    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.readAsDataURL(file)

      reader.onload = async () => {
        const base64Image = reader.result as string
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = base64Image.split(',')[1]

        // Upload to Cloudinary with WebP transformation
        const result = await uploadImage(
          base64Data,
          `${entityType}gallery`,
          `Photo for ${entityType} ${entityId}`,
          1200, // maxWidth
          1200 // maxHeight
        )

        if (result) {
          toast({
            title: 'Success',
            description: 'Photo uploaded successfully',
          })
          onUploadComplete?.()
        } else {
          throw new Error('Failed to upload image')
        }
      }

      reader.onerror = () => {
        throw new Error('Failed to read file')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload photo',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
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
        disabled={isUploading}
      />
      <label htmlFor="photo-upload">
        <Button variant="default" className="cursor-pointer" disabled={isUploading}>
          <Camera className="h-4 w-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Add Photos'}
        </Button>
      </label>
    </div>
  )
}
