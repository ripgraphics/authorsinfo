'use client'

import type { ComponentType, ReactNode } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconButton } from '@/components/ui/icon-button'
import { cn } from '@/lib/utils'

/**
 * Reusable dropdown trigger button for icon-based action menus.
 *
 * Wraps the common pattern used across the app: a DropdownMenu whose
 * trigger is a circular icon button (e.g. "more options" ellipsis,
 * notification bell, camera actions). Fully prop-driven — the icon,
 * label, size, tone, badge, menu alignment/width, and menu content
 * are all configurable, so it can replace the dozens of inline
 * DropdownMenu + Button + icon combinations throughout the codebase.
 */

export interface DropdownIconButtonProps {
  /** Lucide icon component rendered in the trigger button */
  icon: ComponentType<{ className?: string }>
  /** Accessible label for the trigger button */
  label: string
  /** Menu content — DropdownMenuItem / DropdownMenuSeparator / etc. */
  children: ReactNode
  /** Alignment of the dropdown content relative to the trigger */
  align?: 'start' | 'center' | 'end'
  /** Width class for the dropdown content (e.g. 'w-48') */
  contentClassName?: string
  /** Side the dropdown opens on */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Controlled open state */
  open?: boolean
  /** Called when the open state changes (controlled or uncontrolled) */
  onOpenChange?: (open: boolean) => void
  /** Disable the trigger button */
  disabled?: boolean
  /** Trigger size preset (see IconButton) */
  size?: 'sm' | 'md' | 'lg'
  /** Trigger color tone (see IconButton) */
  tone?: 'inherit' | 'muted'
  /** Optional badge on the trigger (e.g. unread count) */
  badge?: ReactNode
  /** Additional classes for the trigger button */
  className?: string
  /** Additional classes for the trigger icon */
  iconClassName?: string
}

export function DropdownIconButton({
  icon,
  label,
  children,
  align = 'end',
  contentClassName,
  side,
  open,
  onOpenChange,
  disabled,
  size = 'sm',
  tone = 'muted',
  badge,
  className,
  iconClassName,
}: DropdownIconButtonProps) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <IconButton
          icon={icon}
          label={label}
          disabled={disabled}
          size={size}
          tone={tone}
          badge={badge}
          className={className}
          iconClassName={iconClassName}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side={side}
        className={cn(contentClassName)}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
