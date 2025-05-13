import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera } from "lucide-react"
import { PhotoUpload } from "@/components/photo-upload"
import Link from "next/link"

interface PhotosListProps {
  photos: {
    id: string
    url: string
    alt: string
    uploadedAt?: string
  }[]
  photosCount: number
  entityId: string
  entityType: string
  onUploadComplete?: () => void
}

export function PhotosList({
  photos,
  photosCount,
  entityId,
  entityType,
  onUploadComplete
}: PhotosListProps) {
  return (
    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="space-y-1.5 p-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold leading-none tracking-tight">Photos · {photosCount}</h2>
        <PhotoUpload
          entityId={entityId}
          entityType={entityType}
          onUploadComplete={onUploadComplete}
        />
      </div>
      <CardContent className="p-6 pt-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.length > 0 ? (
            photos.map((photo) => (
              <div key={photo.id} className="aspect-square relative rounded-md overflow-hidden group">
                <img 
                  src={photo.url}
                  alt={photo.alt}
                  className="object-cover hover:scale-105 transition-transform absolute inset-0 w-full h-full"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="secondary" size="sm" className="opacity-100">
                    View
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center p-6">
              <p className="text-muted-foreground">No photos yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 