'use client'

import FollowButtonComponent from './FollowButton'

interface FollowButtonProps {
  entityId: string | number
  targetType: 'user' | 'book' | 'author' | 'publisher' | 'group'
  entityName?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showIcon?: boolean
  showText?: boolean
  disabled?: boolean
  onFollowChange?: () => void
}

export function FollowButton({
  entityId,
  targetType,
  entityName,
  variant = 'default',
  size,
  className = '',
  showIcon,
  showText,
  disabled,
  onFollowChange,
}: FollowButtonProps) {
  return (
    <FollowButtonComponent
      entityId={entityId}
      targetType={targetType}
      entityName={entityName}
      variant={variant}
      size={size}
      className={className}
      showIcon={showIcon}
      showText={showText}
      disabled={disabled}
    />
  )
}
