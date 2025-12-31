import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PhotoUpload } from '@/components/photo-upload'
import { PhotoManager } from '@/components/photo-manager'
import { AlbumSettingsDialog } from '@/components/album-settings-dialog'
import { Settings } from 'lucide-react'

interface PhotosListProps {
  photos: {
    id: string
    url: string
    alt?: string
    order?: number
  }[]
  photosCount?: number
  entityId: string
  entityType: string
  albumId?: string
  album?: {
    id: string
    title: string
    is_public: boolean
    cover_image_id?: string
  }
  onUploadComplete?: () => void
  onPhotosUpdated?: () => void
}

export function PhotosList({
  photos = [],
  photosCount = 0,
  entityId,
  entityType,
  albumId,
  album,
  onUploadComplete,
  onPhotosUpdated,
}: PhotosListProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <Card className="rounded-lg border bg-card text-card-foreground shadow-xs">
      <div className="space-y-1.5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold leading-none tracking-tight">
            Photos · {photosCount}
          </h2>
          <div className="flex items-center gap-2">
            {album && (
              <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <PhotoUpload
              entityId={entityId}
              entityType={entityType}
              onUploadComplete={onUploadComplete}
            />
          </div>
        </div>
      </div>
      <CardContent className="p-6 pt-0">
        {photos.length > 0 ? (
          <PhotoManager photos={photos} albumId={albumId} onPhotosUpdated={onPhotosUpdated} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">No photos yet</div>
        )}
      </CardContent>

      {album && (
        <AlbumSettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          album={{
            id: album.id,
            name: album.title,
            is_public: album.is_public,
            cover_image_id: album.cover_image_id,
          }}
          photos={photos}
          onSettingsUpdated={onPhotosUpdated}
        />
      )}
    </Card>
  )
}
