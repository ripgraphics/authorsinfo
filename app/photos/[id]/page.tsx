import { supabaseAdmin } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

export const dynamic = "force-dynamic"

interface PhotoPageProps {
  params: Promise<{ id: string }>
}

export default async function PhotoPage({ params }: PhotoPageProps) {
  const { id } = await params

  // Fetch photo data
  const { data: photo, error } = await supabaseAdmin
    .from('photos')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !photo) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Photo</CardTitle>
        </CardHeader>
        <CardContent>
          {photo.url && (
            <div className="relative w-full aspect-square mb-4">
              <Image
                src={photo.url}
                alt={photo.alt_text || photo.description || 'Photo'}
                fill
                className="object-contain rounded-lg"
              />
            </div>
          )}
          {photo.description && (
            <p className="text-muted-foreground">{photo.description}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}