import { supabaseAdmin } from "@/lib/supabase"
import { notFound } from "next/navigation"
// Removed User import since passing only name
import { ClientProfilePage } from "./client"
import { PageContainer } from "@/components/page-container"

export const dynamic = "force-dynamic"

interface ProfilePageProps {
  params: { id: string }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params

  // Fetch only the user's name
  const { data: row, error } = await supabaseAdmin
    .from('users')
    .select('name')
    .eq('id', id)
    .single()

  if (error || !row?.name) {
    notFound()
  }

  // Use placeholders for avatar/cover since rest is mocked
  const avatarUrl = "/placeholder.svg?height=200&width=200"
  const coverImageUrl = "/placeholder.svg?height=400&width=1200"

  // Pass minimal user object containing only name
  const user = { name: row.name }

  return (
    <PageContainer>
      <ClientProfilePage
        user={user}
        avatarUrl={avatarUrl}
        coverImageUrl={coverImageUrl}
        params={{ id }}
      />
    </PageContainer>
  )
}