"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { PageHeader } from "@/components/page-header"
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

interface EditBookPageProps {
  params: {
    id: string
  }
}

export default function EditBookPage({ params }: EditBookPageProps) {
  const router = useRouter()
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
  const [uploadProgress, setUploadProgress] = useState(0)
  const isMounted = useRef(true)

  // Set up cleanup when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Fetch book data with retry mechanism
  useEffect(() => {
    async function fetchBookData(retryCount = 0) {
      try {
        setError(null)

        // Fetch book
        const { data: bookData, error: bookError } = await supabaseClient
          .from("books")
          .select("*")
          .eq("id", params.id)
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

        // Set initial selected authors
        if (bookData.author_id) {
          setSelectedAuthorIds([bookData.author_id])
        }

        // Set initial selected publishers
        if (bookData.publisher_id) {
          setSelectedPublisherIds([bookData.publisher_id])
        }

        // Fetch all authors with retry mechanism
        try {
          const { data: authorsData, error: authorsError } = await supabaseClient
            .from("authors")
            .select("id, name")
            .order("name")
            .limit(100) // Limit to improve performance

          if (authorsError) {
            throw authorsError
          }

          if (!isMounted.current) return
          setAuthors(authorsData as Author[])
        } catch (authorsError) {
          console.error("Error fetching authors:", authorsError)

          // Retry logic for authors
          if (retryCount < 3 && isMounted.current) {
            console.log(`Retrying authors fetch (attempt ${retryCount + 1})...`)
            setTimeout(
              () => {
                if (isMounted.current) {
                  fetchAuthorsOnly(retryCount + 1)
                }
              },
              1000 * (retryCount + 1),
            ) // Exponential backoff
          } else {
            setError("Failed to load authors. Please try refreshing the page.")
          }
        }

        // Fetch all publishers with retry mechanism
        try {
          const { data: publishersData, error: publishersError } = await supabaseClient
            .from("publishers")
            .select("id, name")
            .order("name")
            .limit(100) // Limit to improve performance

          if (publishersError) {
            throw publishersError
          }

          if (!isMounted.current) return
          setPublishers(publishersData as Publisher[])
        } catch (publishersError) {
          console.error("Error fetching publishers:", publishersError)

          // Retry logic for publishers
          if (retryCount < 3 && isMounted.current) {
            console.log(`Retrying publishers fetch (attempt ${retryCount + 1})...`)
            setTimeout(
              () => {
                if (isMounted.current) {
                  fetchPublishersOnly(retryCount + 1)
                }
              },
              1000 * (retryCount + 1),
            ) // Exponential backoff
          } else {
            setError("Failed to load publishers. Please try refreshing the page.")
          }
        }

        if (isMounted.current) {
          setLoading(false)
        }
      } catch (error) {
        console.error("Error in fetchBookData:", error)
        if (isMounted.current) {
          setError("An unexpected error occurred. Please try again.")
          setLoading(false)
        }
      }
    }

    // Separate functions to retry fetching authors and publishers independently
    async function fetchAuthorsOnly(retryCount = 0) {
      try {
        const { data: authorsData, error: authorsError } = await supabaseClient
          .from("authors")
          .select("id, name")
          .order("name")
          .limit(100)

        if (authorsError) {
          throw authorsError
        }

        if (isMounted.current) {
          setAuthors(authorsData as Author[])
          setError(null)
        }
      } catch (error) {
        console.error(`Retry ${retryCount} failed for authors:`, error)
        if (retryCount < 3 && isMounted.current) {
          setTimeout(
            () => {
              if (isMounted.current) {
                fetchAuthorsOnly(retryCount + 1)
              }
            },
            1000 * (retryCount + 1),
          )
        }
      }
    }

    async function fetchPublishersOnly(retryCount = 0) {
      try {
        const { data: publishersData, error: publishersError } = await supabaseClient
          .from("publishers")
          .select("id, name")
          .order("name")
          .limit(100)

        if (publishersError) {
          throw publishersError
        }

        if (isMounted.current) {
          setPublishers(publishersData as Publisher[])
          setError(null)
        }
      } catch (error) {
        console.error(`Retry ${retryCount} failed for publishers:`, error)
        if (retryCount < 3 && isMounted.current) {
          setTimeout(
            () => {
              if (isMounted.current) {
                fetchPublishersOnly(retryCount + 1)
              }
            },
            1000 * (retryCount + 1),
          )
        }
      }
    }

    fetchBookData()
  }, [params.id])

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

    if (!book) return

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const formData = new FormData(e.currentTarget)

      // Handle cover image upload if changed
      let newCoverImageUrl = book.cover_image_url

      if (coverImage) {
        try {
          // Convert the file to base64
          const reader = new FileReader()
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

      // Prepare the update data
      const updateData: Partial<Book> = {
        title: formData.get("title") as string,
        title_long: formData.get("title_long") as string,
        isbn10: formData.get("isbn10") as string,
        isbn13: formData.get("isbn13") as string,
        author_id: selectedAuthorIds[0] || null, // Primary author
        publisher_id: selectedPublisherIds[0] || null, // Primary publisher
        publication_date: formData.get("publication_date") as string,
        binding: formData.get("binding") as string,
        pages: formData.get("pages") ? Number.parseInt(formData.get("pages") as string) : null,
        list_price: formData.get("list_price") ? Number.parseFloat(formData.get("list_price") as string) : null,
        language: formData.get("language") as string,
        edition: formData.get("edition") as string,
        format: formData.get("format") as string,
        synopsis: formData.get("synopsis") as string,
        overview: formData.get("overview") as string,
        dimensions: formData.get("dimensions") as string,
        weight: formData.get("weight") as string,
        average_rating: formData.get("average_rating")
          ? Number.parseFloat(formData.get("average_rating") as string)
          : 0,
        review_count: formData.get("review_count") ? Number.parseInt(formData.get("review_count") as string) : 0,
        featured: formData.get("featured") === "on" ? "true" : "false",
        cover_image_url: newCoverImageUrl,
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

      // If we have a cover_image_id field, update it
      if ("cover_image_id" in book) {
        updateData.cover_image_id = book.cover_image_id
      }

      // Update the book
      const { error: updateError } = await supabaseClient.from("books").update(updateData).eq("id", params.id)

      if (updateError) {
        console.error("Error updating book:", updateError)
        setError(`Error updating book: ${updateError.message}`)
        setSaving(false)
        return
      }

      setSuccessMessage("Book updated successfully!")

      // Redirect back to the book page after a short delay
      setTimeout(() => {
        router.push(`/books/${params.id}`)
      }, 1500)
    } catch (error) {
      console.error("Error in handleSubmit:", error)
      setError("An unexpected error occurred while saving. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // Function to load more authors if needed
  const loadMoreAuthors = async () => {
    if (authors.length >= 100) {
      try {
        setError(null)
        const { data, error } = await supabaseClient
          .from("authors")
          .select("id, name")
          .order("name")
          .range(authors.length, authors.length + 100)

        if (error) {
          throw error
        }

        if (data.length > 0) {
          setAuthors([...authors, ...(data as Author[])])
        }
      } catch (error) {
        console.error("Error loading more authors:", error)
        setError("Failed to load more authors. Please try again.")
      }
    }
  }

  // Function to load more publishers if needed
  const loadMorePublishers = async () => {
    if (publishers.length >= 100) {
      try {
        setError(null)
        const { data, error } = await supabaseClient
          .from("publishers")
          .select("id, name")
          .order("name")
          .range(publishers.length, publishers.length + 100)

        if (error) {
          throw error
        }

        if (data.length > 0) {
          setPublishers([...publishers, ...(data as Publisher[])])
        }
      } catch (error) {
        console.error("Error loading more publishers:", error)
        setError("Failed to load more publishers. Please try again.")
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <PageHeader />
        <main className="flex-1 container py-8">
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Loading book information...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col">
        <PageHeader />
        <main className="flex-1 container py-8">
          <div className="flex items-center justify-center h-full">
            <p>Book not found</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader />
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Edit Book</h1>

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

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mb-6">
              <p className="text-sm mb-1">Uploading image: {uploadProgress}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
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
                        <Input id="title_long" name="title_long" defaultValue={book.title_long || ""} />
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
                        {authors.length > 0 ? (
                          <>
                            <MultiCombobox
                              options={authors.map((author) => ({ value: author.id, label: author.name }))}
                              selected={selectedAuthorIds}
                              onChange={setSelectedAuthorIds}
                              placeholder="Search and select authors..."
                              emptyMessage="No authors found."
                            />
                            {authors.length >= 100 && (
                              <Button
                                type="button"
                                variant="link"
                                onClick={loadMoreAuthors}
                                className="mt-1 h-auto p-0"
                              >
                                Load more authors
                              </Button>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground mt-1">
                            Loading authors... If this takes too long, please refresh the page.
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          Search for authors by name. The first author will be set as the primary author.
                        </p>
                      </div>

                      {/* Publisher Selection */}
                      <div>
                        <Label htmlFor="publishers">Publishers</Label>
                        {publishers.length > 0 ? (
                          <>
                            <MultiCombobox
                              options={publishers.map((publisher) => ({ value: publisher.id, label: publisher.name }))}
                              selected={selectedPublisherIds}
                              onChange={setSelectedPublisherIds}
                              placeholder="Search and select publishers..."
                              emptyMessage="No publishers found."
                            />
                            {publishers.length >= 100 && (
                              <Button
                                type="button"
                                variant="link"
                                onClick={loadMorePublishers}
                                className="mt-1 h-auto p-0"
                              >
                                Load more publishers
                              </Button>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground mt-1">
                            Loading publishers... If this takes too long, please refresh the page.
                          </div>
                        )}
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
                          <Input id="binding" name="binding" defaultValue={book.binding || ""} />
                        </div>
                        <div>
                          <Label htmlFor="format">Format</Label>
                          <Input id="format" name="format" defaultValue={book.format || ""} />
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
                          <Input id="pages" name="pages" type="number" defaultValue={book.pages?.toString() || ""} />
                        </div>
                        <div>
                          <Label htmlFor="list_price">List Price</Label>
                          <Input
                            id="list_price"
                            name="list_price"
                            type="number"
                            step="0.01"
                            defaultValue={book.list_price?.toString() || ""}
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

                      {/* Ratings */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="average_rating">Average Rating</Label>
                          <Input
                            id="average_rating"
                            name="average_rating"
                            type="number"
                            step="0.01"
                            defaultValue={book.average_rating?.toString() || "0.00"}
                          />
                        </div>
                        <div>
                          <Label htmlFor="review_count">Review Count</Label>
                          <Input
                            id="review_count"
                            name="review_count"
                            type="number"
                            defaultValue={book.review_count?.toString() || "0"}
                          />
                        </div>
                      </div>

                      {/* Featured Flag */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="featured"
                          name="featured"
                          defaultChecked={book.featured === "true" || book.featured === true}
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
                        <Link href={`/books/${book.id}`}>Cancel</Link>
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
        </div>
      </main>
    </div>
  )
}
