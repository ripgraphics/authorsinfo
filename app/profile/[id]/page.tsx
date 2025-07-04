import { supabaseAdmin } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ClientProfilePage } from "./client"

export const dynamic = "force-dynamic"

interface ProfilePageProps {
  params: { id: string }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params

  // Special case for the mock "current-user" ID
  if (id === "current-user") {
    // Return a dummy user for the mock current user
    return (
      <ClientProfilePage
        user={{ name: "Current User" }}
        avatarUrl="/placeholder.svg?height=200&width=200"
        coverImageUrl="/placeholder.svg?height=400&width=1200"
        params={{ id }}
      />
    )
  }

  try {
    // Fetch user data from the database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', id)
      .single()

    if (error || !user?.name) {
      notFound()
    }

    // Use placeholders for avatar/cover since we're mocking most of the data
    const avatarUrl = "/placeholder.svg?height=200&width=200"
    const coverImageUrl = "/placeholder.svg?height=400&width=1200"

    return (
      <ClientProfilePage
        user={user}
        avatarUrl={avatarUrl}
        coverImageUrl={coverImageUrl}
        params={{ id }}
      />
    )
  } catch (error) {
    console.error("Error loading user profile:", error)
    notFound()
  }
}