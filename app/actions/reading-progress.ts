"use server"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createServerActionClientAsync } from "@/lib/supabase/client-helper"

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
    const supabase = await createServerActionClientAsync()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { progress: null, error: "User not authenticated" }
    }

    // Get the user's reading progress for this book
    const { data, error } = await supabase
      .from("reading_progress")
      .select("*")
      .eq("book_id", bookId)
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching reading progress:", error)
      return { progress: null, error: error.message }
    }

    return { progress: data, error: null }
  } catch (error) {
    console.error("Error in getUserReadingProgress:", error)
    return { progress: null, error: "An unexpected error occurred" }
  }
}

export async function updateReadingProgress(progress: Partial<ReadingProgress>) {
  try {
    const supabase = await createServerActionClientAsync()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Check if a record already exists
    const { data: existingProgress } = await supabase
      .from("reading_progress")
      .select("*")
      .eq("book_id", progress.book_id || '')
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
        } as any)
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
        } as any)
        .select()

      result = { data, error }
    }

    if (result.error) {
      console.error("Error updating reading progress:", result.error)
      return { success: false, error: result.error.message }
    }

    // Create activity for timeline
    try {
      // Get book details for the activity
      const { data: book } = await supabase
        .from("books")
        .select("id, title, author_id")
        .eq("id", progress.book_id)
        .single()

      if (book) {
        // Get author details if available
        let authorName = "Unknown Author"
        if (book.author_id) {
          const { data: author } = await supabase
            .from("authors")
            .select("id, name")
            .eq("id", book.author_id)
            .single()
          
          if (author) {
            authorName = author.name
          }
        }

        // Determine activity type based on status
        let activityType = "book_added"
        let activityData: any = {
          book_title: book.title,
          book_author: authorName,
          shelf: progress.status === "not_started" ? "Want to Read" : 
                 progress.status === "in_progress" ? "Currently Reading" :
                 progress.status === "completed" ? "Read" :
                 progress.status === "on_hold" ? "On Hold" : "Abandoned"
        }

        // Create the activity
        const { error: activityError } = await supabase
          .from("activities")
          .insert({
            user_id: user.id,
            activity_type: activityType,
            entity_type: "book",
            entity_id: book.id,
            data: activityData,
            metadata: {
              privacy_level: progress.privacy_level || "private",
              engagement_count: 0,
              is_premium: false
            }
          })

        if (activityError) {
          console.error("Error creating activity:", activityError)
          // Don't fail the whole operation if activity creation fails
        }
      }
    } catch (activityError) {
      console.error("Error creating activity for reading progress:", activityError)
      // Don't fail the whole operation if activity creation fails
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
    const supabase = await createServerActionClientAsync()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Delete the reading progress
    const { error } = await supabase
      .from("reading_progress")
      .delete()
      .eq("book_id", bookId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error deleting reading progress:", error)
      return { success: false, error: error.message }
    }

    // Also delete from reading_status table if it exists
    try {
      await supabase
        .from("reading_status")
        .delete()
        .eq("book_id", bookId)
        .eq("user_id", user.id)
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
    const supabase = await createServerActionClientAsync()

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
    const supabase = await createServerActionClientAsync()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { stats: null, error: "User not authenticated" }
    }

    // Get reading statistics
    const { data, error } = await supabase
      .from("reading_progress")
      .select("status")
      .eq("user_id", user.id)

    if (error) {
      console.error("Error fetching reading stats:", error)
      return { stats: null, error: error.message }
    }

    // Calculate statistics
    const stats = {
      total_books: data.length,
      completed: data.filter((item) => item.status === "completed").length,
      in_progress: data.filter((item) => item.status === "in_progress").length,
      want_to_read: data.filter((item) => item.status === "not_started").length,
      on_hold: data.filter((item) => item.status === "on_hold").length,
      abandoned: data.filter((item) => item.status === "abandoned").length,
    }

    return { stats, error: null }
  } catch (error) {
    console.error("Error in getReadingStats:", error)
    return { stats: null, error: "An unexpected error occurred" }
  }
}

export async function getFriendsReadingActivity(limit = 10) {
  try {
    const supabase = await createServerActionClientAsync()

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
      console.error("Error fetching friends reading activity:", error)
      return { activity: [], error: error.message }
    }

    // Process the data to include cover image URL and user name
    const processedActivity = data.map((item) => ({
      ...item,
      book_title: item.book?.title || "Unknown Book",
      user_name: item.user?.name || "Unknown User",
      cover_image_url: item.book_cover?.cover_image?.url || null,
    }))

    return { activity: processedActivity, error: null }
  } catch (error) {
    console.error("Error in getFriendsReadingActivity:", error)
    return { activity: [], error: "An unexpected error occurred" }
  }
}
