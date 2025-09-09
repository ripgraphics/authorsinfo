'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Send } from 'lucide-react'

export interface PostButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
  icon?: React.ReactNode
  loading?: boolean
  sizeClassName?: string
}

export function PostButton({
  label = 'Post',
  icon,
  loading = false,
  className,
  disabled,
  sizeClassName = 'h-8 px-4 text-xs',
  ...props
}: PostButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Button
      {...props}
      disabled={isDisabled}
      className={cn(sizeClassName, className)}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
          Posting...
        </>
      ) : (
        <>
          <span className="mr-2 flex items-center">
            {icon ?? <Send className="h-3 w-3" />}
          </span>
          {label}
        </>
      )}
    </Button>
  )
}

export default PostButton


