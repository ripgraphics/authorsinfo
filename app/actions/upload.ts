"use server"
import { supabaseAdmin } from "@/lib/supabase/server"
import crypto from "crypto"

export async function uploadImage(
  base64Image: string,
  folder = "general",
  alt_text = "",
  maxWidth?: number,
  maxHeight?: number,
  entity_type_id?: string,
) {
  try {
    // Get Cloudinary credentials from environment variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Cloudinary credentials are not properly configured")
    }

    // Create a timestamp for the signature
    const timestamp = Math.round(new Date().getTime() / 1000)

    // Prepare transformation parameters if provided
    let transformationString = "f_webp"  // Always convert to WebP format
    if (maxWidth && maxHeight) {
      transformationString += `,c_fit,w_${maxWidth},h_${maxHeight}`
    } else if (maxWidth) {
      transformationString += `,c_fit,w_${maxWidth}`
    } else if (maxHeight) {
      transformationString += `,c_fit,h_${maxHeight}`
    }

    // Create the parameters object for signature
    const params: Record<string, string> = {
      timestamp: timestamp.toString(),
      folder: folder,
    }

    // Add transformation to params if it exists
    if (transformationString) {
      params.transformation = transformationString
    }

    // Sort parameters alphabetically by key as required by Cloudinary
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc: Record<string, string>, key) => {
        acc[key] = params[key]
        return acc
      }, {})

    // Create signature string from sorted parameters
    const signatureString =
      Object.entries(sortedParams)
        .map(([key, value]) => `${key}=${value}`)
        .join("&") + apiSecret

    // Generate the signature
    const signature = crypto.createHash("sha1").update(signatureString).digest("hex")

    // Prepare the form data
    // Handle both raw base64 strings and data URLs
    let base64Data = base64Image
    if (base64Image.startsWith('data:')) {
      // Extract base64 string from data URL if it's already a data URL
      const commaIndex = base64Image.indexOf(',')
      if (commaIndex !== -1) {
        base64Data = base64Image.substring(commaIndex + 1)
      }
    }
    
    const formData = new FormData()
    formData.append("file", `data:image/jpeg;base64,${base64Data}`)
    formData.append("api_key", apiKey)
    formData.append("timestamp", timestamp.toString())
    formData.append("signature", signature)
    formData.append("folder", folder)
    
    // Always add transformation, even if just WebP conversion
    formData.append("transformation", transformationString)

    // Upload to Cloudinary
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    })

    // Check if the response is ok
    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        console.error("Cloudinary rate limit exceeded. Waiting before retrying...")
        // Wait for 1 second before continuing
        await new Promise((resolve) => setTimeout(resolve, 1000))
        throw new Error("Cloudinary rate limit exceeded. Please try again in a moment.")
      }

      // For other errors, try to get the error text
      try {
        const errorText = await response.text()
        throw new Error(`Cloudinary upload failed: ${errorText}`)
      } catch (textError) {
        // If we can't even get the error text
        throw new Error(`Cloudinary upload failed with status: ${response.status}`)
      }
    }

    // Safely parse JSON
    let data
    try {
      data = await response.json()
    } catch (jsonError) {
      console.error("Error parsing Cloudinary response:", jsonError)
      throw new Error("Invalid response from Cloudinary. Could not parse JSON.")
    }

    // Get actual schema columns from Supabase by querying a sample row
    // (information_schema is not accessible via PostgREST)
    // Use Supabase as the one source of truth for the schema
    const { data: sampleImageRow, error: tableError } = await supabaseAdmin
      .from("images")
      .select('*')
      .limit(1)
      .maybeSingle()

    // Create a Set of available columns from the actual schema
    const availableColumns = new Set(sampleImageRow ? Object.keys(sampleImageRow) : [])

    // If we can't get the table structure, use minimal required fields
    if (tableError || !sampleImageRow) {
      console.warn("Could not determine images table structure, using minimal fields:", tableError?.message)
      // Fallback to minimal insert with only required fields
      const { data: imageData, error } = await supabaseAdmin
        .from("images")
        .insert([
          {
            url: data.secure_url,
            alt_text: alt_text || "",
            storage_provider: 'cloudinary',
            storage_path: folder,
            ...(availableColumns.has('metadata') ? { metadata: { cloudinary_public_id: data.public_id } } : {}),
          },
        ])
        .select()

      if (error) {
        console.error("Error inserting image record:", error)
        throw new Error(
          `Failed to create image record in database: ${error.message || 'Unknown error'}. ` +
          `Code: ${error.code || 'N/A'}. ` +
          `Details: ${error.details || 'N/A'}. ` +
          `Hint: ${error.hint || 'N/A'}`
        )
      }

      if (!imageData || imageData.length === 0) {
        throw new Error("Image upload succeeded but no image record was created in the database")
      }

      return {
        url: data.secure_url,
        publicId: data.public_id,
        imageId: imageData[0].id,
      }
    }

    // Build insert object using only columns that exist in the schema
    const insertObject: Record<string, any> = {
      url: data.secure_url,
      alt_text: alt_text || "",
      storage_provider: 'cloudinary',
      storage_path: folder,
    }

    // Only include columns that exist in the schema
    if (availableColumns.has('metadata')) {
      insertObject.metadata = { cloudinary_public_id: data.public_id }
    }

    // Add entity_type_id only if the column exists in the schema
    if (entity_type_id && availableColumns.has('entity_type_id')) {
      insertObject.entity_type_id = entity_type_id
    }

    // Store the Cloudinary public_id in a field that exists
    if (availableColumns.has('public_id')) {
      insertObject.public_id = data.public_id
    } else if (availableColumns.has('cloudinary_id')) {
      insertObject.cloudinary_id = data.public_id
    } else if (availableColumns.has('external_id')) {
      insertObject.external_id = data.public_id
    }

    // Add additional fields if they exist in the schema
    if (availableColumns.has('original_filename') && data.original_filename) {
      insertObject.original_filename = data.original_filename
    }
    if (availableColumns.has('file_size') && data.bytes) {
      insertObject.file_size = data.bytes
    }
    if (availableColumns.has('width') && data.width) {
      insertObject.width = data.width
    }
    if (availableColumns.has('height') && data.height) {
      insertObject.height = data.height
    }
    if (availableColumns.has('format') && data.format) {
      insertObject.format = data.format
    }
    if (availableColumns.has('mime_type') && data.resource_type) {
      insertObject.mime_type = `${data.resource_type}/${data.format}`
    }
    if (availableColumns.has('is_processed')) {
      insertObject.is_processed = true
    }
    if (availableColumns.has('processing_status')) {
      insertObject.processing_status = 'completed'
    }

    // Insert the image record into the database
    const { data: imageData, error } = await supabaseAdmin.from("images").insert([insertObject]).select()

    if (error) {
      console.error("Error inserting image record:", error)
      console.error("Insert object:", insertObject)
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      throw new Error(
        `Failed to create image record in database: ${error.message || 'Unknown error'}. ` +
        `Code: ${error.code || 'N/A'}. ` +
        `Details: ${error.details || 'N/A'}. ` +
        `Hint: ${error.hint || 'N/A'}`
      )
    }

    if (!imageData || imageData.length === 0) {
      console.error("No image data returned from insert")
      throw new Error("Image upload succeeded but no image record was created in the database")
    }

    return {
      url: data.secure_url,
      publicId: data.public_id,
      imageId: imageData[0].id,
    }
  } catch (error) {
    console.error("Error uploading image:", error)
    // Re-throw the error if it's already an Error instance with a message
    if (error instanceof Error) {
      throw error
    }
    // Otherwise, wrap it in a new Error
    throw new Error(`Failed to upload image: ${String(error)}`)
  }
}

