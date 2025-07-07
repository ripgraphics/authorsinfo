"use server"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"

export type ReadingProgressStatus = "not_started" | "in_progress" | "completed" | "on_hold" | "abandoned"

export type ReadingProgress = {
  id?: string
  user_id: string
  book_id: string
  status: ReadingProgressStatus
  current_page?: number
  total_pages?: number
  percentage?: number
  start_date?: string
  finish_date?: string
  notes?: string
  privacy_level?: string
  allow_friends?: boolean
  allow_followers?: boolean
  created_at?: string
  updated_at?: string
}

export async function getUserReadingProgress(bookId: string) {
  try {
    const supabase = createServerActionClient({ cookies })

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { progress: null, error: "User not authenticated" }
    }

    // Get the reading progress for this book and user
    const { data, error } = await supabase
      .from("reading_progress")
      .select("*")
      .eq("book_id", bookId)
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned" which is fine
      console.error("Error fetching reading progress:", error)
      return { progress: null, error: error.message }
    }

    return { progress: data as ReadingProgress | null, error: null }
  } catch (error) {
    console.error("Error in getUserReadingProgress:", error)
    return { progress: null, error: "An unexpected error occurred" }
  }
}

export async function updateReadingProgress(progress: Partial<ReadingProgress>) {
  try {
    const supabase = createServerActionClient({ cookies })

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Ensure user_id is set
    progress.user_id = user.id

    // Calculate percentage if current_page and total_pages are provided
    if (progress.current_page && progress.total_pages && progress.total_pages > 0) {
      progress.percentage = Math.min(100, Math.round((progress.current_page / progress.total_pages) * 100))
    }

    // Set finish_date if status is completed
    if (progress.status === "completed" && !progress.finish_date) {
      progress.finish_date = new Date().toISOString()
    }

    // Set start_date if status is in_progress and no start_date
    if (progress.status === "in_progress" && !progress.start_date) {
      progress.start_date = new Date().toISOString()
    }

    // Check if a record already exists
    const { data: existingProgress, error: checkError } = await supabase
      .from("reading_progress")
      .select("id")
      .eq("book_id", progress.book_id)
      .eq("user_id", user.id)
      .single()

    let result

    if (existingProgress) {
      // Update existing record
      const { data, error } = await supabase
        .from("reading_progress")
        .update({
          ...progress,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingProgress.id)
        .select()

      result = { data, error }
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from("reading_progress")
        .insert({
          ...progress,
          start_date: progress.start_date || new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          privacy_level: progress.privacy_level || 'private',
          allow_friends: progress.allow_friends !== undefined ? progress.allow_friends : false,
          allow_followers: progress.allow_followers !== undefined ? progress.allow_followers : false,
        })
        .select()

      result = { data, error }
    }

    if (result.error) {
      console.error("Error updating reading progress:", result.error)
      return { success: false, error: result.error.message }
    }

    // Also update the reading_status table if it exists (for backward compatibility)
    try {
      const statusMapping: Record<ReadingProgressStatus, string> = {
        not_started: "want_to_read",
        in_progress: "currently_reading",
        completed: "read",
        on_hold: "currently_reading",
        abandoned: "abandoned",
      }

      await supabase.from("reading_status").upsert({
        user_id: user.id,
        book_id: progress.book_id,
        status: statusMapping[progress.status as ReadingProgressStatus] || "want_to_read",
      })
    } catch (error) {
      console.log("Reading status table might not exist:", error)
      // Continue even if this fails
    }

    // Revalidate the book page
    if (progress.book_id) {
      revalidatePath(`/books/${progress.book_id}`)
    }

    return { success: true, progress: result.data?.[0] as ReadingProgress }
  } catch (error) {
    console.error("Error in updateReadingProgress:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function deleteReadingProgress(bookId: string) {
  try {
    const supabase = createServerActionClient({ cookies })

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Delete the reading progress
    const { error } = await supabase.from("reading_progress").delete().eq("book_id", bookId).eq("user_id", user.id)

    if (error) {
      console.error("Error deleting reading progress:", error)
      return { success: false, error: error.message }
    }

    // Also delete from reading_status if it exists
    try {
      await supabase.from("reading_status").delete().eq("book_id", bookId).eq("user_id", user.id)
    } catch (error) {
      console.log("Reading status table might not exist:", error)
      // Continue even if this fails
    }

    // Revalidate the book page
    revalidatePath(`/books/${bookId}`)

    return { success: true }
  } catch (error) {
    console.error("Error in deleteReadingProgress:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getRecentReadingActivity(limit = 5) {
  try {
    const supabase = createServerActionClient({ cookies })

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { activity: [], error: "User not authenticated" }
    }

    // Get the most recent reading progress updates
    const { data, error } = await supabase
      .from("reading_progress")
      .select(`
        *,
        book:book_id(id, title, cover_image_id),
        book_cover:book_id(cover_image:cover_image_id(url))
      `)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching reading activity:", error)
      return { activity: [], error: error.message }
    }

    // Process the data to include cover image URL
    const processedActivity = data.map((item) => ({
      ...item,
      book_title: item.book?.title || "Unknown Book",
      cover_image_url: item.book_cover?.cover_image?.url || null,
    }))

    return { activity: processedActivity, error: null }
  } catch (error) {
    console.error("Error in getRecentReadingActivity:", error)
    return { activity: [], error: "An unexpected error occurred" }
  }
}

export async function getReadingStats() {
  try {
    const supabase = createServerActionClient({ cookies })

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { stats: null, error: "User not authenticated" }
    }

    // Get counts by status
    const { data, error } = await supabase.from("reading_progress").select("status").eq("user_id", user.id)

    if (error) {
      console.error("Error fetching reading stats:", error)
      return { stats: null, error: error.message }
    }

    // Calculate counts
    const counts = {
      not_started: 0,
      in_progress: 0,
      completed: 0,
      on_hold: 0,
      abandoned: 0,
      total: data.length,
    }

    data.forEach((item) => {
      if (item.status && counts[item.status as keyof typeof counts] !== undefined) {
        counts[item.status as keyof typeof counts]++
      }
    })

    // Get books completed this year
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString()
    const { data: completedThisYear, error: yearError } = await supabase
      .from("reading_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("finish_date", startOfYear)

    if (yearError) {
      console.error("Error fetching completed books:", yearError)
    }

    return {
      stats: {
        ...counts,
        completed_this_year: completedThisYear?.length || 0,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error in getReadingStats:", error)
    return { stats: null, error: "An unexpected error occurred" }
  }
}

export async function getFriendsReadingActivity(limit = 10) {
  try {
    const supabase = createServerActionClient({ cookies })

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { activity: [], error: "User not authenticated" }
    }

    // Get user's friends
    let friendIds: string[] = []

    try {
      // First check if the user has friends in the user_friends table
      const { data: friends } = await supabase
        .from("user_friends")
        .select("friend_id")
        .eq("user_id", user.id)
        .eq("status", "accepted")

      if (friends && friends.length > 0) {
        friendIds = friends.map((f) => f.friend_id)
      } else {
        // If no friends found, use a fallback to show some activity
        const { data: otherUsers } = await supabase.from("users").select("id").neq("id", user.id).limit(5)

        if (otherUsers && otherUsers.length > 0) {
          friendIds = otherUsers.map((u) => u.id)
        }
      }
    } catch (error) {
      console.log("Error fetching friends, using fallback:", error)

      // Fallback: get some other users
      const { data: otherUsers } = await supabase.from("users").select("id").neq("id", user.id).limit(5)

      if (otherUsers && otherUsers.length > 0) {
        friendIds = otherUsers.map((u) => u.id)
      }
    }

    if (friendIds.length === 0) {
      return { activity: [], error: "No friends found" }
    }

    // Get friends' public reading activity
    const { data, error } = await supabase
      .from("reading_progress")
      .select(`
        *,
        user:user_id(id, name, avatar_url),
        book:book_id(id, title, cover_image_id),
        book_cover:book_id(cover_image:cover_image_id(url))
      `)
      .in("user_id", friendIds)
      .or('privacy_level.eq.public,privacy_level.eq.friends')
      .order("updated_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching friends' reading activity:", error)
      return { activity: [], error: error.message }
    }

    // Process the data
    const processedActivity = data.map((item) => ({
      ...item,
      user_name: item.user?.name || "Unknown User",
      user_avatar: item.user?.avatar_url || null,
      book_title: item.book?.title || "Unknown Book",
      cover_image_url: item.book_cover?.cover_image?.url || null,
    }))

    return { activity: processedActivity, error: null }
  } catch (error) {
    console.error("Error in getFriendsReadingActivity:", error)
    return { activity: [], error: "An unexpected error occurred" }
  }
}
