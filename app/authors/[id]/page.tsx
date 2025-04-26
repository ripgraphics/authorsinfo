"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
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

interface AuthorPageProps {
  params: {
    id: string
  }
}

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
      <div className="min-h-screen flex flex-col bg-gray-100">
        <PageHeader />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading author information...</p>
        </main>
      </div>
    )
  }

  if (!author) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <PageHeader />
        <main className="flex-1 flex items-center justify-center">
          <p>Author not found</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <PageHeader />

      <main className="flex-1">
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
            {/* Left Column - Author Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>About</CardTitle>
                  {!editMode && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit Bio</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[625px]">
                        <DialogHeader>
                          <DialogTitle>Edit Biography</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <Textarea
                            id="bio-edit"
                            name="bio"
                            rows={10}
                            value={editedAuthor.bio || ""}
                            onChange={handleInputChange}
                            placeholder="Enter author biography..."
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setEditedAuthor((prev) => ({ ...prev, bio: author.bio }))}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleBioSave}
                          >
                            Save
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {editMode ? (
                    <Textarea
                      name="bio"
                      value={editedAuthor.bio || ""}
                      onChange={handleInputChange}
                      rows={8}
                      placeholder="Enter author biography..."
                    />
                  ) : author.bio ? (
                    <div>
                      <p>{author.bio}</p>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">No biography available for this author.</div>
                  )}
                </CardContent>
              </Card>

              {/* Social Media Links */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Web & Social Media</CardTitle>
                  {!editMode && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit Social Media</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[625px]">
                        <DialogHeader>
                          <DialogTitle>Edit Web & Social Media</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="website-edit" className="text-right">
                              Website
                            </Label>
                            <Input
                              id="website-edit"
                              name="website"
                              value={editedAuthor.website || ""}
                              onChange={handleInputChange}
                              placeholder="https://example.com"
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="twitter-edit" className="text-right">
                              Twitter
                            </Label>
                            <Input
                              id="twitter-edit"
                              name="twitter_handle"
                              value={editedAuthor.twitter_handle || ""}
                              onChange={handleInputChange}
                              placeholder="@username"
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="facebook-edit" className="text-right">
                              Facebook
                            </Label>
                            <Input
                              id="facebook-edit"
                              name="facebook_handle"
                              value={editedAuthor.facebook_handle || ""}
                              onChange={handleInputChange}
                              placeholder="username or page name"
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="instagram-edit" className="text-right">
                              Instagram
                            </Label>
                            <Input
                              id="instagram-edit"
                              name="instagram_handle"
                              value={editedAuthor.instagram_handle || ""}
                              onChange={handleInputChange}
                              placeholder="username"
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="goodreads-edit" className="text-right">
                              Goodreads
                            </Label>
                            <Input
                              id="goodreads-edit"
                              name="goodreads_url"
                              value={editedAuthor.goodreads_url || ""}
                              onChange={handleInputChange}
                              placeholder="https://www.goodreads.com/author/show/..."
                              className="col-span-3"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              setEditedAuthor((prev) => ({
                                ...prev,
                                website: author.website,
                                twitter_handle: author.twitter_handle,
                                facebook_handle: author.facebook_handle,
                                instagram_handle: author.instagram_handle,
                                goodreads_url: author.goodreads_url,
                              }))
                            }
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSocialMediaSave}
                          >
                            Save
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  {editMode ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <Input
                          name="website"
                          value={editedAuthor.website || ""}
                          onChange={handleInputChange}
                          placeholder="Website URL"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Twitter className="h-4 w-4 text-muted-foreground" />
                        <Input
                          name="twitter_handle"
                          value={editedAuthor.twitter_handle || ""}
                          onChange={handleInputChange}
                          placeholder="Twitter handle"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Facebook className="h-4 w-4 text-muted-foreground" />
                        <Input
                          name="facebook_handle"
                          value={editedAuthor.facebook_handle || ""}
                          onChange={handleInputChange}
                          placeholder="Facebook handle"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-muted-foreground" />
                        <Input
                          name="instagram_handle"
                          value={editedAuthor.instagram_handle || ""}
                          onChange={handleInputChange}
                          placeholder="Instagram handle"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {author.website && (
                        <a
                          href={author.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span>{author.website}</span>
                        </a>
                      )}
                      {author.twitter_handle && (
                        <a
                          href={`https://twitter.com/${author.twitter_handle.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Twitter className="h-4 w-4 text-muted-foreground" />
                          <span>{author.twitter_handle}</span>
                        </a>
                      )}
                      {author.facebook_handle && (
                        <a
                          href={`https://facebook.com/${author.facebook_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Facebook className="h-4 w-4 text-muted-foreground" />
                          <span>{author.facebook_handle}</span>
                        </a>
                      )}
                      {author.instagram_handle && (
                        <a
                          href={`https://instagram.com/${author.instagram_handle.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Instagram className="h-4 w-4 text-muted-foreground" />
                          <span>{author.instagram_handle}</span>
                        </a>
                      )}
                      {author.goodreads_url && (
                        <a
                          href={author.goodreads_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:underline"
                        >
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span>Goodreads Profile</span>
                        </a>
                      )}
                      {!author.website &&
                        !author.twitter_handle &&
                        !author.facebook_handle &&
                        !author.instagram_handle &&
                        !author.goodreads_url && (
                          <p className="text-muted-foreground">No social media links available.</p>
                        )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Books by {author.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {books.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {books.map((book) => (
                        <Link key={book.id} href={`/books/${book.id}`} className="block">
                          <div className="aspect-[2/3] rounded-md overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                            {book.cover_image_url ? (
                              <Image
                                src={book.cover_image_url}
                                alt={book.title}
                                width={150}
                                height={225}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <BookOpen className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No books found for this author.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Discussions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add Comment Form */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src="/placeholder.svg" alt="User" />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Input placeholder="Start a discussion about this author..." />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button>Post</Button>
                    </div>
                  </div>

                  <Separator />

                  {/* No Discussions Yet */}
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No discussions yet. Be the first to start a conversation!</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Author Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Books</span>
                      <span className="font-medium">{books.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Followers</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ratings</span>
                      <span className="font-medium">0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Similar Authors */}
              <Card>
                <CardHeader>
                  <CardTitle>Similar Authors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Recommendations coming soon</p>
                  </div>
                </CardContent>
              </Card>

              {/* Reading Challenge */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    <span>Reading Challenge</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      You haven't added any books by {author.name} to your reading challenge yet.
                    </p>
                    <Button className="mt-4">Add to Challenge</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
