"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { supabaseClient } from "@/lib/supabase/client"
import { uploadImage } from "@/app/actions/upload"
import { useGroup } from "@/contexts/GroupContext"

export default function GroupEditPage() {
  const params = useParams()
  const groupId = params.id as string
  const router = useRouter()
  const { group, permissions } = useGroup()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Set initial previews when group data is loaded
  useEffect(() => {
    if (group) {
      if (group.group_image_id) {
        // Fetch the image URL from the images table
        const fetchImageUrl = async () => {
          const { data: imageData } = await supabaseClient
            .from("images")
            .select("url")
            .eq("id", group.group_image_id)
          .single()

          if (imageData?.url) {
            setAvatarPreview(imageData.url)
          }
        }
        fetchImageUrl()
      }
      
      if (group.cover_image_id) {
        // Fetch the cover image URL from the images table
        const fetchCoverUrl = async () => {
          const { data: imageData } = await supabaseClient
            .from("images")
            .select("url")
            .eq("id", group.cover_image_id)
            .single()
          
          if (imageData?.url) {
            setCoverPreview(imageData.url)
        }
        }
        fetchCoverUrl()
      }
        setLoading(false)
      }
  }, [group])

  // Handle avatar image change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  // Handle cover image change
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!group) return

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const formData = new FormData(e.currentTarget)

      // Create update data object
      const updateData: any = {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        is_public: formData.get("is_public") === "true",
        is_discoverable: formData.get("is_discoverable") === "true",
        tags: (formData.get("tags") as string)?.split(",").map(tag => tag.trim()).filter(Boolean) || []
      }

      // Handle avatar upload if changed
      if (avatarFile) {
        try {
          // Convert the file to base64
            const reader = new FileReader()
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const base64 = reader.result as string
              resolve(base64)
            }
            reader.onerror = () => {
              reject(new Error("Failed to read file"))
            }
            reader.readAsDataURL(avatarFile)
          })

          const base64Image = await base64Promise
          console.log("Base64 image prepared, uploading to Cloudinary...")

          // Upload the new image to Cloudinary with alt text
          const groupName = formData.get("name") as string
          const uploadResult = await uploadImage(base64Image, "authorsinfo/group_avatar", `Avatar for ${groupName}`)

          if (uploadResult) {
            console.log("Image uploaded successfully:", uploadResult.url)
            // Insert into images table first
            const { data: imageData, error: imageError } = await supabaseClient
              .from('images')
              .insert({
                url: uploadResult.url,
                alt_text: `Avatar for ${groupName}`,
                img_type_id: 29, // group_avatar
                storage_provider: 'cloudinary',
                storage_path: 'authorsinfo/group_avatar',
                original_filename: avatarFile.name,
                file_size: avatarFile.size,
                mime_type: avatarFile.type,
                is_processed: true,
                processing_status: 'completed'
              })
              .select()
              .single()

            if (imageError) {
              throw new Error(`Failed to insert image record: ${imageError.message}`)
            }

            if (imageData) {
              // Store the image ID in the groups table
              updateData.group_image_id = imageData.id
            }
          } else {
            throw new Error("Failed to upload image - no URL returned")
          }
        } catch (uploadError) {
          console.error("Upload error details:", uploadError)
          setError(
            `Failed to upload group avatar: ${uploadError instanceof Error ? uploadError.message : "Unknown error"}`,
          )
          setSaving(false)
          return
        }
      }

      // Handle cover image upload if changed
      if (coverFile) {
        try {
          // Convert the file to base64
            const reader = new FileReader()
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const base64 = reader.result as string
              resolve(base64)
            }
            reader.onerror = () => {
              reject(new Error("Failed to read file"))
            }
            reader.readAsDataURL(coverFile)
          })

          const base64Image = await base64Promise
          console.log("Base64 image prepared, uploading cover to Cloudinary...")

          // Upload the new image to Cloudinary with alt text
          const groupName = formData.get("name") as string
          const uploadResult = await uploadImage(base64Image, "authorsinfo/group_cover", `Cover for ${groupName}`)

          if (uploadResult) {
            console.log("Cover uploaded successfully:", uploadResult.url)
            // Insert into images table first
            const { data: imageData, error: imageError } = await supabaseClient
              .from('images')
              .insert({
                url: uploadResult.url,
                alt_text: `Cover for ${groupName}`,
                img_type_id: 31, // group_cover
                storage_provider: 'cloudinary',
                storage_path: 'authorsinfo/group_cover',
                original_filename: coverFile.name,
                file_size: coverFile.size,
                mime_type: coverFile.type,
                is_processed: true,
                processing_status: 'completed'
              })
              .select()
              .single()

            if (imageError) {
              throw new Error(`Failed to insert image record: ${imageError.message}`)
            }

            if (imageData) {
              // Store the image ID in the groups table
              updateData.cover_image_id = imageData.id
            }
          } else {
            throw new Error("Failed to upload cover image - no URL returned")
          }
        } catch (uploadError) {
          console.error("Upload error details:", uploadError)
          setError(
            `Failed to upload group cover: ${uploadError instanceof Error ? uploadError.message : "Unknown error"}`,
          )
          setSaving(false)
          return
        }
      }

      // Update group in database
      console.log("Attempting to update group with data:", updateData)
      const { data: updateResult, error: updateError } = await supabaseClient
        .from("groups")
        .update(updateData)
        .eq("id", groupId)
        .select()

      if (updateError) {
        console.error("Detailed update error:", {
          error: updateError,
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        })
        setError(`Error updating group: ${updateError.message || 'Unknown error occurred'}`)
        setSaving(false)
        return
      }

      console.log("Group update result:", updateResult)
      setSuccessMessage("Group updated successfully!")

      // Redirect back to the group page after a short delay
      setTimeout(() => {
        router.push(`/groups/${groupId}`)
      }, 1500)
    } catch (error: any) {
      console.error("Error in handleSubmit:", error)
      setError("An unexpected error occurred while saving. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading group information...</p>
            </div>
          </div>
    )
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Group not found</p>
      </div>
    )
  }

  if (!permissions.isOwner() && !permissions.isAdmin()) {
    return (
          <div className="flex items-center justify-center h-full">
        <p>You don't have permission to edit this group</p>
      </div>
    )
  }

  return (
        <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Group</h1>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
        <Alert className="mb-6">
          <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={group.name}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={group.description}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  name="tags"
                  defaultValue={group.tags?.join(", ")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_public">Visibility</Label>
                <select
                  id="is_public"
                  name="is_public"
                  defaultValue={group.is_public ? "true" : "false"}
                  className="w-full p-2 border rounded"
                >
                  <option value="true">Public</option>
                  <option value="false">Private</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_discoverable">Discoverability</Label>
                <select
                  id="is_discoverable"
                  name="is_discoverable"
                  defaultValue={group.is_discoverable ? "true" : "false"}
                  className="w-full p-2 border rounded"
                >
                  <option value="true">Discoverable</option>
                  <option value="false">Hidden</option>
                </select>
                        </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Group Avatar</Label>
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-24 rounded-full overflow-hidden">
                        <Image
                      src={avatarPreview || "/placeholder.svg"}
                      alt="Group avatar"
                          fill
                          className="object-cover"
                        />
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="max-w-xs"
                        />
                    </div>
              </div>

              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="flex items-center gap-4">
                  <div className="relative h-32 w-full max-w-xs rounded-lg overflow-hidden">
                    <Image
                      src={coverPreview || "/placeholder.svg"}
                      alt="Group cover"
                      fill
                      className="object-cover"
                    />
                    </div>
                      <Input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="max-w-xs"
                      />
                    </div>
                      </div>
                    </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/groups/${groupId}`)}
          >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
            </div>
          </form>
    </div>
  )
}
