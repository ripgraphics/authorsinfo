'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { EntityHoverCard } from '@/components/entity-hover-cards'
import { AddToShelfButton } from '@/components/add-to-shelf-button'

interface BookCardProps {
  id: string
  title: string
  coverImageUrl?: string
  className?: string
  author?: {
    id: string
    name: string
    author_image?: {
      url: string
    }
  }
  authorBookCount?: number
  readingProgress?: {
    status: string
    progress_percentage?: number | null
    percentage?: number | null
    current_page?: number | null
    total_pages?: number | null
  }
}

export function BookCard({
  id,
  title,
  coverImageUrl,
  className = '',
  author,
  authorBookCount = 0,
  readingProgress,
}: BookCardProps) {
  return (
    <div className="group relative h-full">
      <Link href={`/books/${id}`} className="block h-full">
        <Card className={`overflow-hidden h-full transition-transform hover:scale-105 ${className}`}>
          {/* Image container with 2:3 aspect ratio */}
          <div className="relative w-full" style={{ aspectRatio: '2/3' }}>
            {coverImageUrl ? (
              <Image
                src={coverImageUrl || '/placeholder.svg'}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f8fAARNAf/5H5H6AAAAAElFTkSuQmCC"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="p-3 text-center">
            <h3 className="font-medium text-sm line-clamp-1">{title}</h3>
            {author && (
              <div className="text-xs text-muted-foreground mt-1">
                by{' '}
                <EntityHoverCard
                  type="author"
                  entity={{
                    id: author.id,
                    name: author.name,
                    author_image: author.author_image,
                    bookCount: authorBookCount,
                  }}
                >
                  <span className="hover:underline cursor-pointer">{author.name}</span>
                </EntityHoverCard>
              </div>
            )}
            {readingProgress?.status === 'in_progress' && (() => {
              const percentage = readingProgress.progress_percentage ?? readingProgress.percentage
              const hasPercentage = percentage !== null && percentage !== undefined
              const hasPageInfo =
                readingProgress.current_page !== null &&
                readingProgress.current_page !== undefined &&
                readingProgress.total_pages !== null &&
                readingProgress.total_pages !== undefined
              
              if (!hasPercentage && !hasPageInfo) return null
              
              return (
                <div className="mt-2 space-y-1">
                  {(hasPercentage || hasPageInfo) && (
                    <div className="text-xs text-muted-foreground">
                      {(() => {
                        const parts: string[] = []
                        if (hasPercentage) {
                          parts.push(`${Math.round(percentage!)}%`)
                        }
                        if (hasPageInfo) {
                          parts.push(`Page ${readingProgress.current_page} of ${readingProgress.total_pages}`)
                        }
                        return parts.join(' · ')
                      })()}
                    </div>
                  )}
                  {hasPercentage && (
                    <Progress value={Math.round(percentage!)} className="h-1.5" />
                  )}
                </div>
              )
            })()}
          </div>
        </Card>
      </Link>
      
      {/* Add to Shelf Button - Overlay */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <AddToShelfButton 
          bookId={id} 
          size="icon" 
          variant="secondary" 
          className="h-8 w-8 rounded-full shadow-md"
        />
      </div>
    </div>
  )
}
