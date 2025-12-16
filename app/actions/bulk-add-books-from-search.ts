"use server"

import { supabaseAdmin } from "@/lib/supabase/server"
import { ISBNdbDataCollector } from "@/lib/isbndb-data-collector"
import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

interface BulkAddResult {
  success: boolean
  added: number
  duplicates: number
  errors: number
  errorDetails: string[]
  bookIds: string[]
}

export async function bulkAddBooksFromSearch(
  bookObjects: any[]
): Promise<BulkAddResult> {
  const result: BulkAddResult = {
    success: true,
    added: 0,
    duplicates: 0,
    errors: 0,
    errorDetails: [],
    bookIds: [],
  }

  if (!bookObjects || bookObjects.length === 0) {
    result.success = false
    result.errorDetails.push("No books provided")
    return result
  }

  try {
    // Use ISBNdbDataCollector to store books with ALL available data
    const apiKey = process.env.ISBNDB_API_KEY || ""
    const collector = new ISBNdbDataCollector(apiKey)

    // Book Cover entity type ID
    const bookCoverEntityTypeId = "9d91008f-4f24-4501-b18a-922e2cfd6d34"

    // Process each book
    for (const bookData of bookObjects) {
      try {
        // Check if book already exists
        const isbn = bookData.isbn13 || bookData.isbn
        if (!isbn) {
          result.errors++
          result.errorDetails.push(`Skipping "${bookData.title}": No ISBN found`)
          continue
        }

        const { extractISBNs } = await import("@/utils/isbnUtils")
        const { isbn10, isbn13 } = extractISBNs({
          isbn: bookData.isbn,
          isbn13: bookData.isbn13,
        })

        // Check for existing book
        const { data: existingBook } = await supabaseAdmin
          .from("books")
          .select("id")
          .or(`isbn13.eq.${isbn13 || ""},isbn10.eq.${isbn10 || ""}`)
          .maybeSingle()

        if (existingBook) {
          result.duplicates++
          result.bookIds.push(existingBook.id)
          continue
        }

        // Upload image to Cloudinary if available
        let coverImageId: number | null = null
        const imageUrl = bookData.image_original || bookData.image
        let cloudinaryUrl: string | null = null

        if (imageUrl) {
          try {
            // Upload to Cloudinary - this handles URLs directly
            console.log(`📤 Uploading image for "${bookData.title}" from: ${imageUrl.substring(0, 50)}...`)
            const uploadResult = await cloudinary.uploader.upload(imageUrl, {
              folder: "authorsinfo/bookcovers",
              transformation: [{ height: 900, crop: "fit", format: "webp" }],
            })

            if (!uploadResult || !uploadResult.secure_url) {
              throw new Error("Cloudinary upload returned no URL")
            }

            cloudinaryUrl = uploadResult.secure_url
            console.log(`✅ Uploaded to Cloudinary: ${cloudinaryUrl}`)

            // Create image record in database
            const { data: imageRow, error: imgError } = await supabaseAdmin
              .from("images")
              .insert({
                url: cloudinaryUrl,
                alt_text: bookData.title || "Book cover",
                entity_type_id: bookCoverEntityTypeId,
                metadata: {
                  cloudinary_public_id: uploadResult.public_id,
                  entity_type: "book",
                  entity_id: null, // Will be updated after book creation
                },
              })
              .select("id")
              .single()

            if (imageRow && !imgError) {
              coverImageId = imageRow.id
              console.log(`✅ Created image record with ID: ${coverImageId}`)
            } else {
              console.error(`❌ Failed to create image record:`, imgError)
              result.errorDetails.push(`Image upload succeeded but failed to create image record for "${bookData.title}": ${imgError?.message || "Unknown error"}`)
            }
          } catch (uploadError) {
            console.error(`❌ Failed to upload image for "${bookData.title}":`, uploadError)
            const errorMsg = uploadError instanceof Error ? uploadError.message : "Unknown upload error"
            result.errorDetails.push(`Failed to upload image for "${bookData.title}": ${errorMsg}`)
            // Continue without image - don't fail the whole operation
            // But we'll still try to use the original URL as fallback
            cloudinaryUrl = imageUrl
          }
        } else {
          console.log(`⚠️ No image URL found for "${bookData.title}"`)
        }

        // Store book with ALL ISBNdb data using the collector
        const storeResult = await collector.storeBookWithCompleteData(bookData)

        if (storeResult.action === "created" || storeResult.action === "updated") {
          const bookId = storeResult.book.id

          // Link cover image if we have one
          if (coverImageId) {
            try {
              console.log(`🔗 Linking image ${coverImageId} to book ${bookId}`)
              
              // Get existing image metadata
              const { data: existingImage, error: imageSelectError } = await supabaseAdmin
                .from("images")
                .select("metadata, url")
                .eq("id", coverImageId)
                .single()

              if (imageSelectError) {
                console.error("❌ Error fetching image metadata:", imageSelectError)
                result.errorDetails.push(`Failed to link image for "${bookData.title}": ${imageSelectError.message}`)
              } else {
                const cloudinaryPublicId = existingImage?.metadata?.cloudinary_public_id
                const imageUrlToUse = existingImage?.url || cloudinaryUrl || imageUrl

                // Update book with cover image
                const { error: updateBookError } = await supabaseAdmin
                  .from("books")
                  .update({
                    cover_image_id: coverImageId,
                    original_image_url: imageUrlToUse,
                  })
                  .eq("id", bookId)

                if (updateBookError) {
                  console.error("❌ Error updating book with cover image:", updateBookError)
                  result.errorDetails.push(`Failed to link image to book "${bookData.title}": ${updateBookError.message}`)
                } else {
                  console.log(`✅ Book updated with cover_image_id: ${coverImageId}`)
                  
                  // Update image metadata with book ID
                  const { error: updateImageError } = await supabaseAdmin
                    .from("images")
                    .update({
                      metadata: {
                        ...(existingImage?.metadata || {}),
                        cloudinary_public_id: cloudinaryPublicId,
                        entity_type: "book",
                        entity_id: bookId,
                      },
                    })
                    .eq("id", coverImageId)

                  if (updateImageError) {
                    console.error("⚠️ Error updating image metadata (non-critical):", updateImageError)
                    // Don't fail the whole operation for this
                  } else {
                    console.log(`✅ Image metadata updated with book ID`)
                  }
                }
              }
            } catch (imageError) {
              console.error(`❌ Error linking image for "${bookData.title}":`, imageError)
              result.errorDetails.push(`Failed to link image for "${bookData.title}": ${imageError instanceof Error ? imageError.message : "Unknown error"}`)
              // Continue - book was added successfully, just image linking failed
            }
          } else if (imageUrl && cloudinaryUrl) {
            // If we have a Cloudinary URL but no image record, create one
            console.log(`⚠️ No image record but have Cloudinary URL, creating record...`)
            try {
              const { data: imageRow, error: imgError } = await supabaseAdmin
                .from("images")
                .insert({
                  url: cloudinaryUrl,
                  alt_text: bookData.title || "Book cover",
                  entity_type_id: bookCoverEntityTypeId,
                  metadata: {
                    entity_type: "book",
                    entity_id: bookId,
                  },
                })
                .select("id")
                .single()

              if (imageRow && !imgError) {
                const { error: updateBookError } = await supabaseAdmin
                  .from("books")
                  .update({
                    cover_image_id: imageRow.id,
                    original_image_url: cloudinaryUrl,
                  })
                  .eq("id", bookId)

                if (!updateBookError) {
                  console.log(`✅ Created and linked image record: ${imageRow.id}`)
                }
              }
            } catch (error) {
              console.error("Error creating fallback image record:", error)
            }
          }

          result.added++
          result.bookIds.push(bookId)
        }
      } catch (error) {
        result.errors++
        const errorMsg =
          error instanceof Error
            ? error.message
            : `Failed to add "${bookData.title || "Unknown"}": Unknown error`
        result.errorDetails.push(errorMsg)
        console.error(`Error adding book:`, error)
      }
    }

    return result
  } catch (error) {
    result.success = false
    result.errors++
    result.errorDetails.push(
      `Bulk add error: ${error instanceof Error ? error.message : "Unknown error"}`
    )
    return result
  }
}

