"use server"
import { supabaseAdmin } from "@/lib/supabase/server"
import crypto from "crypto"

export async function uploadImage(
  base64Image: string,
  folder = "general",
  alt_text = "",
  maxWidth?: number,
  maxHeight?: number,
) {
  try {
    // Get Cloudinary credentials from environment variables
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Cloudinary credentials are not properly configured")
    }

    // Create a timestamp for the signature
    const timestamp = Math.round(new Date().getTime() / 1000)

    // Prepare transformation parameters if provided
    let transformationString = ""
    if (maxWidth && maxHeight) {
      transformationString = `c_fit,w_${maxWidth},h_${maxHeight}`
    } else if (maxWidth) {
      transformationString = `c_fit,w_${maxWidth}`
    } else if (maxHeight) {
      transformationString = `c_fit,h_${maxHeight}`
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
    const formData = new FormData()
    formData.append("file", `data:image/jpeg;base64,${base64Image}`)
    formData.append("api_key", apiKey)
    formData.append("timestamp", timestamp.toString())
    formData.append("signature", signature)
    formData.append("folder", folder)

    // Add transformation to form data if it exists
    if (transformationString) {
      formData.append("transformation", transformationString)
    }

    // Upload to Cloudinary
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Cloudinary upload failed: ${errorText}`)
    }

    const data = await response.json()

    // First, check the structure of the images table
    const { data: tableInfo, error: tableError } = await supabaseAdmin.from("images").select("*").limit(1)

    if (tableError) {
      console.error("Error checking images table structure:", tableError)
      // If we can't check the table structure, try a minimal insert
      const { data: imageData, error } = await supabaseAdmin
        .from("images")
        .insert([
          {
            url: data.secure_url,
            alt_text: alt_text || "",
            img_type_id: 1, // Assuming 1 is for book covers
          },
        ])
        .select()

      if (error) {
        console.error("Error inserting image record:", error)
        return null
      }

      return {
        url: data.secure_url,
        publicId: data.public_id, // We still return this for the function's API
        imageId: imageData[0].id,
      }
    }

    // Prepare the insert object based on the table structure
    const insertObject: Record<string, any> = {
      url: data.secure_url,
      alt_text: alt_text || "",
      img_type_id: 1, // Assuming 1 is for book covers
    }

    // Store the Cloudinary public_id in a field that exists
    // Try common field names that might exist
    if (tableInfo && tableInfo.length > 0) {
      const sampleRow = tableInfo[0]

      // Check if any of these fields exist in the table
      if ("public_id" in sampleRow) {
        insertObject.public_id = data.public_id
      } else if ("cloudinary_id" in sampleRow) {
        insertObject.cloudinary_id = data.public_id
      } else if ("external_id" in sampleRow) {
        insertObject.external_id = data.public_id
      } else if ("metadata" in sampleRow) {
        // If there's a metadata JSON field, we can store it there
        insertObject.metadata = { cloudinary_public_id: data.public_id }
      }

      // Add type field if it exists (instead of img_type_id)
      if ("type" in sampleRow) {
        insertObject.type = "book_cover"
        // Remove img_type_id if type exists
        delete insertObject.img_type_id
      }
    }

    // Insert the image record into the database
    const { data: imageData, error } = await supabaseAdmin.from("images").insert([insertObject]).select()

    if (error) {
      console.error("Error inserting image record:", error)
      return null
    }

    return {
      url: data.secure_url,
      publicId: data.public_id,
      imageId: imageData[0].id,
    }
  } catch (error) {
    console.error("Error uploading image:", error)
    return null
  }
}

export async function deleteImage(publicId: string) {
  try {
    // Get Cloudinary credentials from environment variables
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
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
