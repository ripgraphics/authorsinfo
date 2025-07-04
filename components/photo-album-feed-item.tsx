import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/hooks/useAuth'
import { PhotoGallery } from './photo-gallery'
import { 
  Heart, 
  Share2, 
  MessageCircle, 
  Eye, 
  Users, 
  Globe, 
  Image as ImageIcon,
  Calendar,
  MoreHorizontal
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface PhotoAlbumFeedItemProps {
  activity: {
    id: string
    user_id: string
    activity_type: string
    entity_type: string
    entity_id: string
    created_at: string
    metadata: {
      album_name: string
      album_description?: string
      privacy_level: string
    }
    user: {
      id: string
      name: string
      avatar_url?: string
    }
  }
  onLike?: (activityId: string) => void
  onShare?: (activityId: string) => void
  onComment?: (activityId: string) => void
}

export function PhotoAlbumFeedItem({ 
  activity, 
  onLike, 
  onShare, 
  onComment 
}: PhotoAlbumFeedItemProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [showAlbum, setShowAlbum] = useState(false)
  const [albumData, setAlbumData] = useState<any>(null)
  const [isLoadingAlbum, setIsLoadingAlbum] = useState(false)
  
  const { user } = useAuth()
  const supabase = createClientComponentClient()

  const handleLike = async () => {
    if (!user) return

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('activity_likes')
          .delete()
          .eq('activity_id', activity.id)
          .eq('user_id', user.id)
        
        setLikeCount(prev => Math.max(0, prev - 1))
        setIsLiked(false)
      } else {
        // Like
        await supabase
          .from('activity_likes')
          .insert({
            activity_id: activity.id,
            user_id: user.id
          })
        
        setLikeCount(prev => prev + 1)
        setIsLiked(true)
      }

      onLike?.(activity.id)
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/albums/${activity.entity_id}`
      await navigator.clipboard.writeText(shareUrl)
      
      // You could show a toast notification here
      console.log('Album link copied to clipboard')
      
      onShare?.(activity.id)
    } catch (error) {
      console.error('Error sharing album:', error)
    }
  }

  const handleViewAlbum = async () => {
    setIsLoadingAlbum(true)
    try {
      // Load album data
      const { data: album, error } = await supabase
        .from('photo_albums')
        .select(`
          id,
          name,
          description,
          is_public,
          cover_image_id,
          created_at,
          metadata,
          album_images(
            id,
            images(
              id,
              url,
              thumbnail_url
            )
          )
        `)
        .eq('id', activity.entity_id)
        .single()

      if (error) throw error
      setAlbumData(album)
      setShowAlbum(true)
    } catch (error) {
      console.error('Error loading album:', error)
    } finally {
      setIsLoadingAlbum(false)
    }
  }

  const getPrivacyIcon = () => {
    const privacyLevel = activity.metadata?.privacy_level || 'public'
    
    switch (privacyLevel) {
      case 'public':
        return <Globe className="h-4 w-4" />
      case 'friends':
        return <Users className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  const getPrivacyLabel = () => {
    const privacyLevel = activity.metadata?.privacy_level || 'public'
    
    switch (privacyLevel) {
      case 'public':
        return 'Public'
      case 'friends':
        return 'Friends Only'
      default:
        return 'Public'
    }
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={activity.user.avatar_url} alt={activity.user.name} />
              <AvatarFallback>
                {activity.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Link 
                  href={`/profile/${activity.user.id}`}
                  className="font-semibold hover:underline"
                >
                  {activity.user.name}
                </Link>
                <span className="text-muted-foreground">created a photo album</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  {getPrivacyIcon()}
                  {getPrivacyLabel()}
                </Badge>
              </div>
            </div>

            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Album Preview */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{activity.metadata.album_name}</h3>
                {activity.metadata.album_description && (
                  <p className="text-muted-foreground text-sm">
                    {activity.metadata.album_description}
                  </p>
                )}
              </div>
            </div>

            {/* Album Cover Preview */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              {albumData?.album_images?.[0]?.images?.url ? (
                <Image
                  src={albumData.album_images[0].images.url}
                  alt={activity.metadata.album_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Button
                  variant="secondary"
                  onClick={handleViewAlbum}
                  disabled={isLoadingAlbum}
                >
                  {isLoadingAlbum ? 'Loading...' : 'View Album'}
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`flex items-center space-x-1 ${
                  isLiked ? 'text-red-500' : 'text-muted-foreground'
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likeCount}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onComment?.(activity.id)}
                className="flex items-center space-x-1 text-muted-foreground"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Comment</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="flex items-center space-x-1 text-muted-foreground"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleViewAlbum}
              disabled={isLoadingAlbum}
            >
              <Eye className="h-4 w-4 mr-1" />
              View Album
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Album Viewer Modal */}
      {showAlbum && albumData && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg w-full max-w-6xl h-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-xl font-semibold">{albumData.name}</h2>
                {albumData.description && (
                  <p className="text-muted-foreground">{albumData.description}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Created by {activity.user.name} • {formatDistanceToNow(new Date(albumData.created_at), { addSuffix: true })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAlbum(false)}
              >
                ×
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <PhotoGallery
                albumId={albumData.id}
                entityType="user"
                entityId={activity.user_id}
                isEditable={false}
                showHeader={false}
                maxImages={50}
                gridCols={4}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
} 