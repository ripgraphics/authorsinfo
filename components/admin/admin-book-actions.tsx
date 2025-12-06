"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  BookOpen,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
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
  MoreHorizontal,
  Share2,
  Bookmark,
  Heart,
  Archive,
  Lock,
  Unlock,
  EyeOff,
  Zap,
  Target,
  TrendingUp,
  Users,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ImageIcon,
  BarChart3,
  Activity
} from "lucide-react"

interface Book {
  id: string
  title: string
  featured?: boolean
  status?: {
    id: string
    name: string
  }
  cover_image_url?: string
  author?: {
    id: string
    name: string
  }
  publisher?: {
    id: string
    name: string
  }
}

interface AdminBookActionsProps {
  book: Book
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

export function AdminBookActions({ book, open, onOpenChange, onEdit, onDelete }: AdminBookActionsProps) {
  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        // You could add a toast notification here
        console.log('Copied to clipboard:', text);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          console.log('Copied to clipboard (fallback):', text);
        } catch (err) {
          console.error('Failed to copy to clipboard:', err);
        }
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
    }
  }

  const handleToggleFeatured = async () => {
    try {
      const response = await fetch(`/api/admin/books/${book.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          featured: !book.featured
        })
      })

      if (response.ok) {
        // Refresh the page or update the book data
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to toggle featured status:', error)
    }
  }

  const handleArchive = async () => {
    try {
      const response = await fetch(`/api/admin/books/${book.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status_id: 'archived' // Assuming you have an archived status
        })
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to archive book:', error)
    }
  }

  const handleDuplicate = async () => {
    try {
      const response = await fetch('/api/admin/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...book,
          id: undefined, // Remove ID to create new book
          title: `${book.title} (Copy)`,
          created_at: undefined,
          updated_at: undefined
        })
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to duplicate book:', error)
    }
  }

  const handleExportData = () => {
    const bookData = {
      id: book.id,
      title: book.title,
      author: book.author?.name,
      publisher: book.publisher?.name,
      featured: book.featured,
      status: book.status?.name,
      cover_image_url: book.cover_image_url,
      export_date: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(bookData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_data.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MoreHorizontal className="h-5 w-5" />
            Book Actions
          </DialogTitle>
          <DialogDescription>
            Manage {book.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Book Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="w-16 h-24 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-24 bg-muted flex items-center justify-center rounded">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{book.title}</h3>
                  {book.author && (
                    <p className="text-sm text-muted-foreground truncate">
                      by {book.author.name}
                    </p>
                  )}
                  {book.publisher && (
                    <p className="text-sm text-muted-foreground truncate">
                      {book.publisher.name}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {book.featured && (
                      <Badge variant="secondary">Featured</Badge>
                    )}
                    {book.status && (
                      <Badge variant="outline">{book.status.name}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Primary Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Primary Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={onEdit} className="justify-start">
                <Edit className="h-4 w-4 mr-2" />
                Edit Book
              </Button>
              <Button variant="outline" onClick={onDelete} className="justify-start text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Book
              </Button>
            </div>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Quick Actions</h4>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleToggleFeatured}
              >
                {book.featured ? (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Remove Featured
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Mark as Featured
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleDuplicate}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate Book
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleArchive}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive Book
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleExportData}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>

          <Separator />

          {/* Information */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Information</h4>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => copyToClipboard(book.id)}
              >
                <Hash className="h-4 w-4 mr-2" />
                Copy Book ID
              </Button>

              {book.cover_image_url && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => copyToClipboard(book.cover_image_url!)}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Copy Image URL
                </Button>
              )}

              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => window.open(`/books/${book.id}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Public Page
              </Button>
            </div>
          </div>

          <Separator />

          {/* Analytics */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Analytics</h4>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => window.open(`/admin/books/${book.id}/analytics`, '_blank')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => window.open(`/admin/books/${book.id}/reviews`, '_blank')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                View Reviews
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => window.open(`/admin/books/${book.id}/activity`, '_blank')}
              >
                <Activity className="h-4 w-4 mr-2" />
                View Activity
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 