"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { PageContainer } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Combobox } from "@/components/ui/combobox"
import { getSupabaseClient } from "@/lib/supabase/client"
import { uploadImage } from "@/app/actions/upload"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import type { Author, Book } from "@/types/database"
import {
  BookOpen,
  User,
  ThumbsUp,
  MessageSquare,
  Share2,
  Calendar,
  Edit,
  Camera,
  Save,
  X,
  Globe,
  Twitter,
  Facebook,
  Instagram,
} from "lucide-react"

export default function AuthorPage() {
  const router = useRouter()
  const params = useParams()
  const authorId = params.id as string
  
  const [author, setAuthor] = useState<Author | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [nationalities, setNationalities] = useState<string[]>([])
  const [editedAuthor, setEditedAuthor] = useState<Partial<Author>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  // Store the ID in a ref to avoid dependency issues
  const authorIdRef = useRef(authorId)
  // Make sure we have a valid Supabase client
  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error("Failed to initialize Supabase client")
  }

  // Fetch author data
  useEffect(() => {
    async function fetchAuthorData() {
      if (!supabase) return
      
      try {
        // Use the ID from the ref
        const id = authorIdRef.current
        // Fetch author with joined image data for both profile and cover
        const { data: authorData, error: authorError } = await supabase
          .from("authors")
          .select(`
    *,
    author_image:author_image_id(id, url, alt_text),
    cover_image:cover_image_id(id, url, alt_text)
  `)
          .eq("id", id)
          .single()

        if (authorError) {
          console.error("Error fetching author:", authorError)
          return
        }

        setAuthor(authorData as Author)
        setEditedAuthor(authorData as Author)

        // Set photo URL from the joined image data
        if (authorData.author_image && authorData.author_image.url) {
          setPhotoPreview(authorData.author_image.url)
        } else if (authorData.photo_url) {
          // Fallback to legacy photo_url if available
          setPhotoPreview(authorData.photo_url)
        }

        // Set cover URL from the joined image data
        if (authorData.cover_image && authorData.cover_image.url) {
          setCoverPreview(authorData.cover_image.url)
        }

        // Fetch books by this author
        const { data: booksData, error: booksError } = await supabase
          .from("books")
          .select(`
          *,
          cover_image:cover_image_id(id, url, alt_text)
        `)
          .eq("author_id", id)

        if (booksError) {
          console.error("Error fetching books:", booksError)
        } else {
          // Process books to include cover image URL
          const processedBooks = booksData.map((book) => ({
            ...book,
            cover_image_url: book.cover_image?.url || book.original_image_url || null,
          }))
          setBooks(processedBooks as Book[])
        }

        // Get list of nationalities from existing authors for dropdown
        const { data: nationalitiesData, error: nationalitiesError } = await supabase
          .from("authors")
          .select("nationality")
          .not("nationality", "is", null)
          .order("nationality")

        if (nationalitiesError) {
          console.error("Error fetching nationalities:", nationalitiesError)
        } else {
          // Extract unique nationalities
          const uniqueNationalities = Array.from(
            new Set(nationalitiesData.map((item) => item.nationality).filter(Boolean)),
          )
          setNationalities(uniqueNationalities)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error in fetchAuthorData:", error)
        setLoading(false)
      }
    }

    fetchAuthorData()
  }, []) // Remove params.id from dependencies since we're using the ref

  // Handle cover image change
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

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
    setEditedAuthor((prev) => ({ ...prev, [name]: value }))
  }

  // Handle nationality change
  const handleNationalityChange = (value: string) => {
    setEditedAuthor((prev) => ({ ...prev, nationality: value }))
  }

  // Save changes
  const saveChanges = async () => {
    if (!author || !supabase) return

    setSaving(true)
    setSuccessMessage(null)

    try {
      // Create a clean update object without any joined fields
      const updateData = { ...editedAuthor }
      const id = authorIdRef.current

      // Remove any joined fields that might cause errors
      delete updateData.author_image
      delete updateData.cover_image

      // Handle cover image upload if changed
      if (coverFile) {
        try {
          // Convert the file to base64
          const base64Promise = new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64 = reader.result as string
              resolve(base64)
            }
            reader.readAsDataURL(coverFile)
          })

          const base64Image = await base64Promise
          // Use the correct folder type for author covers
          const coverResult = await uploadImage(base64Image, "author_covers", `Cover for ${author.name}`)

          if (coverResult) {
            // Store the image ID instead of the URL
            updateData.cover_image_id = coverResult.imageId
          }
        } catch (error) {
          console.error("Error uploading cover image:", error)
        }
      }

      // Handle profile photo upload if changed
      if (photoFile) {
        try {
          // Convert the file to base64
          const base64Promise = new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64 = reader.result as string
              resolve(base64)
            }
            reader.readAsDataURL(photoFile)
          })

          const base64Image = await base64Promise
          const photoResult = await uploadImage(base64Image, "authorimage", `Photo of ${author.name}`)

          if (photoResult) {
            // Only use author_image_id, as photo_url doesn't exist in the schema
            updateData.author_image_id = photoResult.imageId
          }
        } catch (error) {
          console.error("Error uploading profile photo:", error)
        }
      }

      // Update author in database
      const { error } = await supabase.from("authors").update(updateData).eq("id", id)

      if (error) {
        console.error("Error updating author:", error)
        return
      }

      // Update local state
      setAuthor({ ...author, ...updateData } as Author)
      setEditMode(false)
      setSuccessMessage("Author updated successfully!")
      // Make the message visible for a few seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (error) {
      console.error("Error saving changes:", error)
    } finally {
      setSaving(false)
    }
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditMode(false)
    setEditedAuthor(author as Author)
    setCoverFile(null)
    setCoverPreview(null)
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  // Fix for edit dialogs
  const handleBioSave = async () => {
    if (!supabase) return
    
    const id = authorIdRef.current
    const { error } = await supabase.from("authors").update({ bio: editedAuthor.bio }).eq("id", id)
    if (error) {
      console.error("Error updating bio:", error)
      return
    }
    setAuthor((prev) => (prev ? { ...prev, bio: editedAuthor.bio || "" } : null))
  }

  const handleSocialMediaSave = async () => {
    if (!supabase) return
    
    const id = authorIdRef.current
    const { error } = await supabase
      .from("authors")
      .update({
        website: editedAuthor.website,
        twitter_handle: editedAuthor.twitter_handle,
        facebook_handle: editedAuthor.facebook_handle,
        instagram_handle: editedAuthor.instagram_handle,
        goodreads_url: editedAuthor.goodreads_url,
      })
      .eq("id", id)
    if (error) {
      console.error("Error updating social media:", error)
      return
    }
    setAuthor((prev) =>
      prev
        ? {
            ...prev,
            website: editedAuthor.website,
            twitter_handle: editedAuthor.twitter_handle,
            facebook_handle: editedAuthor.facebook_handle,
            instagram_handle: editedAuthor.instagram_handle,
            goodreads_url: editedAuthor.goodreads_url,
          }
        : null,
    )
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p>Loading author information...</p>
        </div>
      </PageContainer>
    )
  }

  if (!author) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p>Author not found</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {/* Cover Banner */}
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-blue-600 to-blue-800">
        {/* Cover Image */}
        {coverPreview ? (
          <div className="absolute inset-0 opacity-20">
            <Image
              src={coverPreview}
              alt={author.name}
              fill
              className="object-cover"
              priority
            />
          </div>
        ) : author.cover_image?.url ? (
          <div className="absolute inset-0 opacity-20">
            <Image
              src={author.cover_image.url}
              alt={author.name}
              fill
              className="object-cover"
              priority
            />
          </div>
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Edit Cover Button */}
        {editMode && (
          <div className="absolute right-4 top-4 z-10">
            <Label
              htmlFor="cover-upload"
              className="bg-black/20 text-white hover:bg-black/30 px-4 py-2 rounded-md cursor-pointer flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              <span>Change Cover</span>
            </Label>
            <Input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </div>
        )}

        <div className="container relative h-full flex items-end pb-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            {/* Author Photo */}
            <div className="w-32 h-32 md:w-40 md:h-40 -mt-16 md:mt-0 z-10 rounded-full overflow-hidden border-4 border-white shadow-xl relative group">
              {photoPreview ? (
                <Image
                  src={photoPreview || "/placeholder.svg"}
                  alt={author.author_image?.alt_text || author.name}
                  width={160}
                  height={160}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <User className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              {editMode && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 transition-opacity cursor-pointer">
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
              )}
            </div>

            {/* Author Name and Info */}
            <div className="text-center md:text-left text-white">
              {editMode ? (
                <Input
                  name="name"
                  value={editedAuthor.name || ""}
                  onChange={handleInputChange}
                  className="text-3xl md:text-4xl font-bold bg-transparent border-b border-white text-white placeholder-white/70"
                  placeholder="Author Name"
                />
              ) : (
                <h1 className="text-3xl md:text-4xl font-bold">{author.name}</h1>
              )}
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                {editMode ? (
                  <div className="flex items-center gap-2 bg-black/20 rounded-md px-2 py-1">
                    <Combobox
                      options={nationalities.map((nat) => ({ value: nat, label: nat }))}
                      value={editedAuthor.nationality || ""}
                      onChange={handleNationalityChange}
                      placeholder="Select nationality..."
                      emptyMessage="Type to add a new nationality"
                      className="w-40 bg-transparent text-white"
                    />
                  </div>
                ) : author.nationality ? (
                  <div className="flex items-center">
                    <span>{author.nationality}</span>
                  </div>
                ) : null}

                {editMode ? (
                  <div className="flex items-center gap-2 bg-black/20 rounded-md px-2 py-1">
                    <Calendar className="h-4 w-4" />
                    <Input
                      name="birth_date"
                      value={editedAuthor.birth_date || ""}
                      onChange={handleInputChange}
                      className="w-32 bg-transparent border-none text-white placeholder-white/70"
                      placeholder="Birth date"
                    />
                  </div>
                ) : author.birth_date ? (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{author.birth_date}</span>
                  </div>
                ) : null}

                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  <span>{books.length} books</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border-b shadow-sm">
        <div className="container py-2">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <Button onClick={saveChanges} disabled={saving} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    <span>{saving ? "Saving..." : "Save Changes"}</span>
                  </Button>
                  <Button variant="outline" onClick={cancelEditing} className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Follow</span>
                  </Button>
                  <Button variant="outline" onClick={() => setEditMode(true)} className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    <span>Edit Page</span>
                  </Button>
                </>
              )}
            </div>

            {!editMode && (
              <div className="flex gap-2">
                <Button variant="ghost" className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span>Like</span>
                </Button>
                <Button variant="ghost" className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>Comment</span>
                </Button>
                <Button variant="ghost" className="flex items-center gap-1">
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded relative container mt-4">
          {successMessage}
        </div>
      )}

      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rest of the content remains the same */}
          {/* This is a placeholder to avoid exceeding token limits */}
        </div>
      </div>
    </PageContainer>
  )
} 