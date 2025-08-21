'use client'

import React, { useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Post, UpdatePostData } from '@/types/post'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Eye, 
  EyeOff, 
  Users, 
  Lock,
  RotateCcw
} from 'lucide-react'
import { PostVisibility } from '@/types/post'

interface PostManagerProps {
  post: Post
  onPostUpdated?: (updatedPost: Post) => void
  onPostDeleted?: (postId: string) => void
  onPostRestored?: (restoredPost: Post) => void
}

export default function PostManager({
  post,
  onPostUpdated,
  onPostDeleted,
  onPostRestored
}: PostManagerProps) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    content: post.content?.text || '',
    hashtags: post.content?.hashtags || [],
    visibility: post.visibility || 'public',
    tags: post.tags || []
  })

  // Check if user can edit this post
  const canEdit = user && post.user_id === user.id && !post.is_deleted
  const canDelete = user && post.user_id === user.id && !post.is_deleted
  const canRestore = user && post.user_id === user.id && post.is_deleted

  // Handle edit mode toggle
  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      // Reset form to original values
      setEditForm({
        content: post.content?.text || '',
        hashtags: post.content?.hashtags || [],
        visibility: post.visibility || 'public',
        tags: post.tags || []
      })
      setErrors([])
    }
    setIsEditing(!isEditing)
  }, [isEditing, post])

  // Handle form input changes
  const handleInputChange = useCallback((field: string, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }, [])

  // Add hashtag
  const addHashtag = useCallback((tag: string) => {
    if (tag && !editForm.hashtags.includes(tag)) {
      setEditForm(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, tag]
      }))
    }
  }, [editForm.hashtags])

  // Remove hashtag
  const removeHashtag = useCallback((tagToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter(tag => tag !== tagToRemove)
    }))
  }, [])

  // Handle post update
  const handleUpdate = useCallback(async () => {
    if (!editForm.content.trim()) {
      setErrors(['Post content cannot be empty'])
      return
    }

    setIsSubmitting(true)
    setErrors([])

    try {
      const updateData: UpdatePostData = {
        content: {
          text: editForm.content.trim(),
          hashtags: editForm.hashtags
        },
        tags: editForm.hashtags,
        visibility: editForm.visibility
      }

      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update post')
      }

      const { post: updatedPost } = await response.json()
      
      if (onPostUpdated) {
        onPostUpdated(updatedPost)
      }
      
      setIsEditing(false)
      
    } catch (error) {
      console.error('Error updating post:', error)
      setErrors([error instanceof Error ? error.message : 'Failed to update post'])
    } finally {
      setIsSubmitting(false)
    }
  }, [editForm, post.id, onPostUpdated])

  // Handle post deletion
  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    setErrors([])

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete post')
      }

      if (onPostDeleted) {
        onPostDeleted(post.id)
      }
      
    } catch (error) {
      console.error('Error deleting post:', error)
      setErrors([error instanceof Error ? error.message : 'Failed to delete post'])
    } finally {
      setIsDeleting(false)
    }
  }, [post.id, onPostDeleted])

  // Handle post restoration
  const handleRestore = useCallback(async () => {
    setIsRestoring(true)
    setErrors([])

    try {
      const response = await fetch(`/api/posts/${post.id}/restore`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to restore post')
      }

      const { post: restoredPost } = await response.json()
      
      if (onPostRestored) {
        onPostRestored(restoredPost)
      }
      
    } catch (error) {
      console.error('Error restoring post:', error)
      setErrors([error instanceof Error ? error.message : 'Failed to restore post'])
    } finally {
      setIsRestoring(false)
    }
  }, [post.id, onPostRestored])

  // Get visibility icon
  const getVisibilityIcon = useCallback((visibility: PostVisibility) => {
    switch (visibility) {
      case 'public':
        return <Eye className="h-4 w-4" />
      case 'friends':
        return <Users className="h-4 w-4" />
      case 'private':
        return <Lock className="h-4 w-4" />
      default:
        return <Eye className="h-4 w-4" />
    }
  }, [])

  if (!canEdit && !canDelete && !canRestore) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Post Management</h3>
            {post.is_deleted && (
              <Badge variant="destructive">Deleted</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {canEdit && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditToggle}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            
            {canDelete && !post.is_deleted && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            
            {canRestore && post.is_deleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestore}
                disabled={isRestoring}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {isRestoring ? 'Restoring...' : 'Restore'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Display */}
        {errors.length > 0 && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            {errors.map((error, index) => (
              <p key={index} className="text-sm text-destructive">{error}</p>
            ))}
          </div>
        )}

        {/* Edit Mode */}
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={editForm.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Edit your post content..."
                className="min-h-[100px]"
                maxLength={5000}
              />
              <div className="text-sm text-muted-foreground">
                {editForm.content.length} / 5000 characters
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hashtags</label>
              <div className="flex flex-wrap gap-2">
                {editForm.hashtags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer">
                    #{tag}
                    <button
                      onClick={() => removeHashtag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
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
                    variant={editForm.visibility === vis ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleInputChange('visibility', vis)}
                  >
                    {getVisibilityIcon(vis)}
                    <span className="ml-2">
                      {vis.charAt(0).toUpperCase() + vis.slice(1)}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleEditToggle}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleUpdate}
                disabled={isSubmitting || !editForm.content.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Updating...' : 'Update Post'}
              </Button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-md">
              <p className="whitespace-pre-wrap">{post.content?.text}</p>
              
              {post.content?.hashtags && post.content.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {post.content.hashtags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
                {getVisibilityIcon(post.visibility)}
                Visibility: {post.visibility.charAt(0).toUpperCase() + post.visibility.slice(1)}
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Created: {new Date(post.created_at).toLocaleDateString()}</p>
              {post.updated_at !== post.created_at && (
                <p>Updated: {new Date(post.updated_at).toLocaleDateString()}</p>
              )}
              <p>Views: {post.view_count || 0}</p>
              <p>Likes: {post.like_count || 0}</p>
              <p>Comments: {post.comment_count || 0}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
