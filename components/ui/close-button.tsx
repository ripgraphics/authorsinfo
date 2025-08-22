import React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CloseButtonProps {
  onClick: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'primary' | 'ghost'
}

export function CloseButton({
  onClick,
  className = '',
  size = 'md',
  variant = 'primary'
}: CloseButtonProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const variantClasses = {
    default: 'bg-gray-100 hover:bg-gray-200 text-gray-600',
    primary: 'bg-primary hover:bg-[#40A3D8] text-primary-foreground',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-500'
  }

  return (
    <button
      aria-label="Close"
      role="button"
      tabIndex={0}
      onClick={onClick}
      className={cn(
        'absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200',
        'focus:outline-none',
        variantClasses[variant],
        className
      )}
    >
      <X className={cn(sizeClasses[size], 'transition-transform')} />
    </button>
  )
} 