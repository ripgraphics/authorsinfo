'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { ContentSection } from '@/components/ui/content-section'
import { Card, CardContent } from '@/components/ui/card'
import { ReactNode } from 'react'

export interface CurrentlyReadingBook {
  id: string
  title: string
  coverImageUrl: string | null
  author: {
    id: string
    name: string
  } | null
  // Support both field names for backward compatibility
  progress_percentage?: number | null
  percentage?: number | null
  currentPage?: number | null
  totalPages?: number | null
  // Optional user info for author pages
  user?: {
    id: string
    name: string
    avatarUrl: string | null
  } | null
  // Optional permalink for custom URL generation
  permalink?: string | null
}

interface CurrentlyReadingSectionProps {
  books: CurrentlyReadingBook[]
  title?: string
  viewMoreLink?: string
  viewMoreText?: string
  emptyMessage?: string
  maxBooks?: number
  // Use Card wrapper instead of ContentSection (for author pages)
  useCardWrapper?: boolean
  className?: string
  // Custom wrapper component (fully reusable)
  wrapperComponent?: React.ComponentType<{
    title?: string
    viewMoreLink?: string
    viewMoreText?: string
    children: ReactNode
    className?: string
  }>
  // Custom book link generator function
  getBookLink?: (book: CurrentlyReadingBook) => string
  // Customizable text labels
  labels?: {
    progress?: string
    pageOf?: string
    authorPrefix?: string
  }
  // Custom book item renderer (fully customizable)
  renderBookItem?: (book: CurrentlyReadingBook, progressPercentage: number | null) => ReactNode
  // Custom styling
  bookItemClassName?: string
  coverImageClassName?: string
  progressBarClassName?: string
}

export function CurrentlyReadingSection({
  books,
  title = 'Currently Reading',
  viewMoreLink,
  viewMoreText = 'See All',
  emptyMessage,
  maxBooks = 3,
  useCardWrapper = false,
  className,
  wrapperComponent: CustomWrapper,
  getBookLink,
  labels = {},
  renderBookItem: customRenderBookItem,
  bookItemClassName = '',
  coverImageClassName = '',
  progressBarClassName = '',
}: CurrentlyReadingSectionProps) {
  const displayBooks = books.slice(0, maxBooks)
  
  // Default labels with customizable overrides
  const defaultLabels = {
    progress: 'Progress',
    pageOf: 'Page',
    authorPrefix: 'by',
    ...labels,
  }
  
  // Default book link generator - supports permalinks
  const defaultGetBookLink = (book: CurrentlyReadingBook): string => {
    if (book.permalink) {
      return `/books/${book.permalink}`
    }
    return `/books/${book.id}`
  }
  
  const getBookUrl = getBookLink || defaultGetBookLink
  
  // Determine progress percentage - support both field names
  const getProgressPercentage = (book: CurrentlyReadingBook): number | null => {
    // Check progress_percentage first (profile page format)
    if (typeof book.progress_percentage === 'number') {
      return book.progress_percentage
    }
    // Check percentage (author page format)
    if (typeof book.percentage === 'number') {
      return book.percentage
    }
    return null
  }

  // Default book item renderer - fully customizable via props
  const defaultRenderBookItem = (book: CurrentlyReadingBook) => {
    const progressPercentage = getProgressPercentage(book)
    const bookUrl = getBookUrl(book)

    return (
      <Link key={book.id} href={bookUrl} className={`block ${bookItemClassName}`}>
        <div className="flex gap-3">
          <div className={`relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-md ${coverImageClassName}`}>
            {book.coverImageUrl ? (
              <Image
                src={book.coverImageUrl}
                alt={book.title}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="font-medium line-clamp-1">{book.title}</h4>
            {book.author && (
              <p className="text-sm text-muted-foreground">
                {defaultLabels.authorPrefix} {book.author.name}
              </p>
            )}
            {typeof progressPercentage === 'number' && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{defaultLabels.progress}</span>
                  <span>{progressPercentage}%</span>
                </div>
                <div className={`relative w-full overflow-hidden rounded-full bg-secondary h-1.5 ${progressBarClassName}`}>
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                {book.currentPage !== null && book.totalPages !== null && (
                  <p className="text-xs text-muted-foreground">
                    {defaultLabels.pageOf} {book.currentPage} of {book.totalPages}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    )
  }

  const renderBookItem = customRenderBookItem 
    ? (book: CurrentlyReadingBook) => customRenderBookItem(book, getProgressPercentage(book))
    : defaultRenderBookItem

  const content = (
    <>
      {displayBooks.length > 0 ? (
        <div className="space-y-4">
          {displayBooks.map((book, index) => (
            <div key={book.id || index}>
              {renderBookItem(book)}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          {emptyMessage || 'No books currently being read'}
        </p>
      )}
    </>
  )

  // Use custom wrapper component if provided (fully reusable)
  if (CustomWrapper) {
    return (
      <CustomWrapper
        title={title}
        viewMoreLink={viewMoreLink}
        viewMoreText={viewMoreText}
        className={className}
      >
        {content}
      </CustomWrapper>
    )
  }

  // Use Card wrapper if specified
  if (useCardWrapper) {
    return (
      <Card className={className}>
        <div className="space-y-1.5 p-4 flex flex-row items-center justify-between">
          <div className="text-2xl font-semibold leading-none tracking-tight">
            {title}
          </div>
          {viewMoreLink && (
            <Link href={viewMoreLink} className="text-sm text-primary hover:underline">
              {viewMoreText}
            </Link>
          )}
        </div>
        <CardContent className="p-4 pt-0 space-y-4">
          {content}
        </CardContent>
      </Card>
    )
  }

  // Default to ContentSection wrapper
  return (
    <ContentSection
      title={title}
      viewMoreLink={viewMoreLink}
      viewMoreText={viewMoreText}
      className={className}
    >
      {content}
    </ContentSection>
  )
}

