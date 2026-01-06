'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BookOpen,
  User,
  Building,
  Image as ImageIcon,
  Edit,
  Eye,
  Download,
  ExternalLink,
  Copy,
  Calendar,
  Globe,
  Hash,
  Tag,
  Star,
  FileText,
  Package,
  DollarSign,
  BarChart3,
  Database,
  Settings,
  Link,
  Bookmark,
  Heart,
  Share2,
  MoreHorizontal,
} from 'lucide-react'

interface Book {
  id: string
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
  created_at: string
  updated_at?: string
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
    publisher_image?: {
      url: string
      alt_text?: string
    }
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

interface AdminBookDetailsProps {
  book: Book
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminBookDetails({ book, open, onOpenChange }: AdminBookDetailsProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatPrice = (price?: number) => {
    if (!price) return 'Not set'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const formatRating = (rating?: number) => {
    if (!rating) return 'No rating'
    return `${rating.toFixed(1)}/5.0`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Book Details
          </DialogTitle>
          <DialogDescription>Complete information about {book.title}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cover Image */}
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Cover Image
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {book.cover_image_url ? (
                      <div className="space-y-4">
                        <img
                          src={book.cover_image_url}
                          alt={book.title}
                          className="w-full h-64 object-cover rounded-lg"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(book.cover_image_url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(book.cover_image_url!)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy URL
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 bg-muted flex items-center justify-center rounded-lg">
                        <div className="text-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No cover image</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Basic Info */}
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Basic Information</span>
                      <div className="flex items-center gap-2">
                        {book.featured && <Badge variant="secondary">Featured</Badge>}
                        {book.status && <Badge variant="outline">{book.status.name}</Badge>}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{book.title}</h3>
                      {book.title_long && book.title_long !== book.title && (
                        <p className="text-sm text-muted-foreground mt-1">{book.title_long}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Author</label>
                        <p className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {book.author ? book.author.name : 'Unknown'}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Publisher
                        </label>
                        <p className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {book.publisher ? book.publisher.name : 'Unknown'}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Publication Date
                        </label>
                        <p className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {book.publication_date ? formatDate(book.publication_date) : 'Unknown'}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Language
                        </label>
                        <p className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {book.language || 'Unknown'}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Pages</label>
                        <p className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {book.pages ? `${book.pages} pages` : 'Unknown'}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Rating</label>
                        <p className="flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          {formatRating(book.average_rating)}
                          {book.review_count && (
                            <span className="text-sm text-muted-foreground">
                              ({book.review_count} reviews)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ISBN Information */}
                {(book.isbn10 || book.isbn13) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        ISBN Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {book.isbn10 && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              ISBN-10
                            </label>
                            <div className="flex items-center gap-2">
                              <p className="font-mono">{book.isbn10}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(book.isbn10!)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        {book.isbn13 && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              ISBN-13
                            </label>
                            <div className="flex items-center gap-2">
                              <p className="font-mono">{book.isbn13}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(book.isbn13!)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Physical Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Physical Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Format</label>
                      <p>{book.format_type?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Binding</label>
                      <p>{book.binding_type?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Dimensions
                      </label>
                      <p>{book.dimensions || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Weight</label>
                      <p>{book.weight ? `${book.weight}g` : 'Not specified'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">List Price</label>
                    <p className="text-lg font-semibold">{formatPrice(book.list_price)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Content */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {book.synopsis && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Synopsis</label>
                      <p className="mt-1">{book.synopsis}</p>
                    </div>
                  )}
                  {book.overview && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Overview</label>
                      <p className="mt-1">{book.overview}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="images" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cover Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Cover Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {book.cover_image_url ? (
                    <>
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Cover Image URL</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(book.cover_image_url!)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground break-all">
                          {book.cover_image_url}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="h-64 bg-muted flex items-center justify-center rounded-lg">
                      <div className="text-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No cover image</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Original Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Original Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {book.original_image_url ? (
                    <>
                      <img
                        src={book.original_image_url}
                        alt="Original"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Original Image URL</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(book.original_image_url!)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground break-all">
                          {book.original_image_url}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="h-64 bg-muted flex items-center justify-center rounded-lg">
                      <div className="text-center">
                        <ExternalLink className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No original image</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* System Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Book ID</label>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm">{book.id}</p>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(book.id)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created</label>
                      <p>{formatDate(book.created_at)}</p>
                    </div>
                    {book.updated_at && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Last Updated
                        </label>
                        <p>{formatDate(book.updated_at)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Average Rating
                      </label>
                      <p className="text-lg font-semibold">{formatRating(book.average_rating)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Review Count
                      </label>
                      <p className="text-lg font-semibold">{book.review_count || 0}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Featured</label>
                      <p>{book.featured ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <p>{book.status?.name || 'Unknown'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Related Entities */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    Related Entities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {book.author && (
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        {book.author.author_image?.url ? (
                          <img
                            src={book.author.author_image.url}
                            alt={book.author.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{book.author.name}</p>
                          <p className="text-sm text-muted-foreground">Author</p>
                        </div>
                      </div>
                    )}

                    {book.publisher && (
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        {book.publisher.publisher_image?.url ? (
                          <img
                            src={book.publisher.publisher_image.url}
                            alt={book.publisher.name}
                            className="w-10 h-10 rounded-sm object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded-sm flex items-center justify-center">
                            <Building className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{book.publisher.name}</p>
                          <p className="text-sm text-muted-foreground">Publisher</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
