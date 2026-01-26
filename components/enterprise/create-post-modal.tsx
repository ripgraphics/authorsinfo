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
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
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
  ArrowLeft,
  Clock,
  Megaphone,
  ChevronRight,
  MessageSquare,
  Briefcase,
} from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { PostComposerWithPreview } from './post-composer-with-preview'
import { Switch } from '@/components/ui/switch'
import { TagAndCollaborateView, type TaggedEntity } from './tag-and-collaborate-view'
import type { LinkPreviewMetadata } from '@/types/link-preview'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

export type CreatePostView = 'create' | 'settings' | 'add-to-post' | 'post-audience' | 'tag-and-collaborate'

// Re-export TaggedEntity for consumers of this module
export type { TaggedEntity }

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
    tagged_users?: TaggedEntity[]
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

const AUDIENCE_OPTIONS: Array<{
  value: 'public' | 'friends' | 'followers' | 'private'
  icon: React.ReactNode
  label: string
  explanation: string
}> = [
  {
    value: 'public',
    icon: <Globe className="h-5 w-5" />,
    label: 'Public',
    explanation: 'Anyone on or off the app. Your post will show up in Feed, on your profile and in search results.',
  },
  {
    value: 'friends',
    icon: <Users className="h-5 w-5" />,
    label: 'Friends',
    explanation: 'Only people you\'ve added as friends can see your post.',
  },
  {
    value: 'followers',
    icon: <User className="h-5 w-5" />,
    label: 'Followers',
    explanation: 'Only people who follow you can see your post.',
  },
  {
    value: 'private',
    icon: <Lock className="h-5 w-5" />,
    label: 'Only me',
    explanation: 'Only you can see your post.',
  },
]

const DEFAULT_VISIBILITY_STORAGE_KEY = 'posts_default_visibility'

