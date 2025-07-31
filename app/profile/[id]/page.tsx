import { supabaseAdmin } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ClientProfilePage } from "./client"

export const dynamic = "force-dynamic"

interface ProfilePageProps {
  params: { id: string }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params

  try {
    // First, try to find user by permalink
    let user = null
    let error = null

    // Check if the ID looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)

    if (isUUID) {
      // Try to find by UUID first
      const { data: uuidUser, error: uuidError } = await supabaseAdmin
        .from('users')
        .select('name, email, created_at, permalink')
        .eq('id', id)
        .single()

      if (!uuidError && uuidUser) {
        user = uuidUser
      } else {
        // If not found by UUID, try by permalink
        const { data: permalinkUser, error: permalinkError } = await supabaseAdmin
          .from('users')
          .select('name, email, created_at, permalink')
          .eq('permalink', id)
          .single()

        if (!permalinkError && permalinkUser) {
          user = permalinkUser
        } else {
          error = permalinkError
        }
      }
    } else {
      // Try to find by permalink
      const { data: permalinkUser, error: permalinkError } = await supabaseAdmin
        .from('users')
        .select('name, email, created_at, permalink')
        .eq('permalink', id)
        .single()

      if (!permalinkError && permalinkUser) {
        user = permalinkUser
      } else {
        error = permalinkError
      }
    }

    if (error || !user) {
      console.error("User not found:", error)
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