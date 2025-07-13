import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase"
import type { Group } from "@/types/group"
import { ClientGroupPage } from "./client"
import { getFollowers, getFollowersCount } from "@/lib/follows-server"
import { createClient } from '@/lib/supabase-server'

interface GroupPageProps {
  params: {
    id: string
  }
}

async function getGroup(id: string) {
  try {
    console.log("Fetching group with ID:", id)
    
    const { data: group, error } = await supabaseAdmin
      .from("groups")
      .select(`
        *
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching group:", error)
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return null
    }

    console.log("Group fetched successfully:", group ? "Found" : "Not found")
    return group as Group
  } catch (error) {
    console.error("Unexpected error fetching group:", error)
    return null
  }
}

async function getGroupMembers(groupId: string) {
  try {
    const { data: members, error } = await supabaseAdmin
      .from("group_members")
      .select(`
        user_id,
        status,
        joined_at
      `)
      .eq("group_id", groupId)
      .eq("status", "active")
      .order("joined_at", { ascending: false })

    if (error) {
      console.error("Error fetching group members:", error)
      return []
    }

    // Get user details for each member
    const membersWithDetails = []
    for (const member of members || []) {
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(member.user_id)
        if (!userError && userData.user) {
          membersWithDetails.push({
            ...member,
            user: {
              id: userData.user.id,
              name: userData.user.user_metadata?.name || userData.user.user_metadata?.full_name || 'Unknown User',
              email: userData.user.email || 'unknown@email.com',
              avatar_url: userData.user.user_metadata?.avatar_url || null
            }
          })
        }
      } catch (error) {
        console.error("Error fetching user details for member:", member.user_id, error)
        // Add member with fallback data
        membersWithDetails.push({
          ...member,
          user: {
            id: member.user_id,
            name: 'Unknown User',
            email: 'unknown@email.com',
            avatar_url: null
          }
        })
      }
    }

    return membersWithDetails
  } catch (error) {
    console.error("Error fetching group members:", error)
    return []
  }
}

async function getGroupBooks(groupId: string) {
  try {
    const { data: groupBooks, error } = await supabaseAdmin
      .from("group_books")
      .select(`
        book_id,
        added_at
      `)
      .eq("group_id", groupId)
      .order("added_at", { ascending: false })

    if (error) {
      console.error("Error fetching group books:", error)
      return []
    }

    if (!groupBooks || groupBooks.length === 0) {
      return []
    }

    // Get book details for each group book
    const bookIds = groupBooks.map(gb => gb.book_id)
    const { data: books, error: booksError } = await supabaseAdmin
      .from("books")
      .select(`
        id,
        title,
        cover_image:cover_image_id(id, url, alt_text),
        original_image_url
      `)
      .in("id", bookIds)

    if (booksError) {
      console.error("Error fetching books:", booksError)
      return []
    }

    return books || []
  } catch (error) {
    console.error("Error fetching group books:", error)
    return []
  }
}

async function getGroupDiscussions(groupId: string) {
  try {
    const { data: discussions, error } = await supabaseAdmin
      .from("discussions")
      .select(`
        id,
        title,
        content,
        created_at,
        user_id
      `)
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching group discussions:", error)
      return []
    }

    // Get user details for each discussion
    const discussionsWithDetails = []
    for (const discussion of discussions || []) {
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(discussion.user_id)
        if (!userError && userData.user) {
          discussionsWithDetails.push({
            ...discussion,
            user: {
              id: userData.user.id,
              name: userData.user.user_metadata?.name || userData.user.user_metadata?.full_name || 'Unknown User',
              email: userData.user.email || 'unknown@email.com',
              avatar_url: userData.user.user_metadata?.avatar_url || null
            }
          })
        }
      } catch (error) {
        console.error("Error fetching user details for discussion:", discussion.user_id, error)
        // Add discussion with fallback data
        discussionsWithDetails.push({
          ...discussion,
          user: {
            id: discussion.user_id,
            name: 'Unknown User',
            email: 'unknown@email.com',
            avatar_url: null
          }
        })
      }
    }

    return discussionsWithDetails
  } catch (error) {
    console.error("Error fetching group discussions:", error)
    return []
  }
}

async function getGroupActivities(groupId: string) {
  try {
    const { data: activities, error } = await supabaseAdmin
      .from("activities")
      .select(`
        id,
        activity_type,
        created_at,
        data,
        user_id
      `)
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Error fetching group activities:", error)
      return []
    }

    // Get user details for each activity
    const activitiesWithDetails = []
    for (const activity of activities || []) {
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(activity.user_id)
        if (!userError && userData.user) {
          activitiesWithDetails.push({
            ...activity,
            user: {
              id: userData.user.id,
              name: userData.user.user_metadata?.name || userData.user.user_metadata?.full_name || 'Unknown User',
              email: userData.user.email || 'unknown@email.com',
              avatar_url: userData.user.user_metadata?.avatar_url || null
            }
          })
        }
      } catch (error) {
        console.error("Error fetching user details for activity:", activity.user_id, error)
        // Add activity with fallback data
        activitiesWithDetails.push({
          ...activity,
          user: {
            id: activity.user_id,
            name: 'Unknown User',
            email: 'unknown@email.com',
            avatar_url: null
          }
        })
      }
    }

    return activitiesWithDetails
  } catch (error) {
    console.error("Error fetching group activities:", error)
    return []
  }
}

async function getGroupFollowers(groupId: string) {
  try {
    const { followers, count } = await getFollowers(groupId, 'group', 1, 50)
    return { followers, count }
  } catch (error) {
    console.error("Error fetching group followers:", error)
    return { followers: [], count: 0 }
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
  return `${Math.floor(diffInSeconds / 31536000)} years ago`
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  // Special case: if id is "add", redirect to the add page
  if (id === "add") {
    redirect("/groups/add")
  }

  try {
    console.log("Starting to fetch group data for ID:", id)
    
    const group = await getGroup(id)
    if (!group) {
      console.log("Group not found, redirecting to 404")
      notFound()
    }

    // Get group image URLs
    let groupImageUrl = group.cover_image_url || "/placeholder.svg?height=200&width=200"
    
    let coverImageUrl = group.cover_image_url || "/placeholder.svg?height=400&width=1200"

    // Fetch related data
    const [members, books, discussions, activities, { followers, count: followersCount }] = await Promise.all([
      getGroupMembers(id),
      getGroupBooks(id),
      getGroupDiscussions(id),
      getGroupActivities(id),
      getGroupFollowers(id)
    ])

    // Get current user for permissions
    const { data: { user } } = await supabase.auth.getUser()

    return (
      <ClientGroupPage
        group={group}
        groupImageUrl={groupImageUrl}
        coverImageUrl={coverImageUrl}
        params={{ id }}
        followers={followers}
        followersCount={followersCount}
        members={members}
        membersCount={members.length}
        books={books}
        booksCount={books.length}
        discussions={discussions}
        activities={activities}
        currentUser={user}
      />
    )
  } catch (error) {
    console.error("Error in GroupPage:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })
    return <div>Error loading group. Please try again later.</div>
  }
}