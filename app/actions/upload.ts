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

    // Create a signature string
    const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash("sha1").update(signatureString).digest("hex")

    // Prepare the form data
    const formData = new FormData()
    formData.append("file", `data:image/jpeg;base64,${base64Image}`)
    formData.append("api_key", apiKey)
    formData.append("timestamp", timestamp.toString())
    formData.append("signature", signature)
    formData.append("folder", folder)

    // Add transformation parameters if provided
    let transformationString = ""
    if (maxWidth && maxHeight) {
      transformationString = `c_fit,w_${maxWidth},h_${maxHeight}`
    } else if (maxWidth) {
      transformationString = `c_fit,w_${maxWidth}`
    } else if (maxHeight) {
      transformationString = `c_fit,h_${maxHeight}`
    }

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

    // Insert the image record into the database
    const { data: imageData, error } = await supabaseAdmin
      .from("images")
      .insert([
        {
          url: data.secure_url,
          public_id: data.public_id,
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

    // Delete the image record from the database
    const { error } = await supabaseAdmin.from("images").delete().eq("public_id", publicId)

    if (error) {
      console.error("Error deleting image record:", error)
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

    // Query the database first to get the public_id
    const { data, error } = await supabaseAdmin.from("images").select("public_id").eq("url", url).single()

    if (!error && data && data.public_id) {
      return data.public_id
    }

    // If not found in the database, try to extract from the URL
    // Example URL: https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg
    const match = url.match(/\/upload\/(?:v\d+\/)?([^/]+)\.\w+$/)
    if (match && match[1]) {
      return match[1]
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
