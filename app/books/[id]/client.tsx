'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { AuthorAvatar } from '@/components/author-avatar'
import { AuthorHoverCard } from '@/components/author-hover-card'
import { PublisherHoverCard } from '@/components/entity-hover-cards'
import { EntityHeader, TabConfig } from '@/components/entity-header'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Book as BookType, Author, Review, BindingType, FormatType } from '@/types/book'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import {
  BookOpen,
  Calendar,
  User,
  ThumbsUp,
  MessageSquare,
  Share2,
  Star,
  Clock,
  BookMarked,
  Heart,
  Globe,
  Tag,
  FileText,
  Pencil,
  Ruler,
  Weight,
  BookText,
  ChevronDown,
  Filter,
  MoreHorizontal as Ellipsis,
  Users,
  ImageIcon,
  Info,
  Book,
  MapPin,
  Camera,
  UserPlus,
  Plus,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { FollowersList } from '@/components/followers-list'
import { FollowersListTab } from '@/components/followers-list-tab'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ViewFullDetailsButton } from '@/components/ui/ViewFullDetailsButton'
import { TimelineAboutSection } from '@/components/author/TimelineAboutSection'
import { EntityHoverCard } from '@/components/entity-hover-cards'
import { ContentSection } from '@/components/ui/content-section'
import { formatDate } from '@/utils/dateUtils'
import { canUserEditEntity } from '@/lib/auth-utils'
import { BookEventsSection } from '@/components/book/BookEventsSection'
import { BookCard } from '@/components/book-card'
import { supabase } from '@/lib/supabase/client'
import { EntityTabs, EntityTab } from '@/components/ui/entity-tabs'
import { EntityPhotoAlbums } from '@/components/user-photo-albums'
import { useSearchParams, useRouter } from 'next/navigation'
import EnterpriseTimelineActivities from '@/components/enterprise/enterprise-timeline-activities-optimized'
import { EntityImageUpload } from '@/components/entity/EntityImageUpload'
import { CameraIconButton } from '@/components/ui/camera-icon-button'
import { HoverOverlay } from '@/components/ui/hover-overlay'
import { ImageCropper } from '@/components/ui/image-cropper'
import { createBrowserClient } from '@supabase/ssr'
import { EntityAboutTab } from '@/components/entity/EntityAboutTab'
import { EntityMoreTab } from '@/components/entity/EntityMoreTab'
import { EntityMetadata } from '@/types/entity'
import { getTabsForEntity } from '@/lib/tabContentRegistry'
import { ShelfCreateDialog } from '@/components/shelf-create-dialog'
import { ShelfBookStatusModal, ReadingStatus } from '@/components/shelf-book-status-modal'
import { useShelfStore } from '@/lib/stores/shelf-store'

interface Follower {
  id: string
  name: string
  avatar_url?: string | null
  username?: string
}

interface ClientBookPageProps {
  book: BookType & { website?: string | null }
  authors: Author[]
  publisher: any | null
  reviews: Review[]
  publisherBooksCount: number
  authorBookCounts: Record<string, number>
  bindingType: BindingType | null
  formatType: FormatType | null
  readingProgress: any | null
  followers?: Follower[]
  followersCount: number
  params: { id: string }
}

