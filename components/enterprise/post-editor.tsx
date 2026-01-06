'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/hooks/useAuth'
import { Post, CreatePostData, PostContentType, PostVisibility } from '@/types/post'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bold, Italic, Hash, Image, Send, Save, X } from 'lucide-react'

interface PostEditorProps {
  initialData?: Partial<CreatePostData>
  onPostCreated?: (post: Post) => void
  onCancel?: () => void
  entityType?: string
  entityId?: string
  isEditing?: boolean
  existingPost?: Post
}

export default function PostEditor({
  initialData,
  onPostCreated,
  onCancel,
  entityType = 'user',
  entityId,
  isEditing = false,
  existingPost,
}: PostEditorProps) {
  const { user } = useAuth()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [content, setContent] = useState(
    initialData?.content?.text || existingPost?.content?.text || ''
  )
  const [hashtags, setHashtags] = useState<string[]>(
    initialData?.content?.hashtags || existingPost?.content?.hashtags || []
  )
  const [visibility, setVisibility] = useState<PostVisibility>(
    initialData?.visibility || existingPost?.visibility || 'public'
  )
  const [isSubmitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [charCount, setCharCount] = useState(0)
  const maxChars = 5000

  useEffect(() => {
    setCharCount(content.length)
  }, [content])

  const handleSubmit = useCallback(async () => {
    if (!user || !content.trim()) return

    setSubmitting(true)
    setErrors([])

    try {
      const postData: any = {
        user_id: user.id,
        text: content, // Store text directly in the text column
        data: {
          type: 'text',
          hashtags: hashtags,
        },
        visibility: visibility,
        content_type: 'text',
        publish_status: 'published',
        entity_type: entityType,
        entity_id: entityId,
      }

      const { data, error } = await supabase.from('activities').insert(postData).select().single()

      if (error) throw error

      if (onPostCreated && data) {
        onPostCreated(data)
      }

      // Reset form
      setContent('')
      setHashtags([])
    } catch (error) {
      console.error('Error creating post:', error)
      setErrors(['Failed to create post'])
    } finally {
      setSubmitting(false)
    }
  }, [user, content, hashtags, visibility, entityType, entityId, onPostCreated, supabase])

  const addHashtag = useCallback(
    (tag: string) => {
      if (tag && !hashtags.includes(tag)) {
        setHashtags([...hashtags, tag])
      }
    },
    [hashtags]
  )

  const removeHashtag = useCallback(
    (tagToRemove: string) => {
      setHashtags(hashtags.filter((tag) => tag !== tagToRemove))
    },
    [hashtags]
  )

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <p className="text-center text-muted-foreground">Please sign in to create a post</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{isEditing ? 'Edit Post' : 'Create Post'}</span>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {errors.length > 0 && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            {errors.map((error, index) => (
              <p key={index} className="text-sm text-destructive">
                {error}
              </p>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px]"
            maxLength={maxChars}
          />

          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>
              {charCount} / {maxChars} characters
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Hashtags</label>
          <div className="flex flex-wrap gap-2">
            {hashtags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="cursor-pointer">
                #{tag}
                <button onClick={() => removeHashtag(tag)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Input
            placeholder="Add hashtag and press Enter"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addHashtag(e.currentTarget.value.trim())
                e.currentTarget.value = ''
              }
            }}
            className="max-w-xs"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Visibility</label>
          <div className="flex gap-2">
            {(['public', 'friends', 'private'] as PostVisibility[]).map((vis) => (
              <Button
                key={vis}
                variant={visibility === vis ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVisibility(vis)}
              >
                {vis.charAt(0).toUpperCase() + vis.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button onClick={handleSubmit} disabled={isSubmitting || !content.trim()}>
            <Send className="h-4 w-4 mr-2" />
            {isEditing ? 'Update Post' : 'Post'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
