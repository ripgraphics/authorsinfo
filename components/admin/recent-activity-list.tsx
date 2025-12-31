import type React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface RecentActivityListProps {
  title: string
  description?: string
  items: {
    id: string
    title: string
    subtitle?: string
    timestamp: string
    icon?: React.ReactNode
  }[]
  className?: string
  emptyMessage?: string
}

export function RecentActivityList({
  title,
  description,
  items,
  className,
  emptyMessage = 'No recent activity',
}: RecentActivityListProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-start space-x-4">
                {item.icon && (
                  <div className="mt-0.5">
                    <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                      {item.icon}
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{item.title}</p>
                  {item.subtitle && (
                    <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-muted-foreground">{emptyMessage}</div>
        )}
      </CardContent>
    </Card>
  )
}
