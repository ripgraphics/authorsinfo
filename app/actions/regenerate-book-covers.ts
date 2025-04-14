"use server"

import { supabaseAdmin } from "@/lib/supabase/server"
import { uploadImage, deleteImage, getPublicIdFromUrl } from "@/app/actions/upload"

type RegenerationProgress = {
  processed: number
  total: number
  currentBatch: number
  totalBatches: number
  lastProcessedId: string | null
  errors: Array<{ id: string; error: string }>
  success: Array<{ id: string; oldUrl: string | null; newUrl: string }>
}

export async function getBookCoverRegenerationCandidates(
  batchSize: number,
  lastProcessedId: string | null = null,
  filterEmptyCovers = true,
) {
  try {
    let query = supabaseAdmin
      .from("books")
      .select("id, title, original_image_url, cover_image_url, cover_image_id")
      .not("original_image_url", "is", null)

    // Option to filter books with empty cover images (represented as {})
    if (filterEmptyCovers) {
      query = query.or("cover_image_url.is.null,cover_image_url.eq.{}")
    }

    // If we have a last processed ID, start after that one
    if (lastProcessedId) {
      query = query.gt("id", lastProcessedId)
    }

    // Order by ID to ensure consistent pagination
    query = query.order("id").limit(batchSize)

    const { data, error } = await query

    if (error) {
      console.error("Error fetching books for cover regeneration:", error)
      return { books: [], total: 0 }
    }

    // Get total count for progress tracking
    const { count, error: countError } = await supabaseAdmin
      .from("books")
      .select("id", { count: "exact", head: true })
      .not("original_image_url", "is", null)

    if (countError) {
      console.error("Error counting books for regeneration:", countError)
      return { books: data, total: data.length }
    }

    return { books: data, total: count || 0 }
  } catch (error) {
    console.error("Error in getBookCoverRegenerationCandidates:", error)
    return { books: [], total: 0 }
  }
}

export async function regenerateBookCovers(
  batchSize: number,
  maxWidth: number,
  maxHeight: number,
  lastProcessedId: string | null = null,
  filterEmptyCovers = true,
): Promise<RegenerationProgress> {
  try {
    const { books, total } = await getBookCoverRegenerationCandidates(batchSize, lastProcessedId, filterEmptyCovers)

    const progress: RegenerationProgress = {
      processed: 0,
      total,
      currentBatch: 1,
      totalBatches: Math.ceil(total / batchSize),
      lastProcessedId: lastProcessedId,
      errors: [],
      success: [],
    }

    if (!books.length) {
      return progress
    }

    // Process each book in the batch
    for (const book of books) {
      try {
        // Skip if no original image URL
        if (!book.original_image_url) {
          progress.errors.push({
            id: book.id,
            error: "No original image URL",
          })
          continue
        }

        // Delete existing cover image if it exists
        if (book.cover_image_url) {
          const publicId = await getPublicIdFromUrl(book.cover_image_url)
          if (publicId) {
            await deleteImage(publicId)
          }
        }

        // Fetch the original image and convert to base64
        const imageResponse = await fetch(book.original_image_url)
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch original image: ${imageResponse.statusText}`)
        }

        const imageBuffer = await imageResponse.arrayBuffer()
        const base64Image = Buffer.from(imageBuffer).toString("base64")

        // Upload the new image with transformations
        const uploadResult = await uploadImage(base64Image, "bookcovers", `Book cover for: ${book.title}`)

        if (!uploadResult) {
          throw new Error("Failed to upload image to Cloudinary")
        }

        // Update the book record with the new image URL and ID
        const { error: updateError } = await supabaseAdmin
          .from("books")
          .update({
            cover_image_url: uploadResult.url,
            cover_image_id: uploadResult.imageId,
          })
          .eq("id", book.id)

        if (updateError) {
          throw new Error(`Failed to update book record: ${updateError.message}`)
        }

        // Add to success list
        progress.success.push({
          id: book.id,
          oldUrl: book.cover_image_url,
          newUrl: uploadResult.url,
        })
      } catch (error) {
        console.error(`Error processing book ${book.id}:`, error)
        progress.errors.push({
          id: book.id,
          error: error instanceof Error ? error.message : String(error),
        })
      }

      // Update progress
      progress.processed++
      progress.lastProcessedId = book.id
    }

    return progress
  } catch (error) {
    console.error("Error in regenerateBookCovers:", error)
    throw error
  }
}

export async function getTotalBooksWithOriginalImages(): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin
      .from("books")
      .select("id", { count: "exact", head: true })
      .not("original_image_url", "is", null)

    if (error) {
      console.error("Error counting books with original images:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Error counting books with original images:", error)
    return 0
  }
}

export async function getTotalBooksWithEmptyCovers(): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin
      .from("books")
      .select("id", { count: "exact", head: true })
      .not("original_image_url", "is", null)
      .or("cover_image_url.is.null,cover_image_url.eq.{}")

    if (error) {
      console.error("Error counting books with empty covers:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Error counting books with empty covers:", error)
    return 0
  }
}
