import { notFound } from "next/navigation"
import { ClientGroupPage } from "./client"
import { supabaseClient } from "@/lib/supabase/client"

export const dynamic = "force-dynamic"

interface GroupPageProps {
  params: { id: string }
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set. Please set it in your .env.local file.");
  }

  // Fetch all group fields from the new API endpoint
  const res = await fetch(`${baseUrl}/api/groups/${id}`, { cache: 'no-store' })
  const group = await res.json()

  if (!group || group.error || !group.name) {
    notFound()
  }

  console.log('Group data:', {
    id: group.id,
    name: group.name,
    cover_image_url: group.cover_image_url,
    group_image_url: group.group_image_url
  })

  // Use the image URLs directly from the API response
  const avatarUrl = group.group_image_url || "/placeholder.svg?height=200&width=200"
  const coverImageUrl = group.cover_image_url || "/placeholder.svg?height=400&width=1200"

  return (
    <div>
      <ClientGroupPage
        group={group}
        avatarUrl={avatarUrl}
        coverImageUrl={coverImageUrl}
        params={{ id }}
      />
    </div>
  )
}