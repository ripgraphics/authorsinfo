"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function updatePublisher(id: string, formData: FormData) {
  const supabase = createClient()

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const website = formData.get("website") as string
  const founded = formData.get("founded") as string
  const logoFile = formData.get("logo") as File

  // Prepare update data
  const updateData: any = {
    name,
    description,
    website,
    founded: founded ? Number.parseInt(founded) : null,
  }

  // Handle logo upload if a new file was provided
  if (logoFile && logoFile.size > 0) {
    // First, get the current publisher to check if we need to remove an old logo
    const { data: currentPublisher } = await supabase.from("publishers").select("logo_url").eq("id", id).single()

    // If there's an existing logo, remove it to avoid orphaned files
    if (currentPublisher?.logo_url) {
      const oldLogoPath = currentPublisher.logo_url.split("/").pop()
      if (oldLogoPath) {
        await supabase.storage.from("publisher-logos").remove([oldLogoPath])
      }
    }

    // Upload the new logo
    const fileExt = logoFile.name.split(".").pop()
    const fileName = `${id}-${Date.now()}.${fileExt}`

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from("publisher-logos")
      .upload(fileName, logoFile)

    if (uploadError) {
      console.error("Error uploading logo:", uploadError)
      return { success: false, error: "Failed to upload logo" }
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage.from("publisher-logos").getPublicUrl(fileName)

    // Add the logo URL to the update data
    updateData.logo_url = urlData.publicUrl
  }

  // Update the publisher record
  const { error } = await supabase.from("publishers").update(updateData).eq("id", id)

  if (error) {
    console.error("Error updating publisher:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/publisher/${id}`)
  return { success: true }
}
