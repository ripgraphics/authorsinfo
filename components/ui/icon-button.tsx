'use client'

import type { ComponentType, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Reusable circular icon button used for compact action rows
 * (e.g. chat headers, card overlays, toolbars).
 *
 * Renders a small circular ghost button with a centered icon and
 * optional badge. Fully prop-driven: icon, label, handler, size,
 * tone, and badge are all configurable so it can be reused anywhere.
 */

export interface IconButtonProps {
  /** Lucide icon component to render inside the button */
  icon: ComponentType<{ className?: string }>
  /** Accessible label; also used as the native tooltip */
  label: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  /**
   * Visual size preset.
   * - sm: 28px circle, 16px icon (chat header default)
   * - md: 36px circle, 18px icon
   * - lg: 40px circle, 20px icon (shadcn icon size)
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Color tone for the icon and hover background.
   * - inherit: uses the parent's text color (for colored headers)
   * - muted: standard muted foreground on default background
   */
  tone?: 'inherit' | 'muted'
  /** Optional badge content (e.g. unread count) rendered top-right */
  badge?: ReactNode
  /** Additional classes merged onto the button */
  className?: string
  /** Additional classes merged onto the icon */
  iconClassName?: string
}

const sizeMap = {
  sm: { button: 'h-7 w-7', icon: 'h-4 w-4' },
  md: { button: 'h-9 w-9', icon: 'h-[18px] w-[18px]' },
  lg: { button: 'h-10 w-10', icon: 'h-5 w-5' },
} as const

const toneMap = {
  inherit: 'text-inherit hover:bg-primary-foreground/20',
  muted: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
} as const

export function IconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  type = 'button',
  size = 'sm',
  tone = 'inherit',
  badge,
  className,
  iconClassName,
}: IconButtonProps) {
  const sizeClasses = sizeMap[size]
  return (
    <Button
      type={type}
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'relative rounded-full p-0',
        sizeClasses.button,
        toneMap[tone],
        badge !== undefined && badge !== null && 'badge-host',
        className
      )}
    >
      <Icon className={cn(sizeClasses.icon, iconClassName)} />
      {badge !== undefined && badge !== null ? (
        <span
          aria-hidden="true"
          className={cn(
            'absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold text-destructive-foreground'
          )}
        >
          {badge}
        </span>
      ) : null}
    </Button>
  )
}