export async function deleteImage(publicId: string) {
  try {
    // Get Cloudinary credentials from environment variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Cloudinary credentials are not properly configured")
    }

    // Create a timestamp for the signature
    const timestamp = Math.round(new Date().getTime() / 1000)

    // Create a signature string
    const signatureString = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash("sha1").update(signatureString).digest("hex")

    // Prepare the form data
    const formData = new FormData()
    formData.append("public_id", publicId)
    formData.append("api_key", apiKey)
    formData.append("timestamp", timestamp.toString())
    formData.append("signature", signature)

    // Delete from Cloudinary
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Cloudinary delete failed: ${errorText}`)
    }

    const data = await response.json()

    // Try to find the image by URL first since we don't know which field stores the public_id
    try {
      // Get the image URL from Cloudinary public_id
      const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`

      // Find images that might match this public_id
      const { data: images, error } = await supabaseAdmin
        .from("images")
        .select("*")
        .or(`url.ilike.%${publicId}%`)
        .limit(1)

      if (!error && images && images.length > 0) {
        // Delete the found image
        await supabaseAdmin.from("images").delete().eq("id", images[0].id)
      }
    } catch (findError) {
      console.error("Error finding image to delete:", findError)
      // Continue even if we can't find the image to delete
    }

    return data
  } catch (error) {
    console.error("Error deleting image:", error)
    return null
  }
}

export async function getPublicIdFromUrl(url: string): Promise<string | null> {
  try {
    // Check if the URL is empty or invalid
    if (!url || url === "{}" || url.includes("fetch:")) {
      return null
    }

    // Try to extract from the URL directly since we may not have public_id in the database
    // Example URL: https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg
    const match = url.match(/\/upload\/(?:v\d+\/)?([^/]+)\.\w+$/)
    if (match && match[1]) {
      return match[1]
    }

    // If we couldn't extract from URL, try the database as a fallback
    try {
      const { data, error } = await supabaseAdmin.from("images").select("*").eq("url", url).single()

      if (!error && data) {
        // Check various possible field names for the public_id
        if (data.public_id) return data.public_id
        if (data.cloudinary_id) return data.cloudinary_id
        if (data.external_id) return data.external_id
        if (data.metadata?.cloudinary_public_id) return data.metadata.cloudinary_public_id
      }
    } catch (dbError) {
      console.error("Error querying database for public_id:", dbError)
    }

    return null
  } catch (error) {
    console.error("Error getting public ID from URL:", error)
    return null
  }
}

export async function replaceImage(
  oldImageUrl: string | null,
  newBase64Image: string,
  folder = "general",
  altText = "",
  maxWidth?: number,
  maxHeight?: number,
): Promise<{ url: string; publicId: string; imageId: string } | null> {
  try {
    // Upload the new image first
    const newImageData = await uploadImage(newBase64Image, folder, altText, maxWidth, maxHeight)

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
