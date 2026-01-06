'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  BookOpen,
  User,
  Building,
  Image as ImageIcon,
  Upload,
  Trash2,
  Save,
  X,
  Plus,
  Edit,
  Eye,
  Download,
  RefreshCw,
  Settings,
  Database,
  FileText,
  Star,
  Calendar,
  Globe,
  Hash,
  Tag,
  Link,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react'

interface Book {
  id?: string
  title: string
  title_long?: string
  isbn10?: string
  isbn13?: string
  publication_date?: string
  language?: string
  pages?: number
  average_rating?: number
  review_count?: number
  featured?: boolean
  synopsis?: string
  overview?: string
  dimensions?: string
  weight?: number
  list_price?: number
  cover_image_url?: string
  original_image_url?: string
  author_id?: string
  publisher_id?: string
  binding_type_id?: string
  format_type_id?: string
  status_id?: string
  author?: {
    id: string
    name: string
    author_image?: {
      url: string
    }
  }
  publisher?: {
    id: string
    name: string
    logo_url?: string
  }
  binding_type?: {
    id: string
    name: string
  }
  format_type?: {
    id: string
    name: string
  }
  status?: {
    id: string
    name: string
  }
}

interface AdminBookEditorProps {
  book?: Book | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function AdminBookEditor({ book, open, onOpenChange, onSave }: AdminBookEditorProps) {
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState<Book>({
    title: '',
    title_long: '',
    isbn10: '',
    isbn13: '',
    publication_date: '',
    language: '',
    pages: undefined,
    average_rating: undefined,
    review_count: undefined,
    featured: false,
    synopsis: '',
    overview: '',
    dimensions: '',
    weight: undefined,
    list_price: undefined,
    cover_image_url: '',
    original_image_url: '',
    author_id: '',
    publisher_id: '',
    binding_type_id: '',
    format_type_id: '',
    status_id: '',
  })

  // Options for dropdowns
  const [authors, setAuthors] = useState<Array<{ id: string; name: string }>>([])
  const [publishers, setPublishers] = useState<Array<{ id: string; name: string }>>([])
  const [bindingTypes, setBindingTypes] = useState<Array<{ id: string; name: string }>>([])
  const [formatTypes, setFormatTypes] = useState<Array<{ id: string; name: string }>>([])
  const [statuses, setStatuses] = useState<Array<{ id: string; name: string }>>([])

  // Loading states
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Initialize form data when book changes
  useEffect(() => {
    if (book) {
      setFormData({
        id: book.id,
        title: book.title || '',
        title_long: book.title_long || '',
        isbn10: book.isbn10 || '',
        isbn13: book.isbn13 || '',
        publication_date: book.publication_date || '',
        language: book.language || '',
        pages: book.pages,
        average_rating: book.average_rating,
        review_count: book.review_count,
        featured: book.featured || false,
        synopsis: book.synopsis || '',
        overview: book.overview || '',
        dimensions: book.dimensions || '',
        weight: book.weight,
        list_price: book.list_price,
        cover_image_url: book.cover_image_url || '',
        original_image_url: book.original_image_url || '',
        author_id: book.author_id || book.author?.id || '',
        publisher_id: book.publisher_id || book.publisher?.id || '',
        binding_type_id: book.binding_type_id || book.binding_type?.id || '',
        format_type_id: book.format_type_id || book.format_type?.id || '',
        status_id: book.status_id || book.status?.id || '',
      })
    } else {
      setFormData({
        title: '',
        title_long: '',
        isbn10: '',
        isbn13: '',
        publication_date: '',
        language: '',
        pages: undefined,
        average_rating: undefined,
        review_count: undefined,
        featured: false,
        synopsis: '',
        overview: '',
        dimensions: '',
        weight: undefined,
        list_price: undefined,
        cover_image_url: '',
        original_image_url: '',
        author_id: '',
        publisher_id: '',
        binding_type_id: '',
        format_type_id: '',
        status_id: '',
      })
    }
  }, [book])

  // Load options
  useEffect(() => {
    if (open) {
      loadOptions()
    }
  }, [open])

  const loadOptions = async () => {
    setLoading(true)
    try {
      const [authorsRes, publishersRes, bindingTypesRes, formatTypesRes, statusesRes] =
        await Promise.all([
          fetch('/api/admin/authors'),
          fetch('/api/admin/publishers'),
          fetch('/api/admin/binding-types'),
          fetch('/api/admin/format-types'),
          fetch('/api/admin/statuses'),
        ])

      if (authorsRes.ok) {
        const authorsData = await authorsRes.json()
        setAuthors(authorsData.authors || [])
      }

      if (publishersRes.ok) {
        const publishersData = await publishersRes.json()
        setPublishers(publishersData.publishers || [])
      }

      if (bindingTypesRes.ok) {
        const bindingTypesData = await bindingTypesRes.json()
        setBindingTypes(bindingTypesData.bindingTypes || [])
      }

      if (formatTypesRes.ok) {
        const formatTypesData = await formatTypesRes.json()
        setFormatTypes(formatTypesData.formatTypes || [])
      }

      if (statusesRes.ok) {
        const statusesData = await statusesRes.json()
        setStatuses(statusesData.statuses || [])
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load options',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof Book, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'book_covers')

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to upload image')
    }

    const data = await response.json()
    return data.url
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let coverImageUrl = formData.cover_image_url

      // Upload new image if selected
      if (imageFile) {
        coverImageUrl = await uploadImage(imageFile)
      }

      const bookData = {
        ...formData,
        cover_image_url: coverImageUrl,
      }

      const url = book?.id ? `/api/admin/books/${book.id}` : '/api/admin/books'
      const method = book?.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookData),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: book?.id ? 'Book updated successfully' : 'Book created successfully',
        })
        onSave()
        onOpenChange(false)
      } else {
        const data = await response.json()
        toast({
          title: 'Error',
          description: data.error || 'Failed to save book',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save book',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!book?.id) return

    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/books/${book.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Book deleted successfully',
        })
        onSave()
        onOpenChange(false)
      } else {
        const data = await response.json()
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete book',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete book',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {book?.id ? 'Edit Book' : 'Add New Book'}
          </DialogTitle>
          <DialogDescription>
            Manage all book information including metadata, images, and relationships.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Book title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title_long">Long Title</Label>
                <Input
                  id="title_long"
                  value={formData.title_long || ''}
                  onChange={(e) => handleInputChange('title_long', e.target.value)}
                  placeholder="Full book title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isbn10">ISBN-10</Label>
                <Input
                  id="isbn10"
                  value={formData.isbn10 || ''}
                  onChange={(e) => handleInputChange('isbn10', e.target.value)}
                  placeholder="ISBN-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isbn13">ISBN-13</Label>
                <Input
                  id="isbn13"
                  value={formData.isbn13 || ''}
                  onChange={(e) => handleInputChange('isbn13', e.target.value)}
                  placeholder="ISBN-13"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publication_date">Publication Date</Label>
                <Input
                  id="publication_date"
                  type="date"
                  value={formData.publication_date || ''}
                  onChange={(e) => handleInputChange('publication_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={formData.language || 'none'}
                  onValueChange={(value) =>
                    handleInputChange('language', value === 'none' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select language</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="ru">Russian</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pages">Pages</Label>
                <Input
                  id="pages"
                  type="number"
                  value={formData.pages || ''}
                  onChange={(e) =>
                    handleInputChange('pages', e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="Number of pages"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="list_price">List Price</Label>
                <Input
                  id="list_price"
                  type="number"
                  step="0.01"
                  value={formData.list_price || ''}
                  onChange={(e) =>
                    handleInputChange(
                      'list_price',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.featured || false}
                onCheckedChange={(checked) => handleInputChange('featured', checked)}
              />
              <Label htmlFor="featured">Featured Book</Label>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="synopsis">Synopsis</Label>
                <Textarea
                  id="synopsis"
                  value={formData.synopsis || ''}
                  onChange={(e) => handleInputChange('synopsis', e.target.value)}
                  placeholder="Brief synopsis"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="overview">Overview</Label>
                <Textarea
                  id="overview"
                  value={formData.overview || ''}
                  onChange={(e) => handleInputChange('overview', e.target.value)}
                  placeholder="Detailed overview"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  value={formData.dimensions || ''}
                  onChange={(e) => handleInputChange('dimensions', e.target.value)}
                  placeholder="e.g., 6 x 9 inches"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (grams)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight || ''}
                  onChange={(e) =>
                    handleInputChange('weight', e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="Weight in grams"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="average_rating">Average Rating</Label>
                <Input
                  id="average_rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.average_rating || ''}
                  onChange={(e) =>
                    handleInputChange(
                      'average_rating',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="0.0 - 5.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="review_count">Review Count</Label>
                <Input
                  id="review_count"
                  type="number"
                  value={formData.review_count || ''}
                  onChange={(e) =>
                    handleInputChange(
                      'review_count',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="Number of reviews"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cover Image */}
              <div className="space-y-4">
                <Label>Cover Image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {imagePreview || formData.cover_image_url ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview || formData.cover_image_url}
                        alt="Cover preview"
                        className="w-32 h-48 object-cover mx-auto rounded-sm"
                      />
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('cover-upload')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Change
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setImageFile(null)
                            setImagePreview(null)
                            handleInputChange('cover_image_url', '')
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('cover-upload')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Cover
                        </Button>
                      </div>
                    </div>
                  )}
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Original Image URL */}
              <div className="space-y-4">
                <Label>Original Image URL</Label>
                <Input
                  value={formData.original_image_url || ''}
                  onChange={(e) => handleInputChange('original_image_url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                {formData.original_image_url && (
                  <div className="text-sm text-muted-foreground">
                    <ExternalLink className="h-4 w-4 inline mr-1" />
                    <a
                      href={formData.original_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View original image
                    </a>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="relationships" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Select
                  value={formData.author_id || 'none'}
                  onValueChange={(value) =>
                    handleInputChange('author_id', value === 'none' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select author" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select author</SelectItem>
                    {authors.map((author) => (
                      <SelectItem key={author.id} value={author.id}>
                        {author.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publisher">Publisher</Label>
                <Select
                  value={formData.publisher_id || 'none'}
                  onValueChange={(value) =>
                    handleInputChange('publisher_id', value === 'none' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select publisher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select publisher</SelectItem>
                    {publishers.map((publisher) => (
                      <SelectItem key={publisher.id} value={publisher.id}>
                        {publisher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="binding_type">Binding Type</Label>
                <Select
                  value={formData.binding_type_id || 'none'}
                  onValueChange={(value) =>
                    handleInputChange('binding_type_id', value === 'none' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select binding type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select binding type</SelectItem>
                    {bindingTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format_type">Format Type</Label>
                <Select
                  value={formData.format_type_id || 'none'}
                  onValueChange={(value) =>
                    handleInputChange('format_type_id', value === 'none' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select format type</SelectItem>
                    {formatTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status_id || 'none'}
                  onValueChange={(value) =>
                    handleInputChange('status_id', value === 'none' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select status</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          {book?.id && (
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !formData.title}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
