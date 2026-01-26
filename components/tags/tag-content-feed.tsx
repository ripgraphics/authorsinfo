/**
 * TagContentFeed Component
 * Displays content filtered by tag
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface TagContentFeedProps {
  taggings: any[]
  tag: {
    id: string
    name: string
    slug: string
    type: string
  }
}

export function TagContentFeed({ taggings, tag }: TagContentFeedProps) {
  // Group taggings by context
  const byContext = taggings.reduce((acc, tagging) => {
    const context = tagging.context || 'post'
    if (!acc[context]) {
      acc[context] = []
    }
    acc[context].push(tagging)
    return acc
  }, {} as Record<string, any[]>)

  const contexts = Object.keys(byContext)

  return (
    <Tabs defaultValue={contexts[0] || 'post'} className="w-full">
      <TabsList>
        {contexts.map((context) => (
          <TabsTrigger key={context} value={context}>
            {context.charAt(0).toUpperCase() + context.slice(1)}s ({byContext[context].length})
          </TabsTrigger>
        ))}
      </TabsList>

      {contexts.map((context) => (
        <TabsContent key={context} value={context} className="mt-4">
          <div className="space-y-4">
            {byContext[context].map((tagging: any) => {
              const content = tagging.posts || tagging.activities
              const user = content?.users

              if (!content) return null

              return (
                <Card key={tagging.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user?.avatar_url}
                        alt={user?.name}
                        name={user?.name}
                        size="sm"
                      />
                      <div>
                        <Link
                          href={`/profile/${user?.permalink || user?.id}`}
                          className="font-medium hover:underline"
                        >
                          {user?.name || 'Unknown'}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {new Date(content.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{content.content || content.text}</p>
                    <div className="mt-4 flex gap-2">
                      <Link
                        href={`/${context}s/${content.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View {context}
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
