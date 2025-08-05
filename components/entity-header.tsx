"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, BookOpen, Users, MapPin, Globe, User, MoreHorizontal, MessageSquare, UserPlus, Settings, Crop, Loader2 } from "lucide-react"
import Link from "next/link"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { AuthorHoverCard, PublisherHoverCard, GroupHoverCard, EventCreatorHoverCard } from "@/components/entity-hover-cards"
import { UserHoverCard } from "@/components/entity-hover-cards"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EntityHoverCard } from "@/components/entity-hover-cards"
import { GroupActions } from '@/components/group/GroupActions'
import { useGroupPermissions } from '@/hooks/useGroupPermissions'
import { useAuth } from '@/hooks/useAuth'
import { FollowButton } from '@/components/follow-button'
import { EntityImageUpload } from '@/components/entity/EntityImageUpload'
import { AddFriendButton } from '@/components/add-friend-button'
import { ImageCropper } from '@/components/ui/image-cropper'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { EntityTabs } from "@/components/ui/entity-tabs"

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
  tabs: TabConfig[]
  activeTab: string
  onTabChange: (tabId: string) => void
  children?: React.ReactNode
  className?: string
  onCoverImageChange?: () => void
  onProfileImageChange?: () => void
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
  tabs,
  activeTab,
  onTabChange,
  children,
  className,
  onCoverImageChange,
  onProfileImageChange,
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
}: EntityHeaderProps) {
  const { user } = useAuth()
  const groupPermissions = useGroupPermissions(group?.id || null, user?.id)
  const { isMember: isGroupMember, isAdmin } = groupPermissions
  const [groupMemberData, setGroupMemberData] = useState<any>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)
  const [isAvatarCropModalOpen, setIsAvatarCropModalOpen] = useState(false)
  const [coverImage, setCoverImage] = useState<string | undefined>(coverImageUrl)
  const [avatarImage, setAvatarImage] = useState<string | undefined>(profileImageUrl)
  const [isProcessing, setIsProcessing] = useState(false)
  const [imageVersion, setImageVersion] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    const fetchGroupMemberData = async () => {
      if (!creator || !group?.id) return;
      
      try {
        const response = await fetch(`/api/group-members?group_id=${group.id}&user_id=${creator.id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Group member data:', data);
        setGroupMemberData(data[0] || null); // Get first record if exists
      } catch (error) {
        console.error('Error fetching group member data:', error);
        setGroupMemberData(null);
      }
    };

    fetchGroupMemberData();
  }, [creator, group?.id]);

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
      
      // Get Cloudinary signature for signed upload
      const signatureResponse = await fetch('/api/cloudinary/signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folder: `${entityType}_entity_header_cover`
        })
      })

      if (!signatureResponse.ok) {
        throw new Error('Failed to get Cloudinary signature')
      }

      const signatureData = await signatureResponse.json()
      console.log('Signature data:', signatureData)

      // Create FormData for signed upload to Cloudinary
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', signatureData.apiKey)
      formData.append('timestamp', signatureData.timestamp.toString())
      formData.append('signature', signatureData.signature)
      formData.append('folder', signatureData.folder)
      formData.append('cloud_name', signatureData.cloudName)
      formData.append('quality', '95')
      formData.append('fetch_format', 'auto')

      console.log('FormData created, entries:')
      for (let [key, value] of formData.entries()) {
        console.log(key, value)
      }

      const uploadUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`
      console.log('Upload URL:', uploadUrl)

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      })

      console.log('Upload response status:', uploadResponse.status)
      console.log('Upload response ok:', uploadResponse.ok)
      console.log('Upload response headers:', Object.fromEntries(uploadResponse.headers.entries()))

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error('Cloudinary upload error response:', errorText)
        throw new Error(`Failed to upload to Cloudinary: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`)
      }

      const uploadResult = await uploadResponse.json()
      console.log('Upload result:', uploadResult)

      if (!uploadResult.secure_url) {
        throw new Error('No secure URL returned from Cloudinary')
      }

      // Insert into images table using server action
      const imageInsertResponse = await fetch('/api/insert-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: uploadResult.secure_url,
          alt_text: `Entity header cover for ${entityType} ${name}`,
          storage_provider: 'cloudinary',
          storage_path: `authorsinfo/${entityType}_entity_header_cover`,
          original_filename: file.name,
          file_size: file.size,
          mime_type: file.type
        })
      })

      if (!imageInsertResponse.ok) {
        const errorText = await imageInsertResponse.text()
        throw new Error(`Failed to insert image record: ${errorText}`)
      }

      const imageInsertResult = await imageInsertResponse.json()
      const imageData = imageInsertResult.data

      // Add image to entity album
      const albumType = entityType === 'book' ? 'book_entity_header_album' : 
                       entityType === 'author' ? 'author_entity_header_album' :
                       entityType === 'publisher' ? 'publisher_entity_header_album' :
                       entityType === 'event' ? 'event_entity_header_album' :
                       'user_gallery_album'

      const albumResponse = await fetch('/api/entity-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityId: entityId || '',
          entityType: entityType,
          albumType: albumType,
          imageId: imageData.id,
          isCover: true,
          isFeatured: true,
          metadata: {
            aspect_ratio: 16/9,
            uploaded_via: 'entity_header',
            original_filename: file.name,
            file_size: file.size
          }
        })
      })

      if (!albumResponse.ok) {
        const errorText = await albumResponse.text()
        console.error('Failed to add image to album:', errorText)
        // Don't throw error here, just log it
      }

      // Update local state with the new image URL
      setCoverImage(uploadResult.secure_url)
      setImageVersion(prev => prev + 1)
      setIsCropModalOpen(false)

      // Call the onCoverImageChange callback if provided
      if (onCoverImageChange) {
        onCoverImageChange()
      }

      // Show success message
      toast({
        title: "Success",
        description: `${entityType} entity header cover has been updated successfully and added to album.`
      })

    } catch (error: any) {
      console.error('Error uploading cropped image:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload cropped image. Please try again.",
        variant: "destructive"
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
      
      // Get Cloudinary signature for signed upload
      const signatureResponse = await fetch('/api/cloudinary/signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folder: `${entityType}_entity_header_avatar`
        })
      })

      if (!signatureResponse.ok) {
        throw new Error('Failed to get Cloudinary signature')
      }

      const signatureData = await signatureResponse.json()
      console.log('Signature data:', signatureData)

      // Create FormData for signed upload to Cloudinary
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', signatureData.apiKey)
      formData.append('timestamp', signatureData.timestamp.toString())
      formData.append('signature', signatureData.signature)
      formData.append('folder', signatureData.folder)
      formData.append('cloud_name', signatureData.cloudName)
      formData.append('quality', '95')
      formData.append('fetch_format', 'auto')

      console.log('FormData created, entries:')
      for (let [key, value] of formData.entries()) {
        console.log(key, value)
      }

      const uploadUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`
      console.log('Upload URL:', uploadUrl)

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      })

      console.log('Upload response status:', uploadResponse.status)
      console.log('Upload response ok:', uploadResponse.ok)
      console.log('Upload response headers:', Object.fromEntries(uploadResponse.headers.entries()))

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error('Cloudinary upload error response:', errorText)
        throw new Error(`Failed to upload to Cloudinary: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`)
      }

      const uploadResult = await uploadResponse.json()
      console.log('Upload result:', uploadResult)

      if (!uploadResult.secure_url) {
        throw new Error('No secure URL returned from Cloudinary')
      }

      // Insert into images table using server action
      const imageInsertResponse = await fetch('/api/insert-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: uploadResult.secure_url,
          alt_text: `Entity header avatar for ${entityType} ${name}`,
          storage_provider: 'cloudinary',
          storage_path: `authorsinfo/${entityType}_entity_header_avatar`,
          original_filename: file.name,
          file_size: file.size,
          mime_type: file.type
        })
      })

      if (!imageInsertResponse.ok) {
        const errorText = await imageInsertResponse.text()
        throw new Error(`Failed to insert image record: ${errorText}`)
      }

      const imageInsertResult = await imageInsertResponse.json()
      const imageData = imageInsertResult.data

      // Add image to entity album
      const albumType = entityType === 'book' ? 'book_avatar_album' : 
                       entityType === 'author' ? 'author_avatar_album' :
                       entityType === 'publisher' ? 'publisher_avatar_album' : 'user_avatar_album'

      const albumResponse = await fetch('/api/entity-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityId: entityId || '',
          entityType: entityType,
          albumType: albumType,
          imageId: imageData.id,
          isCover: true,
          isFeatured: true,
          metadata: {
            aspect_ratio: 1,
            uploaded_via: 'entity_header',
            original_filename: file.name,
            file_size: file.size
          }
        })
      })

      if (!albumResponse.ok) {
        const errorText = await albumResponse.text()
        console.error('Failed to add image to album:', errorText)
        // Don't throw error here, just log it
      }

      // Update local state with the new image URL
      setAvatarImage(uploadResult.secure_url)
      setImageVersion(prev => prev + 1)
      setIsAvatarCropModalOpen(false)

      // Call the onProfileImageChange callback if provided
      if (onProfileImageChange) {
        onProfileImageChange()
      }

      // Show success message
      toast({
        title: "Success",
        description: `${entityType} entity header avatar has been updated successfully and added to album.`
      })

    } catch (error: any) {
      console.error('Error uploading cropped avatar:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload cropped avatar. Please try again.",
        variant: "destructive"
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
      <h1 className="entity-header__title text-base sm:text-[1.1rem] font-bold truncate">{name}</h1>
    )

    switch (entityType) {
      case 'author':
        return author ? (
          <EntityHoverCard
            type="author"
            entity={{
              id: author.id,
              name: author.name,
              author_image: author.author_image,
              bookCount: authorBookCount
            }}
          >
            <span className="entity-header__author-name text-muted-foreground">{author.name}</span>
          </EntityHoverCard>
        ) : nameElement
      case 'publisher':
        return publisher ? (
          <EntityHoverCard
            type="publisher"
            entity={{
              id: publisher.id,
              name: publisher.name,
              publisher_image: publisher.publisher_image,
              logo_url: publisher.publisher_image?.url,
              bookCount: publisherBookCount
            }}
          >
            <span className="entity-header__publisher-name text-muted-foreground">{publisher.name}</span>
          </EntityHoverCard>
        ) : nameElement
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
              event_count: eventCreator.event_count
            }}
          >
            <span className="entity-header__event-creator-name text-muted-foreground">{eventCreator.name}</span>
          </EntityHoverCard>
        ) : nameElement
      default:
        return nameElement
    }
  }

  const renderCreatorInfo = () => {
    if (!creator) return creatorName;
    
    return (
      <EntityHoverCard
        type="group"
        entity={{
          id: creator.id,
          name: creator.name,
          group_image: {
            url: `/api/avatar/${creator.id}`
          },
          joined_at: groupMemberData?.joined_at || creatorJoinedAt
        }}
      >
        <span className="entity-header__creator-link cursor-pointer">{creatorName}</span>
      </EntityHoverCard>
    );
  };

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
                  <Link href={`/groups/${group.id}/edit`} className="entity-header__edit-group-link flex items-center">
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
        {/* Add Friend button for user profiles */}
        {entityType === 'user' && entityId && (
          <AddFriendButton
            targetUserId={entityId}
            targetUserName={name}
            className="entity-header__add-friend-button flex items-center"
            variant="outline"
            size="sm"
          />
        )}
        {isMessageable && onMessage && (
          <Button className="entity-header__message-button flex items-center" onClick={onMessage}>
            <MessageSquare className="h-4 w-4 mr-2" />
            <span className="entity-header__message-text hidden sm:inline">Message</span>
          </Button>
        )}
        {entityId && targetType && (
          <FollowButton
            entityId={entityId}
            targetType={targetType}
            entityName={name}
            variant={isFollowing ? "outline" : "default"} 
            className="entity-header__follow-button flex items-center"
            onFollowChange={onFollow}
          />
        )}
        {!isEditable && (
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </>
    )
  }

  const renderCoverImage = () => {
    if (!coverImage && !isEditable) return null

    // Add cache-busting parameter to force image reload
    const imageUrl = coverImage ? `${coverImage}?t=${imageVersion}` : ''

    return (
      <div className="entity-header__cover-container relative w-full aspect-[1344/500] bg-muted">
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
        {isEditable && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            {coverImage && (
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:text-accent-foreground h-9 rounded-md px-3 entity-header__crop-cover-button bg-white/80 hover:bg-white"
                onClick={() => setIsCropModalOpen(true)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crop className="h-4 w-4 mr-2" />
                    Crop
                  </>
                )}
              </button>
            )}
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:text-accent-foreground h-9 rounded-md px-3 entity-header__cover-image-button bg-white/80 hover:bg-white"
              onClick={() => setIsCoverModalOpen(true)}
            >
              <Camera className="h-4 w-4 mr-2" />
              Change Cover
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderAvatar = () => {
    return (
      <div className="entity-header__avatar-container relative">
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
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:text-accent-foreground entity-header__avatar-button absolute bottom-2 right-2 rounded-full h-8 w-8 bg-white/80 hover:bg-white"
              >
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
    <div className={cn("entity-header bg-white rounded-lg shadow overflow-hidden mb-6", className)}>
      {/* Cover Image */}
      {renderCoverImage()}

      {/* Header Content */}
      <div className="entity-header__content px-6 pb-6">
        <div className="entity-header__profile-section flex flex-col md:flex-row md:items-end relative z-10">
          {/* Profile Image - Only this should go outside the container */}
          <div className="entity-header__avatar-container relative" style={{ transform: 'translateY(-40px)' }}>
            {renderAvatar()}
          </div>

          {/* Entity Info - This should stay within the container */}
          <div className="entity-header__info mt-6 md:ml-6 flex-1">
            <div className="entity-header__info-layout flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="entity-header__info-content max-w-full md:max-w-[calc(100%-240px)] min-w-0">
                {renderEntityName()}
                {entityType === 'group' && creatorName && (
                  <div className="entity-header__creator-info text-muted-foreground truncate text-sm">
                    Created by{" "}
                    {renderCreatorInfo()}
                  </div>
                )}
                {username && (
                  <div className="entity-header__username text-muted-foreground truncate text-sm">
                    {typeof username === 'string' 
                      ? (username.startsWith('@') || username.startsWith('by ') ? username : `@${username}`)
                      : username
                    }
                  </div>
                )}
                {description && (
                  <p className="entity-header__description text-muted-foreground mt-1 line-clamp-2">{description}</p>
                )}
              </div>
            </div>

            {/* Stats and Info */}
            <div className="entity-header__stats-container flex flex-wrap justify-between items-baseline gap-x-6 gap-y-2 mt-4">
              <div className="entity-header__stats-group flex flex-wrap gap-x-6 gap-y-2">
                {stats.map((stat, index) => (
                  <div key={index} className="entity-header__stat-item flex items-center text-muted-foreground">
                    {stat.href ? (
                      <Link href={stat.href} className="entity-header__stat-link flex items-center hover:text-primary">
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
                
                {location && (
                  <div className="entity-header__location-item flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{location}</span>
                  </div>
                )}
                
                {website && (
                  <div className="entity-header__website-item flex items-center text-muted-foreground">
                    <a
                      href={website.startsWith('http') ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="entity-header__website-link flex items-center hover:text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      <span>Website</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="entity-header__actions flex flex-wrap gap-2 mt-2 md:mt-0 shrink-0 md:flex-nowrap">
                {renderActions()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="entity-header__nav border-t">
        <div className="entity-header__nav-container">
          <EntityTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
        </div>
      </div>

      {/* Image Upload Modals */}
      {isEditable && (
        <>
          <EntityImageUpload
            entityId={entityType === 'group' ? group?.id || '' : name}
            entityType={entityType}
            currentImageUrl={coverImage}
            onImageChange={setCoverImage}
            type="cover"
            isOpen={isCoverModalOpen}
            onOpenChange={setIsCoverModalOpen}
          />
          <EntityImageUpload
            entityId={entityType === 'group' ? group?.id || '' : name}
            entityType={entityType}
            currentImageUrl={avatarImage}
            onImageChange={setAvatarImage}
            type="avatar"
            isOpen={isAvatarModalOpen}
            onOpenChange={setIsAvatarModalOpen}
          />
        </>
      )}

      {/* Crop Cover Image Modal */}
      {isEditable && coverImage && (
        <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Crop Entity Header Cover</DialogTitle>
            </DialogHeader>
            <ImageCropper
              imageUrl={coverImage}
              aspectRatio={1344 / 500}
              onCropComplete={handleCropCover}
              onCancel={handleCropCancel}
              isProcessing={isProcessing}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Crop Avatar Image Modal */}
      {isEditable && avatarImage && (
        <Dialog open={isAvatarCropModalOpen} onOpenChange={setIsAvatarCropModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Crop Avatar</DialogTitle>
            </DialogHeader>
            <ImageCropper
              imageUrl={avatarImage}
              aspectRatio={1}
              targetWidth={400}
              targetHeight={400}
              onCropComplete={handleCropAvatar}
              onCancel={handleAvatarCropCancel}
              isProcessing={isProcessing}
            />
          </DialogContent>
        </Dialog>
      )}

      {children}
    </div>
  )
}