import { supabaseAdmin } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { ClientPhotoPage } from "./client"

export const dynamic = "force-dynamic"

interface PhotoPageProps {
  params: { id: string }
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
    <ClientPhotoPage
      photo={photo}
      params={{ id }}
    />
  )
}