"use server"

import { supabaseAdmin } from "@/lib/supabase/server"

type CloudinaryFolder = "bookcovers" | "authorimage" | "authorgallery" | "bookgallery" | "page_cover" | "author_covers"
type ImageType = "book_cover" | "author_image" | "author_gallery" | "book_gallery" | "page_cover" | "author_cover"

// Map folder names to image type IDs
const folderToImageTypeId: Record<CloudinaryFolder, string> = {
  bookcovers: "1", // book_cover
  authorimage: "22", // author_image
  authorgallery: "23", // author_gallery
  bookgallery: "24", // book_gallery
  page_cover: "25", // page_cover
  author_covers: "26", // author_cover
}

export async function uploadImage(
  base64Image: string,
  folder: CloudinaryFolder = "bookcovers",
  altText = "",
): Promise<{ url: string; imageId: string } | null> {
  try {
    // Extract the base64 data part if it's a complete data URL
    const base64Data = base64Image.includes("base64,") ? base64Image.split("base64,")[1] : base64Image

    // Get the cloud name from environment variables
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Missing Cloudinary credentials")
      return null
    }

    // Generate a timestamp
    const timestamp = Math.floor(Date.now() / 1000).toString()

    // Create the folder path
    const folderPath = `authorsinfo/${folder}`

    // Create a simple signature with minimal parameters
    // This is the most reliable approach
    const stringToSign = `folder=${folderPath}&timestamp=${timestamp}${apiSecret}`
    console.log("String to sign:", stringToSign)

    // Generate signature using Web Crypto API
    const encoder = new TextEncoder()
    const data = encoder.encode(stringToSign)
    const hashBuffer = await crypto.subtle.digest("SHA-1", data)

    // Convert the hash buffer to a hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const signature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

    // Direct upload to Cloudinary using their REST API
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

    // Create the form data for the upload
    const formData = new URLSearchParams()
    formData.append("file", `data:image/jpeg;base64,${base64Data}`)
    formData.append("api_key", apiKey)
    formData.append("timestamp", timestamp)
    formData.append("signature", signature)
    formData.append("folder", folderPath)
    formData.append("alt", altText || "Image")

    console.log("Uploading to Cloudinary with params:", {
      url: uploadUrl,
      folder: folderPath,
      timestamp,
      signature,
    })

    // Make the request
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Cloudinary upload failed: ${response.status} ${errorText}`)
      return null
    }

    const uploadData = await response.json()
    console.log("Upload successful:", uploadData.secure_url)

    // Get the image type ID based on the folder
    const imgTypeId = folderToImageTypeId[folder]

    // Insert the image into the database with proper metadata
    const { data: imageData, error: imageError } = await supabaseAdmin
      .from("images")
      .insert({
        url: uploadData.secure_url,
        alt_text: altText,
        img_type_id: imgTypeId,
      })
      .select("id")
      .single()

    if (imageError) {
      console.error("Error saving image to database:", imageError)
      return null
    }

    return {
      url: uploadData.secure_url,
      imageId: imageData.id,
    }
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error)
    return null
  }
}

export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    if (!publicId) return false

    // Call our secure deletion endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/cloudinary/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicId }),
    })

    if (!response.ok) {
      throw new Error(`Deletion failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.success
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error)
    return false
  }
}

// Helper function to extract public ID from Cloudinary URL
// Making this async to comply with Server Actions requirements
export async function getPublicIdFromUrl(url: string): Promise<string | null> {
  try {
    // Extract the public ID from a URL like:
    // https://res.cloudinary.com/[cloud_name]/image/upload/v1234567890/authorsinfo/bookcovers/image123.jpg
    const regex = /\/v\d+\/(.+)\.\w+$/
    const match = url.match(regex)

    if (match && match[1]) {
      return match[1]
    }

    return null
  } catch (error) {
    console.error("Error extracting public ID from URL:", error)
    return null
  }
}

export async function replaceImage(
  oldImageUrl: string | null,
  newBase64Image: string,
  folder: CloudinaryFolder = "bookcovers",
  altText = "",
): Promise<{ url: string; imageId: string } | null> {
  try {
    // Upload the new image first
    const newImageData = await uploadImage(newBase64Image, folder, altText)

    // If upload successful and there was an old image, delete it
    if (newImageData && oldImageUrl) {
      const publicId = await getPublicIdFromUrl(oldImageUrl)
      if (publicId) {
        await deleteImage(publicId)
      }
    }

    return newImageData
  } catch (error) {
    console.error("Error replacing image:", error)
    return null
  }
}
