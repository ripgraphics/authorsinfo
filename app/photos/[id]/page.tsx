import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'

export const dynamic = 'force-dynamic'

interface PhotoPageProps {
  params: Promise<{ id: string }>
}

export default async function PhotoPage({ params }: PhotoPageProps) {
  const { id } = await params

  // Fetch photo data from Convex
  const photo = await fetchQuery(api.queries.photos.getPhoto, { id })

  if (!photo) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
            <CardTitle>{photo.alt_text || photo.caption || 'Photo'}</CardTitle>
        </CardHeader>
        <CardContent>
          {photo.url && (
            <div className="relative w-full aspect-square mb-4">
              <Image
                src={photo.url}
                  alt={photo.alt_text || photo.caption || 'Photo'}
                fill
                className="object-contain rounded-lg"
              />
            </div>
          )}
            {photo.caption && <p className="text-muted-foreground">{photo.caption}</p>}
          {photo.created_at && (
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(photo.created_at).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
