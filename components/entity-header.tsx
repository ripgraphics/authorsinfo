'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Camera,
  BookOpen,
  Users,
  MapPin,
  Globe,
  User,
  MoreHorizontal,
  MessageSquare,
  UserPlus,
  Settings,
  Crop,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  GroupHoverCard,
  EventCreatorHoverCard,
} from '@/components/entity-hover-cards'
import { UserHoverCard } from '@/components/entity-hover-cards'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EntityHoverCard } from '@/components/entity-hover-cards'
import { GroupActions } from '@/components/group/GroupActions'
import { useGroupPermissions } from '@/hooks/useGroupPermissions'
import { useAuth } from '@/hooks/useAuth'
import { FollowButton } from '@/components/follow-button'
import { EntityImageUpload } from '@/components/entity/EntityImageUpload'
import { AddFriendButton } from '@/components/add-friend-button'
import { MutualFriendsDisplay } from '@/components/mutual-friends-display'
import { ImageCropper } from '@/components/ui/image-cropper'
import { CameraIconButton } from '@/components/ui/camera-icon-button'
import { HoverOverlay } from '@/components/ui/hover-overlay'
import { ReusableModal } from '@/components/ui/reusable-modal'
import { useToast } from '@/hooks/use-toast'
import { EntityTabs } from '@/components/ui/entity-tabs'
import { deduplicatedRequest, clearCache } from '@/lib/request-utils'
import { createBrowserClient } from '@supabase/ssr'
import { useIsMobile } from '@/hooks/use-mobile'
import { ResponsiveActionButton } from '@/components/ui/responsive-action-button'

export type EntityType = 'author' | 'publisher' | 'book' | 'group' | 'user' | 'event' | 'photo'

export interface Stat {
  icon: React.ReactNode
  text: string
  href?: string
}

export interface TabConfig {
  id: string
  label: string
  disabled?: boolean
}

export interface EntityHeaderProps {
  entityType: EntityType
  name: string
  username?: string | React.ReactNode
  description?: string
  coverImageUrl: string
  profileImageUrl: string
  stats?: Stat[]
  location?: string
  website?: string
  mutualFriendsCount?: number
  tabs: TabConfig[]
  activeTab: string
  onTabChange: (tabId: string) => void
  children?: React.ReactNode
  className?: string
  onCoverImageChange?: () => void
  onProfileImageChange?: () => void
  changeCoverLabel?: string
  cropCoverLabel?: string
  cropCoverSuccessMessage?: string
  onMessage?: () => void
  onFollow?: () => void
  isFollowing?: boolean
  isMessageable?: boolean
  isEditable?: boolean
  entityId?: string
  targetType?: 'user' | 'book' | 'author' | 'publisher' | 'group'
  creatorName?: string
  creator?: {
    id: string
    name: string
    email?: string
    created_at?: string
  }
  author?: {
    id: string
    name: string
    author_image?: {
      url: string
    }
  }
  authorBookCount?: number
  publisher?: {
    id: string
    name: string
    publisher_image?: {
      url: string
    }
    logo_url?: string
  }
  publisherBookCount?: number
  group?: {
    id: string
    name: string
    group_image?: {
      url: string
    }
    member_count?: number
    is_private: boolean
  }
  eventCreator?: {
    id: string
    name: string
    avatar_url?: string
    event_count?: number
  }
  creatorJoinedAt?: string
  isMember?: boolean
  bookId?: string
  // Enhanced profile fields for enterprise-grade profiles
  enhancedProfile?: {
    bio?: string
    birthDate?: string
    gender?: string
    occupation?: string
    education?: string
    interests?: string[]
    socialLinks?: {
      twitter?: string
      linkedin?: string
      instagram?: string
      facebook?: string
      website?: string
    }
    phone?: string
    email?: string
    timezone?: string
    languages?: string[]
    readingPreferences?: {
      favoriteGenres?: string[]
      readingGoals?: {
        booksPerYear?: number
        pagesPerDay?: number
        currentStreak?: number
      }
      readingStats?: {
        totalBooksRead?: number
        totalPagesRead?: number
        averageRating?: number
        favoriteAuthors?: string[]
      }
    }
    privacySettings?: {
      defaultPrivacyLevel?: 'private' | 'friends' | 'followers' | 'public'
      allowPublicReadingProfile?: boolean
      allowFriendsToSeeReading?: boolean
      allowFollowersToSeeReading?: boolean
      showReadingStatsPublicly?: boolean
      showCurrentlyReadingPublicly?: boolean
      showReadingHistoryPublicly?: boolean
      showReadingGoalsPublicly?: boolean
    }
  }
  // Add userStats for hover card
  userStats?: {
    booksRead: number
    friendsCount: number
    followersCount: number
    location: string | null
    website: string | null
    joinedDate: string
  }
}

