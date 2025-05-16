import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PhotoUploadDialog } from './photo-upload-dialog'
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
  }[]
  onAlbumUpdated: () => void
}

export function PhotoAlbumsList({ albums, onAlbumUpdated }: PhotoAlbumsListProps) {
  const router = useRouter()

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
              <PhotoUploadDialog
                albumId={album.id}
                onPhotosUploaded={onAlbumUpdated}
              />
              <AlbumSettingsDialog
                album={album}
                onSettingsUpdated={onAlbumUpdated}
              />
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
    </div>
  )
} 