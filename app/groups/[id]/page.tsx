import { supabaseAdmin } from "@/lib/supabase"
import { notFound } from "next/navigation"
// Removed User import since passing only name
import { ClientGroupPage } from "./client"
import { PageContainer } from "@/components/page-container"

export const dynamic = "force-dynamic"

interface GroupPageProps {
  params: { id: string }
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params

  // Fetch only the user's name
  const { data: row, error } = await supabaseAdmin
    .from('groups')
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
  const group = { name: row.name }

  return (
    <PageContainer>
      <ClientGroupPage
        group={group}
        avatarUrl={avatarUrl}
        coverImageUrl={coverImageUrl}
        params={{ id }}
      />
    </PageContainer>
  )
}