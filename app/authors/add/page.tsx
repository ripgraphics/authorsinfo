"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabaseClient } from "@/lib/supabase/client"
import { uploadImage } from "@/app/actions/upload"
import { User, Camera } from "lucide-react"
import { Combobox } from "@/components/ui/combobox"

export default function AddAuthorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [nationalities, setNationalities] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: "",
    nationality: "",
    birth_date: "",
    bio: "",
    website: "",
    twitter_handle: "",
    facebook_handle: "",
    instagram_handle: "",
    goodreads_url: "",
  })

  // Fetch nationalities on component mount
  useEffect(() => {
    async function fetchNationalities() {
      try {
        const { data, error } = await supabaseClient
          .from("authors")
          .select("nationality")
          .not("nationality", "is", null)
          .order("nationality")

        if (error) {
          console.error("Error fetching nationalities:", error)
          return
        }

        // Extract unique nationalities
        const uniqueNationalities = Array.from(new Set(data.map((item: { nationality: string | null }) => item.nationality).filter(Boolean) as string[]))
        setNationalities(uniqueNationalities)
      } catch (error) {
        console.error("Error fetching nationalities:", error)
      }
    }

    fetchNationalities()
  }, [])

  // Handle profile photo change
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle nationality change
  const handleNationalityChange = (value: string) => {
    setFormData((prev) => ({ ...prev, nationality: value }))
  }

  // Save author
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let photoUrl = null

      // Upload profile photo if provided
      if (photoFile) {
        const reader = new FileReader()
        reader.readAsDataURL(photoFile)
        reader.onload = async () => {
          const base64Image = reader.result as string
          photoUrl = await uploadImage(base64Image, "authors/photos", formData.name)
        }
      }

      // Create author in database
      const { data, error } = await (supabaseClient
        .from("authors") as any)
        .insert({
          ...formData,
          photo_url: photoUrl,
        })
        .select()

      if (error) {
        console.error("Error creating author:", error)
        return
      }

      // Redirect to the new author page
      if (data && data.length > 0) {
        router.push(`/authors/${data[0].id}`)
      }
    } catch (error) {
      console.error("Error saving author:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <PageHeader />
      <main className="flex-1 container py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Add New Author</h1>

          <Card>
            <CardHeader>
              <CardTitle>Author Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Author Photo */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl relative">
                      {photoPreview ? (
                        <img
                          src={photoPreview || "/placeholder.svg"}
                          alt="Author preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <User className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                        <Label
                          htmlFor="photo-upload"
                          className="w-full h-full flex items-center justify-center cursor-pointer"
                        >
                          <Camera className="h-8 w-8 text-white" />
                        </Label>
                        <Input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoChange}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Upload author photo</p>
                  </div>

                  {/* Basic Info */}
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Author's full name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nationality">Nationality</Label>
                      <Combobox
                        options={nationalities.map((nat) => ({ value: nat, label: nat }))}
                        value={formData.nationality}
                        onChange={handleNationalityChange}
                        placeholder="Select nationality..."
                        emptyMessage="Type to add a new nationality"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birth_date">Birth Date</Label>
                      <Input
                        id="birth_date"
                        name="birth_date"
                        value={formData.birth_date}
                        onChange={handleInputChange}
                        placeholder="YYYY-MM-DD or text format"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biography</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Author's biography..."
                    rows={6}
                  />
                </div>

                <h3 className="text-lg font-semibold pt-4">Web & Social Media</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter_handle">Twitter</Label>
                    <Input
                      id="twitter_handle"
                      name="twitter_handle"
                      value={formData.twitter_handle}
                      onChange={handleInputChange}
                      placeholder="@username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebook_handle">Facebook</Label>
                    <Input
                      id="facebook_handle"
                      name="facebook_handle"
                      value={formData.facebook_handle}
                      onChange={handleInputChange}
                      placeholder="username or page name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram_handle">Instagram</Label>
                    <Input
                      id="instagram_handle"
                      name="instagram_handle"
                      value={formData.instagram_handle}
                      onChange={handleInputChange}
                      placeholder="username"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="goodreads_url">Goodreads URL</Label>
                    <Input
                      id="goodreads_url"
                      name="goodreads_url"
                      value={formData.goodreads_url}
                      onChange={handleInputChange}
                      placeholder="https://www.goodreads.com/author/show/..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" type="button" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Author"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
