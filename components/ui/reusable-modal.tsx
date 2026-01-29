'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const CONTENT_CLASS =
  'flex flex-col max-h-[85vh] overflow-hidden max-w-[500px] p-0'
const HEADER_CLASS = 'flex-shrink-0 px-4 pt-4 pb-2 border-b'
const TITLE_CLASS = 'flex-1 text-center text-xl font-semibold'
const BODY_CLASS = 'flex-1 min-h-0 overflow-y-auto'
const BODY_INNER_CLASS = 'px-4 pb-4 pt-2'
const FOOTER_CLASS = 'flex-shrink-0 pt-4 pb-4 px-4 border-t'

export interface ReusableModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string | React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  contentClassName?: string
  titleClassName?: string
  /** When true, header (title + description) is not rendered; use for minimal chrome (e.g. command palette). */
  hideHeader?: boolean
  /** Optional left slot in header (e.g. Back button); when not provided, spacer is used. */
  headerLeft?: React.ReactNode
  /** Optional right slot in header; when not provided, spacer is used. */
  headerRight?: React.ReactNode
}

/**
 * Reusable modal that enforces the Create Post / Add to Shelf layout and styling
 * for consistent appearance across the app.
 */
export function ReusableModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  contentClassName,
  titleClassName,
  hideHeader = false,
  headerLeft,
  headerRight,
}: ReusableModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(CONTENT_CLASS, contentClassName)}
      >
        {!hideHeader && (
          <DialogHeader className={HEADER_CLASS}>
            <div className="flex items-center justify-between">
              {headerLeft ?? <div className="h-8 w-8 flex-shrink-0" aria-hidden="true" />}
              <DialogTitle
                className={cn(TITLE_CLASS, titleClassName)}
              >
                {title}
              </DialogTitle>
              {headerRight ?? <div className="h-8 w-8 flex-shrink-0" aria-hidden="true" />}
            </div>
          </DialogHeader>
        )}

        <div className={BODY_CLASS}>
          <div className={hideHeader ? 'flex flex-col min-h-0 overflow-hidden' : BODY_INNER_CLASS}>
            {!hideHeader && description != null && (
              <DialogDescription className="pb-2">
                {typeof description === 'string' ? description : description}
              </DialogDescription>
            )}
            {children}
          </div>
        </div>

        {footer != null && (
          <DialogFooter
            className={cn(
              'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
              FOOTER_CLASS
            )}
          >
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
