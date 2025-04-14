"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { supabaseClient } from "@/lib/supabase/client"
import { uploadImage } from "@/app/actions/upload"
import {
  BookOpen,
  Building,
  ThumbsUp,
  MessageSquare,
  Share2,
  Calendar,
  Edit,
  Camera,
  Save,
  X,
  Globe,
  User,
} from "lucide-react"
import type { Publisher, Book } from "@/types/database"

interface PublisherPageProps {
  params: {
    id: string
  }
}

export default function PublisherPage({ params }: PublisherPageProps) {
  const [publisher, setPublisher] = useState<Publisher | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [editedPublisher, setEditedPublisher] = useState<Partial<Publisher>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch publisher data
  useEffect(() => {
    async function fetchPublisherData() {
      try {
        // Fetch publisher with joined image data
        const { data: publisherData, error: publisherError } = await supabaseClient
          .from("publishers")
          .select(`
            *,
            publisher_image:publisher_image_id(id, url, alt_text, img_type_id),
            cover_image:cover_image_id(id, url, alt_text, img_type_id),
            publisher_gallery:publisher_gallery_id(id, url, alt_text, img_type_id)
          `)
          .eq("id", params.id)
          .single()

        if (publisherError) {
          console.error("Error fetching publisher:", publisherError)
          return
        }

        setPublisher(publisherData as Publisher)
        setEditedPublisher(publisherData as Publisher)

        // Set logo preview if publisher_image exists
        if (publisherData.publisher_image?.url) {
          setLogoPreview(publisherData.publisher_image.url)
        }

        // Set cover preview if cover_image exists
        if (publisherData.cover_image?.url) {
          setCoverPreview(publisherData.cover_image.url)
        }

        // Fetch books by this publisher
        const { data: booksData, error: booksError } = await supabaseClient
          .from("books")
          .select(`
            *,
            cover_image:cover_image_id(id, url, alt_text)
          `)
          .eq("publisher_id", params.id)

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

        setLoading(false)
      } catch (error) {
        console.error("Error in fetchPublisherData:", error)
        setLoading(false)
      }
    }

    fetchPublisherData()
  }, [params.id])

  // Handle logo image change
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
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

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditedPublisher((prev) => ({ ...prev, [name]: value }))
  }

  // Save changes
  const saveChanges = async () => {
    if (!publisher) return

    setSaving(true)
    setSuccessMessage(null)

    try {
      // Create a clean update object
      const updateData = { ...editedPublisher }

      // Handle logo upload if changed
      if (logoFile) {
        try {
          // Convert the file to base64
          const base64Promise = new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64 = reader.result as string
              resolve(base64)
            }
            reader.readAsDataURL(logoFile)
          })

          const base64Image = await base64Promise
          // Use the publisher_image type (27) for the logo
          const logoResult = await uploadImage(base64Image, "publisher_image", `Logo for ${publisher.name}`)

          if (logoResult) {
            // Store the image ID
            updateData.publisher_image_id = logoResult.imageId
          }
        } catch (error) {
          console.error("Error uploading logo image:", error)
        }
      }

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
          // Use the page_cover type (25) for the cover image
          const coverResult = await uploadImage(base64Image, "page_cover", `Cover for ${publisher.name}`)

          if (coverResult) {
            // Store the image ID
            updateData.cover_image_id = coverResult.imageId
          }
        } catch (error) {
          console.error("Error uploading cover image:", error)
        }
      }

      // Update publisher in database
      const { error } = await supabaseClient.from("publishers").update(updateData).eq("id", params.id)

      if (error) {
        console.error("Error updating publisher:", error)
        return
      }

      // Fetch the updated publisher with joined image data
      const { data: updatedPublisher, error: fetchError } = await supabaseClient
        .from("publishers")
        .select(`
          *,
          publisher_image:publisher_image_id(id, url, alt_text, img_type_id),
          cover_image:cover_image_id(id, url, alt_text, img_type_id),
          publisher_gallery:publisher_gallery_id(id, url, alt_text, img_type_id)
        `)
        .eq("id", params.id)
        .single()

      if (fetchError) {
        console.error("Error fetching updated publisher:", fetchError)
      } else {
        // Update local state with the fresh data
        setPublisher(updatedPublisher as Publisher)
      }

      setEditMode(false)
      setSuccessMessage("Publisher updated successfully!")

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
    setEditedPublisher(publisher as Publisher)
    setLogoFile(null)
    setLogoPreview(publisher?.publisher_image?.url || null)
    setCoverFile(null)
    setCoverPreview(publisher?.cover_image?.url || null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <PageHeader />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading publisher information...</p>
        </main>
      </div>
    )
  }

  if (!publisher) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <PageHeader />
        <main className="flex-1 flex items-center justify-center">
          <p>Publisher not found</p>
        </main>
      </div>
    )
  }

  // Default placeholder image
  const placeholderImage = "/placeholder.svg?height=150&width=300"

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
                src={coverPreview || "/placeholder.svg"}
                alt={publisher.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : publisher.cover_image?.url ? (
            <div className="absolute inset-0 opacity-20">
              <Image
                src={publisher.cover_image.url || "/placeholder.svg"}
                alt={publisher.name}
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
              {/* Publisher Logo */}
              <div className="w-40 h-40 -mt-16 md:mt-0 z-10 rounded-md overflow-hidden border-4 border-white bg-white shadow-xl relative group">
                {logoPreview ? (
                  <Image
                    src={logoPreview || "/placeholder.svg"}
                    alt={publisher.name}
                    width={160}
                    height={160}
                    className="w-full h-full object-contain"
                  />
                ) : publisher.publisher_image?.url ? (
                  <Image
                    src={publisher.publisher_image.url || "/placeholder.svg"}
                    alt={publisher.name}
                    width={160}
                    height={160}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-white flex items-center justify-center">
                    <Building className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                {editMode && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 transition-opacity cursor-pointer">
                    <Label
                      htmlFor="logo-upload"
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                    >
                      <Camera className="h-8 w-8 text-white" />
                    </Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </div>
                )}
              </div>

              {/* Publisher Name and Info */}
              <div className="text-center md:text-left text-white">
                {editMode ? (
                  <Input
                    name="name"
                    value={editedPublisher.name || ""}
                    onChange={handleInputChange}
                    className="text-3xl md:text-4xl font-bold bg-transparent border-b border-white text-white placeholder-white/70"
                    placeholder="Publisher Name"
                  />
                ) : (
                  <h1 className="text-3xl md:text-4xl font-bold">{publisher.name}</h1>
                )}
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                  {editMode ? (
                    <div className="flex items-center gap-2 bg-black/20 rounded-md px-2 py-1">
                      <Calendar className="h-4 w-4" />
                      <Input
                        name="founded_year"
                        value={editedPublisher.founded_year || ""}
                        onChange={handleInputChange}
                        type="number"
                        className="w-32 bg-transparent border-none text-white placeholder-white/70"
                        placeholder="Founded Year"
                      />
                    </div>
                  ) : publisher.founded_year ? (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Founded {publisher.founded_year}</span>
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
            {/* Left Column - Publisher Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* About Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>About</CardTitle>
                  {!editMode && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit About</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[625px]">
                        <DialogHeader>
                          <DialogTitle>Edit About</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <Textarea
                            id="about-edit"
                            name="about"
                            rows={10}
                            value={editedPublisher.about || ""}
                            onChange={handleInputChange}
                            placeholder="Enter publisher description..."
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setEditedPublisher((prev) => ({ ...prev, about: publisher.about }))}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={async () => {
                              await supabaseClient
                                .from("publishers")
                                .update({ about: editedPublisher.about })
                                .eq("id", params.id)
                              setPublisher((prev) => (prev ? { ...prev, about: editedPublisher.about || "" } : null))
                            }}
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
                      name="about"
                      value={editedPublisher.about || ""}
                      onChange={handleInputChange}
                      rows={8}
                      placeholder="Enter publisher description..."
                    />
                  ) : publisher.about ? (
                    <div>
                      <p>{publisher.about}</p>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">No information available for this publisher.</div>
                  )}
                </CardContent>
              </Card>

              {/* Website & Contact */}
              <Card className="publisher-contact-card">
                <CardHeader className="publisher-contact-header flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="publisher-contact-title">Website & Contact</CardTitle>
                  {!editMode && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="publisher-edit-button h-8 w-8 p-0">
                          <Edit className="publisher-edit-icon h-4 w-4" />
                          <span className="sr-only">Edit Contact</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="publisher-contact-dialog sm:max-w-[625px]">
                        <DialogHeader>
                          <DialogTitle>Edit Contact Information</DialogTitle>
                        </DialogHeader>
                        <div className="publisher-contact-form grid gap-4 py-4">
                          {/* Address Section - Moved to the top */}
                          <h3 className="publisher-form-section-title text-lg font-medium">Address</h3>
                          <div className="publisher-form-row grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address-line1-edit" className="publisher-form-label text-right">
                              Address Line 1
                            </Label>
                            <Input
                              id="address-line1-edit"
                              name="address_line1"
                              value={editedPublisher.address_line1 || ""}
                              onChange={handleInputChange}
                              placeholder="123 Publishing Street"
                              className="publisher-form-input col-span-3"
                            />
                          </div>
                          <div className="publisher-form-row grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address-line2-edit" className="publisher-form-label text-right">
                              Address Line 2
                            </Label>
                            <Input
                              id="address-line2-edit"
                              name="address_line2"
                              value={editedPublisher.address_line2 || ""}
                              onChange={handleInputChange}
                              placeholder="Suite 456"
                              className="publisher-form-input col-span-3"
                            />
                          </div>
                          <div className="publisher-form-row grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="city-edit" className="publisher-form-label text-right">
                              City
                            </Label>
                            <Input
                              id="city-edit"
                              name="city"
                              value={editedPublisher.city || ""}
                              onChange={handleInputChange}
                              placeholder="New York"
                              className="publisher-form-input col-span-3"
                            />
                          </div>
                          <div className="publisher-form-row grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="state-edit" className="publisher-form-label text-right">
                              State/Province
                            </Label>
                            <Input
                              id="state-edit"
                              name="state"
                              value={editedPublisher.state || ""}
                              onChange={handleInputChange}
                              placeholder="NY"
                              className="publisher-form-input col-span-3"
                            />
                          </div>
                          <div className="publisher-form-row grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="postal-code-edit" className="publisher-form-label text-right">
                              Postal Code
                            </Label>
                            <Input
                              id="postal-code-edit"
                              name="postal_code"
                              value={editedPublisher.postal_code || ""}
                              onChange={handleInputChange}
                              placeholder="10001"
                              className="publisher-form-input col-span-3"
                            />
                          </div>
                          <div className="publisher-form-row grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="country-edit" className="publisher-form-label text-right">
                              Country
                            </Label>
                            <Input
                              id="country-edit"
                              name="country"
                              value={editedPublisher.country || ""}
                              onChange={handleInputChange}
                              placeholder="United States"
                              className="publisher-form-input col-span-3"
                            />
                          </div>

                          <Separator className="publisher-form-separator my-2" />

                          {/* Website & Contact Section */}
                          <h3 className="publisher-form-section-title text-lg font-medium">Contact Information</h3>
                          <div className="publisher-form-row grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="website-edit" className="publisher-form-label text-right">
                              Website
                            </Label>
                            <Input
                              id="website-edit"
                              name="website"
                              value={editedPublisher.website || ""}
                              onChange={handleInputChange}
                              placeholder="https://example.com"
                              className="publisher-form-input col-span-3"
                            />
                          </div>
                          <div className="publisher-form-row grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email-edit" className="publisher-form-label text-right">
                              Email
                            </Label>
                            <Input
                              id="email-edit"
                              name="email"
                              value={editedPublisher.email || ""}
                              onChange={handleInputChange}
                              placeholder="contact@publisher.com"
                              className="publisher-form-input col-span-3"
                            />
                          </div>
                          <div className="publisher-form-row grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone-edit" className="publisher-form-label text-right">
                              Phone
                            </Label>
                            <Input
                              id="phone-edit"
                              name="phone"
                              value={editedPublisher.phone || ""}
                              onChange={handleInputChange}
                              placeholder="+1 (123) 456-7890"
                              className="publisher-form-input col-span-3"
                            />
                          </div>
                        </div>
                        <div className="publisher-dialog-actions flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              setEditedPublisher((prev) => ({
                                ...prev,
                                website: publisher.website,
                                email: publisher.email,
                                phone: publisher.phone,
                                address_line1: publisher.address_line1,
                                address_line2: publisher.address_line2,
                                city: publisher.city,
                                state: publisher.state,
                                postal_code: publisher.postal_code,
                                country: publisher.country,
                              }))
                            }
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={async () => {
                              await supabaseClient
                                .from("publishers")
                                .update({
                                  website: editedPublisher.website,
                                  email: editedPublisher.email,
                                  phone: editedPublisher.phone,
                                  address_line1: editedPublisher.address_line1,
                                  address_line2: editedPublisher.address_line2,
                                  city: editedPublisher.city,
                                  state: editedPublisher.state,
                                  postal_code: editedPublisher.postal_code,
                                  country: editedPublisher.country,
                                })
                                .eq("id", params.id)
                              setPublisher((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      website: editedPublisher.website,
                                      email: editedPublisher.email,
                                      phone: editedPublisher.phone,
                                      address_line1: editedPublisher.address_line1,
                                      address_line2: editedPublisher.address_line2,
                                      city: editedPublisher.city,
                                      state: editedPublisher.state,
                                      postal_code: editedPublisher.postal_code,
                                      country: editedPublisher.country,
                                    }
                                  : null,
                              )
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent className="publisher-contact-content">
                  {editMode ? (
                    <div className="publisher-contact-edit-form space-y-3">
                      {/* Address Section - Moved to the top */}
                      <h3 className="publisher-address-title text-sm font-medium">Address</h3>
                      <div className="publisher-address-edit-form space-y-2">
                        <Input
                          name="address_line1"
                          value={editedPublisher.address_line1 || ""}
                          onChange={handleInputChange}
                          placeholder="Address Line 1"
                          className="publisher-address-input"
                        />
                        <Input
                          name="address_line2"
                          value={editedPublisher.address_line2 || ""}
                          onChange={handleInputChange}
                          placeholder="Address Line 2"
                          className="publisher-address-input"
                        />
                        <div className="publisher-address-row grid grid-cols-2 gap-2">
                          <Input
                            name="city"
                            value={editedPublisher.city || ""}
                            onChange={handleInputChange}
                            placeholder="City"
                            className="publisher-city-input"
                          />
                          <Input
                            name="state"
                            value={editedPublisher.state || ""}
                            onChange={handleInputChange}
                            placeholder="State/Province"
                            className="publisher-state-input"
                          />
                        </div>
                        <div className="publisher-address-row grid grid-cols-2 gap-2">
                          <Input
                            name="postal_code"
                            value={editedPublisher.postal_code || ""}
                            onChange={handleInputChange}
                            placeholder="Postal Code"
                            className="publisher-postal-code-input"
                          />
                          <Input
                            name="country"
                            value={editedPublisher.country || ""}
                            onChange={handleInputChange}
                            placeholder="Country"
                            className="publisher-country-input"
                          />
                        </div>
                      </div>

                      <Separator className="publisher-contact-separator my-2" />

                      {/* Contact Information */}
                      <h3 className="publisher-contact-title text-sm font-medium">Contact Information</h3>
                      <div className="publisher-contact-edit-row flex items-center gap-2">
                        <Globe className="publisher-contact-icon h-4 w-4 text-muted-foreground" />
                        <Input
                          name="website"
                          value={editedPublisher.website || ""}
                          onChange={handleInputChange}
                          placeholder="Website URL"
                          className="publisher-contact-input"
                        />
                      </div>
                      <div className="publisher-contact-edit-row flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="publisher-contact-icon text-muted-foreground"
                        >
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        <Input
                          name="email"
                          value={editedPublisher.email || ""}
                          onChange={handleInputChange}
                          placeholder="Email address"
                          className="publisher-contact-input"
                        />
                      </div>
                      <div className="publisher-contact-edit-row flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="publisher-contact-icon text-muted-foreground"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <Input
                          name="phone"
                          value={editedPublisher.phone || ""}
                          onChange={handleInputChange}
                          placeholder="Phone number"
                          className="publisher-contact-input"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="publisher-contact-display space-y-2">
                      {/* Address Section - Moved to the top */}
                      {(publisher.address_line1 || publisher.city || publisher.state || publisher.country) && (
                        <div className="publisher-address space-y-1">
                          <h3 className="publisher-address-title text-sm font-medium">Address</h3>
                          {publisher.address_line1 && (
                            <p className="publisher-address-line">{publisher.address_line1}</p>
                          )}
                          {publisher.address_line2 && (
                            <p className="publisher-address-line">{publisher.address_line2}</p>
                          )}
                          {(publisher.city || publisher.state || publisher.postal_code) && (
                            <p className="publisher-address-line">
                              {publisher.city && <span>{publisher.city}</span>}
                              {publisher.city && publisher.state && <span>, </span>}
                              {publisher.state && <span>{publisher.state}</span>}
                              {(publisher.city || publisher.state) && publisher.postal_code && <span> </span>}
                              {publisher.postal_code && <span>{publisher.postal_code}</span>}
                            </p>
                          )}
                          {publisher.country && <p className="publisher-address-line">{publisher.country}</p>}
                        </div>
                      )}

                      <Separator className="publisher-address-separator my-2" />

                      {/* Contact Information */}
                      <h3 className="publisher-contact-title text-sm font-medium">Contact Information</h3>
                      {publisher.website && (
                        <a
                          href={publisher.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="publisher-website flex items-center gap-2 hover:underline"
                        >
                          <Globe className="publisher-website-icon h-4 w-4 text-muted-foreground" />
                          <span>{publisher.website}</span>
                        </a>
                      )}
                      {publisher.email && (
                        <a
                          href={`mailto:${publisher.email}`}
                          className="publisher-email flex items-center gap-2 hover:underline"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="publisher-email-icon text-muted-foreground"
                          >
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                          </svg>
                          <span>{publisher.email}</span>
                        </a>
                      )}
                      {publisher.phone && (
                        <a
                          href={`tel:${publisher.phone}`}
                          className="publisher-phone flex items-center gap-2 hover:underline"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="publisher-phone-icon text-muted-foreground"
                          >
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <span>{publisher.phone}</span>
                        </a>
                      )}

                      {!publisher.website &&
                        !publisher.email &&
                        !publisher.phone &&
                        !publisher.address_line1 &&
                        !publisher.city &&
                        !publisher.state &&
                        !publisher.country && (
                          <p className="publisher-no-contact text-muted-foreground">
                            No contact information available.
                          </p>
                        )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Books Tab */}
              <Card>
                <CardHeader>
                  <CardTitle>Books by {publisher.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {books.length > 0 ? (
                    <div className="publisher-books-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {books.map((book) => (
                        <Link key={book.id} href={`/books/${book.id}`} className="publisher-book-link block">
                          <div className="publisher-book-cover aspect-[2/3] rounded-md overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                            {book.cover_image_url ? (
                              <Image
                                src={book.cover_image_url || "/placeholder.svg"}
                                alt={book.title}
                                width={150}
                                height={225}
                                className="publisher-book-image w-full h-full object-cover"
                              />
                            ) : (
                              <div className="publisher-book-placeholder w-full h-full bg-muted flex items-center justify-center">
                                <BookOpen className="publisher-book-icon h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="publisher-no-books text-center py-6">
                      <p className="publisher-no-books-message text-muted-foreground">
                        No books found for this publisher.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Discussions */}
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
                        <Input placeholder="Start a discussion about this publisher..." />
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
              {/* Publisher Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Books Published</span>
                      <span className="font-medium">{books.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Followers</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Years Active</span>
                      <span className="font-medium">
                        {publisher.founded_year ? `${publisher.founded_year} - Present` : "Unknown"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Similar Publishers */}
              <Card>
                <CardHeader>
                  <CardTitle>Similar Publishers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Recommendations coming soon</p>
                  </div>
                </CardContent>
              </Card>

              {/* Featured Authors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <span>Featured Authors</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No featured authors for this publisher yet.</p>
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
