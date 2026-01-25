/**
 * Create Post Modal Component
 * Facebook-style post creation modal with live link preview
 * Phase 1: Create Post Modal with Live Link Preview
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Image as ImageIcon,
  Smile,
  MapPin,
  UserPlus,
  Video,
  MoreHorizontal,
  Globe,
  Lock,
  Users,
  Users2,
  User,
  X,
  ArrowLeft,
  Clock,
  Megaphone,
  ChevronRight,
} from 'lucide-react'
import { PostComposerWithPreview } from './post-composer-with-preview'
import { Switch } from '@/components/ui/switch'
import type { LinkPreviewMetadata } from '@/types/link-preview'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

export interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  entityType: 'user' | 'author' | 'publisher' | 'group' | 'event' | 'book'
  entityId: string
  defaultVisibility?: 'public' | 'friends' | 'followers' | 'private'
  onPostCreated?: () => void
  onSubmit: (data: {
    text: string
    link_url?: string
    link_preview_metadata?: LinkPreviewMetadata
    image_url?: string
    visibility: string
  }) => Promise<boolean>
}

/**
 * Get visibility icon
 */
function getVisibilityIcon(visibility: string) {
  switch (visibility) {
    case 'public':
      return <Globe className="h-4 w-4" />
    case 'friends':
      return <Users className="h-4 w-4" />
    case 'followers':
      return <User className="h-4 w-4" />
    case 'private':
      return <Lock className="h-4 w-4" />
    default:
      return <Globe className="h-4 w-4" />
  }
}

/**
 * Get visibility label
 */
function getVisibilityLabel(visibility: string): string {
  switch (visibility) {
    case 'public':
      return 'Public'
    case 'friends':
      return 'Friends'
    case 'followers':
      return 'Followers'
    case 'private':
      return 'Only me'
    default:
      return 'Public'
  }
}

/**
 * Create Post Modal
 */
