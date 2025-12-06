import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EnterpriseImageUpload } from '@/components/ui/enterprise-image-upload'
import { AlbumSettingsDialog } from './album-settings-dialog'
import { useRouter } from 'next/navigation'

interface PhotoAlbumsListProps {
  albums: {
    id: string
    name: string
    description?: string
    cover_image_url?: string
    photo_count: number
    created_at: string
    is_public?: boolean
    cover_image_id?: string
    metadata?: any
  }[]
  onAlbumUpdated: () => void
}

export function PhotoAlbumsList({ albums, onAlbumUpdated }: PhotoAlbumsListProps) {
  const router = useRouter()
  const [selectedAlbum, setSelectedAlbum] = useState<{
    id: string
    name: string
    is_public: boolean
    cover_image_id?: string
    metadata?: any
  } | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  if (albums.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No albums found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {albums.map((album) => (
        <Card key={album.id} className="overflow-hidden">
          <CardHeader className="p-0">
            <div className="aspect-video relative bg-muted">
              {album.cover_image_url ? (
                <img
                  src={album.cover_image_url}
                  alt={album.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No cover image
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <CardTitle className="text-lg mb-2">{album.name}</CardTitle>
            {album.description && (
              <p className="text-sm text-muted-foreground mb-2">{album.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {album.photo_count} {album.photo_count === 1 ? 'photo' : 'photos'}
            </p>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-between">
            <div className="flex space-x-2">
              <EnterpriseImageUpload
                entityId={album.id}
                entityType="user"
                context="album"
                albumId={album.id}
                onUploadComplete={onAlbumUpdated}
                buttonText="Add Photos"
                size="sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedAlbum({
                    id: album.id,
                    name: album.name,
                    is_public: album.is_public ?? false,
                    cover_image_id: album.cover_image_id,
                    metadata: album.metadata
                  })
                  setIsSettingsOpen(true)
                }}
              >
                Settings
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push(`/albums/${album.id}`)}
            >
              View Album
            </Button>
          </CardFooter>
        </Card>
      ))}
      {selectedAlbum && (
        <AlbumSettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => {
            setIsSettingsOpen(false)
            setSelectedAlbum(null)
          }}
          album={selectedAlbum}
          photos={[]}
          onSettingsUpdated={() => {
            onAlbumUpdated()
            setIsSettingsOpen(false)
            setSelectedAlbum(null)
          }}
        />
      )}
    </div>
  )
} 