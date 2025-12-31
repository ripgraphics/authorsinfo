import { redirect } from 'next/navigation'
import { createServerComponentClientAsync } from '@/lib/supabase/client-helper'

import { PermalinkSettings } from '@/components/permalink-settings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link, ExternalLink, Copy, CheckCircle, AlertCircle } from 'lucide-react'

export default async function PermalinkDemoPage() {
  const supabase = await createServerComponentClientAsync()

  // Get the current user from the session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Get user data from the database
  const { data: userData } = await supabase
    .from('users')
    .select('name, email, permalink, created_at')
    .eq('id', user.id)
    .single()

  // Example permalinks for different entity types
  const examplePermalinks = [
    {
      entityType: 'user',
      name: 'John Smith',
      permalink: 'john-smith',
      url: '/profile/john-smith',
      description: 'User profile with custom permalink',
    },
    {
      entityType: 'group',
      name: 'Book Club 2024',
      permalink: 'book-club-2024',
      url: '/groups/book-club-2024',
      description: 'Reading group with memorable URL',
    },
    {
      entityType: 'event',
      name: 'Summer Reading Festival',
      permalink: 'summer-reading-festival',
      url: '/events/summer-reading-festival',
      description: 'Event page with SEO-friendly URL',
    },
    {
      entityType: 'book',
      name: 'The Great Gatsby',
      permalink: 'the-great-gatsby',
      url: '/books/the-great-gatsby',
      description: 'Book page with clean permalink',
    },
    {
      entityType: 'author',
      name: 'F. Scott Fitzgerald',
      permalink: 'f-scott-fitzgerald',
      url: '/authors/f-scott-fitzgerald',
      description: 'Author profile with custom URL',
    },
    {
      entityType: 'publisher',
      name: 'Simon & Schuster',
      permalink: 'simon-schuster',
      url: '/publishers/simon-schuster',
      description: 'Publisher page with branded URL',
    },
  ]

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Permalink System Demo</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the enterprise-level permalink system that transforms complex UUIDs into
            memorable, SEO-friendly URLs for all entity types.
          </p>
        </div>

        {/* Current User Permalink */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Your Current Permalink
            </CardTitle>
            <CardDescription>Manage your personal permalink settings</CardDescription>
          </CardHeader>
          <CardContent>
            <PermalinkSettings
              entityId={user.id}
              entityType="user"
              currentPermalink={(userData as any)?.permalink}
              entityName={(userData as any)?.name || 'User'}
            />
          </CardContent>
        </Card>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Custom URLs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Transform complex UUIDs into memorable, human-readable URLs that are easy to share
                and remember.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Real-time Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Instant validation and availability checking with helpful suggestions for
                alternatives.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-purple-600" />
                SEO Optimized
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Search engine friendly URLs that improve discoverability and ranking potential.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Example Permalinks */}
        <Card>
          <CardHeader>
            <CardTitle>Example Permalinks</CardTitle>
            <CardDescription>See how permalinks work across different entity types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {examplePermalinks.map((example, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{example.name}</h3>
                      <p className="text-sm text-muted-foreground">{example.description}</p>
                    </div>
                    <Badge variant="outline">{example.entityType}</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Permalink:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded-sm">
                        {example.permalink}
                      </code>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">URL:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded-sm">{example.url}</code>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* URL Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Before vs After</CardTitle>
            <CardDescription>
              See the transformation from UUIDs to custom permalinks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-red-600 mb-2">Before (UUIDs)</h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-red-50 rounded-sm border">
                      <code className="text-xs text-red-700">
                        /profile/e06cdf85-b449-4dcb-b943-068aaad8cfa3
                      </code>
                    </div>
                    <div className="p-3 bg-red-50 rounded-sm border">
                      <code className="text-xs text-red-700">
                        /groups/123e4567-e89b-12d3-a456-426614174000
                      </code>
                    </div>
                    <div className="p-3 bg-red-50 rounded-sm border">
                      <code className="text-xs text-red-700">
                        /events/987fcdeb-51a2-43d1-9f12-345678901234
                      </code>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-green-600 mb-2">After (Permalinks)</h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 rounded-sm border">
                      <code className="text-xs text-green-700">/profile/john-smith</code>
                    </div>
                    <div className="p-3 bg-green-50 rounded-sm border">
                      <code className="text-xs text-green-700">/groups/book-club-2024</code>
                    </div>
                    <div className="p-3 bg-green-50 rounded-sm border">
                      <code className="text-xs text-green-700">
                        /events/summer-reading-festival
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Enterprise Benefits</CardTitle>
            <CardDescription>
              Why this permalink system is perfect for enterprise applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">User Experience</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                    <li>• Memorable and shareable URLs</li>
                    <li>• Professional appearance</li>
                    <li>• Easy to type and remember</li>
                    <li>• Brand consistency</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold">SEO & Marketing</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                    <li>• Search engine friendly</li>
                    <li>• Improved click-through rates</li>
                    <li>• Better social media sharing</li>
                    <li>• Enhanced discoverability</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Technical Excellence</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                    <li>• Real-time validation</li>
                    <li>• Automatic conflict resolution</li>
                    <li>• Backward compatibility</li>
                    <li>• Scalable architecture</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold">Security & Performance</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                    <li>• Reserved word protection</li>
                    <li>• Rate limiting</li>
                    <li>• Optimized database queries</li>
                    <li>• Caching support</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
