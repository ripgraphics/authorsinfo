"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, BookOpen, Image } from "lucide-react"

export default function LinkCoverImagesPage() {
  const [bookId, setBookId] = useState("")
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [bookInfo, setBookInfo] = useState<{ title: string; author: string } | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const fetchBookInfo = async (id: string) => {
    if (!id.trim()) {
      setBookInfo(null)
      return
    }

    try {
      const response = await fetch(`/api/books/${id}`)
      if (response.ok) {
        const book = await response.json()
        setBookInfo({
          title: book.title,
          author: book.author || "Unknown Author"
        })
      } else {
        setBookInfo(null)
      }
    } catch (error) {
      console.error("Error fetching book info:", error)
      setBookInfo(null)
    }
  }

  const handleBookIdChange = (value: string) => {
    setBookId(value)
    if (value.trim()) {
      fetchBookInfo(value)
    } else {
      setBookInfo(null)
    }
  }

  const handleCloudinaryIdChange = (value: string) => {
    setCloudinaryPublicId(value)
    if (value.trim()) {
      // Show preview of the Cloudinary image
      setImagePreview(`https://res.cloudinary.com/demo/image/upload/${value}`)
    } else {
      setImagePreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!bookId.trim() || !cloudinaryPublicId.trim()) {
      setResult({
        success: false,
        message: "Please enter both Book ID and Cloudinary Public ID"
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/books/link-cover-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId: bookId.trim(),
          cloudinaryPublicId: cloudinaryPublicId.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: `Successfully linked image to book "${data.book.title}"`
        })
        // Clear the form on success
        setBookId("")
        setCloudinaryPublicId("")
        setBookInfo(null)
        setImagePreview(null)
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to link image to book"
        })
      }
    } catch (error) {
      console.error("Error linking image:", error)
      setResult({
        success: false,
        message: "An error occurred while linking the image"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Link Cover Images to Books
          </CardTitle>
          <CardDescription>
            Link existing Cloudinary images to books as cover images. Enter the book ID and Cloudinary public ID to establish the connection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bookId">Book ID (UUID)</Label>
              <Input
                id="bookId"
                type="text"
                placeholder="e.g., bd68ee0c-155b-4ea7-8903-2485e0be5ff1"
                value={bookId}
                onChange={(e) => handleBookIdChange(e.target.value)}
                disabled={isLoading}
              />
              {bookInfo && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <BookOpen className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">{bookInfo.title}</p>
                    <p className="text-xs text-green-600">by {bookInfo.author}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cloudinaryPublicId">Cloudinary Public ID</Label>
              <Input
                id="cloudinaryPublicId"
                type="text"
                placeholder="e.g., lr4ahfk9crt7qtgsisa5"
                value={cloudinaryPublicId}
                onChange={(e) => handleCloudinaryIdChange(e.target.value)}
                disabled={isLoading}
              />
              {imagePreview && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-medium text-blue-800 mb-2">Image Preview:</p>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-w-full h-32 object-cover rounded border"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                      const nextSibling = e.currentTarget.nextElementSibling as HTMLElement
                      if (nextSibling) {
                        nextSibling.style.display = "block"
                      }
                    }}
                  />
                  <p className="text-xs text-red-600 hidden">Image not found or invalid public ID</p>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || !bookId.trim() || !cloudinaryPublicId.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Linking Image...
                </>
              ) : (
                "Link Image to Book"
              )}
            </Button>
          </form>

          {result && (
            <Alert className={`mt-6 ${result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                {result.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium">How to use:</h4>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Enter the book's UUID in the Book ID field - the page will automatically fetch and display the book title</li>
              <li>Enter the Cloudinary public ID in the Cloudinary Public ID field - a preview of the image will be shown</li>
              <li>Click "Link Image to Book" to establish the connection</li>
            </ol>
          </div>
          <div>
            <h4 className="font-medium">Example:</h4>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>Book ID:</strong> bd68ee0c-155b-4ea7-8903-2485e0be5ff1</li>
              <li><strong>Cloudinary Public ID:</strong> lr4ahfk9crt7qtgsisa5</li>
            </ul>
          </div>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-xs">
              <strong>Note:</strong> This will create or reuse an image record in the database and update the book's cover_image_id and original_image_url fields.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 