import type React from 'react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BookOpen } from 'lucide-react'
import type { Author } from '@/types/book'
import Image from 'next/image'

interface AuthorHoverCardProps {
  author: Author
  bookCount: number
  children: React.ReactNode
}

export function AuthorHoverCard({ author, bookCount, children }: AuthorHoverCardProps) {
  // Determine the image URL to use - use author_image relation from database
  const imageUrl = author.author_image?.url || '/placeholder.svg'

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80">
        <Link href={`/authors/${author.id}`} className="block no-underline">
          <div className="flex items-start space-x-4">
            <Avatar
              src={imageUrl || '/placeholder.svg'}
              name={author.name}
              size="md"
              className="h-12 w-12"
            />
            <div className="flex flex-col">
              <h4 className="text-sm font-semibold">{author.name}</h4>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <BookOpen className="mr-1 h-3 w-3" />
                <span>{bookCount} books</span>
              </div>
            </div>
          </div>
        </Link>
      </HoverCardContent>
    </HoverCard>
  )
}
