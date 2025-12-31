'use client'

import type React from 'react'

import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Calendar, BookOpen, Loader2, AlertTriangle } from 'lucide-react'
import { supabaseClient } from '@/lib/supabase/client'
import { uploadImage } from '@/app/actions/upload'
import type { Author, Book } from '@/types/database'
import { Combobox } from '@/components/ui/combobox'

export default function EditAuthorPage() {
  const router = useRouter()
  const params = useParams()
  const [author, setAuthor] = useState<Author | null>(null)
  const [authorBooks, setAuthorBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [nationalities, setNationalities] = useState<string[]>([])
  const [selectedNationality, setSelectedNationality] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [authorImageUrl, setAuthorImageUrl] = useState<string | null>(null)

  // Fetch author data
  useEffect(() => {
    async function fetchAuthorData() {
      try {
        setError(null)

        // Fetch author
        const { data: authorData, error: authorError } = await supabaseClient
          .from('authors')
          .select('*, author_image:author_image_id(url)')
          .eq('id', params.id as string)
          .single()

        if (authorError) {
          console.error('Error fetching author:', authorError)
          setError(`Error fetching author: ${authorError.message}`)
          return
        }

        const author = authorData as Author
        setAuthor(author)
        setSelectedNationality(author.nationality || '')

        // Set the image URL from the joined author_image table
        const authorImage = (authorData as any).author_image as any
        if (authorImage && authorImage.url) {
          setAuthorImageUrl(authorImage.url)
        }

        // Fetch books by this author
        const { data: booksData, error: booksError } = await supabaseClient
          .from('books')
          .select('*')
          .eq('author_id', params.id as string)
          .order('title')

        if (booksError) {
          console.error('Error fetching author books:', booksError)
        } else {
          setAuthorBooks(booksData as Book[])
        }

        // Get list of nationalities from existing authors for dropdown
        const { data: nationalitiesData, error: nationalitiesError } = await supabaseClient
          .from('authors')
          .select('nationality')
          .not('nationality', 'is', null)
          .order('nationality')

        if (nationalitiesError) {
          console.error('Error fetching nationalities:', nationalitiesError)
        } else if (nationalitiesData) {
          // Extract unique nationalities
          const uniqueNationalities = Array.from(
            new Set(
              nationalitiesData
                .map((item: { nationality: string | null }) => item.nationality)
                .filter(Boolean) as string[]
            )
          )
          setNationalities(uniqueNationalities)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error in fetchAuthorData:', error)
        setLoading(false)
        setError('An unexpected error occurred. Please try again.')
      }
    }

    fetchAuthorData()
  }, [params.id as string])

  // Handle photo change
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!author) return

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const formData = new FormData(e.currentTarget)

      // Handle photo upload if changed
      let newAuthorImageId = (author as any).author_image_id

      if (photoFile) {
        try {
          // Convert the file to base64
          const reader = new FileReader()
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const base64 = reader.result as string
              resolve(base64)
            }
            reader.onerror = () => {
              reject(new Error('Failed to read file'))
            }
            reader.readAsDataURL(photoFile)
          })

          const base64Image = await base64Promise
          console.log('Base64 image prepared, uploading to Cloudinary...')

          // Upload the new image to Cloudinary with alt text
          const authorName = formData.get('name') as string
          const uploadResult = await uploadImage(
            base64Image,
            'authorimage',
            `Photo of ${authorName}`
          )

          if (uploadResult) {
            console.log('Image uploaded successfully:', uploadResult.url)
            newAuthorImageId = uploadResult.imageId
          } else {
            throw new Error('Failed to upload image - no URL returned')
          }
        } catch (uploadError) {
          console.error('Upload error details:', uploadError)
          setError(
            `Failed to upload author photo: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`
          )
          setSaving(false)
          return
        }
      }

      // Prepare the update data
      const birthDateValue = formData.get('birth_date') as string
      const updateData: any = {
        name: formData.get('name') as string,
        bio: formData.get('bio') as string,
        // Only include birth_date if it's not empty
        ...(birthDateValue.trim() ? { birth_date: birthDateValue } : { birth_date: null }),
        nationality: selectedNationality,
        website: formData.get('website') as string,
        twitter_handle: formData.get('twitter_handle') as string,
        facebook_handle: formData.get('facebook_handle') as string,
        instagram_handle: formData.get('instagram_handle') as string,
        goodreads_url: formData.get('goodreads_url') as string,
        author_image_id: newAuthorImageId,
      }

      // Update the author
      const { error: updateError } = await (supabaseClient.from('authors') as any)
        .update(updateData)
        .eq('id', params.id as string)

      if (updateError) {
        console.error('Error updating author:', updateError)
        setError(`Error updating author: ${updateError.message}`)
        setSaving(false)
        return
      }

      setSuccessMessage('Author updated successfully!')

      // Redirect back to the author page after a short delay
      setTimeout(() => {
        router.push(`/authors/${params.id as string}`)
      }, 1500)
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      setError('An unexpected error occurred while saving. Please try again.')
    } finally {
      setSaving(false)
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
              <p>Loading author information...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!author) {
    return (
      <div className="min-h-screen flex flex-col">
        <PageHeader />
        <main className="flex-1 container py-8">
          <div className="flex items-center justify-center h-full">
            <p>Author not found</p>
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
          <h1 className="text-3xl font-bold mb-6">Edit Author</h1>

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
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Author Photo */}
            <div>
              <Card className="overflow-hidden">
                {photoPreview ? (
                  <div className="w-full h-full">
                    <Image
                      src={photoPreview || '/placeholder.svg'}
                      alt={author.name}
                      width={400}
                      height={400}
                      className="w-full aspect-square object-cover"
                    />
                  </div>
                ) : authorImageUrl ? (
                  <div className="w-full h-full">
                    <Image
                      src={authorImageUrl || '/placeholder.svg'}
                      alt={author.name}
                      width={400}
                      height={400}
                      className="w-full aspect-square object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-muted flex items-center justify-center">
                    <User className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </Card>
              <div className="mt-4">
                <Label htmlFor="author-photo" className="block mb-2">
                  Change Photo
                </Label>
                <Input
                  id="author-photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Images will be stored in Cloudinary in the authorsinfo/authorimage folder
                </p>
              </div>

              {/* Author's Books */}
              {authorBooks.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Books by this Author</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {authorBooks.map((book) => (
                        <li key={book.id} className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <Link href={`/books/${book.id}`} className="hover:underline truncate">
                            {book.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Author Details Form */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Author Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      {/* Basic Information */}
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" defaultValue={author.name} required />
                      </div>

                      {/* Nationality with searchable dropdown */}
                      <div>
                        <Label htmlFor="nationality">Nationality</Label>
                        <Combobox
                          options={nationalities.map((nat) => ({ value: nat, label: nat }))}
                          value={selectedNationality}
                          onChange={setSelectedNationality}
                          placeholder="Select or type a nationality..."
                          emptyMessage="No matching nationality found. Type to add a new one."
                          className="w-full"
                        />
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="birth_date">Birth Date</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="birth_date"
                              name="birth_date"
                              className="pl-10"
                              defaultValue={author.birth_date || ''}
                              placeholder="YYYY-MM-DD or text format"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Biography */}
                      <div>
                        <Label htmlFor="bio">Biography</Label>
                        <Textarea id="bio" name="bio" rows={8} defaultValue={author.bio || ''} />
                      </div>

                      {/* Social Media */}
                      <div>
                        <h3 className="text-lg font-medium mb-2">Social Media & Web Presence</h3>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="website">Website</Label>
                            <Input
                              id="website"
                              name="website"
                              type="url"
                              defaultValue={author.website || ''}
                              placeholder="https://example.com"
                            />
                          </div>

                          <div>
                            <Label htmlFor="twitter_handle">Twitter</Label>
                            <Input
                              id="twitter_handle"
                              name="twitter_handle"
                              defaultValue={author.twitter_handle || ''}
                              placeholder="@username"
                            />
                          </div>

                          <div>
                            <Label htmlFor="facebook_handle">Facebook</Label>
                            <Input
                              id="facebook_handle"
                              name="facebook_handle"
                              defaultValue={author.facebook_handle || ''}
                              placeholder="username or page name"
                            />
                          </div>

                          <div>
                            <Label htmlFor="instagram_handle">Instagram</Label>
                            <Input
                              id="instagram_handle"
                              name="instagram_handle"
                              defaultValue={author.instagram_handle || ''}
                              placeholder="username"
                            />
                          </div>

                          <div>
                            <Label htmlFor="goodreads_url">Goodreads Profile</Label>
                            <Input
                              id="goodreads_url"
                              name="goodreads_url"
                              defaultValue={author.goodreads_url || ''}
                              placeholder="https://www.goodreads.com/author/show/..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-4">
                      <Button type="button" variant="outline" asChild>
                        <Link href={`/authors/${author.id}`}>Cancel</Link>
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
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
