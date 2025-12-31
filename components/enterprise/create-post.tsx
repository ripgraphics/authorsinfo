'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  MessageSquare,
  Image as ImageIcon,
  Link as LinkIcon,
  Globe,
  Lock,
  Users,
  BookOpen,
  User,
  Building,
  Calendar,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth' // Add this import

interface CreatePostProps {
  entityType?: string
  entityId?: string
  onPostCreated?: () => void
  className?: string
}

export default function CreatePost({
  entityType = 'user',
  entityId,
  onPostCreated,
  className = '',
}: CreatePostProps) {
  const { toast } = useToast()
  const { user } = useAuth() // Get current user
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() && (!imageUrl || !linkUrl)) {
      toast({
        title: 'Error',
        description: 'Please enter some content or add an image/link for your post',
        variant: 'destructive',
      })
      return
    }

    // Check if user is authenticated
    if (!user?.id) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to create posts',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: {
            text: content.trim(),
          },
          image_url: imageUrl || undefined,
          link_url: linkUrl || undefined,
          visibility,
          entity_type: entityType,
          entity_id: entityId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create post')
      }

      const result = await response.json()

      toast({
        title: 'Success!',
        description: 'Your post has been created successfully',
      })

      // Reset form
      setContent('')
      setImageUrl('')
      setLinkUrl('')

      // Notify parent component
      if (onPostCreated) {
        onPostCreated()
      }
    } catch (error) {
      console.error('Error creating post:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create post',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getVisibilityIcon = () => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-4 w-4" />
      case 'private':
        return <Lock className="h-4 w-4" />
      case 'friends':
        return <Users className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  const getVisibilityLabel = () => {
    switch (visibility) {
      case 'public':
        return 'Public'
      case 'private':
        return 'Private'
      case 'friends':
        return 'Friends Only'
      default:
        return 'Public'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Create a Post
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content Input */}
          <div>
            <Label htmlFor="content">What's on your mind?</Label>
            <Textarea
              id="content"
              placeholder="Share your thoughts, ideas, or updates..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={1000}
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {content.length}/1000 characters
            </div>
          </div>

          {/* Image URL */}
          <div>
            <Label htmlFor="image-url">Image URL (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              {imageUrl && (
                <Button type="button" variant="outline" size="sm" onClick={() => setImageUrl('')}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Link URL */}
          <div>
            <Label htmlFor="link-url">Link URL (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="link-url"
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              {linkUrl && (
                <Button type="button" variant="outline" size="sm" onClick={() => setLinkUrl('')}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Visibility Settings */}
          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Public - Everyone can see this post
                  </div>
                </SelectItem>
                <SelectItem value="friends">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Friends Only - Only your friends can see this post
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Private - Only you can see this post
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Entity Type Badge */}
          {entityType && entityType !== 'user' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Posting to:</span>
              <Badge variant="outline" className="capitalize">
                {entityType === 'book' && <BookOpen className="h-3 w-3 mr-1" />}
                {entityType === 'author' && <User className="h-3 w-3 mr-1" />}
                {entityType === 'publisher' && <Building className="h-3 w-3 mr-1" />}
                {entityType === 'group' && <Users className="h-3 w-3 mr-1" />}
                {entityType === 'event' && <Calendar className="h-3 w-3 mr-1" />}
                {entityType}
              </Badge>
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting || !content.trim()}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Post...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-2" />
                Publish Post
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
