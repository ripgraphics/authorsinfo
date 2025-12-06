"use client"

import { useState, useEffect } from "react"
import { useAuth } from '@/hooks/useAuth'
import { canUserEditEntity } from '@/lib/auth-utils'
import { EntityHeader } from '@/components/entity-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pencil, BookOpen, Users, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

interface ReadingList {
  id: string
  name: string
  description?: string
  is_public: boolean
  user_id: string
  created_at: string
  updated_at: string
  books?: Array<{
    id: string
    title: string
    cover_image_url?: string
  }>
}

interface ReadingListClientProps {
  readingList: ReadingList
  books?: Array<{
    id: string
    title: string
    cover_image_url?: string
  }>
  booksCount?: number
  followersCount?: number
}

export function ReadingListClient({ 
  readingList, 
  books = [], 
  booksCount = 0,
  followersCount = 0 
}: ReadingListClientProps) {
  const { user } = useAuth()
  const [canEdit, setCanEdit] = useState(false)
  const [activeTab, setActiveTab] = useState("books")

  // Check edit permissions
  useEffect(() => {
    const checkEditPermissions = async () => {
      if (!user?.id) {
        setCanEdit(false)
        return
      }

      // Use the new ownership function for reading lists
      const canEditEntity = await canUserEditEntity(
        user.id, 
        'reading_list', 
        readingList.id,
        readingList
      )
      setCanEdit(canEditEntity)
    }

    checkEditPermissions()
  }, [user, readingList])

  const tabs = [
    { id: "books", label: "Books" },
    { id: "about", label: "About" },
    { id: "followers", label: "Followers" }
  ]

  const stats = [
    { 
      icon: <BookOpen className="h-4 w-4 mr-1" />, 
      text: `${booksCount} books` 
    },
    { 
      icon: <Users className="h-4 w-4 mr-1" />, 
      text: `${followersCount} followers` 
    },
    {
      icon: readingList.is_public ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />,
      text: readingList.is_public ? "Public" : "Private"
    }
  ]

  return (
    <div className="reading-list-page">
      <EntityHeader
        entityType="user"
        name={readingList.name}
        description={readingList.description}
        coverImageUrl="/placeholder.svg?height=400&width=1200"
        profileImageUrl="/placeholder.svg?height=200&width=200"
        stats={stats}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isEditable={canEdit}
        entityId={readingList.id}
        targetType="user"
      />

      <div className="reading-list-page__content">
        {activeTab === "books" && (
          <div className="reading-list-page__books-tab">
            <div className="reading-list-page__tab-content">
              <div className="reading-list-page__header flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Books in this list</h2>
                {canEdit && (
                  <Button asChild>
                    <Link href={`/reading-lists/${readingList.id}/edit`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit List
                    </Link>
                  </Button>
                )}
              </div>

              {books.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No books yet</h3>
                      <p className="text-muted-foreground mb-4">
                        {canEdit 
                          ? "Add some books to get started!" 
                          : "This list doesn't have any books yet."
                        }
                      </p>
                      {canEdit && (
                        <Button asChild>
                          <Link href={`/reading-lists/${readingList.id}/add-books`}>
                            Add Books
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {books.map((book) => (
                    <Card key={book.id} className="book-card">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="relative h-20 w-14 flex-shrink-0">
                            <img
                              src={book.cover_image_url || "/placeholder.svg"}
                              alt={book.title}
                              className="object-cover rounded-md absolute inset-0 w-full h-full"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium line-clamp-2 mb-1">
                              <Link 
                                href={`/books/${book.id}`}
                                className="hover:text-primary transition-colors"
                              >
                                {book.title}
                              </Link>
                            </h3>
                            {canEdit && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="mt-2 h-6 px-2 text-xs"
                                onClick={() => {
                                  // Handle remove book from list
                                  console.log('Remove book from list')
                                }}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "about" && (
          <div className="reading-list-page__about-tab">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>About this list</CardTitle>
                {canEdit && (
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {readingList.description || "No description provided."}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "followers" && (
          <div className="reading-list-page__followers-tab">
            <Card>
              <CardHeader>
                <CardTitle>Followers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {followersCount === 0 
                    ? "No followers yet." 
                    : `${followersCount} people are following this list.`
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 