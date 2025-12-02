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
  problemTypes: string[] = ["empty", "broken", "null_id"],
) {
  try {
    let query = supabaseAdmin
      .from("books")
      .select("id, title, original_image_url, cover_image_id, images:cover_image_id(url, id)")
      .not("original_image_url", "is", null)

    // Option to filter books with problematic covers
    if (filterEmptyCovers) {
      // Instead of using a complex OR clause, we'll use separate queries for each problem type
      // and combine the results in JavaScript
      const bookIds = new Set<string>()

      // Process each problem type separately
      for (const problemType of problemTypes) {
        const problemQuery = supabaseAdmin.from("books").select("id").not("original_image_url", "is", null)

        if (problemType === "empty") {
          // Handle empty curly braces in images table
          const { data } = await supabaseAdmin
            .from("books")
            .select("id, images:cover_image_id(url)")
            .not("original_image_url", "is", null)
            .eq("images.url", "{}")

          if (data) {
            data.forEach((book: { id: string }) => bookIds.add(book.id))
          }
        } else if (problemType === "null") {
          // Handle NULL url in images table
          const { data } = await supabaseAdmin
            .from("books")
            .select("id, images:cover_image_id(url)")
            .not("original_image_url", "is", null)
            .is("images.url", null)

          if (data) {
            data.forEach((book: { id: string }) => bookIds.add(book.id))
          }
        } else if (problemType === "broken") {
          // Handle broken Cloudinary URLs with fetch: in them
          const { data } = await supabaseAdmin
            .from("books")
            .select("id, images:cover_image_id(url)")
            .not("original_image_url", "is", null)
            .ilike("images.url", "%fetch:%")

          if (data) {
            data.forEach((book: { id: string }) => bookIds.add(book.id))
          }
        } else if (problemType === "null_id") {
          // Handle NULL cover_image_id
          const { data } = await supabaseAdmin
            .from("books")
            .select("id")
            .not("original_image_url", "is", null)
            .is("cover_image_id", null)

          if (data) {
            data.forEach((book: { id: string }) => bookIds.add(book.id))
          }
        }
      }

      // If we have book IDs to process, filter the main query
      if (bookIds.size > 0) {
        // Convert Set to Array
        const idsArray = Array.from(bookIds)

        // If we have a last processed ID, filter out books we've already processed
        if (lastProcessedId) {
          const filteredIds = idsArray.filter((id) => id > lastProcessedId)

          // Sort and limit to batch size
          const batchIds = filteredIds.sort().slice(0, batchSize)

          if (batchIds.length > 0) {
            query = query.in("id", batchIds)
          } else {
            // No more books to process
            return { books: [], total: 0 }
          }
        } else {
          // Sort and limit to batch size
          const batchIds = idsArray.sort().slice(0, batchSize)
          query = query.in("id", batchIds)
        }
      } else {
        // No books match the problem types
        return { books: [], total: 0 }
      }
    } else {
      // If we're not filtering for problematic covers, just paginate by ID
      if (lastProcessedId) {
        query = query.gt("id", lastProcessedId)
      }

      // Order by ID to ensure consistent pagination
      query = query.order("id").limit(batchSize)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching books for cover regeneration:", error)
      return { books: [], total: 0 }
    }

    // Get total count for progress tracking
    let total = 0

    if (filterEmptyCovers) {
      // Use the alternative method to count problematic books
      total = await getTotalBooksWithProblematicCoversAlt()
    } else {
      // Count all books with original images
      const { count, error: countError } = await supabaseAdmin
        .from("books")
        .select("id", { count: "exact", head: true })
        .not("original_image_url", "is", null)

      if (countError) {
        console.error("Error counting books for regeneration:", countError)
        total = data.length
      } else {
        total = count || 0
      }
    }

    return { books: data, total }
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
  problemTypes: string[] = ["empty", "broken", "null_id", "null"],
): Promise<RegenerationProgress> {
  try {
    const { books, total } = await getBookCoverRegenerationCandidates(
      batchSize,
      lastProcessedId,
      filterEmptyCovers,
      problemTypes,
    )

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

    // First, check the structure of the images table to determine field names
    let imageTableFields: Record<string, boolean> = {}
    try {
      const { data: tableInfo, error: tableError } = await supabaseAdmin.from("images").select("*").limit(1)

      if (!tableError && tableInfo && tableInfo.length > 0) {
        // Create a map of field names that exist in the table
        imageTableFields = Object.keys(tableInfo[0]).reduce(
          (acc, key) => {
            acc[key] = true
            return acc
          },
          {} as Record<string, boolean>,
        )
      }
    } catch (error) {
      console.error("Error checking images table structure:", error)
      // Continue with default assumptions if we can't check the table
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

        // Check if we need to delete an existing image
        let existingImageUrl = null

        // If we have an images relation, check its URL
        // Note: images is an array from the relation query
        if (book.images && Array.isArray(book.images) && book.images.length > 0 && book.images[0]?.url) {
          existingImageUrl = book.images[0].url
        } else if (book.images && !Array.isArray(book.images) && (book.images as any).url) {
          // Fallback for non-array case (shouldn't happen but for type safety)
          existingImageUrl = (book.images as any).url
        }

        // Delete existing cover image if it exists and is not problematic
        if (existingImageUrl && existingImageUrl !== "{}" && !existingImageUrl.includes("fetch:")) {
          try {
            const publicId = await getPublicIdFromUrl(existingImageUrl)
            if (publicId) {
              await deleteImage(publicId)
            }
          } catch (deleteError) {
            console.warn(`Could not delete image for book ${book.id}:`, deleteError)
            // Continue with the process even if deletion fails
          }
        }

        // Fetch the original image and convert to base64
        let retries = 0
        const maxRetries = 3
        let uploadResult = null

        while (retries < maxRetries && !uploadResult) {
          try {
            const imageResponse = await fetch(book.original_image_url)
            if (!imageResponse.ok) {
              throw new Error(`Failed to fetch original image: ${imageResponse.statusText}`)
            }

            const imageBuffer = await imageResponse.arrayBuffer()
            const base64Image = Buffer.from(imageBuffer).toString("base64")

            // Upload the new image with transformations
            uploadResult = await uploadImage(
              base64Image,
              "bookcovers",
              `Book cover for: ${book.title}`,
              maxWidth,
              maxHeight,
            )
          } catch (error) {
            retries++
            console.warn(`Attempt ${retries}/${maxRetries} failed:`, error)

            // If it's a rate limit error, wait longer between retries
            if (error instanceof Error && error.message?.includes("rate limit")) {
              await new Promise((resolve) => setTimeout(resolve, 2000 * retries)) // Exponential backoff
            } else if (retries < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second before retry for other errors
            } else {
              // On final retry, rethrow the error
              throw error
            }
          }
        }

        if (!uploadResult) {
          throw new Error("Failed to upload image to Cloudinary after multiple retries")
        }

        // If the book had a cover_image_id, update the image record
        if (book.cover_image_id) {
          const { error: imageUpdateError } = await supabaseAdmin
            .from("images")
            .update({
              url: uploadResult.url,
            })
            .eq("id", book.cover_image_id)

          if (imageUpdateError) {
            console.warn(`Failed to update image record: ${imageUpdateError.message}`)
            // Continue even if this update fails
          }
        } else {
          // Create a new image record with the correct fields based on table structure
          const imageInsert: Record<string, any> = {
            url: uploadResult.url,
          }

          // Add the appropriate type field based on what exists in the table
          if (imageTableFields.img_type_id) {
            imageInsert.img_type_id = 1 // Assuming 1 is for book covers
          } else if (imageTableFields.type) {
            imageInsert.type = "book_cover"
          }

          // Add alt text if the field exists
          if (imageTableFields.alt_text) {
            imageInsert.alt_text = `Book cover for: ${book.title}`
          }

          // Create a new image record
          const { data: newImage, error: newImageError } = await supabaseAdmin
            .from("images")
            .insert(imageInsert)
            .select("id")
            .single()

          if (newImageError) {
            throw new Error(`Failed to create new image record: ${newImageError.message}`)
          }

          // Update the book with the new image ID
          const { error: updateBookError } = await supabaseAdmin
            .from("books")
            .update({
              cover_image_id: newImage.id,
            })
            .eq("id", book.id)

          if (updateBookError) {
            throw new Error(`Failed to update book with new image ID: ${updateBookError.message}`)
          }
        }

        // Add to success list
        progress.success.push({
          id: book.id,
          oldUrl: existingImageUrl,
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

// Simplified version that avoids complex OR clauses
export async function getTotalBooksWithProblematicCovers(): Promise<number> {
  try {
    // Just use the alternative method which is more reliable
    return await getTotalBooksWithProblematicCoversAlt()
  } catch (error) {
    console.error("Error counting books with problematic covers:", error)
    return 0
  }
}

// This is now our primary method for counting problematic covers
export async function getTotalBooksWithProblematicCoversAlt(): Promise<number> {
  try {
    // Count books with NULL cover_image_id
    const { count: nullId, error: nullIdError } = await supabaseAdmin
      .from("books")
      .select("id", { count: "exact", head: true })
      .not("original_image_url", "is", null)
      .is("cover_image_id", null)

    if (nullIdError) {
      console.error("Error counting books with NULL cover_image_id:", nullIdError)
      return 0
    }

    // Count books with problematic images (separate queries to avoid complex OR)
    let totalProblematicImages = 0

    try {
      // Count books with empty braces {} in images table
      const { count: emptyBraces } = await supabaseAdmin
        .from("books")
        .select("id, images:cover_image_id(url)", { count: "exact", head: true })
        .not("original_image_url", "is", null)
        .eq("images.url", "{}")

      totalProblematicImages += emptyBraces || 0
    } catch (error) {
      console.error("Error counting books with empty braces in images:", error)
    }

    try {
      // Count books with NULL url in images table
      const { count: nullUrl } = await supabaseAdmin
        .from("books")
        .select("id, images:cover_image_id(url)", { count: "exact", head: true })
        .not("original_image_url", "is", null)
        .is("images.url", null)

      totalProblematicImages += nullUrl || 0
    } catch (error) {
      console.error("Error counting books with NULL url in images:", error)
    }

    try {
      // Count books with broken URLs in images table
      const { count: brokenUrl } = await supabaseAdmin
        .from("books")
        .select("id, images:cover_image_id(url)", { count: "exact", head: true })
        .not("original_image_url", "is", null)
        .ilike("images.url", "%fetch:%")

      totalProblematicImages += brokenUrl || 0
    } catch (error) {
      console.error("Error counting books with broken URLs in images:", error)
    }

    return (nullId || 0) + totalProblematicImages
  } catch (error) {
    console.error("Error counting books with problematic covers (alt method):", error)
    return 0
  }
}

// Update the getProblematicCoverStats function to be more robust
export async function getProblematicCoverStats(): Promise<{
  emptyBraces: number
  nullUrl: number
  brokenUrl: number
  nullId: number
}> {
  try {
    // Initialize with default values
    let emptyBraces = 0
    let nullUrl = 0
    let brokenUrl = 0
    let nullId = 0

    // Count books with NULL cover_image_id but have original_image_url
    try {
      const { count, error } = await supabaseAdmin
        .from("books")
        .select("id", { count: "exact", head: true })
        .not("original_image_url", "is", null)
        .is("cover_image_id", null)

      if (!error) {
        nullId = count || 0
      } else {
        console.error("Error counting NULL cover_image_id:", error)
      }
    } catch (error) {
      console.error("Error counting NULL cover_image_id:", error)
    }

    // Count books with empty braces {} in images table
    try {
      const { count, error } = await supabaseAdmin
        .from("books")
        .select("id, images:cover_image_id(url)", { count: "exact", head: true })
        .eq("images.url", "{}")

      if (!error) {
        emptyBraces = count || 0
      } else {
        console.error("Error counting empty braces:", error)
      }
    } catch (error) {
      console.error("Error counting empty braces:", error)
    }

    // Count books with NULL url in images table
    try {
      const { count, error } = await supabaseAdmin
        .from("books")
        .select("id, images:cover_image_id(url)", { count: "exact", head: true })
        .is("images.url", null)

      if (!error) {
        nullUrl = count || 0
      } else {
        console.error("Error counting NULL url in images:", error)
      }
    } catch (error) {
      console.error("Error counting NULL url in images:", error)
    }

    // Count books with broken URLs in images table
    try {
      const { count, error } = await supabaseAdmin
        .from("books")
        .select("id, images:cover_image_id(url)", { count: "exact", head: true })
        .ilike("images.url", "%fetch:%")

      if (!error) {
        brokenUrl = count || 0
      } else {
        console.error("Error counting broken URLs:", error)
      }
    } catch (error) {
      console.error("Error counting broken URLs:", error)
    }

    return {
      emptyBraces,
      nullUrl,
      brokenUrl,
      nullId,
    }
  } catch (error) {
    console.error("Error getting problematic cover stats:", error)
    return {
      emptyBraces: 0,
      nullUrl: 0,
      brokenUrl: 0,
      nullId: 0,
    }
  }
}