export function ClientBookPage({
  book,
  authors,
  publisher,
  reviews,
  publisherBooksCount,
  authorBookCounts,
  bindingType,
  formatType,
  readingProgress,
  followers = [],
  followersCount = 0,
  params,
}: ClientBookPageProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const validTabs: EntityTab[] = [
    { id: 'details', label: 'Details' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'about', label: 'About' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'followers', label: `Followers (${followersCount})` },
    { id: 'photos', label: 'Photos' },
    { id: 'more', label: 'More' },
  ]

  const tabParam = searchParams?.get('tab')
  const validTabIds = validTabs.map((t) => t.id)
  const initialTab = tabParam && validTabIds.includes(tabParam) ? tabParam : 'details'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [showFullAbout, setShowFullAbout] = useState(false)
  const [showFullTimelineAbout, setShowFullTimelineAbout] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoadingFollow, setIsLoadingFollow] = useState(false)
  const [needsTruncation, setNeedsTruncation] = useState(false)
  const [needsTimelineTruncation, setNeedsTimelineTruncation] = useState(false)
  const [currentReadingStatus, setCurrentReadingStatus] = useState<string | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isShelfCreateDialogOpen, setIsShelfCreateDialogOpen] = useState(false)
  const [isAddToShelfDialogOpen, setIsAddToShelfDialogOpen] = useState(false)
  const [isPageInputModalOpen, setIsPageInputModalOpen] = useState(false)
  const { fetchShelves } = useShelfStore()
  const [canEdit, setCanEdit] = useState(false)
  const [moreBooks, setMoreBooks] = useState<any[]>([])
  const [bookData, setBookData] = useState(book)
  const [isCoverImageModalOpen, setIsCoverImageModalOpen] = useState(false)
  const [isHoveringCover, setIsHoveringCover] = useState(false)
  const [isCoverDropdownOpen, setIsCoverDropdownOpen] = useState(false)
  const [isCoverCropModalOpen, setIsCoverCropModalOpen] = useState(false)
  const [isProcessingCrop, setIsProcessingCrop] = useState(false)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Sync bookData with book prop when it changes (e.g., after page refresh)
  // But don't reset if we just updated the cover image locally
  const [justUpdatedCoverImage, setJustUpdatedCoverImage] = useState(false)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6ad30084-e554-4118-90e3-f654a3d8dd51', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'client.tsx:143',
        message: 'useEffect triggered',
        data: {
          justUpdatedCoverImage,
          bookCoverImageId: book?.cover_image_id,
          bookDataCoverImageId: bookData?.cover_image_id,
          bookCoverImageUrl: book?.cover_image?.url,
          bookDataCoverImageUrl: bookData?.cover_image?.url,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
      }),
    }).catch(() => {})
    // #endregion

    // SUPABASE IS THE SOURCE OF TRUTH: If bookData has a cover_image_id that differs from book prop,
    // preserve bookData because it came from Supabase (fresh API fetch)
    // This handles the case where book prop is stale from server-side rendering
    const bookDataCoverId = bookData?.cover_image_id
    const bookPropCoverId = book?.cover_image_id

    if (bookDataCoverId && bookPropCoverId && bookDataCoverId !== bookPropCoverId) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ad30084-e554-4118-90e3-f654a3d8dd51', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'client.tsx:151',
          message: 'Preserving bookData - Supabase source of truth',
          data: { bookDataCoverImageId: bookDataCoverId, bookPropCoverImageId: bookPropCoverId },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'E',
        }),
      }).catch(() => {})
      // #endregion
      // Keep bookData (Supabase value) and only sync other fields from book prop
      setBookData((prev) => ({
        ...book,
        // Preserve cover_image_id and cover_image from Supabase (bookData)
        cover_image_id: prev.cover_image_id,
        cover_image: prev.cover_image,
        cover_image_url: prev.cover_image_url,
      }))
      return
    }

    // If bookData has cover_image_id but book prop doesn't, preserve bookData (Supabase has it)
    if (bookDataCoverId && !bookPropCoverId) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ad30084-e554-4118-90e3-f654a3d8dd51', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'client.tsx:165',
          message: 'Preserving bookData - book prop missing cover_image_id',
          data: { bookDataCoverImageId: bookDataCoverId },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'E',
        }),
      }).catch(() => {})
      // #endregion
      setBookData((prev) => ({
        ...book,
        cover_image_id: prev.cover_image_id,
        cover_image: prev.cover_image,
        cover_image_url: prev.cover_image_url,
      }))
      return
    }

    // If we just updated the cover image, skip the reset to preserve the new image
    if (justUpdatedCoverImage) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ad30084-e554-4118-90e3-f654a3d8dd51', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'client.tsx:162',
          message: 'Skipping reset - justUpdatedCoverImage is true',
          data: { justUpdatedCoverImage },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A',
        }),
      }).catch(() => {})
      // #endregion
      setJustUpdatedCoverImage(false)
      return
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6ad30084-e554-4118-90e3-f654a3d8dd51', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'client.tsx:169',
        message: 'Resetting bookData to book prop',
        data: {
          bookCoverImageId: book?.cover_image_id,
          bookDataCoverImageId: bookData?.cover_image_id,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C',
      }),
    }).catch(() => {})
    // #endregion
    setBookData(book)
  }, [book, justUpdatedCoverImage, bookData?.cover_image_id])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  // Determine if current user can edit this book
  useEffect(() => {
    const checkEditPermissions = async () => {
      if (!user) {
        setCanEdit(false)
        return
      }

      // Check if user is admin or super_admin (from user object first, then database)
      const userRole = (user as any)?.role
      const isAdmin =
        userRole === 'admin' || userRole === 'super_admin' || userRole === 'super-admin'

      if (isAdmin) {
        setCanEdit(true)
        return
      }

      // If not in user object, check database
      if (!userRole) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single()

          const profileRole = profile?.role
          const isAdminFromDb =
            profileRole === 'admin' ||
            profileRole === 'super_admin' ||
            profileRole === 'super-admin'

          if (isAdminFromDb) {
            setCanEdit(true)
            return
          }
        } catch (error) {
          console.error('Error checking edit permissions:', error)
        }
      }

      // Books don't have a created_by field, so editing is based on admin role only
      // (which is checked above)

      setCanEdit(false)
    }

    checkEditPermissions()
  }, [user, book.id])

  // Note: Mock data removed - using real data from props (moreBooks, followers, etc.)
  // Photos tab now uses EntityPhotoAlbums component which fetches data from the API

  // Follow/unfollow handler - now handled by FollowButton component
  const handleFollow = () => {
    // This callback can be used to update UI state if needed
    // The FollowButton component handles all the follow logic internally
  }

  // Check if content needs truncation
  const checkTruncation = (
    content: string,
    maxHeight: number,
    setTruncation: (needs: boolean) => void,
    isTimeline = false
  ) => {
    // Simple approach: count characters and estimate lines
    const charCount = content.length
    const avgCharsPerLine = isTimeline ? 50 : 60 // Timeline has smaller text
    const estimatedLines = Math.ceil(charCount / avgCharsPerLine)
    const lineHeight = isTimeline ? 20 : 24 // Approximate line height in pixels
    const estimatedHeight = estimatedLines * lineHeight

    setTruncation(estimatedHeight > maxHeight)
  }

  // Check follow status on component mount
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user) {
        setIsFollowing(false)
        return
      }

      try {
        const response = await fetch(`/api/follow?entityId=${params.id}&targetType=book`)
        if (response.ok) {
          const data = await response.json()
          setIsFollowing(data.isFollowing)
        } else if (response.status === 401) {
          // User not authenticated, set to false
          setIsFollowing(false)
        }
      } catch (error) {
        console.error('Error checking follow status:', error)
        setIsFollowing(false)
      }
    }

    checkFollowStatus()
  }, [user, params.id])

  // Check truncation when content changes
  useEffect(() => {
    if (book.synopsis) {
      // 240px = max-h-60 (15rem * 16px)
      checkTruncation(book.synopsis, 240, setNeedsTruncation)
    }
  }, [book.synopsis])

  useEffect(() => {
    if (book.synopsis || book.overview) {
      // 160px = max-h-40 (10rem * 16px)
      checkTruncation(book.synopsis || book.overview || '', 160, setNeedsTimelineTruncation, true)
    }
  }, [book.synopsis, book.overview])

  // Check current reading status on component mount
  useEffect(() => {
    const checkReadingStatus = async () => {
      if (!user) {
        setCurrentReadingStatus(null)
        return
      }

      try {
        const response = await fetch(`/api/reading-status?bookId=${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setCurrentReadingStatus(data.status)
        }
      } catch (error) {
        console.error('Error checking reading status:', error)
      }
    }

    checkReadingStatus()
  }, [user, params.id])

  // Handle reading status update
  const handleReadingStatusUpdate = async (status: string) => {
    if (!user) {
      alert('Please log in to add books to your shelf')
      return
    }

    // If status is "currently_reading", show page input modal
    if (status === 'currently_reading') {
      setIsAddToShelfDialogOpen(false)
      setIsPageInputModalOpen(true)
      return
    }

    // For other statuses, update directly and close dialog
    await updateReadingStatus(status)
    setIsAddToShelfDialogOpen(false)
  }

  // Update reading status with optional current page
  const updateReadingStatus = async (status: string, currentPage?: number) => {
    setIsUpdatingStatus(true)
    try {
      const requestBody: any = {
        bookId: params.id,
        status: status,
      }

      // If status is in_progress and we have current page, include it
      if (status === 'currently_reading' && currentPage !== undefined) {
        requestBody.currentPage = currentPage
      }

      const response = await fetch('/api/reading-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentReadingStatus(data.status)
        // Show success message with book title
        const statusMap: Record<string, string> = {
          want_to_read: 'Want to Read',
          currently_reading: 'Currently Reading',
          read: 'Read',
          on_hold: 'On Hold',
          abandoned: 'Abandoned',
          remove: 'removed from',
        }
        const statusDisplayName = statusMap[status] || status.replace('_', ' ')
        const actionText = status === 'remove' ? 'removed from' : 'added to'
        const pageText = currentPage !== undefined ? ` (Page ${currentPage})` : ''
        toast({
          title: 'Success!',
          description: `"${book.title}" ${actionText} ${statusDisplayName} shelf${pageText}`,
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || `Failed to update reading status for "${book.title}"`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating reading status:', error)
      toast({
        title: 'Error',
        description: `An error occurred while updating reading status for "${book.title}"`,
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Handle page input modal confirmation
  const handlePageInputConfirm = async (status: ReadingStatus, currentPage?: number) => {
    await updateReadingStatus('currently_reading', currentPage)
    setIsPageInputModalOpen(false)
  }

  // Helper function to get display name for status
  const getStatusDisplayName = (status: string) => {
    const statusMap: Record<string, string> = {
      not_started: 'Want to Read',
      in_progress: 'Currently Reading',
      completed: 'Read',
      on_hold: 'On Hold',
      abandoned: 'Abandoned',
    }
    return statusMap[status] || status
  }

  // Handle removing from shelf
  const handleRemoveFromShelf = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to manage your shelves',
        variant: 'destructive',
      })
      return
    }

    setIsUpdatingStatus(true)
    try {
      const response = await fetch('/api/reading-status', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: params.id,
        }),
      })

      if (response.ok) {
        setCurrentReadingStatus(null)
        setIsAddToShelfDialogOpen(false)
        toast({
          title: 'Success!',
          description: `"${book.title}" has been removed from your shelves`,
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || `Failed to remove "${book.title}" from shelf`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error removing from shelf:', error)
      toast({
        title: 'Error',
        description: `An error occurred while removing "${book.title}" from shelf`,
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Extract public ID from Cloudinary URL (including folder path)
  const getPublicIdFromUrl = (url: string): string | null => {
    try {
      if (!url || !url.includes('cloudinary.com')) return null
      const parts = url.split('/')
      const uploadIndex = parts.findIndex((part) => part === 'upload')

      if (uploadIndex > -1 && uploadIndex < parts.length - 1) {
        // Get everything after 'upload' including folder path and filename
        const pathParts = parts.slice(uploadIndex + 1)
        const filename = pathParts[pathParts.length - 1]
        const publicIdWithoutExt = filename.split('.')[0]

        // Reconstruct public ID with folder path if it exists
        if (pathParts.length > 1) {
          // There's a folder path
          const folderPath = pathParts.slice(0, -1).join('/')
          return `${folderPath}/${publicIdWithoutExt}`
        }
        return publicIdWithoutExt
      }

      // Fallback: just get filename if we can't find 'upload'
      const filename = parts[parts.length - 1]
      return filename.split('.')[0]
    } catch (error) {
      console.error('Error extracting public ID:', error)
      return null
    }
  }

  // Delete old image from Cloudinary
  // Handle cropping book cover
  const handleCropBookCover = async (croppedImageBlob: Blob) => {
    setIsProcessingCrop(true)
    try {
      console.log('handleCropBookCover called with blob:', croppedImageBlob)

      // Convert blob to file
      const file = new File([croppedImageBlob], 'cropped-book-cover.jpg', { type: 'image/jpeg' })

      // Find the original image ID from the current cover image URL
      let originalImageId: string | null = null
      const currentCoverUrl = bookData.cover_image?.url || bookData.cover_image_url
      if (currentCoverUrl) {
        try {
          const { data: originalImage } = await supabase
            .from('images')
            .select('id')
            .eq('url', currentCoverUrl)
            .single()

          if (originalImage) {
            originalImageId = originalImage.id
            console.log('Found original book cover image ID:', originalImageId)
          }
        } catch (error) {
          console.warn('Could not find original book cover image ID (non-critical):', error)
        }
      }

      // Use the entity-image upload API which handles metadata properly
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityType', 'book')
      formData.append('entityId', book.id)
      formData.append('imageType', 'cover')
      formData.append('originalType', 'bookCover')
      formData.append('isCropped', 'true') // Mark as cropped version of existing image
      if (originalImageId) {
        formData.append('originalImageId', originalImageId) // Link to original image
      }

      console.log('📤 Uploading cropped book cover via /api/upload/entity-image...')
      const uploadResponse = await fetch('/api/upload/entity-image', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        console.error('❌ Upload failed:', errorData)
        throw new Error(
          errorData.error || `Failed to upload cropped book cover: ${uploadResponse.status}`
        )
      }

      const uploadResult = await uploadResponse.json()
      console.log('✅ Upload result:', uploadResult)

      if (!uploadResult.url || !uploadResult.image_id) {
        throw new Error('Invalid response from upload API')
      }

      // Mark that we're updating the cover image to prevent useEffect from resetting
      setJustUpdatedCoverImage(true)

      // Update the book's cover_image_id to point to the new cropped image
      // WITHOUT deleting the original image (we keep both)
      try {
        const { error: updateError } = await supabase
          .from('books')
          .update({ cover_image_id: uploadResult.image_id })
          .eq('id', book.id)

        if (updateError) {
          console.error('Error updating book cover_image_id:', updateError)
          throw new Error(`Failed to update book cover: ${updateError.message}`)
        }

        console.log('✅ Book cover_image_id updated to:', uploadResult.image_id)
      } catch (error: any) {
        console.error('Error updating book cover:', error)
        throw error
      }

      // Update local state for instant UI feedback
      setBookData((prev) => {
        const updated = {
          ...prev,
          cover_image: {
            id: uploadResult.image_id,
            url: uploadResult.url,
            alt_text: prev.cover_image?.alt_text || `Cover for ${prev.title}`,
          },
          cover_image_id: uploadResult.image_id,
          cover_image_url: uploadResult.url,
        } as typeof prev

        console.log('✅ Book data updated with cropped cover:', {
          cover_image_id: updated.cover_image_id,
          cover_image_url: updated.cover_image_url,
        })

        return updated
      })

      // Add the cropped image to the book's cover album
      try {
        const albumResponse = await fetch('/api/entity-images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entityId: book.id,
            entityType: 'book',
            albumPurpose: 'cover',
            imageId: uploadResult.image_id,
            isCover: true,
            isFeatured: true,
            metadata: {
              aspect_ratio: 2 / 3,
              uploaded_via: 'book_cover_crop',
              original_filename: file.name,
              file_size: file.size,
              is_cropped: true,
              ...(originalImageId && { original_image_id: originalImageId }),
            },
          }),
        })

        if (!albumResponse.ok) {
          console.warn('⚠️ Failed to add cropped image to album (non-critical)')
        } else {
          console.log('✅ Cropped image added to album')
        }
      } catch (albumError) {
        console.warn('⚠️ Error adding cropped image to album (non-critical):', albumError)
      }

      setIsCoverCropModalOpen(false)

      toast({
        title: 'Success',
        description: 'Book cover cropped and saved as a new file',
      })
    } catch (error: any) {
      console.error('Error cropping book cover:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to crop book cover. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessingCrop(false)
    }
  }

  const deleteOldImageFromCloudinary = async (imageUrl: string) => {
    try {
      const publicId = getPublicIdFromUrl(imageUrl)
      if (!publicId) {
        console.log('No public ID found in URL, skipping deletion')
        return
      }

      const response = await fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.warn('Failed to delete old image from Cloudinary:', errorData)
      } else {
        console.log('Old image deleted from Cloudinary:', publicId)
      }
    } catch (error) {
      console.warn('Error deleting old image from Cloudinary:', error)
    }
  }

  // Handle cover image change
  const handleCoverImageChange = async (newImageUrl: string, newImageId?: string) => {
    console.log('🔄 handleCoverImageChange called:', { newImageUrl, newImageId })

    // Mark that we're updating the cover image to prevent useEffect from resetting
    setJustUpdatedCoverImage(true)

    // Delete old image from Cloudinary if it exists
    const oldImageUrl = bookData?.cover_image?.url || bookData?.cover_image_url
    if (oldImageUrl) {
      await deleteOldImageFromCloudinary(oldImageUrl)
    }

    // Immediately update local state for instant UI feedback
    setBookData((prev) => {
      console.log('📝 Updating bookData with new cover:', {
        oldUrl: prev.cover_image?.url,
        newUrl: newImageUrl,
        oldId: prev.cover_image_id,
        newId: newImageId,
      })
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ad30084-e554-4118-90e3-f654a3d8dd51', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'client.tsx:542',
          message: 'Updating bookData with new cover image',
          data: { oldCoverImageId: prev.cover_image_id, newImageId, newImageUrl },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'E',
        }),
      }).catch(() => {})
      // #endregion

      const baseCoverImage =
        prev.cover_image ||
        (prev.cover_image_id ? { id: prev.cover_image_id, url: prev.cover_image_url || '' } : null)
      const updated = {
        ...prev,
        cover_image: baseCoverImage
          ? {
              ...baseCoverImage,
              id: newImageId || baseCoverImage.id,
              url: newImageUrl,
            }
          : newImageId
            ? { id: newImageId, url: newImageUrl }
            : null,
        cover_image_id: newImageId || prev.cover_image_id,
        cover_image_url: newImageUrl,
      } as typeof prev

      console.log('✅ Book data updated:', {
        cover_image_id: updated.cover_image_id,
        cover_image_url: updated.cover_image_url,
        cover_image: updated.cover_image,
      })
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ad30084-e554-4118-90e3-f654a3d8dd51', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'client.tsx:568',
          message: 'bookData updated with new cover_image_id',
          data: {
            updatedCoverImageId: updated.cover_image_id,
            updatedCoverImageUrl: updated.cover_image_url,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'E',
        }),
      }).catch(() => {})
      // #endregion

      return updated
    })

    toast({
      title: 'Success!',
      description: 'Book cover image uploaded successfully',
    })

    // Fetch fresh book data from API to ensure we have the latest data
    try {
      console.log('🔄 Fetching fresh book data from API...')
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ad30084-e554-4118-90e3-f654a3d8dd51', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'client.tsx:577',
          message: 'Fetching fresh book data from API',
          data: { bookId: params.id, currentCoverImageId: bookData?.cover_image_id, newImageId },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'B',
        }),
      }).catch(() => {})
      // #endregion
      const response = await fetch(`/api/books/${params.id}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/6ad30084-e554-4118-90e3-f654a3d8dd51', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: 'client.tsx:583',
              message: 'Fresh book data received from API',
              data: {
                apiCoverImageId: result.data?.cover_image_id,
                expectedImageId: newImageId,
                apiCoverImageUrl: result.data?.cover_image?.url,
                matches: result.data?.cover_image_id === newImageId,
              },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'run1',
              hypothesisId: 'B',
            }),
          }).catch(() => {})
          // #endregion
          console.log('✅ Fresh book data received, updating state')
          setBookData(result.data)
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/6ad30084-e554-4118-90e3-f654a3d8dd51', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: 'client.tsx:586',
              message: 'Setting bookData and justUpdatedCoverImage flag',
              data: { coverImageId: result.data?.cover_image_id },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'run1',
              hypothesisId: 'A',
            }),
          }).catch(() => {})
          // #endregion
          // Keep the flag set to prevent reset
          setJustUpdatedCoverImage(true)
        }
      }
    } catch (error) {
      console.error('❌ Error fetching fresh book data:', error)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ad30084-e554-4118-90e3-f654a3d8dd51', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'client.tsx:590',
          message: 'Error fetching fresh book data',
          data: { error: error instanceof Error ? error.message : 'unknown' },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'B',
        }),
      }).catch(() => {})
      // #endregion
    }

    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    // Revalidate the path in background (non-blocking)
    // Don't reset justUpdatedCoverImage flag - let the cover_image_id comparison handle it
    // The flag will be reset naturally when book prop updates with matching cover_image_id
    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/revalidate/book-cover/${params.id}`, {
          method: 'POST',
        })
      } catch (revalidateError) {
        console.warn('Revalidate request failed:', revalidateError)
      }
      refreshTimeoutRef.current = null
    }, 1000)
  }

  // Configure tabs for the EntityHeader
  const tabs: TabConfig[] = [
    { id: 'details', label: 'Details' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'photos', label: 'Photos' },
    { id: 'followers', label: 'Followers' },
    { id: 'more', label: 'More' },
  ]

  // Set up stats for the EntityHeader
  const bookStats = [
    {
      icon: <BookOpen className="h-4 w-4 mr-1" />,
      text: `${book.pages || book.page_count || 0} pages`,
    },
    {
      icon: <Users className="h-4 w-4 mr-1" />,
      text: `${followers.length} followers`,
    },
  ]

  // Get main author
  const mainAuthor = authors && authors.length > 0 ? authors[0] : undefined

  const bookLink = book.website || undefined
  const publishDate = book.publish_date || book.publication_date || undefined
  const language = book.language || undefined

  useEffect(() => {
    async function fetchMoreBooks() {
      if (!authors || authors.length === 0) return
      const { data, error } = await supabase
        .from('books')
        .select('id, title, cover_image:images!cover_image_id(id, url)')
        .eq('author_id', authors[0].id)
        .neq('id', book.id)
        .limit(4)
      if (!error && data) setMoreBooks(data)
    }
    fetchMoreBooks()
  }, [authors, book.id])

  return (
    <div className="book-page">
      <EntityHeader
        entityType="book"
        name={bookData.title}
        bookId={params.id}
        entityId={params.id}
        targetType="book"
        username={
          authors && authors.length > 0 ? (
            <EntityHoverCard
              type="author"
              entity={{
                id: authors[0].id,
                name: authors[0].name,
                author_image: authors[0].author_image
                  ? { url: authors[0].author_image.url }
                  : undefined,
                bookCount: authorBookCounts[authors[0].id] || 0,
              }}
            >
              <span className="text-muted-foreground">{authors[0].name}</span>
            </EntityHoverCard>
          ) : undefined
        }
        coverImageUrl={bookData.cover_image?.url || '/placeholder.svg?height=400&width=1200'}
        profileImageUrl={bookData.cover_image?.url || '/placeholder.svg?height=200&width=200'}
        stats={[
          {
            icon: <BookOpen className="h-4 w-4 mr-1" />,
            text: `${bookData.pages || bookData.page_count || 0} pages`,
          },
          {
            icon: <Users className="h-4 w-4 mr-1" />,
            text: `${followersCount} followers`,
          },
        ]}
        location={bookData.language || undefined}
        website={bookData.website || undefined}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        author={
          authors && authors.length > 0
            ? {
                id: authors[0].id,
                name: authors[0].name,
                author_image: authors[0].author_image
                  ? { url: authors[0].author_image.url }
                  : undefined,
              }
            : undefined
        }
        authorBookCount={authors && authors.length > 0 ? authorBookCounts[authors[0].id] : 0}
        publisher={
          publisher
            ? {
                id: publisher.id,
                name: publisher.name,
                publisher_image: publisher.publisher_image,
                logo_url: publisher.publisher_image?.url,
              }
            : undefined
        }
        publisherBookCount={publisherBooksCount}
        isMessageable={true}
        isEditable={canEdit}
        changeCoverLabel="Change Page Cover"
        cropCoverLabel="Crop Page Cover"
        cropCoverSuccessMessage="Page cover cropped and saved as a new file"
        isFollowing={isFollowing}
        onFollow={handleFollow}
        onCoverImageChange={() => handleCoverImageChange('', '')}
      />

      <div className="book-page__content">
        {activeTab === 'timeline' && (
          <div className="book-page__timeline-tab">
            <div className="book-page__tab-content grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Sidebar */}
              <div className="book-page__sidebar lg:col-span-1 space-y-6 self-end sticky bottom-0">
                {/* About Section */}
                <ContentSection
                  title="About"
                  onViewMore={() => setActiveTab('details')}
                  className="book-page__about-section"
                >
                  <div className="space-y-2">
                    {book.synopsis || book.overview ? (
                      <Collapsible
                        open={showFullTimelineAbout}
                        onOpenChange={setShowFullTimelineAbout}
                      >
                        {/* Show truncated content initially */}
                        <div
                          className={`text-sm text-muted-foreground max-w-none synopsis-content prose prose-sm max-h-40 overflow-hidden ${
                            showFullTimelineAbout ? 'hidden' : ''
                          }`}
                          dangerouslySetInnerHTML={{
                            __html: book.synopsis || book.overview || '',
                          }}
                        />

                        {/* Show full content when expanded */}
                        <CollapsibleContent className="text-sm text-muted-foreground max-w-none synopsis-content prose prose-sm">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: book.synopsis || book.overview || '',
                            }}
                          />
                        </CollapsibleContent>

                        {needsTimelineTruncation && (
                          <div className="flex justify-end mt-2">
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:bg-primary/10 hover:text-primary"
                              >
                                {showFullTimelineAbout ? 'View Less' : 'View More'}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        )}
                      </Collapsible>
                    ) : (
                      <p className="text-sm text-muted-foreground">No description available.</p>
                    )}
                    {book.language && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Language: {book.language}</span>
                      </div>
                    )}
                    {book.website && (
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                        <a
                          href={
                            book.website.startsWith('http')
                              ? book.website
                              : `https://${book.website}`
                          }
                          className="hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </ContentSection>

                {/* Friends/Followers Section */}
                <FollowersList
                  followers={followers}
                  followersCount={followersCount}
                  entityId={params.id}
                  entityType="book"
                  onViewMore={() => setActiveTab('followers')}
                  className="book-page__followers-section"
                />

                {/* More by Author Section - Shows other books by the same author */}
                {moreBooks && moreBooks.length > 0 && (
                  <ContentSection
                    title={`More by ${authors?.[0]?.name || 'this Author'}`}
                    onViewMore={() => authors?.[0]?.id && window.location.assign(`/authors/${authors[0].id}?tab=books`)}
                    viewMoreText="See All"
                    className="book-page__more-by-author-section"
                  >
                    <div className="grid grid-cols-3 gap-3">
                      {moreBooks.slice(0, 6).map((book) => (
                        <Link key={book.id} href={`/books/${book.id}`}>
                          <div className="aspect-[2/3] relative rounded-sm overflow-hidden">
                            <img
                              src={book.cover_image?.url || '/placeholder.svg?height=120&width=80'}
                              alt={book.title}
                              className="object-cover hover:scale-105 transition-transform absolute inset-0 w-full h-full"
                            />
                          </div>
                          <p className="text-xs mt-1 line-clamp-1">{book.title}</p>
                        </Link>
                      ))}
                    </div>
                  </ContentSection>
                )}

                {/* Photos Section - Shows photos from the photos tab */}
                <ContentSection
                  title="Photos"
                  onViewMore={() => setActiveTab('photos')}
                  className="book-page__photos-section"
                >
                  <p className="text-sm text-muted-foreground text-center py-4">
                    View photos in the Photos tab
                  </p>
                </ContentSection>

                {/* Book Events Section */}
                <BookEventsSection bookId={params.id} className="book-page__events-section" />
              </div>

              {/* Main Content Area - Timeline */}
              <div className="book-page__main-content lg:col-span-2 space-y-6">
                <EnterpriseTimelineActivities
                  entityId={params.id}
                  entityType="book"
                  isOwnEntity={canEdit}
                  entityDisplayInfo={
                    authors && authors.length > 0
                      ? {
                          id: authors[0].id,
                          name: authors[0].name,
                          type: 'author' as const,
                          author_image: authors[0].author_image?.url || undefined,
                          bookCount: authorBookCounts[authors[0].id] || 0,
                        }
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="book-page__details-tab">
            <div className="book-detail-layout grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Column - Book Cover (1/3 width) */}
              <div className="book-page__details-sidebar lg:col-span-1 lg:sticky lg:top-4 lg:self-start">
                {/* Book Cover (full width) */}
                <Card
                  className="book-page__cover-card overflow-hidden relative"
                  onMouseEnter={() => setIsHoveringCover(true)}
                  onMouseLeave={() => setIsHoveringCover(false)}
                >
                  {bookData.cover_image?.url ? (
                    <div
                      className="book-page__cover-image w-full h-full relative"
                      onMouseEnter={() => setIsHoveringCover(true)}
                      onMouseLeave={() => {
                        if (!isCoverDropdownOpen) {
                          setIsHoveringCover(false)
                        }
                      }}
                    >
                      <Image
                        key={bookData.cover_image_id || 'no-cover'}
                        src={bookData.cover_image.url}
                        alt={bookData.cover_image?.alt_text ?? bookData.title}
                        width={400}
                        height={600}
                        className="w-full aspect-[2/3] object-cover"
                      />
                      {/* Camera Icon Overlay - Only show on hover and if editable */}
                      {canEdit && (isHoveringCover || isCoverDropdownOpen) && (
                        <HoverOverlay
                          isVisible={isHoveringCover || isCoverDropdownOpen}
                          onMouseEnter={() => setIsHoveringCover(true)}
                          onMouseLeave={() => {
                            if (!isCoverDropdownOpen) {
                              setIsHoveringCover(false)
                            }
                          }}
                        >
                          <CameraIconButton
                            onChangeCover={() => {
                              setIsCoverImageModalOpen(true)
                              setIsCoverDropdownOpen(false)
                            }}
                            onCrop={() => {
                              setIsCoverCropModalOpen(true)
                              setIsCoverDropdownOpen(false)
                            }}
                            changeCoverLabel="Change Cover Image"
                            cropLabel="Crop Book Cover"
                            showCrop={!!bookData.cover_image?.url}
                            onOpenChange={(open) => {
                              setIsCoverDropdownOpen(open)
                              if (!open) {
                                setIsHoveringCover(false)
                              }
                            }}
                          />
                        </HoverOverlay>
                      )}
                    </div>
                  ) : (
                    <div
                      className="book-page__cover-placeholder w-full aspect-[2/3] bg-muted flex items-center justify-center relative"
                      onMouseEnter={() => setIsHoveringCover(true)}
                      onMouseLeave={() => {
                        if (!isCoverDropdownOpen) {
                          setIsHoveringCover(false)
                        }
                      }}
                    >
                      <BookOpen className="h-16 w-16 text-muted-foreground" />
                      {/* Camera Icon Overlay - Only show on hover and if editable */}
                      {canEdit && (isHoveringCover || isCoverDropdownOpen) && (
                        <HoverOverlay
                          isVisible={isHoveringCover || isCoverDropdownOpen}
                          onMouseEnter={() => setIsHoveringCover(true)}
                          onMouseLeave={() => {
                            if (!isCoverDropdownOpen) {
                              setIsHoveringCover(false)
                            }
                          }}
                        >
                          <CameraIconButton
                            onChangeCover={() => {
                              setIsCoverImageModalOpen(true)
                              setIsCoverDropdownOpen(false)
                            }}
                            changeCoverLabel="Change Cover Image"
                            showCrop={false}
                            onOpenChange={(open) => {
                              setIsCoverDropdownOpen(open)
                              if (!open) {
                                setIsHoveringCover(false)
                              }
                            }}
                          />
                        </HoverOverlay>
                      )}
                    </div>
                  )}
                </Card>

                {/* Cover Image Upload Modal */}
                {canEdit && (
                  <EntityImageUpload
                    entityId={book.id}
                    entityType="book"
                    currentImageUrl={
                      bookData.cover_image?.url || bookData.cover_image_url || undefined
                    }
                    onImageChange={handleCoverImageChange}
                    type="bookCover"
                    isOpen={isCoverImageModalOpen}
                    onOpenChange={setIsCoverImageModalOpen}
                  />
                )}

                {/* Crop Cover Image Modal */}
                {canEdit && bookData.cover_image?.url && isCoverCropModalOpen && (
                  <ImageCropper
                    imageUrl={bookData.cover_image.url}
                    aspectRatio={2 / 3} // Book cover aspect ratio
                    targetWidth={400}
                    targetHeight={600}
                    onCropComplete={handleCropBookCover}
                    onCancel={() => setIsCoverCropModalOpen(false)}
                    isProcessing={isProcessingCrop}
                    title="Crop Book Cover"
                    helpText="Adjust the crop area to frame your book cover"
                  />
                )}

                {/* Book Events Section */}
                <BookEventsSection bookId={params.id} className="book-page__events-section" />

                {/* Add to Shelf Section */}
                <div className="book-page__shelf-section space-y-4 w-full mt-6">
                  <Dialog open={isAddToShelfDialogOpen} onOpenChange={setIsAddToShelfDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="default"
                        className="book-page__shelf-button w-full"
                        disabled={isUpdatingStatus}
                      >
                        <BookMarked className="h-4 w-4" />
                        {currentReadingStatus
                          ? `On Shelf (${getStatusDisplayName(currentReadingStatus)})`
                          : 'Add to Shelf'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg p-4">
                      <DialogHeader>
                        <DialogTitle>
                          {currentReadingStatus ? 'Update Reading Status' : 'Add Book to Shelf'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleReadingStatusUpdate('want_to_read')}
                          disabled={isUpdatingStatus}
                          className={`shelf-menu-item flex items-center gap-2 rounded-xs px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer w-full text-left ${
                            currentReadingStatus === 'not_started'
                              ? 'bg-accent text-accent-foreground'
                              : ''
                          }`}
                        >
                          {currentReadingStatus === 'not_started' ? '✓ ' : ''}Want to Read
                        </button>
                        <button
                          onClick={() => handleReadingStatusUpdate('currently_reading')}
                          disabled={isUpdatingStatus}
                          className={`shelf-menu-item flex items-center gap-2 rounded-xs px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer w-full text-left ${
                            currentReadingStatus === 'in_progress'
                              ? 'bg-accent text-accent-foreground'
                              : ''
                          }`}
                        >
                          {currentReadingStatus === 'in_progress' ? '✓ ' : ''}Currently Reading
                        </button>
                        <button
                          onClick={() => handleReadingStatusUpdate('read')}
                          disabled={isUpdatingStatus}
                          className={`shelf-menu-item flex items-center gap-2 rounded-xs px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer w-full text-left ${
                            currentReadingStatus === 'completed'
                              ? 'bg-accent text-accent-foreground'
                              : ''
                          }`}
                        >
                          {currentReadingStatus === 'completed' ? '✓ ' : ''}Read
                        </button>
                        <button
                          onClick={() => handleReadingStatusUpdate('on_hold')}
                          disabled={isUpdatingStatus}
                          className={`shelf-menu-item flex items-center gap-2 rounded-xs px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer w-full text-left ${
                            currentReadingStatus === 'on_hold'
                              ? 'bg-accent text-accent-foreground'
                              : ''
                          }`}
                        >
                          {currentReadingStatus === 'on_hold' ? '✓ ' : ''}On Hold
                        </button>
                        <button
                          onClick={() => handleReadingStatusUpdate('abandoned')}
                          disabled={isUpdatingStatus}
                          className={`shelf-menu-item flex items-center gap-2 rounded-xs px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer w-full text-left ${
                            currentReadingStatus === 'abandoned'
                              ? 'bg-accent text-accent-foreground'
                              : ''
                          }`}
                        >
                          {currentReadingStatus === 'abandoned' ? '✓ ' : ''}Abandoned
                        </button>
                      </div>
                      {currentReadingStatus && (
                        <>
                          <div role="separator" className="shelf-separator my-2 h-px bg-muted" />
                          <button
                            onClick={handleRemoveFromShelf}
                            disabled={isUpdatingStatus}
                            className="shelf-menu-item flex items-center gap-2 rounded-xs px-2 py-1.5 text-sm hover:bg-destructive hover:text-destructive-foreground cursor-pointer w-full text-left"
                          >
                            Remove from Shelf
                          </button>
                        </>
                      )}
                      <div role="separator" className="shelf-separator my-2 h-px bg-muted" />
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddToShelfDialogOpen(false)
                          setIsShelfCreateDialogOpen(true)
                        }}
                        className="shelf-menu-item flex items-center gap-2 rounded-xs px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer w-full text-left"
                      >
                        <Plus className="w-4 h-4" />
                        New Shelf
                      </button>
                      <div role="separator" className="shelf-separator my-2 h-px bg-muted" />
                      <button
                        type="button"
                        onClick={() => {
                          if (user) {
                            router.push(`/profile/${user.id}?tab=shelves`)
                          } else {
                            toast({
                              title: 'Authentication required',
                              description: 'Please sign in to manage your shelves',
                              variant: 'destructive',
                            })
                          }
                        }}
                        className="shelf-manage-button w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        Manage shelves...
                      </button>
                    </DialogContent>
                  </Dialog>

                  {/* Shelf Create Dialog */}
                  <ShelfCreateDialog
                    open={isShelfCreateDialogOpen}
                    onOpenChange={setIsShelfCreateDialogOpen}
                    origin="add-to-shelf"
                    autoAddBookId={params.id}
                    autoAddBookTitle={book.title}
                    onCreated={async (shelf) => {
                      // Refresh shelves list
                      await fetchShelves()
                      // Close the add to shelf dialog if it's still open
                      setIsAddToShelfDialogOpen(false)
                    }}
                  />

                  {/* Page Input Modal for Currently Reading */}
                  <ShelfBookStatusModal
                    open={isPageInputModalOpen}
                    onOpenChange={setIsPageInputModalOpen}
                    bookId={params.id}
                    bookTitle={book.title}
                    totalPages={book.pages || book.page_count || null}
                    onConfirm={handlePageInputConfirm}
                    isLoading={isUpdatingStatus}
                    initialStatus="in_progress"
                  />
                </div>
              </div>

              {/* Right Column - Book Details (2/3 width) */}
              <div className="book-page__details-content lg:col-span-2 space-y-6">
                {/* Book Details at the top */}
                <ContentSection
                  title="Book Details"
                  headerRight={
                    canEdit ? (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                        <Link href={`/books/${book.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit Book</span>
                        </Link>
                      </Button>
                    ) : null
                  }
                  className="book-page__book-details-section"
                >
                  <div className="book-details-layout space-y-6">
                    {/* Title - Full Width */}
                    <div className="book-details__title-section">
                      <h3 className="font-medium text-lg">Title</h3>
                      <p className="text-muted-foreground text-xl font-semibold">{book.title}</p>
                    </div>

                    {/* Author(s) - Full Width */}
                    {authors && authors.length > 0 && (
                      <div className="book-details__authors-section">
                        <h3 className="font-medium text-lg">Author(s)</h3>
                        <div className="text-muted-foreground">
                          {authors.map((author, index) => (
                            <span key={author.id}>
                              <EntityHoverCard
                                type="author"
                                entity={{
                                  id: author.id,
                                  name: author.name,
                                  author_image: author.author_image
                                    ? { url: author.author_image.url }
                                    : undefined,
                                  bookCount: authorBookCounts[author.id] || 0,
                                }}
                              >
                                <span className="text-muted-foreground hover:text-primary transition-colors">
                                  {author.name}
                                </span>
                              </EntityHoverCard>
                              {index < authors.length - 1 && <span className="mx-2">•</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Publisher(s) - Full Width */}
                    {publisher && (
                      <div className="book-details__publishers-section">
                        <h3 className="font-medium text-lg">Publisher(s)</h3>
                        <div className="text-muted-foreground">
                          <EntityHoverCard
                            type="publisher"
                            entity={{
                              id: publisher.id,
                              name: publisher.name,
                              publisher_image: publisher.publisher_image,
                              logo_url: publisher.publisher_image?.url,
                              bookCount: publisherBooksCount,
                            }}
                          >
                            <span className="text-muted-foreground hover:text-primary transition-colors">
                              {publisher.name}
                            </span>
                          </EntityHoverCard>
                        </div>
                      </div>
                    )}

                    {/* Other Details - 3 Column Grid */}
                    <div className="book-details__other-details">
                      <h3 className="font-medium text-lg mb-4">Other Details</h3>
                      <div className="book-details-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {/* Display book data based on the actual schema, excluding specified fields */}
                        {book.isbn && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">ISBN</h4>
                            <p className="text-muted-foreground">{book.isbn}</p>
                          </div>
                        )}

                        {book.isbn10 && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">ISBN-10</h4>
                            <p className="text-muted-foreground">{book.isbn10}</p>
                          </div>
                        )}

                        {book.isbn13 && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">ISBN-13</h4>
                            <p className="text-muted-foreground">{book.isbn13}</p>
                          </div>
                        )}

                        {book.publish_date && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">Publish Date</h4>
                            <p className="text-muted-foreground flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              {formatDate(book.publish_date)}
                            </p>
                          </div>
                        )}

                        {book.publication_date && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">Publication Date</h4>
                            <p className="text-muted-foreground flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              {formatDate(book.publication_date)}
                            </p>
                          </div>
                        )}

                        {(bindingType || book.binding) && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">Binding</h4>
                            <p className="text-muted-foreground flex items-center">
                              <BookText className="h-4 w-4 mr-2" />
                              {bindingType?.name || book.binding}
                            </p>
                          </div>
                        )}

                        {/* Only show page_count if it's a valid number */}
                        {book.page_count !== undefined &&
                          book.page_count !== null &&
                          !isNaN(Number(book.page_count)) && (
                            <div className="book-detail-item">
                              <h4 className="font-medium">Page Count</h4>
                              <p className="text-muted-foreground flex items-center">
                                <FileText className="h-4 w-4 mr-2" />
                                {book.page_count}
                              </p>
                            </div>
                          )}

                        {/* Only show pages if it's a valid number */}
                        {book.pages !== undefined &&
                          book.pages !== null &&
                          !isNaN(Number(book.pages)) && (
                            <div className="book-detail-item">
                              <h4 className="font-medium">Pages</h4>
                              <p className="text-muted-foreground flex items-center">
                                <FileText className="h-4 w-4 mr-2" />
                                {book.pages}
                              </p>
                            </div>
                          )}

                        {book.dimensions && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">Dimensions</h4>
                            <p className="text-muted-foreground flex items-center">
                              <Ruler className="h-4 w-4 mr-2" />
                              {book.dimensions}
                            </p>
                          </div>
                        )}

                        {book.weight !== null && book.weight !== undefined && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">Weight</h4>
                            <p className="text-muted-foreground">
                              {typeof book.weight === 'number'
                                ? Number(book.weight).toFixed(2)
                                : book.weight}{' '}
                              kg
                            </p>
                          </div>
                        )}

                        {book.genre && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">Genre</h4>
                            <p className="text-muted-foreground flex items-center">
                              <Tag className="h-4 w-4 mr-2" />
                              {book.genre}
                            </p>
                          </div>
                        )}

                        {book.language && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">Language</h4>
                            <p className="text-muted-foreground flex items-center">
                              <Globe className="h-4 w-4 mr-2" />
                              {book.language}
                            </p>
                          </div>
                        )}

                        {book.average_rating !== undefined &&
                          book.average_rating !== null &&
                          !isNaN(Number(book.average_rating)) && (
                            <div className="book-detail-item">
                              <h4 className="font-medium">Average Rating</h4>
                              <p className="text-muted-foreground flex items-center">
                                <Star className="h-4 w-4 mr-2 fill-yellow-400 text-yellow-400" />
                                {Number(book.average_rating).toFixed(1)} / 5
                              </p>
                            </div>
                          )}

                        {(formatType || book.format) && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">Format</h4>
                            <p className="text-muted-foreground">
                              {formatType?.name || book.format}
                            </p>
                          </div>
                        )}

                        {book.edition && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">Edition</h4>
                            <p className="text-muted-foreground">{book.edition}</p>
                          </div>
                        )}

                        {book.series && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">Series</h4>
                            <p className="text-muted-foreground">{book.series}</p>
                          </div>
                        )}

                        {book.website && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">Website</h4>
                            <p className="text-muted-foreground flex items-center">
                              <Globe className="h-4 w-4 mr-2" />
                              <a
                                href={
                                  book.website.startsWith('http')
                                    ? book.website
                                    : `https://${book.website}`
                                }
                                className="hover:underline text-primary"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Visit Website
                              </a>
                            </p>
                          </div>
                        )}

                        {book.created_at && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">Created At</h4>
                            <p className="text-muted-foreground">{formatDate(book.created_at)}</p>
                          </div>
                        )}

                        {book.updated_at && (
                          <div className="book-detail-item">
                            <h4 className="font-medium">Updated At</h4>
                            <p className="text-muted-foreground">{formatDate(book.updated_at)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Synopsis and Overview - Full Width */}
                    {book.synopsis && (
                      <div className="book-details__synopsis-section">
                        <h3 className="font-medium text-lg">Synopsis</h3>
                        <Collapsible open={showFullAbout} onOpenChange={setShowFullAbout}>
                          {/* Show truncated content initially */}
                          <div
                            className={`text-muted-foreground max-w-none synopsis-content prose prose-sm ${
                              !showFullAbout ? 'max-h-60 overflow-hidden' : 'hidden'
                            }`}
                            dangerouslySetInnerHTML={{ __html: book.synopsis }}
                          />

                          {/* Show full content when expanded */}
                          <CollapsibleContent className="text-muted-foreground max-w-none synopsis-content prose prose-sm">
                            <div dangerouslySetInnerHTML={{ __html: book.synopsis }} />
                          </CollapsibleContent>

                          {needsTruncation && (
                            <div className="flex justify-end mt-2">
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-primary hover:bg-primary/10 hover:text-primary"
                                >
                                  {showFullAbout ? 'View Less' : 'View More'}
                                </Button>
                              </CollapsibleTrigger>
                            </div>
                          )}
                        </Collapsible>
                      </div>
                    )}

                    {book.overview && (
                      <div className="book-details__overview-section">
                        <h3 className="font-medium text-lg">Overview</h3>
                        <div
                          className="text-muted-foreground max-w-none"
                          dangerouslySetInnerHTML={{ __html: book.overview }}
                        />
                      </div>
                    )}
                  </div>
                </ContentSection>

                {/* More Books By Author Section */}
                {authors && authors.length > 0 && (
                  <ContentSection
                    title={`More Books By ${authors[0].name}`}
                    footer={
                      <div className="mt-4 text-center">
                        <Button variant="outline" asChild>
                          <Link href={`/authors/${authors[0].id}?tab=books`}>View All Books</Link>
                        </Button>
                      </div>
                    }
                    className="book-page__more-books-section"
                  >
                    {moreBooks.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {moreBooks.map((b) => (
                          <BookCard
                            key={b.id}
                            id={b.id}
                            title={b.title}
                            coverImageUrl={b.cover_image?.url || '/placeholder.svg'}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No other books found by this author</p>
                      </div>
                    )}
                  </ContentSection>
                )}

                {/* Similar Books */}
                <ContentSection title="Similar Books" className="book-page__similar-books-section">
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Recommendations coming soon</p>
                  </div>
                </ContentSection>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="book-page__reviews-tab">
            <ContentSection title="Reviews" className="book-page__reviews-section">
              <div className="space-y-6">
                {/* Add Review Form */}
                <div className="review-form space-y-4">
                  <div className="flex items-center gap-2">
                    <Avatar src="/placeholder.svg" alt="User" name="User" size="sm" />
                    <div className="flex-1">
                      <Input placeholder="Write a review..." />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="rating-selector flex items-center">
                      <span className="mr-2">Rate:</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-5 w-5 text-gray-300 cursor-pointer hover:text-yellow-400"
                          />
                        ))}
                      </div>
                    </div>
                    <Button>Post Review</Button>
                  </div>
                </div>

                <Separator />

                {/* Reviews List */}
                {reviews.length > 0 ? (
                  <div className="reviews-list space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="review-item space-y-2">
                        <div className="flex items-start gap-3">
                          <Avatar src="/placeholder.svg" alt="User" name="User" size="sm" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">User</h4>
                                <div className="flex items-center">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating
                                          ? 'text-yellow-400 fill-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                  {/* Only show date if created_at exists */}
                                  {review.created_at && (
                                    <span className="ml-2 text-sm text-muted-foreground">
                                      {formatDate(review.created_at)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className="mt-2">{review.content}</p>
                            <div className="review-actions flex items-center gap-4 mt-2">
                              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" />
                                <span>Like</span>
                              </Button>
                              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                <span>Reply</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-reviews text-center py-4">
                    <p className="text-muted-foreground">
                      No reviews yet. Be the first to review this book!
                    </p>
                  </div>
                )}
              </div>
            </ContentSection>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="book-page__photos-tab">
            <div className="book-page__tab-content space-y-6">
              <EntityPhotoAlbums
                entityId={params.id}
                entityType="book"
                isOwnEntity={canEdit}
                entityDisplayInfo={
                  authors && authors.length > 0
                    ? {
                        id: authors[0].id,
                        name: authors[0].name,
                        type: 'author' as const,
                        author_image: authors[0].author_image
                          ? { url: authors[0].author_image.url }
                          : undefined,
                        bookCount: authorBookCounts[authors[0].id] || 0,
                      }
                    : undefined
                }
              />
            </div>
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="book-page__followers-tab">
            <div className="book-page__tab-content space-y-6">
              <FollowersListTab
                followers={followers}
                followersCount={followers.length}
                entityId={params.id}
                entityType="book"
              />
            </div>
          </div>
        )}

        {activeTab === 'more' && (
          <EntityMoreTab
            entity={{
              entityType: 'book',
              entityId: params.id,
              title: book.title,
              synopsis: book.synopsis || undefined,
              about: book.overview || undefined,
              createdAt: book.created_at || new Date().toISOString(),
              updatedAt: book.updated_at || new Date().toISOString(),
            }}
            config={{
              sections: {
                stats: false,
                preferences: false,
                events: true,
                recommendations: true,
              },
              customSections: {
                groups: (
                  <div className="space-y-4">
                    <Link href={`/groups/add?target_type=book&target_id=${params.id}`}>
                      <Button className="book-groups__create-button">
                        <Users className="h-4 w-4 mr-2" />
                        Create Group
                      </Button>
                    </Link>
                    <div className="book-groups__item flex items-center gap-3 p-3 border rounded-lg">
                      <span className="book-groups__avatar relative flex shrink-0 overflow-hidden rounded-full h-14 w-14">
                        <img
                          src="/placeholder.svg?height=100&width=100"
                          alt="Fantasy Book Club"
                          className="aspect-square h-full w-full"
                        />
                      </span>
                      <div className="book-groups__content flex-1 min-w-0">
                        <h3 className="book-groups__name font-medium truncate">Fantasy Book Club</h3>
                        <div className="book-groups__meta flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="book-groups__role inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-xs">
                            Moderator
                          </div>
                          <span>·</span>
                          <span>1243 members</span>
                        </div>
                      </div>
                      <Button variant="outline" className="book-groups__view-button h-9 rounded-md px-3">
                        View
                      </Button>
                    </div>
                  </div>
                ),
              },
            }}
          />
        )}
      </div>
    </div>
  )
}
