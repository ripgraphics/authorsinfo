'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'

import { cn } from '@/lib/utils'
import { CloseButton } from './close-button'

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  // Detect if this is a large/full-screen modal by checking for flex-col or h-full in className
  const isLargeModal = className?.includes('flex flex-col') || className?.includes('h-full') || className?.includes('max-w-6xl') || className?.includes('max-w-7xl') || className?.includes('max-w-full')
  
  const baseClasses = isLargeModal
    ? // Large modal: use flex layout, centered with padding, no transform
      'fixed left-[50%] top-[50%] z-50 flex w-full translate-x-[-50%] translate-y-[-50%] border border-black bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg'
    : // Default modal: centered grid layout
      'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-black bg-background p-4 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg'

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(baseClasses, className)}
        {...props}
      >
        {children}
        {/* Close button - always shown by default using reusable CloseButton component */}
        {/* Hide with [&>button]:hidden in className when using a header with its own close button */}
        {!className?.includes('[&>button]:hidden') && (
          <DialogPrimitive.Close asChild>
            {/* CloseButton onClick is handled by DialogPrimitive.Close, pass no-op to satisfy prop requirement */}
            <CloseButton onClick={() => {}} className="absolute right-4 top-4 z-50" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  // DialogHeader supports both vertical (default) and horizontal layouts
  // Vertical: Title and description stacked (default)
  // Horizontal: Add "flex items-center justify-between" to className for title/actions layout
  const isHorizontalLayout = className?.includes('flex items-center justify-between') || className?.includes('justify-between')
  
  // Add right padding to prevent title from overlapping with close button (close button is ~48px wide: 32px button + 16px margin)
  // Only add padding for vertical layout (horizontal layouts handle spacing themselves)
  const baseClasses = isHorizontalLayout
    ? // Horizontal layout: title on left, actions on right (spacing handled by justify-between)
      'flex items-center justify-between'
    : // Default vertical layout: title and description stacked with padding to avoid close button
      'flex flex-col space-y-1.5 text-center sm:text-left pr-12'
  
  return <div className={cn(baseClasses, className)} {...props} />
}
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight pr-0', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
