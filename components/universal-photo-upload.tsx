'use client'

import { Button } from '@/components/ui/button'
import { Camera } from 'lucide-react'

export type EntityType = 'user' | 'publisher' | 'author' | 'group' | 'book' | 'event' | 'content'

interface UniversalPhotoUploadProps {
  entityId: string
  entityType: EntityType
  albumId?: string
  onUploadComplete?: (photoIds: string[]) => void
  onUploadStart?: () => void
  onUploadError?: (error: Error) => void
  maxFiles?: number
  allowedTypes?: string[]
  maxFileSize?: number
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  buttonText?: string
  disabled?: boolean
  isOwner?: boolean
}

export function UniversalPhotoUpload({
  entityId,
  entityType,
  onUploadComplete,
  buttonText = 'Add Photo',
  variant = 'outline',
  size = 'sm',
  showIcon = true,
  disabled = false,
  className = '',
}: UniversalPhotoUploadProps) {
  const handleClick = () => {
    // Placeholder implementation
    console.log('Photo upload clicked for', entityType, entityId)
    onUploadComplete?.([])
  }

  return (
    <Button
      variant={variant}
      size={size === 'md' ? 'default' : size}
      onClick={handleClick}
      disabled={disabled}
      className={className}
    >
      {showIcon && <Camera className="h-4 w-4 mr-2" />}
      {buttonText}
    </Button>
  )
}
