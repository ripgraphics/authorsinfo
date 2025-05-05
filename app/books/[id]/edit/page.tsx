"use client"

import React, { use, useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, AlertTriangle, Loader2 } from "lucide-react"
import { MultiCombobox } from "@/components/ui/multi-combobox"
import { supabaseClient } from "@/lib/supabase/client"
import { uploadImage } from "@/app/actions/upload"
import type { Book, Author, Publisher } from "@/types/database"
import { PageContainer } from "@/components/page-container"

interface EditBookPageProps {
  params: {
    id: string
  }
}

export default function EditBookPage({ params }: EditBookPageProps) {
  const router = useRouter()
  const bookId = use(params).id
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [authors, setAuthors] = useState<Author[]>([])
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<string[]>([])
  const [selectedPublisherIds, setSelectedPublisherIds] = useState<string[]>([])
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [authorSearchTerm, setAuthorSearchTerm] = useState("")
  const [publisherSearchTerm, setPublisherSearchTerm] = useState("")
  const [loadingMoreAuthors, setLoadingMoreAuthors] = useState(false)
  const [loadingMorePublishers, setLoadingMorePublishers] = useState(false)
  const [hasMoreAuthors, setHasMoreAuthors] = useState(true)
  const [hasMorePublishers, setHasMorePublishers] = useState(true)
  const isMounted = useRef(true)
  const [bindingOptions, setBindingOptions] = useState<{ value: string; label: string }[]>([])
  const [formatOptions, setFormatOptions] = useState<{ value: string; label: string }[]>([])
  const [selectedBindings, setSelectedBindings] = useState<string[]>([])
  const [selectedFormats, setSelectedFormats] = useState<string[]>([])

  // Set up cleanup when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Load authors with pagination and search
  const loadAuthors = useCallback(async (searchTerm = "", startIndex = 0, limit = 50) => {
    if (!supabaseClient) return;
    
    try {
      setLoadingMoreAuthors(true)

      let query = supabaseClient
        .from("authors")
        .select("id, name", { count: "exact" })
        .order("name")
        .range(startIndex, startIndex + limit - 1)

      if (searchTerm) {
        query = query.ilike("name", `%${searchTerm}%`)
      }

      const { data, count, error } = await query

      if (error) {
        console.error("Error loading authors:", error)
        return
      }

      if (isMounted.current) {
        if (startIndex === 0) {
          setAuthors(data as Author[])
        } else {
          setAuthors((prev) => [...prev, ...(data as Author[])])
        }

        // Check if we have more authors to load
        if (count) {
          setHasMoreAuthors(startIndex + limit < count)
        } else {
          setHasMoreAuthors(data.length === limit)
        }
      }
    } catch (error) {
      console.error("Error in loadAuthors:", error)
    } finally {
      if (isMounted.current) {
        setLoadingMoreAuthors(false)
      }
    }
  }, [])

  // Load publishers with pagination and search
  const loadPublishers = useCallback(async (searchTerm = "", startIndex = 0, limit = 50) => {
    if (!supabaseClient) return;
    
    try {
      setLoadingMorePublishers(true)

      let query = supabaseClient
        .from("publishers")
        .select("id, name", { count: "exact" })
        .order("name")
        .range(startIndex, startIndex + limit - 1)

      if (searchTerm) {
        query = query.ilike("name", `%${searchTerm}%`)
      }

      const { data, count, error } = await query

      if (error) {
        console.error("Error loading publishers:", error)
        return
      }

      if (isMounted.current) {
        if (startIndex === 0) {
          setPublishers(data as Publisher[])
        } else {
          setPublishers((prev) => [...prev, ...(data as Publisher[])])
        }

        // Check if we have more publishers to load
        if (count) {
          setHasMorePublishers(startIndex + limit < count)
        } else {
          setHasMorePublishers(data.length === limit)
        }
      }
    } catch (error) {
      console.error("Error in loadPublishers:", error)
    } finally {
      if (isMounted.current) {
        setLoadingMorePublishers(false)
      }
    }
  }, [])

  // Handle author search
  const handleAuthorSearch = useCallback(
    (search: string) => {
      setAuthorSearchTerm(search)
      loadAuthors(search, 0)
    },
    [loadAuthors],
  )

  // Handle publisher search
  const handlePublisherSearch = useCallback(
    (search: string) => {
      setPublisherSearchTerm(search)
      loadPublishers(search, 0)
    },
    [loadPublishers],
  )

  // Load more authors when scrolling
  const loadMoreAuthors = useCallback(() => {
    if (loadingMoreAuthors || !hasMoreAuthors) return
    loadAuthors(authorSearchTerm, authors.length)
  }, [loadAuthors, authorSearchTerm, authors.length, loadingMoreAuthors, hasMoreAuthors])

  // Load more publishers when scrolling
  const loadMorePublishers = useCallback(() => {
    if (loadingMorePublishers || !hasMorePublishers) return
    loadPublishers(publisherSearchTerm, publishers.length)
  }, [loadPublishers, publisherSearchTerm, publishers.length, loadingMorePublishers, hasMorePublishers])

  // Handle cover image change
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setCoverImage(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!book || !supabaseClient) return

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const formData = new FormData(e.currentTarget)

      // Helper function to convert empty strings to null for numeric fields
      const parseNumericField = (value: FormDataEntryValue | null): number | undefined => {
        if (value === null || value === "") return undefined;
        const parsed = Number(value);
        return isNaN(parsed) ? undefined : parsed;
      }

      // Handle cover image upload if changed
      let newCoverImageUrl = book.cover_image_url
      let newCoverImageId = book.cover_image_id

      if (coverImage) {
        try {
          // Convert the file to base64
          const base64Promise = new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64 = reader.result as string
              resolve(base64)
            }
            reader.readAsDataURL(coverImage)
          })

          const base64Image = await base64Promise

          // Upload the new image to Cloudinary with alt text
          const bookTitle = formData.get("title") as string
          const uploadResult = await uploadImage(base64Image, "bookcovers", `Cover of ${bookTitle}`)

          if (uploadResult) {
            newCoverImageUrl = uploadResult.url

            // If we already have a cover_image_id, update that image record
            if (book.cover_image_id) {
              const { error: imageUpdateError } = await supabaseClient
                .from("images")
                .update({ url: uploadResult.url })
                .eq("id", book.cover_image_id)

              if (imageUpdateError) {
                console.error("Error updating image record:", imageUpdateError)
                // Continue anyway, we'll update the URL directly on the book
              }
            } else {
              // Create a new image record
              const { data: newImage, error: newImageError } = await supabaseClient
                .from("images")
                .insert({
                  url: uploadResult.url,
                  img_type_id: 1, // Assuming 1 is for book covers
                  alt_text: `Cover of ${bookTitle}`,
                })
                .select("id")
                .single()

              if (newImageError) {
                console.error("Error creating image record:", newImageError)
                // Continue anyway, we'll update the URL directly on the book
              } else if (newImage) {
                newCoverImageId = newImage.id
              }
            }
          } else {
            throw new Error("Failed to upload image")
          }
        } catch (uploadError) {
          console.error("Upload error:", uploadError)
          setError("Failed to upload cover image. Please try again.")
          setSaving(false)
          return
        }
      }

      // Get binding_type_id and format_type_id from selected values
      const bindingTypeId = selectedBindings.length > 0 ? Number.parseInt(selectedBindings[0], 10) : null
      const formatTypeId = selectedFormats.length > 0 ? Number.parseInt(selectedFormats[0], 10) : null

      // Prepare the update data
      const updateData = {
        title: formData.get("title") as string,
        isbn10: formData.get("isbn10") as string,
        isbn13: formData.get("isbn13") as string,
        author_id: selectedAuthorIds.length > 0 ? selectedAuthorIds[0] : undefined,
        publisher_id: selectedPublisherIds.length > 0 ? selectedPublisherIds[0] : undefined,
        publication_date: formData.get("publication_date") as string,
        binding_type_id: bindingTypeId || undefined,
        format_type_id: formatTypeId || undefined,
        language: formData.get("language") as string,
        edition: formData.get("edition") as string,
        synopsis: formData.get("synopsis") as string,
        overview: formData.get("overview") as string,
        dimensions: formData.get("dimensions") as string,
        weight: formData.get("weight") as string,
        cover_image_url: newCoverImageUrl,
        cover_image_id: newCoverImageId,
      } as Partial<Book>

      // Handle numeric fields properly to avoid type errors
      const pages = parseNumericField(formData.get("pages"));
      if (pages !== undefined) {
        updateData.pages = pages;
      }

      const listPrice = parseNumericField(formData.get("list_price"));
      if (listPrice !== undefined) {
        updateData.list_price = listPrice;
      }

      // Handle book_gallery_img separately - it might be an array in the database
      const galleryImgValue = formData.get("book_gallery_img") as string
      if (galleryImgValue) {
        // If it's a comma-separated string, convert to array
        if (galleryImgValue.includes(",")) {
          updateData.book_gallery_img = galleryImgValue.split(",").map((url) => url.trim())
        } else {
          // If it's a single value, make it an array with one item
          updateData.book_gallery_img = [galleryImgValue.trim()]
        }
      } else {
        // If empty, set to null or empty array based on your database requirements
        updateData.book_gallery_img = null
      }

      console.log("Updating book with data:", updateData)

      // Update the book
      const { error: updateError } = await supabaseClient.from("books").update(updateData).eq("id", bookId)

      if (updateError) {
        console.error("Error updating book:", updateError)
        setError(`Error updating book: ${updateError.message}`)
        setSaving(false)
        return
      }

      setSuccessMessage("Book updated successfully!")

      // Redirect back to the book page after a short delay
      setTimeout(() => {
        router.push(`/books/${bookId}`)
      }, 2000) // 2 second delay to show success message
    } catch (error: any) {
      console.error("Error in handleSubmit:", error)
      setError(`An unexpected error occurred while saving: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Fetch book data
  useEffect(() => {
    async function fetchBookData() {
      if (!supabaseClient) {
        setError("Supabase client is not available")
        setLoading(false)
        return
      }
      
      try {
        setError(null)

        // Fetch book
        const { data: bookData, error: bookError } = await supabaseClient
          .from("books")
          .select(
            `
              *,
              cover_image:images(id, url, alt_text, img_type_id),
              binding_type:binding_types(id, name),
              format_type:format_types(id, name)
            `
          )
          .eq("id", bookId)
          .single()

        if (bookError) {
          console.error("Error fetching book:", bookError)
          setError(`Error fetching book: ${bookError.message}`)
          return
        }

        if (!isMounted.current) return

        // Process the book data
        const processedBook = {
          ...bookData,
          // Ensure numeric fields are properly typed
          average_rating: bookData.average_rating !== null ? Number(bookData.average_rating) : null,
          price: bookData.price !== null ? Number(bookData.price) : null,
          list_price: bookData.list_price !== null ? Number(bookData.list_price) : null,
          page_count: bookData.page_count !== null ? Number(bookData.page_count) : null,
          pages: bookData.pages !== null ? Number(bookData.pages) : null,
          series_number: bookData.series_number !== null ? Number(bookData.series_number) : null,
        } as Book

        setBook(processedBook)
        console.log("Book data loaded:", processedBook)

        // Set cover preview
        if (bookData.cover_image?.url) {
          setCoverPreview(bookData.cover_image.url)
        } else if (bookData.cover_image_url) {
          setCoverPreview(bookData.cover_image_url)
        } else if (bookData.original_image_url) {
          setCoverPreview(bookData.original_image_url)
        }

        // Set initial selected authors
        if (bookData.author_id) {
          setSelectedAuthorIds([bookData.author_id])

          // Fetch author name for display
          if (!supabaseClient) return;
          
          const { data: authorData } = await supabaseClient
            .from("authors")
            .select("id, name")
            .eq("id", bookData.author_id)
            .single()

          if (authorData) {
            setAuthors([authorData as Author])
          }
        }

        // Set initial selected publishers
        if (bookData.publisher_id) {
          setSelectedPublisherIds([bookData.publisher_id])

          // Fetch publisher name for display
          if (!supabaseClient) return;
          
          const { data: publisherData } = await supabaseClient
            .from("publishers")
            .select("id, name")
            .eq("id", bookData.publisher_id)
            .single()

          if (publisherData) {
            setPublishers([publisherData as Publisher])
          }
        }

        // Set initial binding and format if available
        if (bookData.binding_type_id) {
          setSelectedBindings([bookData.binding_type_id.toString()])
        }

        if (bookData.format_type_id) {
          setSelectedFormats([bookData.format_type_id.toString()])
        }
      } catch (error) {
        console.error("Error in fetchBookData:", error)
        if (isMounted.current) {
          setError("An unexpected error occurred. Please try again.")
        }
      } finally {
        if (isMounted.current) {
          setLoading(false)
        }
      }
    }

    // Load binding and format types
    async function fetchBindingAndFormatTypes() {
      if (!supabaseClient) return;
      
      try {
        // Fetch binding types
        const { data: bindingTypes, error: bindingError } = await supabaseClient
          .from("binding_types")
          .select("id, name")
          .order("name");

        if (bindingError) {
          console.error("Error fetching binding types:", bindingError);
        } else if (bindingTypes) {
          setBindingOptions(
            bindingTypes.map((type) => ({
              value: type.id.toString(),
              label: type.name,
            })),
          );
        }

        // Fetch format types
        const { data: formatTypes, error: formatError } = await supabaseClient
          .from("format_types")
          .select("id, name")
          .order("name")

        if (formatError) {
          console.error("Error fetching format types:", formatError)
        } else if (formatTypes) {
          setFormatOptions(
            formatTypes.map((type) => ({
              value: type.id.toString(),
              label: type.name,
            })),
          )
        }
      } catch (error) {
        console.error("Error fetching binding and format types:", error);
      }
    }

    fetchBookData()
    loadAuthors()
    loadPublishers()
    fetchBindingAndFormatTypes()
  }, [bookId, loadAuthors, loadPublishers])

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-full py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading book information...</p>
          </div>
        </div>
      </PageContainer>
    )
  }

  if (!book) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-full py-12">
          <p>Book not found</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Edit Book">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Book Cover */}
        <div>
          <Card className="overflow-hidden">
            {coverPreview ? (
              <div className="w-full h-full">
                <Image
                  src={coverPreview || "/placeholder.svg"}
                  alt={book.title}
                  width={400}
                  height={600}
                  className="w-full aspect-[2/3] object-cover"
                />
              </div>
            ) : book.cover_image_url ? (
              <div className="w-full h-full">
                <Image
                  src={book.cover_image_url || "/placeholder.svg"}
                  alt={book.title}
                  width={400}
                  height={600}
                  className="w-full aspect-[2/3] object-cover"
                />
              </div>
            ) : (
              <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </Card>
          <div className="mt-4">
            <Label htmlFor="cover-image" className="block mb-2">
              Change Cover Image
            </Label>
            <Input id="cover-image" type="file" accept="image/*" onChange={handleCoverImageChange} />
            <p className="text-xs text-muted-foreground mt-1">
              Images will be stored in Cloudinary in the authorsinfo/bookcovers folder
            </p>
          </div>
        </div>

        {/* Book Details Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Book Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {/* Basic Information */}
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" name="title" defaultValue={book.title} />
                  </div>

                  <div>
                    <Label htmlFor="title_long">Long Title</Label>
                    <Input 
                      id="title_long" 
                      name="title_long" 
                      defaultValue={(book as any).title_long || ""} 
                    />
                  </div>

                  {/* ISBN Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="isbn10">ISBN-10</Label>
                      <Input id="isbn10" name="isbn10" defaultValue={book.isbn10 || ""} />
                    </div>
                    <div>
                      <Label htmlFor="isbn13">ISBN-13</Label>
                      <Input id="isbn13" name="isbn13" defaultValue={book.isbn13 || ""} />
                    </div>
                  </div>

                  {/* Author Selection */}
                  <div>
                    <Label htmlFor="authors">Authors</Label>
                    <MultiCombobox
                      options={authors.map((author) => ({ value: author.id, label: author.name }))}
                      selected={selectedAuthorIds}
                      onChange={setSelectedAuthorIds}
                      placeholder="Search and select authors..."
                      emptyMessage="No authors found."
                      onSearch={handleAuthorSearch}
                      onScrollEnd={loadMoreAuthors}
                      loading={loadingMoreAuthors}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Search for authors by name. The first author will be set as the primary author.
                    </p>
                  </div>

                  {/* Publisher Selection */}
                  <div>
                    <Label htmlFor="publishers">Publishers</Label>
                    <MultiCombobox
                      options={publishers.map((publisher) => ({ value: publisher.id, label: publisher.name }))}
                      selected={selectedPublisherIds}
                      onChange={setSelectedPublisherIds}
                      placeholder="Search and select publishers..."
                      emptyMessage="No publishers found."
                      onSearch={handlePublisherSearch}
                      onScrollEnd={loadMorePublishers}
                      loading={loadingMorePublishers}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Search for publishers by name. The first publisher will be set as the primary publisher.
                    </p>
                  </div>

                  {/* Publication Details */}
                  <div>
                    <Label htmlFor="publication_date">Publication Date</Label>
                    <Input
                      id="publication_date"
                      name="publication_date"
                      defaultValue={book.publication_date || ""}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="binding">Binding</Label>
                      <MultiCombobox
                        options={bindingOptions}
                        selected={selectedBindings}
                        onChange={setSelectedBindings}
                        placeholder="Select binding type..."
                        emptyMessage="No binding types found."
                      />
                    </div>
                    <div>
                      <Label htmlFor="format">Format</Label>
                      <MultiCombobox
                        options={formatOptions}
                        selected={selectedFormats}
                        onChange={setSelectedFormats}
                        placeholder="Select format..."
                        emptyMessage="No formats found."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edition">Edition</Label>
                      <Input id="edition" name="edition" defaultValue={book.edition || ""} />
                    </div>
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Input id="language" name="language" defaultValue={book.language || ""} />
                    </div>
                  </div>

                  {/* Physical Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pages">Pages</Label>
                      <Input
                        id="pages"
                        name="pages"
                        type="number"
                        defaultValue={book.pages ? book.pages.toString() : ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="list_price">List Price</Label>
                      <Input
                        id="list_price"
                        name="list_price"
                        type="number"
                        step="0.01"
                        defaultValue={book.list_price ? book.list_price.toString() : ""}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dimensions">Dimensions</Label>
                      <Input id="dimensions" name="dimensions" defaultValue={book.dimensions || ""} />
                    </div>
                    <div>
                      <Label htmlFor="weight">Weight</Label>
                      <Input id="weight" name="weight" defaultValue={book.weight || ""} />
                    </div>
                  </div>

                  {/* Gallery Images */}
                  <div>
                    <Label htmlFor="book_gallery_img">Book Gallery Images</Label>
                    <Input
                      id="book_gallery_img"
                      name="book_gallery_img"
                      defaultValue={
                        Array.isArray(book.book_gallery_img)
                          ? book.book_gallery_img.join(", ")
                          : book.book_gallery_img || ""
                      }
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter comma-separated URLs for additional book images.
                    </p>
                  </div>

                  {/* Ratings - Read Only */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="average_rating">Average Rating (Read Only)</Label>
                      <Input
                        id="average_rating"
                        name="average_rating"
                        type="number"
                        step="0.01"
                        defaultValue={book.average_rating?.toString() || "0.00"}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="review_count">Review Count (Read Only)</Label>
                      <Input
                        id="review_count"
                        name="review_count"
                        type="number"
                        defaultValue={(book as any).review_count?.toString() || "0"}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>
                  </div>

                  {/* Featured Flag */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      name="featured"
                      defaultChecked={(book as any).featured === "true" || (book as any).featured === true}
                    />
                    <Label htmlFor="featured">Featured Book</Label>
                  </div>

                  {/* Content */}
                  <div>
                    <Label htmlFor="synopsis">Synopsis</Label>
                    <Textarea id="synopsis" name="synopsis" rows={5} defaultValue={book.synopsis || ""} />
                  </div>

                  <div>
                    <Label htmlFor="overview">Overview</Label>
                    <Textarea id="overview" name="overview" rows={5} defaultValue={book.overview || ""} />
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" asChild>
                    <Link href={`/books/${bookId}`}>Cancel</Link>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
