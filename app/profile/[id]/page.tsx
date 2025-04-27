import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import type { User } from "@/types/database"
import { ClientProfilePage } from "./client"
import { PageHeader } from "@/components/page-header"

interface ProfilePageProps {
  params: { id: string }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  // Initialize Supabase auth-helpers client for server components
  const supabase = createServerComponentClient({ cookies })

  // Fetch the user record (id, name, and email)
  const { data: userRow, error } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("id", params.id)
    .single()

  if (error || !userRow) {
    return notFound()
  }

  // Map to our User interface for the client component
  const user: User = {
    id: userRow.id,
    username: userRow.name,
    email: userRow.email,
    full_name: userRow.name,
  }

  // Use placeholder URLs until real images are added
  const avatarUrl = user.avatar_url || "/placeholder.svg?height=200&width=200"
  const coverImageUrl = "/placeholder.svg?height=400&width=1200"

  return (
    <>
      <PageHeader />
      <ClientProfilePage
        user={user}
        avatarUrl={avatarUrl}
        coverImageUrl={coverImageUrl}
        params={params}
      />
    </>
  )
} 