import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import type { User } from "@/types/database"
import { ClientProfilePage } from "./client"

interface ProfilePageProps {
  params: {
    id: string
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params
  // Await cookie store before using it
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: cookieStore })

  // Fetch user data
  const { data: user, error } = await supabase
    .from("users")
    .select(`*
      , user_image:user_image_id(id, url, alt_text)
      , cover_image:cover_image_id(id, url, alt_text)
    `)
    .eq("id", id)
    .single()

  if (error || !user) {
    notFound()
  }

  // Get avatar URL
  const avatarUrl = user.user_image?.url || user.avatar_url || "/placeholder.svg?height=200&width=200"
  // Get cover URL
  const coverImageUrl = user.cover_image?.url || "/placeholder.svg?height=400&width=1200"

  return (
    <ClientProfilePage
      user={user as User}
      avatarUrl={avatarUrl}
      coverImageUrl={coverImageUrl}
      params={params}
    />
  )
} 