import React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CloseButtonProps {
  onClick?: React.ComponentPropsWithoutRef<'button'>['onClick']
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'primary' | 'ghost'
  positioned?: boolean
  'aria-label'?: string
  type?: 'button' | 'submit' | 'reset'
}

export function CloseButton({
  onClick,
  className = '',
  size = 'md',
  variant = 'primary',
  positioned = true,
  'aria-label': ariaLabel = 'Close',
  type = 'button',
}: CloseButtonProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const variantClasses = {
    default: 'bg-gray-100 hover:bg-gray-200 text-gray-600',
    primary: 'bg-primary hover:bg-app-theme-blue text-primary-foreground',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-500',
  }

  return (
    <button
      type={type}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        positioned && 'absolute top-2 right-2',
        'inline-flex items-center justify-center p-1.5 rounded-full transition-all duration-200',
        'focus:outline-none',
        variantClasses[variant],
        className
      )}
    >
      <X className={cn(sizeClasses[size], 'transition-transform')} />
    </button>
  )
}