export function EntityHeader({
  entityType,
  name,
  username,
  description,
  coverImageUrl,
  profileImageUrl,
  stats = [],
  location,
  website,
  mutualFriendsCount,
  tabs,
  activeTab,
  onTabChange,
  children,
  className,
  onCoverImageChange,
  onProfileImageChange,
  changeCoverLabel = 'Change Cover',
  cropCoverLabel = 'Crop Cover',
  cropCoverSuccessMessage,
  onMessage,
  onFollow,
  isFollowing = false,
  isMessageable = true,
  isEditable = false,
  entityId,
  targetType,
  creatorName,
  creator,
  author,
  authorBookCount = 0,
  publisher,
  publisherBookCount = 0,
  group,
  eventCreator,
  creatorJoinedAt,
  isMember = false,
  bookId,
  enhancedProfile,
  userStats,
}: EntityHeaderProps) {
  console.log('🏗️ EntityHeader component mounted with props:', {
    entityType,
    entityId,
    name,
    coverImageUrl,
  })

  const { user } = useAuth()
  const router = useRouter()
  const groupPermissions = useGroupPermissions(group?.id || null, user?.id)
  const { isMember: isGroupMember, isAdmin } = groupPermissions
  const [groupMemberData, setGroupMemberData] = useState<any>(null)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)
  const [isAvatarCropModalOpen, setIsAvatarCropModalOpen] = useState(false)
  // For users, cover image is canonical (`profiles.cover_image_id -> images.url`) and should render immediately.
  // For other entities, initialize as undefined so we can fetch an entity header image first, then fallback.
  const [coverImage, setCoverImage] = useState<string | undefined>(
    entityType === 'user' ? coverImageUrl : undefined
  )
  const [avatarImage, setAvatarImage] = useState<string | undefined>(profileImageUrl)
  const [isProcessing, setIsProcessing] = useState(false)
  const [imageVersion, setImageVersion] = useState(0)
  const [entityImages, setEntityImages] = useState<{
    header?: string
    avatar?: string
  }>({})
  const [isHoveringCover, setIsHoveringCover] = useState(false)
  const [isCoverDropdownOpen, setIsCoverDropdownOpen] = useState(false)
  const { toast } = useToast()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  // Use mobile detection for responsive action buttons (compact only on mobile devices)
  const actionsContainerRef = useRef<HTMLDivElement>(null)
  const isCompact = useIsMobile()

  useEffect(() => {
    const fetchGroupMemberData = async () => {
      if (!creator || !group?.id) return

      try {
        const response = await fetch(
          `/api/group-members?group_id=${group.id}&user_id=${creator.id}`
        )
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        console.log('Group member data:', data)
        setGroupMemberData(data[0] || null) // Get first record if exists
      } catch (error) {
        console.error('Error fetching group member data:', error)
        setGroupMemberData(null)
      }
    }

    fetchGroupMemberData()
  }, [creator, group?.id])

  // Fetch entity images with optimization
  const fetchEntityImages = useCallback(async () => {
    if (!entityId || !entityType) {
      console.log('❌ Missing entityId or entityType, skipping fetch')
      return
    }

    // ✅ User avatar/cover must NOT depend on albums for rendering.
    // Canonical source is `profiles.avatar_image_id` / `profiles.cover_image_id` -> `images.url`.
    if (entityType === 'user') {
      return
    }

    try {
      console.log('📡 Fetching entity images with optimization...')

      // Use deduplicated requests with shorter cache for entity images
      // Shorter cache ensures fresh data after image uploads
      const [headerData, avatarData] = await Promise.all([
        deduplicatedRequest(
          `entity-header-${entityType}-${entityId}`,
          () =>
            fetch(
              `/api/entity-images?entityId=${entityId}&entityType=${entityType}&albumPurpose=entity_header`
            ).then((r) => r.json()),
          30 * 1000 // 30 seconds cache - shorter for entity header images
        ),
        deduplicatedRequest(
          `entity-avatar-${entityType}-${entityId}`,
          () =>
            fetch(
              `/api/entity-images?entityId=${entityId}&entityType=${entityType}&albumPurpose=avatar`
            ).then((r) => r.json()),
          30 * 1000 // 30 seconds cache - shorter for entity avatar images
        ),
      ])

      // Process header images - FIRST PRIORITY: entity header image
      let foundEntityHeaderImage = false

      console.log('🔍 Header data response:', {
        success: headerData.success,
        albumsCount: headerData.albums?.length || 0,
        albums: headerData.albums?.map((a: any) => ({
          id: a.id,
          name: a.name,
          imagesCount: a.images?.length || 0,
        })),
      })

      if (headerData.success && headerData.albums && headerData.albums.length > 0) {
        const headerAlbum = headerData.albums[0]
        console.log('🔍 Header album details:', {
          id: headerAlbum.id,
          name: headerAlbum.name,
          imagesCount: headerAlbum.images?.length || 0,
          images: headerAlbum.images?.map((img: any) => ({
            id: img.id,
            is_cover: img.is_cover,
            hasImage: !!img.image,
            imageUrl: img.image?.url || 'NO URL',
            imageId: img.image?.id || 'NO ID',
          })),
        })

        if (headerAlbum.images && headerAlbum.images.length > 0) {
          // Filter out images with null image objects
          const validImages = headerAlbum.images.filter((img: any) => img.image && img.image.url)
          console.log(
            `🔍 Filtered ${validImages.length} valid images from ${headerAlbum.images.length} total`
          )

          if (validImages.length > 0) {
            let headerImage = validImages.find((img: any) => img.is_cover)

            if (!headerImage) {
              headerImage = validImages.reduce((latest: any, current: any) => {
                if (!latest) return current
                const latestDate = new Date(latest.image?.created_at || 0)
                const currentDate = new Date(current.image?.created_at || 0)
                return currentDate > latestDate ? current : latest
              })
            }

            if (headerImage && headerImage.image) {
              console.log('✅ Found entity header image, setting:', headerImage.image.url)
              setEntityImages((prev) => ({ ...prev, header: headerImage.image.url }))
              setCoverImage(headerImage.image.url)
              setImageVersion((prev) => prev + 1) // Force image reload
              foundEntityHeaderImage = true
            } else {
              console.warn('⚠️ Header image found but missing image object:', headerImage)
            }
          } else {
            console.warn(
              '⚠️ No valid images found in header album (all images have null image objects)'
            )
          }
        } else {
          console.warn('⚠️ Header album has no images array or empty images array')
        }
      } else {
        console.warn('⚠️ No header albums found or request failed:', {
          success: headerData.success,
          error: headerData.error,
          albumsCount: headerData.albums?.length || 0,
        })
      }

      // FALLBACK: Only use book cover if no entity header image was found
      if (!foundEntityHeaderImage) {
        console.log('⚠️ No entity header image found, falling back to book cover')
        setEntityImages((prev) => ({ ...prev, header: undefined }))
        setCoverImage(coverImageUrl)
      }

      // Process avatar images
      console.log('🔍 Avatar data response:', {
        success: avatarData.success,
        albumsCount: avatarData.albums?.length || 0,
        albums: avatarData.albums?.map((a: any) => ({
          id: a.id,
          name: a.name,
          imagesCount: a.images?.length || 0,
        })),
      })

      if (avatarData.success && avatarData.albums && avatarData.albums.length > 0) {
        const avatarAlbum = avatarData.albums[0]
        console.log('🔍 Avatar album details:', {
          id: avatarAlbum.id,
          name: avatarAlbum.name,
          imagesCount: avatarAlbum.images?.length || 0,
          images: avatarAlbum.images?.map((img: any) => ({
            id: img.id,
            is_cover: img.is_cover,
            hasImage: !!img.image,
            imageUrl: img.image?.url || 'NO URL',
            imageId: img.image?.id || 'NO ID',
          })),
        })

        if (avatarAlbum.images && avatarAlbum.images.length > 0) {
          // Filter out images with null image objects
          const validImages = avatarAlbum.images.filter((img: any) => img.image && img.image.url)
          console.log(
            `🔍 Filtered ${validImages.length} valid images from ${avatarAlbum.images.length} total`
          )

          if (validImages.length > 0) {
            let avatarImage = validImages.find((img: any) => img.is_cover)

            if (!avatarImage) {
              avatarImage = validImages.reduce((latest: any, current: any) => {
                if (!latest) return current
                const latestDate = new Date(latest.image?.created_at || 0)
                const currentDate = new Date(current.image?.created_at || 0)
                return currentDate > latestDate ? current : latest
              })
            }

            if (avatarImage && avatarImage.image) {
              console.log('✅ Setting avatar image:', avatarImage.image.url)
              setEntityImages((prev) => ({ ...prev, avatar: avatarImage.image.url }))
              setAvatarImage(avatarImage.image.url)
            } else {
              console.warn('⚠️ Avatar image found but missing image object:', avatarImage)
            }
          } else {
            console.warn(
              '⚠️ No valid images found in avatar album (all images have null image objects)'
            )
          }
        } else {
          console.warn('⚠️ Avatar album has no images array or empty images array')
        }
      } else {
        console.warn('⚠️ No avatar albums found or request failed:', {
          success: avatarData.success,
          error: avatarData.error,
          albumsCount: avatarData.albums?.length || 0,
        })
      }
    } catch (error) {
      console.error('❌ Error fetching entity images:', error)
      // On error, fall back to book cover
      setCoverImage(coverImageUrl)
    }
  }, [entityId, entityType])

  // Fetch entity images from photo albums when component mounts
  useEffect(() => {
    // For users, we render canonical avatar/cover from props/state and do not fetch from albums.
    if (entityType === 'user') return
    console.log('🚀 useEffect triggered, calling fetchEntityImages')
    fetchEntityImages()
  }, [fetchEntityImages])

  // Listen for entity image changes (when user sets new cover in photos tab)
  useEffect(() => {
    const handleEntityImageChanged = () => {
      console.log('🔄 Entity image changed event received, refreshing images...')

      // Clear cache to ensure fresh data is fetched
      clearCache(`entity-avatar-${entityType}-${entityId}`)
      clearCache(`entity-header-${entityType}-${entityId}`)

      // Add a small delay to ensure database transaction is fully committed
      // This prevents race conditions where the query might execute before the transaction completes
      setTimeout(() => {
        console.log('🔄 Fetching fresh entity images after cache clear...')
        fetchEntityImages()
      }, 100)
    }

    window.addEventListener('entityImageChanged', handleEntityImageChanged)

    return () => {
      window.removeEventListener('entityImageChanged', handleEntityImageChanged)
    }
  }, [fetchEntityImages, entityType, entityId])

  // Listen for canonical primary image changes (avatar/cover) so the header updates instantly
  // when a user reverts to an older album image.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | {
            entityType?: string
            entityId?: string
            primaryKind?: 'avatar' | 'cover'
            imageUrl?: string
          }
        | undefined

      if (!detail) return
      if (detail.entityType !== entityType) return
      if (!detail.entityId || detail.entityId !== entityId) return

      if (detail.primaryKind === 'avatar' && detail.imageUrl) {
        setAvatarImage(detail.imageUrl)
      }
      if (detail.primaryKind === 'cover' && detail.imageUrl) {
        setCoverImage(detail.imageUrl)
        setImageVersion((prev) => prev + 1)
      }
    }

    window.addEventListener('entityPrimaryImageChanged', handler as EventListener)
    return () => window.removeEventListener('entityPrimaryImageChanged', handler as EventListener)
  }, [entityId, entityType])

  console.log('🔍 EntityHeader useEffect dependencies changed:', { entityId, entityType })

  const handleCropCover = async (croppedImageBlob: Blob) => {
    setIsProcessing(true)
    try {
      console.log('handleCropCover called with blob:', croppedImageBlob)
      console.log('Blob size:', croppedImageBlob.size)
      console.log('Blob type:', croppedImageBlob.type)

      // Convert blob to file
      const file = new File([croppedImageBlob], 'cropped-cover.jpg', { type: 'image/jpeg' })
      console.log('Created file:', file)
      console.log('File size:', file.size)
      console.log('File type:', file.type)

      // Find the original image ID from the current cover image URL
      let originalImageId: string | null = null
      if (coverImage) {
        try {
          const { data: originalImage } = await supabase
            .from('images')
            .select('id')
            .eq('url', coverImage)
            .single()

          if (originalImage) {
            originalImageId = originalImage.id
            console.log('Found original image ID:', originalImageId)
          }
        } catch (error) {
          console.warn('Could not find original image ID (non-critical):', error)
        }
      }

      // Use the entity-image upload API which handles metadata properly
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityType', entityType)
      formData.append('entityId', entityId || '')
      formData.append('imageType', 'cover')
      formData.append('originalType', 'entityHeaderCover')
      formData.append('isCropped', 'true') // Mark as cropped version of existing image
      if (originalImageId) {
        formData.append('originalImageId', originalImageId) // Link to original image
      }

      console.log('📤 Uploading cropped image via /api/upload/entity-image...')
      const uploadResponse = await fetch('/api/upload/entity-image', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        console.error('❌ Upload failed:', errorData)
        throw new Error(
          errorData.error || `Failed to upload cropped image: ${uploadResponse.status}`
        )
      }

      const uploadResult = await uploadResponse.json()
      console.log('✅ Upload result:', uploadResult)

      if (!uploadResult.url || !uploadResult.image_id) {
        throw new Error('Invalid response from upload API')
      }

      const imageData = { id: uploadResult.image_id }

      // Add image to entity album
      const albumPurpose = 'entity_header'

      console.log('DEBUG - entityId value:', entityId)
      console.log('DEBUG - entityId type:', typeof entityId)
      console.log('DEBUG - entityId truthy check:', !!entityId)

      console.log('📤 Calling entity-images API with:', {
        entityId: entityId || '',
        entityType: entityType,
        albumPurpose: albumPurpose,
        imageId: imageData.id,
        imageUrl: uploadResult.url,
        isCover: true,
        isFeatured: true,
      })

      const albumResponse = await fetch('/api/entity-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityId: entityId || '',
          entityType: entityType,
          albumPurpose: albumPurpose,
          imageId: imageData.id,
          isCover: true,
          isFeatured: true,
          metadata: {
            aspect_ratio: 16 / 9,
            uploaded_via: 'entity_header',
            original_filename: file.name,
            file_size: file.size,
          },
        }),
      })

      console.log('📥 Album API response status:', albumResponse.status)
      console.log('📥 Album API response ok:', albumResponse.ok)
      console.log(
        '📥 Album API response headers:',
        Object.fromEntries(albumResponse.headers.entries())
      )

      if (!albumResponse.ok) {
        const errorText = await albumResponse.text()
        let errorMessage = 'Failed to add image to album'
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        console.error('Failed to add image to album:', errorText)
        console.error('Album response status:', albumResponse.status)
        console.error(
          'Album response headers:',
          Object.fromEntries(albumResponse.headers.entries())
        )

        // Throw error so user sees it
        throw new Error(errorMessage)
      }

      const albumResult = await albumResponse.json()
      console.log('Successfully added image to album:', albumResult)

      if (!albumResult.success) {
        throw new Error(albumResult.error || 'Failed to create album or add image')
      }

      // Clear cache to force fresh fetch on next load
      clearCache(`entity-header-${entityType}-${entityId}`)

      // Update local state with the new image URL
      setCoverImage(uploadResult.url)
      setImageVersion((prev) => prev + 1)
      setIsCropModalOpen(false)

      // Trigger a fresh fetch of entity images to ensure consistency
      // Use setTimeout to ensure the album update has propagated
      setTimeout(() => {
        fetchEntityImages()
      }, 1000)

      // Call the onCoverImageChange callback if provided
      if (onCoverImageChange) {
        onCoverImageChange()
      }

      // Dispatch event to notify other components
      window.dispatchEvent(
        new CustomEvent('entityImageChanged', {
          detail: { entityType, entityId, imageType: 'header' },
        })
      )

      // Show success message only after everything succeeded
      toast({
        title: 'Success',
        description:
          cropCoverSuccessMessage ||
          `${entityType} entity header cover has been updated successfully and added to album.`,
      })
    } catch (error: any) {
      console.error('Error uploading cropped image:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload cropped image. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCropCancel = () => {
    setIsCropModalOpen(false)
    setIsProcessing(false)
  }

  const handleCropAvatar = async (croppedImageBlob: Blob) => {
    setIsProcessing(true)
    try {
      console.log('handleCropAvatar called with blob:', croppedImageBlob)
      console.log('Blob size:', croppedImageBlob.size)
      console.log('Blob type:', croppedImageBlob.type)

      // Convert blob to file
      const file = new File([croppedImageBlob], 'cropped-avatar.jpg', { type: 'image/jpeg' })
      console.log('Created file:', file)
      console.log('File size:', file.size)
      console.log('File type:', file.type)

      // Find the original image ID from the current avatar image URL
      let originalImageId: string | null = null
      if (avatarImage) {
        try {
          const { data: originalImage } = await supabase
            .from('images')
            .select('id')
            .eq('url', avatarImage)
            .single()

          if (originalImage) {
            originalImageId = originalImage.id
            console.log('Found original avatar image ID:', originalImageId)
          }
        } catch (error) {
          console.warn('Could not find original avatar image ID (non-critical):', error)
        }
      }

      // Use the entity-image upload API which handles metadata properly
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityType', entityType)
      formData.append('entityId', entityId || '')
      formData.append('imageType', 'avatar')
      formData.append('originalType', 'avatar')
      formData.append('isCropped', 'true') // Mark as cropped version of existing image
      if (originalImageId) {
        formData.append('originalImageId', originalImageId) // Link to original image
      }

      console.log('📤 Uploading cropped avatar via /api/upload/entity-image...')
      const uploadResponse = await fetch('/api/upload/entity-image', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        console.error('❌ Avatar upload failed:', errorData)
        throw new Error(
          errorData.error || `Failed to upload cropped avatar: ${uploadResponse.status}`
        )
      }

      const uploadResult = await uploadResponse.json()
      console.log('✅ Avatar upload result:', uploadResult)

      if (!uploadResult.url || !uploadResult.image_id) {
        throw new Error('Invalid response from upload API')
      }

      const imageData = { id: uploadResult.image_id }

      // Add image to entity album
      const albumPurpose = 'avatar'

      console.log('DEBUG - entityId value for avatar:', entityId)
      console.log('DEBUG - entityId type for avatar:', typeof entityId)
      console.log('DEBUG - entityId truthy check for avatar:', !!entityId)

      console.log('Calling entity-images API for avatar with:', {
        entityId: entityId || '',
        entityType: entityType,
        albumPurpose: albumPurpose,
        imageId: imageData.id,
        imageUrl: uploadResult.url,
        isCover: true,
        isFeatured: true,
      })

      const albumResponse = await fetch('/api/entity-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityId: entityId || '',
          entityType: entityType,
          albumPurpose: albumPurpose,
          imageId: imageData.id,
          isCover: true,
          isFeatured: true,
          metadata: {
            aspect_ratio: 1,
            uploaded_via: 'entity_header',
            original_filename: file.name,
            file_size: file.size,
          },
        }),
      })

      console.log('Avatar album response status:', albumResponse.status)
      console.log('Avatar album response ok:', albumResponse.ok)

      if (!albumResponse.ok) {
        const errorText = await albumResponse.text()
        console.error('Failed to add avatar to album:', errorText)
        console.error('Avatar album response status:', albumResponse.status)
        console.error(
          'Avatar album response headers:',
          Object.fromEntries(albumResponse.headers.entries())
        )
        // Don't throw error here, just log it
      } else {
        const albumResult = await albumResponse.json()
        console.log('Successfully added avatar to album:', albumResult)
      }

      // Update local state with the new image URL
      setAvatarImage(uploadResult.url)
      setImageVersion((prev) => prev + 1)
      setIsAvatarCropModalOpen(false)

      // Dispatch event for real-time updates across the application
      if (entityType === 'user' && entityId) {
        window.dispatchEvent(
          new CustomEvent('entityPrimaryImageChanged', {
            detail: {
              entityType: 'user',
              entityId: entityId,
              primaryKind: 'avatar',
              imageUrl: uploadResult.url,
            },
          })
        )
      }

      // Clear caches related to user avatar
      clearCache(`user-avatar-${entityId}`)
      clearCache(`entity-avatar-${entityType}-${entityId}`)
      clearCache(`entity-header-${entityType}-${entityId}`)

      // Call the onProfileImageChange callback if provided
      if (onProfileImageChange) {
        onProfileImageChange()
      }

      // Refresh router to ensure all components get updated data
      router.refresh()

      // Show success message
      toast({
        title: 'Success',
        description: `${entityType} entity header avatar has been updated successfully and added to album.`,
      })
    } catch (error: any) {
      console.error('Error uploading cropped avatar:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload cropped avatar. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAvatarCropCancel = () => {
    setIsAvatarCropModalOpen(false)
    setIsProcessing(false)
  }

  const renderEntityName = () => {
    const nameElement = (
      <h1 className="entity-header__title text-base sm:text-[1.1rem] font-bold truncate max-w-full min-w-0 block">
        {name}
      </h1>
    )

    switch (entityType) {
      case 'user':
        // Debug logging
        console.log('🔍 EntityHeader Debug:', {
          entityId: entityId,
          name: name,
          userStats: userStats,
          hasUserStats: !!userStats,
        })

        return (
          <h1 className="entity-header__title text-base sm:text-[1.1rem] font-bold truncate max-w-full min-w-0 block">
            <EntityHoverCard
              type="user"
              entity={{
                id: entityId || '',
                name: name,
                avatar_url: profileImageUrl,
                created_at: creatorJoinedAt,
                location: location, // Pass the location prop
                website: website, // Pass the website prop
                // Add any other user data that might be available
                friend_count: parseInt(
                  stats?.find((s) => s.text.includes('friends'))?.text.match(/\d+/)?.[0] || '0'
                ),
                books_read_count: parseInt(
                  stats?.find((s) => s.text.includes('books'))?.text.match(/\d+/)?.[0] || '0'
                ),
              }}
              userStats={userStats}
            >
              <span className="cursor-pointer hover:text-primary transition-colors inline-block">
                {name}
              </span>
            </EntityHoverCard>
          </h1>
        )
      case 'author':
        return author ? (
          <EntityHoverCard
            type="author"
            entity={{
              id: author.id,
              name: author.name,
              author_image: author.author_image,
              bookCount: authorBookCount,
            }}
          >
            <span className="entity-header__author-name text-muted-foreground">{author.name}</span>
          </EntityHoverCard>
        ) : (
          nameElement
        )
      case 'publisher':
        return publisher ? (
          <EntityHoverCard
            type="publisher"
            entity={{
              id: publisher.id,
              name: publisher.name,
              publisher_image: publisher.publisher_image,
              logo_url: publisher.publisher_image?.url,
              bookCount: publisherBookCount,
            }}
          >
            <span className="entity-header__publisher-name text-muted-foreground">
              {publisher.name}
            </span>
          </EntityHoverCard>
        ) : (
          nameElement
        )
      case 'group':
        return nameElement
      case 'event':
        return eventCreator ? (
          <EntityHoverCard
            type="event"
            entity={{
              id: eventCreator.id,
              name: eventCreator.name,
              avatar_url: eventCreator.avatar_url,
              event_count: eventCreator.event_count,
            }}
          >
            <span className="entity-header__event-creator-name text-muted-foreground">
              {eventCreator.name}
            </span>
          </EntityHoverCard>
        ) : (
          nameElement
        )
      default:
        return nameElement
    }
  }

  const renderCreatorInfo = () => {
    if (!creator) return creatorName

    return (
      <EntityHoverCard
        type="group"
        entity={{
          id: creator.id,
          name: creator.name,
          group_image: {
            url: `/api/avatar/${creator.id}`,
          },
          joined_at: groupMemberData?.joined_at || creatorJoinedAt,
        }}
      >
        <span className="entity-header__creator-link cursor-pointer">{creatorName}</span>
      </EntityHoverCard>
    )
  }

  const renderActions = () => {
    if (entityType === 'group' && group) {
      return (
        <div className="entity-header__group-actions flex items-center gap-2">
          <GroupActions
            groupId={group.id}
            groupName={group.name}
            isPrivate={group.is_private}
            isMember={isGroupMember}
            onJoinChange={() => {
              // Refresh the page or update the UI as needed
              window.location.reload()
            }}
          />
          {(isAdmin() || isEditable) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/groups/${group.id}/edit`}
                    className="entity-header__edit-group-link flex items-center"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Group
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )
    }

    return (
      <>
        {/* Only show action buttons if user is logged in */}
        {user && (
          <>
            {/* Add Friend button for user profiles */}
            {entityType === 'user' && entityId && (
              <AddFriendButton
                targetUserId={entityId}
                targetUserName={name}
                className="entity-header__add-friend-button flex items-center"
                variant="outline"
                size="sm"
                compact={isCompact}
              />
            )}
            {/* Follow button */}
            {entityId && targetType && (
              <FollowButton
                entityId={entityId}
                targetType={targetType}
                entityName={name}
                className="entity-header__follow-button flex items-center"
                size="sm"
                showText={!isCompact}
              />
            )}
            {/* Message button - shown by default when isMessageable is true, but not for own profile */}
            {isMessageable && !(entityType === 'user' && user?.id === entityId) && (
              <ResponsiveActionButton
                icon={<MessageSquare className="h-4 w-4" />}
                label="Message"
                tooltip="Message"
                compact={isCompact}
                variant="default"
                size="sm"
                onClick={onMessage}
                className="entity-header__message-button flex items-center"
              />
            )}
          </>
        )}
        {/* More options dropdown - always visible */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="entity-header__more-button h-9 w-9 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="entity-header__share-option flex items-center cursor-pointer">
              Share
            </DropdownMenuItem>
            <DropdownMenuItem className="entity-header__report-option flex items-center cursor-pointer">
              Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    )
  }

  const renderCoverImage = () => {
    if (!coverImage && !isEditable) return null

    // Add cache-busting parameter to force image reload
    const imageUrl = coverImage ? `${coverImage}?t=${imageVersion}` : ''

    return (
      <div
        className="entity-header__cover-container relative w-full aspect-[1344/500] bg-muted"
        onMouseEnter={() => setIsHoveringCover(true)}
        onMouseLeave={() => {
          if (!isCoverDropdownOpen) {
            setIsHoveringCover(false)
          }
        }}
      >
        {coverImage && (
          <Image
            src={imageUrl}
            alt={`${name} cover`}
            fill
            className="entity-header__cover-image object-cover"
            priority
            quality={95}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
          />
        )}
        {isEditable && (isHoveringCover || isCoverDropdownOpen) && (
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
                setIsCoverModalOpen(true)
                setIsCoverDropdownOpen(false)
              }}
              onCrop={
                coverImage
                  ? () => {
                      setIsCropModalOpen(true)
                      setIsCoverDropdownOpen(false)
                    }
                  : undefined
              }
              showCrop={!!coverImage}
              changeCoverLabel={changeCoverLabel}
              cropLabel={cropCoverLabel}
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
    )
  }

  const renderAvatar = () => {
    return (
      <div className="entity-header__avatar-container relative w-32 h-32 shrink-0">
        <div className="avatar-container relative w-32 h-32 overflow-hidden rounded-full border-2 border-white shadow-md">
          {avatarImage ? (
            <Image
              src={avatarImage}
              alt={`${name} avatar`}
              width={128}
              height={128}
              className="object-cover rounded-full"
              priority
            />
          ) : (
            <Image
              src="/placeholder.svg?height=200&width=200"
              alt={`${name} avatar`}
              width={128}
              height={128}
              className="object-cover rounded-full"
              priority
            />
          )}
        </div>
        {isEditable && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:text-accent-foreground entity-header__avatar-button absolute bottom-2 right-2 rounded-full h-8 w-8 bg-white/80 hover:bg-white">
                <Camera className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsAvatarModalOpen(true)}>
                <Camera className="h-4 w-4 mr-2" />
                Change Avatar
              </DropdownMenuItem>
              {avatarImage && (
                <DropdownMenuItem onClick={() => setIsAvatarCropModalOpen(true)}>
                  <Crop className="h-4 w-4 mr-2" />
                  Crop Avatar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn('entity-header bg-white rounded-lg shadow-sm overflow-hidden mb-6', className)}
    >
      {/* Cover Image */}
      {renderCoverImage()}

      {/* Header Content */}
      <div className="entity-header__content px-4 pb-4">
        <div className="entity-header__profile-section flex flex-col items-center md:flex-row md:items-start relative z-10">
          {/* Profile Image - Only this should go outside the container */}
          <div className="shrink-0 self-start mx-auto md:mx-0" style={{ transform: 'translateY(-40px)' }}>
            {renderAvatar()}
          </div>

          {/* Entity Info - This should stay within the container */}
          <div className="entity-header__info mt-6 md:ml-6 flex-1 min-w-0 max-w-full md:w-auto">
            <div className="entity-header__info-layout flex flex-col items-center md:flex-row md:items-start md:justify-between gap-4">
              <div className="entity-header__info-content flex-1 min-w-0 max-w-full overflow-hidden text-center md:text-left">
                {renderEntityName()}
                {entityType === 'group' && creatorName && (
                  <div className="entity-header__creator-info text-muted-foreground truncate text-sm">
                    Created by {renderCreatorInfo()}
                  </div>
                )}
                {username && (
                  <div className="entity-header__username text-muted-foreground truncate text-sm">
                    {typeof username === 'string'
                      ? username.startsWith('@') || username.startsWith('by ')
                        ? username
                        : `@${username}`
                      : username}
                  </div>
                )}
                {description && (
                  <p className="entity-header__description text-muted-foreground mt-1 line-clamp-2">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Stats and Info */}
            <div className="entity-header__stats-container flex flex-wrap justify-center md:justify-between items-baseline gap-x-6 gap-y-2 mt-4">
              <div className="entity-header__stats-group flex flex-wrap gap-x-6 gap-y-2">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="entity-header__stat-item flex items-center text-muted-foreground"
                  >
                    {stat.href ? (
                      <Link
                        href={stat.href}
                        className="entity-header__stat-link flex items-center hover:text-primary"
                      >
                        {stat.icon}
                        <span>{stat.text}</span>
                      </Link>
                    ) : (
                      <>
                        {stat.icon}
                        <span>{stat.text}</span>
                      </>
                    )}
                  </div>
                ))}

                {/* Only show mutual friends if user is logged in (mutual friends require a logged-in user to compare) */}
                {user && mutualFriendsCount !== undefined && mutualFriendsCount > 0 && (
                  <div className="entity-header__mutual-friends-item flex items-center text-muted-foreground">
                    <MutualFriendsDisplay
                      count={mutualFriendsCount}
                      variant="compact"
                    />
                  </div>
                )}

                {website && (
                  <div className="entity-header__website-item flex items-center text-muted-foreground">
                    <a
                      href={website.startsWith('http') ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="entity-header__website-link flex items-center app-text-link"
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      <span>Website</span>
                    </a>
                  </div>
                )}
              </div>

              <div
                ref={actionsContainerRef}
                className="entity-header__actions flex flex-wrap justify-center md:justify-start gap-2 mt-2 md:mt-0 shrink-0 md:flex-nowrap"
              >
                {renderActions()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="entity-header__nav border-t">
        <div className="entity-header__nav-container">
          <EntityTabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      </div>

      {/* Image Upload Modals */}
      {isEditable && (
        <>
          <EntityImageUpload
            entityId={entityType === 'group' ? group?.id || '' : entityId || ''}
            entityType={entityType}
            currentImageUrl={coverImage}
            onImageChange={(url) => setCoverImage(url)}
            type="entityHeaderCover"
            isOpen={isCoverModalOpen}
            onOpenChange={setIsCoverModalOpen}
          />
          <EntityImageUpload
            entityId={entityType === 'group' ? group?.id || '' : entityId || ''}
            entityType={entityType}
            currentImageUrl={avatarImage}
            onImageChange={(url) => setAvatarImage(url)}
            type="avatar"
            isOpen={isAvatarModalOpen}
            onOpenChange={setIsAvatarModalOpen}
          />
        </>
      )}

      {/* Crop Cover Image Modal - ImageCropper creates its own modal */}
      {isEditable && coverImage && isCropModalOpen && (
        <ImageCropper
          imageUrl={coverImage}
          aspectRatio={1344 / 500}
          targetWidth={1344}
          targetHeight={500}
          onCropComplete={handleCropCover}
          onCancel={handleCropCancel}
          isProcessing={isProcessing}
          title={entityType === 'book' ? 'Crop Page Cover' : 'Crop Entity Header Cover'}
          helpText="Adjust the crop area to frame your cover image"
        />
      )}

      {/* Crop Avatar Image Modal */}
      {isEditable && avatarImage && (
        <ReusableModal
          open={isAvatarCropModalOpen}
          onOpenChange={setIsAvatarCropModalOpen}
          title="Crop Avatar"
          contentClassName="max-w-4xl"
        >
          <ImageCropper
            imageUrl={avatarImage}
            aspectRatio={1}
            targetWidth={400}
            targetHeight={400}
            onCropComplete={handleCropAvatar}
            onCancel={handleAvatarCropCancel}
            isProcessing={isProcessing}
            circularCrop={true}
          />
        </ReusableModal>
      )}

      {children}
    </div>
  )
}
