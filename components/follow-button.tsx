'use client'

import FollowButtonComponent from './FollowButton'

interface FollowButtonProps {
  entityId: string | number
  targetType: 'user' | 'book' | 'author' | 'publisher' | 'group'
  entityName?: string
  variant?: 'default' | 'outline'
  className?: string
  onFollowChange?: () => void
}

export function FollowButton({
  entityId,
  targetType,
  entityName,
  variant = 'default',
  className = '',
  onFollowChange,
}: FollowButtonProps) {
  return (
    <FollowButtonComponent
      entityId={entityId}
      targetType={targetType}
      entityName={entityName}
      variant={variant}
      className={className}
    />
  )
}