const ADD_TO_POST_OPTIONS: Array<{
  id: string
  icon: React.ReactNode
  label: string
  iconClassName: string
}> = [
  { id: 'photo-video', icon: <ImageIcon className="h-6 w-6" />, label: 'Photo/video', iconClassName: 'text-green-600' },
  { id: 'live-video', icon: <Video className="h-6 w-6" />, label: 'Live video', iconClassName: 'text-red-600' },
  { id: 'tag-people', icon: <UserPlus className="h-6 w-6" />, label: 'Tag people', iconClassName: 'text-blue-600' },
  { id: 'check-in', icon: <MapPin className="h-6 w-6" />, label: 'Check in', iconClassName: 'text-red-600' },
  { id: 'feeling', icon: <Smile className="h-6 w-6" />, label: 'Feeling/activity', iconClassName: 'text-yellow-600' },
  { id: 'gif', icon: <span className="text-[10px] font-bold leading-none">GIF</span>, label: 'GIF', iconClassName: 'text-gray-700' },
  { id: 'get-messages', icon: <MessageSquare className="h-6 w-6" />, label: 'Get messages', iconClassName: 'text-blue-600' },
  { id: 'create-job', icon: <Briefcase className="h-6 w-6" />, label: 'Create job', iconClassName: 'text-gray-600' },
]

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
  const [view, setView] = useState<CreatePostView>('create')
  const [postText, setPostText] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'followers' | 'private'>(
    defaultVisibility
  )
  const [linkPreview, setLinkPreview] = useState<LinkPreviewMetadata | null>(null)
  const [detectedLinkUrl, setDetectedLinkUrl] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [boostPost, setBoostPost] = useState(false)
  const [setAsDefaultAudience, setSetAsDefaultAudience] = useState(false)
  const [tagged, setTagged] = useState<TaggedEntity[]>([])
  const returnViewRef = useRef<CreatePostView>('create')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const visibilityBeforeAudienceRef = useRef<'public' | 'friends' | 'followers' | 'private'>(
    defaultVisibility
  )
  const audienceDoneRef = useRef(false)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPostText('')
      setLinkPreview(null)
      setDetectedLinkUrl(null)
      setVisibility(defaultVisibility)
      setView('create')
      setBoostPost(false)
      setSetAsDefaultAudience(false)
      // Focus textarea when modal opens
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    } else {
      setView('create')
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
      setView('settings')
    }
  }

  // Handle Back button (go back to create step)
  const handleBack = () => {
    setView('create')
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
      // Build text with inline tags from tagged users (if not already mentioned)
      let finalText = captionText
      if (tagged.length > 0) {
        // Add mentions for tagged users that aren't already in the text
        const existingMentions = captionText.match(/@\w+/g) || []
        const existingMentionSlugs = existingMentions.map((m) => m.substring(1).toLowerCase())
        
        const newMentions = tagged
          .filter((t) => t.type === 'user' || t.type === 'profile' || t.type === 'page')
          .filter((t) => !existingMentionSlugs.includes(t.label.toLowerCase().replace(/\s+/g, '')))
          .map((t) => `@${t.label.replace(/\s+/g, '')}`)
        
        if (newMentions.length > 0) {
          finalText = `${captionText}\n\n${newMentions.join(' ')}`
        }
      }

      const success = await onSubmit({
        text: finalText,
        link_url: detectedLinkUrl || undefined,
        link_preview_metadata: linkPreview || undefined,
        visibility,
        tagged_users: tagged.length > 0 ? tagged : undefined,
      })

      if (success) {
        setPostText('')
        setLinkPreview(null)
        setDetectedLinkUrl(null)
        setView('create')
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

  const handlePostAudienceDone = () => {
    if (setAsDefaultAudience && typeof window !== 'undefined') {
      try {
        localStorage.setItem(DEFAULT_VISIBILITY_STORAGE_KEY, visibility)
      } catch {
        /* ignore */
      }
    }
    audienceDoneRef.current = true
    setView(returnViewRef.current)
  }

  const handlePostAudienceCancel = () => {
    setVisibility(visibilityBeforeAudienceRef.current)
    setView(returnViewRef.current)
  }

  const openTagAndCollaborate = (from: CreatePostView) => {
    returnViewRef.current = from
    setView('tag-and-collaborate')
  }

  const openAddToPost = () => {
    returnViewRef.current = 'create'
    setView('add-to-post')
  }

  const openPostAudience = (from: CreatePostView) => {
    returnViewRef.current = from
    visibilityBeforeAudienceRef.current = visibility
    setSetAsDefaultAudience(visibility === defaultVisibility)
    setView('post-audience')
  }

  const captionText = getCaptionText()
  const hasContent = captionText.trim().length > 0 || detectedLinkUrl || linkPreview
  const currentUserName = user?.name || 'User'
  const currentUserAvatar = user?.avatar_url || undefined

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="flex flex-col max-h-[85vh] overflow-hidden max-w-[500px] p-0">
        {view === 'create' && (
          <>
            {/* Header */}
            <DialogHeader className="flex-shrink-0 px-4 pt-4 pb-2 border-b">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 flex-shrink-0" aria-hidden="true" />
                <DialogTitle className="flex-1 text-center text-xl font-semibold">
                  Create post
                </DialogTitle>
                <div className="h-8 w-8 flex-shrink-0" aria-hidden="true" />
              </div>
            </DialogHeader>

            {/* Scrollable body */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {/* User Info and Privacy */}
              <div className="px-4 pt-4">
                <div className="flex items-center gap-2">
                  <Avatar
                    src={currentUserAvatar}
                    alt={currentUserName}
                    name={currentUserName}
                    size="sm"
                    className="w-10 h-10"
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">{currentUserName}</span>
                    <button
                      type="button"
                      onClick={() => openPostAudience('create')}
                      className="flex items-center gap-1 rounded-md border border-input bg-background h-7 w-[90px] text-xs py-0 px-2 ring-offset-background hover:bg-accent/50 focus:outline-none focus:ring-1 focus:ring-ring/25 focus:ring-offset-0 shrink-0 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0"
                    >
                      {getVisibilityIcon(visibility)}
                      <span className="min-w-0 truncate">{getVisibilityLabel(visibility)}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Text Input and Link Preview */}
              <div className="px-4 py-4 min-h-[200px]">
                <PostComposerWithPreview
                  value={postText}
                  onChange={setPostText}
                  placeholder="What's on your mind?"
                  maxLength={5000}
                  onLinkPreviewChange={handleLinkPreviewChange}
                  previewImageWidth="w-32"
                />
              </div>

              {/* Add to your post section */}
              <div className="px-4 py-3 border-t">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={openAddToPost}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                  >
                    Add to your post
                  </button>
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
                      onClick={() => openTagAndCollaborate('create')}
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
            </div>

            {/* Footer with Next Button */}
            <DialogFooter className="flex-shrink-0 px-4 pb-4 border-t pt-3">
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
        )}

        {view === 'settings' && (
          <>
            {/* Post Settings Step */}
            {/* Header with Back button */}
            <DialogHeader className="flex-shrink-0 px-4 pt-4 pb-2 border-b">
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
                <div className="h-8 w-8 flex-shrink-0" aria-hidden="true" />
              </div>
            </DialogHeader>

            {/* Scrollable body */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {/* Settings Options */}
              <div className="px-4 py-4 space-y-0">
              {/* Post audience */}
              <button
                onClick={() => openPostAudience('settings')}
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
                onClick={() => openTagAndCollaborate('settings')}
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
            </div>

            {/* Footer with Post Button */}
            <DialogFooter className="flex-shrink-0 px-4 pb-4 border-t pt-3">
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

        {view === 'add-to-post' && (
          <>
            <DialogHeader className="flex-shrink-0 px-4 pt-4 pb-2 border-b">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setView('create')} className="h-8 w-8 shrink-0" aria-label="Back">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle className="text-lg font-semibold flex-1">Add to your post</DialogTitle>
              </div>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                {ADD_TO_POST_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      opt.id === 'tag-people'
                        ? openTagAndCollaborate('add-to-post')
                        : setView('create')
                    }
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border border-transparent',
                      'hover:bg-accent/50 hover:border-input transition-colors text-left',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted',
                        opt.iconClassName
                      )}
                    >
                      {opt.icon}
                    </div>
                    <span className="text-sm font-medium truncate">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {view === 'post-audience' && (
          <>
            <DialogHeader className="flex-shrink-0 px-4 pt-4 pb-2 border-b">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handlePostAudienceCancel} className="h-8 w-8 shrink-0" aria-label="Back">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle className="text-lg font-semibold flex-1">Post audience</DialogTitle>
              </div>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Who can see your post?</p>
                <p className="text-sm text-muted-foreground">
                  Your post will show up in Feed, on your profile and in search results. Your default
                  audience is set to {getVisibilityLabel(defaultVisibility)}, but you can change the
                  audience of this specific post.
                </p>
              </div>
              <RadioGroup
                value={visibility}
                onValueChange={(v) => setVisibility(v as typeof visibility)}
                className="space-y-2"
              >
                {AUDIENCE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    onClick={() => setVisibility(opt.value)}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      visibility === opt.value
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:bg-accent/50'
                    )}
                  >
                    <RadioGroupItem value={opt.value} className="mt-0.5 shrink-0" />
                    <div className="flex gap-3 min-w-0 flex-1">
                      <div className="p-1.5 rounded-full bg-muted shrink-0 [&_svg]:h-4 [&_svg]:w-4">
                        {opt.icon}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-medium block">{opt.label}</span>
                        <span className="text-xs text-muted-foreground block">{opt.explanation}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="set-default-audience"
                  checked={setAsDefaultAudience}
                  onCheckedChange={(c) => setSetAsDefaultAudience(!!c)}
                />
                <Label htmlFor="set-default-audience" className="text-sm font-medium cursor-pointer">
                  Set as default audience
                </Label>
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 px-4 pb-4 pt-3 border-t gap-2 sm:gap-0">
              <Button variant="ghost" onClick={handlePostAudienceCancel}>Cancel</Button>
              <Button onClick={handlePostAudienceDone}>Done</Button>
            </DialogFooter>
          </>
        )}

        {view === 'tag-and-collaborate' && (
          <>
            <DialogHeader className="flex-shrink-0 px-4 pt-4 pb-2 border-b">
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setView(returnViewRef.current)}
                  className="h-8 w-8 shrink-0"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle className="text-lg font-semibold flex-1 text-center">
                  Tag and collaborate
                </DialogTitle>
                <div className="h-8 w-8 shrink-0" aria-hidden="true" />
              </div>
            </DialogHeader>
            <div className="flex-1 min-h-0">
              <TagAndCollaborateView
                tagged={tagged}
                onTaggedChange={setTagged}
                suggestions={[]}
                className="flex-1 min-h-0 h-full"
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}