export function CreatePostModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  defaultVisibility = 'public',
  onPostCreated,
  onSubmit,
}: CreatePostModalProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<'create' | 'settings'>('create')
  const [postText, setPostText] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'followers' | 'private'>(
    defaultVisibility
  )
  const [linkPreview, setLinkPreview] = useState<LinkPreviewMetadata | null>(null)
  const [detectedLinkUrl, setDetectedLinkUrl] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [boostPost, setBoostPost] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPostText('')
      setLinkPreview(null)
      setDetectedLinkUrl(null)
      setVisibility(defaultVisibility)
      setStep('create')
      setBoostPost(false)
      // Focus textarea when modal opens
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    } else {
      // Reset to first step when modal closes
      setStep('create')
    }
  }, [isOpen, defaultVisibility])

  // Extract link URL from text when link preview changes
  useEffect(() => {
    if (linkPreview) {
      setDetectedLinkUrl(linkPreview.url)
    } else {
      // Try to extract URL from text if preview is cleared
      const urlMatch = postText.match(/https?:\/\/[^\s<>"{}|\\^`\[\]]+/i)
      if (urlMatch) {
        setDetectedLinkUrl(urlMatch[0])
      } else {
        setDetectedLinkUrl(null)
      }
    }
  }, [linkPreview, postText])

  // Handle link preview change
  const handleLinkPreviewChange = (preview: LinkPreviewMetadata | null) => {
    setLinkPreview(preview)
  }

  // Extract caption text (text without URL)
  const getCaptionText = (): string => {
    if (!detectedLinkUrl) return postText
    // Remove URL from text, preserving text before and after
    const urlPattern = new RegExp(detectedLinkUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    return postText.replace(urlPattern, '').trim().replace(/\s+/g, ' ')
  }

  // Handle Next button (go to settings step)
  const handleNext = () => {
    const captionText = getCaptionText()
    const hasContent = captionText.trim().length > 0 || detectedLinkUrl || linkPreview

    if (hasContent) {
      setStep('settings')
    }
  }

  // Handle Back button (go back to create step)
  const handleBack = () => {
    setStep('create')
  }

  // Handle submit (final post)
  const handleSubmit = async () => {
    const captionText = getCaptionText()
    const hasContent = captionText.trim().length > 0 || detectedLinkUrl || linkPreview

    if (!hasContent) {
      return
    }

    setIsPosting(true)
    try {
      const success = await onSubmit({
        text: captionText,
        link_url: detectedLinkUrl || undefined,
        link_preview_metadata: linkPreview || undefined,
        visibility,
      })

      if (success) {
        setPostText('')
        setLinkPreview(null)
        setDetectedLinkUrl(null)
        setStep('create')
        onPostCreated?.()
        onClose()
      }
    } catch (error) {
      console.error('Error submitting post:', error)
    } finally {
      setIsPosting(false)
    }
  }

  // Handle close
  const handleClose = () => {
    if (!isPosting) {
      setPostText('')
      setLinkPreview(null)
      setDetectedLinkUrl(null)
      onClose()
    }
  }

  const captionText = getCaptionText()
  const hasContent = captionText.trim().length > 0 || detectedLinkUrl || linkPreview
  const currentUserName = user?.name || 'User'
  const currentUserAvatar = user?.avatar_url || undefined

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[500px] p-0 [&>button]:hidden">
        {step === 'create' ? (
          <>
            {/* Header */}
            <DialogHeader className="px-4 pt-4 pb-2 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-semibold">
                  Create post
                </DialogTitle>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </div>
            </DialogHeader>

            {/* User Info and Privacy */}
            <div className="px-4 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar
                  src={currentUserAvatar}
                  alt={currentUserName}
                  name={currentUserName}
                  size="sm"
                  className="w-10 h-10"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{currentUserName}</span>
                </div>
              </div>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as any)}>
                <SelectTrigger className="w-[120px] h-9">
                  <div className="flex items-center gap-2">
                    {getVisibilityIcon(visibility)}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Public
                    </div>
                  </SelectItem>
                  <SelectItem value="friends">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Friends
                    </div>
                  </SelectItem>
                  <SelectItem value="followers">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Followers
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Only me
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Text Input and Link Preview */}
            <div className="px-4 py-4 min-h-[200px]">
              <PostComposerWithPreview
                value={postText}
                onChange={setPostText}
                placeholder="What's on your mind?"
                maxLength={5000}
                onLinkPreviewChange={handleLinkPreviewChange}
              />
            </div>

            {/* Add to your post section */}
            <div className="px-4 py-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Add to your post
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50"
                    title="Photo/Video"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    title="Tag People"
                  >
                    <UserPlus className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                    title="Camera"
                  >
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Location"
                  >
                    <MapPin className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    title="Messenger"
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                    title="More"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer with Next Button */}
            <DialogFooter className="px-4 pb-4 border-t pt-3">
              <Button
                onClick={handleNext}
                disabled={!hasContent || isPosting}
                className="w-full"
                size="lg"
              >
                Next
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Post Settings Step */}
            {/* Header with Back button */}
            <DialogHeader className="px-4 pt-4 pb-2 border-b">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle className="text-xl font-semibold flex-1 text-center">
                  Post settings
                </DialogTitle>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </div>
            </DialogHeader>

            {/* Settings Options */}
            <div className="px-4 py-4 space-y-0">
              {/* Post audience */}
              <button
                onClick={() => {
                  // Could open a sub-modal or inline editor for audience selection
                }}
                className="w-full flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Globe className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">Post audience</span>
                    <span className="text-xs text-muted-foreground">
                      {getVisibilityLabel(visibility)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Tag and collaborate */}
              <button
                className="w-full flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">Tag and collaborate</span>
                    <span className="text-xs text-muted-foreground">
                      Tag people and share credit for your post with a collaborator.
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Scheduling options */}
              <button
                className="w-full flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gray-100">
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">Scheduling options</span>
                    <span className="text-xs text-muted-foreground">Publish now</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Share to groups */}
              <button
                className="w-full flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-purple-100">
                    <Users2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">Share to groups</span>
                    <span className="text-xs text-muted-foreground">
                      Reach more people when you share your post in relevant groups.
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Boost post */}
              <div className="w-full flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-orange-100">
                    <Megaphone className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">Boost post</span>
                    <span className="text-xs text-muted-foreground">
                      You'll choose settings after you click Post.
                    </span>
                  </div>
                </div>
                <Switch
                  checked={boostPost}
                  onCheckedChange={setBoostPost}
                />
              </div>
            </div>

            {/* Footer with Post Button */}
            <DialogFooter className="px-4 pb-4 border-t pt-3">
              <Button
                onClick={handleSubmit}
                disabled={!hasContent || isPosting}
                className="w-full"
                size="lg"
              >
                {isPosting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Posting...
                  </>
                ) : (
                  'Post'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
