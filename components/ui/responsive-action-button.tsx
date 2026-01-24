'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ResponsiveActionButtonProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Button>, 'children'> {
  icon: React.ReactNode
  label: string
  tooltip?: string
  compact?: boolean
  href?: string
  asChild?: boolean
}

/**
 * ResponsiveActionButton - A button that switches between full and icon-only modes
 * 
 * When compact is true, shows only the icon with a tooltip
 * When compact is false, shows icon + label text
 */
export function ResponsiveActionButton({
  icon,
  label,
  tooltip,
  compact = false,
  href,
  asChild,
  className,
  size = 'sm',
  variant = 'outline',
  ...buttonProps
}: ResponsiveActionButtonProps) {
  const tooltipText = tooltip || label

  // Data attributes for overflow detection hook
  const buttonDataAttrs = {
    'data-button-label': label,
    'data-button-variant': variant,
    'data-button-has-icon': 'true',
  }

  // If href is provided, render as Link
  if (href) {
    if (compact) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={variant}
                size={size === 'sm' ? 'icon' : size}
                className={cn('h-9 w-9', className)}
                asChild
                {...buttonDataAttrs}
                {...buttonProps}
              >
                <Link href={href}>{icon}</Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return (
      <Button variant={variant} size={size} className={className} asChild {...buttonDataAttrs} {...buttonProps}>
        <Link href={href}>
          {icon}
          <span className="ml-2">{label}</span>
        </Link>
      </Button>
    )
  }

  // Regular button (no href)
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size === 'sm' ? 'icon' : size}
              className={cn('h-9 w-9', className)}
              {...buttonDataAttrs}
              {...buttonProps}
            >
              {icon}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Button variant={variant} size={size} className={className} {...buttonDataAttrs} {...buttonProps}>
      {icon}
      <span className="ml-2">{label}</span>
    </Button>
  )
}
