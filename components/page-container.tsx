import React from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className, ...props }: PageContainerProps) {
  return (
    <div
      className={cn(
        'container mx-auto px-4 max-w-7xl py-8', // Base padding and container
        'min-h-[calc(100vh-4rem)]', // Account for header height
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
