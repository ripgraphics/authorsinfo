import { notFound } from "next/navigation"
import { ClientGroupPage } from "./client"

export const dynamic = "force-dynamic"

interface GroupPageProps {
  params: { id: string }
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = params

  // Fetch all group fields from the new API endpoint
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/groups/${id}`, { cache: 'no-store' })
  const group = await res.json()

  if (!group || group.error || !group.name) {
    notFound()
  }

  // Use group-provided images if available, else fallback to placeholder
  const avatarUrl = group.avatar_url || "/placeholder.svg?height=200&width=200"
  const coverImageUrl = group.banner_image_url || "/placeholder.svg?height=400&width=1200"

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