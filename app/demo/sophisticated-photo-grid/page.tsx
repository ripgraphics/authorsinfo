'use client'

import { useState } from 'react'
import { SophisticatedPhotoGrid } from '@/components/photo-gallery/sophisticated-photo-grid'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

// Sample photo data for demonstration
const samplePhotos = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    thumbnail_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    alt_text: 'Mountain landscape',
    description: 'Beautiful mountain landscape at sunset',
    created_at: '2024-01-15T10:00:00Z',
    likes: [{ id: '1', user_id: 'user1', user_name: 'John Doe', created_at: '2024-01-15T11:00:00Z' }],
    comments: [{ id: '1', user_id: 'user2', user_name: 'Jane Smith', content: 'Stunning view!', created_at: '2024-01-15T12:00:00Z' }],
    shares: [{ id: '1', user_id: 'user3', user_name: 'Bob Johnson', platform: 'twitter', created_at: '2024-01-15T13:00:00Z' }],
    analytics: { views: 1250, downloads: 45, engagement_rate: 0.08 },
    is_cover: true,
    is_featured: false
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
    thumbnail_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    alt_text: 'Forest path',
    description: 'Peaceful forest path in autumn',
    created_at: '2024-01-15T10:00:00Z',
    likes: [{ id: '2', user_id: 'user4', user_name: 'Alice Brown', created_at: '2024-01-15T14:00:00Z' }],
    comments: [],
    shares: [],
    analytics: { views: 890, downloads: 23, engagement_rate: 0.06 },
    is_cover: false,
    is_featured: true
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    thumbnail_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    alt_text: 'Ocean waves',
    description: 'Powerful ocean waves crashing on rocks',
    created_at: '2024-01-15T10:00:00Z',
    likes: [],
    comments: [],
    shares: [],
    analytics: { views: 567, downloads: 12, engagement_rate: 0.04 },
    is_cover: false,
    is_featured: false
  },
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
    thumbnail_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    alt_text: 'City skyline',
    description: 'Modern city skyline at night',
    created_at: '2024-01-15T10:00:00Z',
    likes: [],
    comments: [],
    shares: [],
    analytics: { views: 432, downloads: 8, engagement_rate: 0.03 },
    is_cover: false,
    is_featured: false
  },
  {
    id: '5',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    thumbnail_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    alt_text: 'Desert dunes',
    description: 'Rolling sand dunes in the desert',
    created_at: '2024-01-15T10:00:00Z',
    likes: [],
    comments: [],
    shares: [],
    analytics: { views: 298, downloads: 5, engagement_rate: 0.02 },
    is_cover: false,
    is_featured: false
  }
]

export default function SophisticatedPhotoGridDemo() {
  const [photoCount, setPhotoCount] = useState(5)
  const [showActions, setShowActions] = useState(true)
  const [showStats, setShowStats] = useState(true)

  const handlePhotoClick = (photo: any, index: number) => {
    console.log('Photo clicked:', photo, 'at index:', index)
    // In a real app, this would open a photo viewer modal
  }

  const handlePhotoLike = (photoId: string) => {
    console.log('Photo liked:', photoId)
    // In a real app, this would update the like count in your database
  }

  const handlePhotoComment = (photoId: string) => {
    console.log('Photo comment:', photoId)
    // In a real app, this would open a comment dialog
  }

  const handlePhotoShare = (photoId: string) => {
    console.log('Photo share:', photoId)
    // In a real app, this would open a share dialog
  }

  const handlePhotoDownload = (photoId: string) => {
    console.log('Photo download:', photoId)
    // In a real app, this would trigger a download
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Sophisticated Photo Grid Demo</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Experience the advanced photo grid layout system that intelligently arranges photos 
          for optimal space utilization and visual appeal.
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Grid Controls</CardTitle>
          <CardDescription>
            Customize the photo grid behavior and appearance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="photo-count">Number of Photos: {photoCount}</Label>
            <input
              id="photo-count"
              type="range"
              min="1"
              max="5"
              value={photoCount}
              onChange={(e) => setPhotoCount(Number(e.target.value))}
              className="w-32"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-actions"
                checked={showActions}
                onCheckedChange={setShowActions}
              />
              <Label htmlFor="show-actions">Show Action Buttons</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="show-stats"
                checked={showStats}
                onCheckedChange={setShowStats}
              />
              <Label htmlFor="show-stats">Show Statistics</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Photo Grid Display</CardTitle>
          <CardDescription>
            The grid automatically adjusts layout based on photo count for optimal space usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SophisticatedPhotoGrid
            photos={samplePhotos.slice(0, photoCount)}
            onPhotoClick={handlePhotoClick}
            onPhotoLike={handlePhotoLike}
            onPhotoComment={handlePhotoComment}
            onPhotoShare={handlePhotoShare}
            onPhotoDownload={handlePhotoDownload}
            showActions={showActions}
            showStats={showStats}
            className="max-w-4xl mx-auto"
          />
        </CardContent>
      </Card>

      {/* Features Explanation */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Layout Intelligence</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• 1 photo: Full-width display</li>
              <li>• 2 photos: Side-by-side layout</li>
              <li>• 3 photos: 2 on top, 1 wide below</li>
              <li>• 4 photos: 2x2 grid layout</li>
              <li>• 5+ photos: Optimized grid with overflow indicator</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interactive Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Hover effects with smooth animations</li>
              <li>• Like, comment, and share actions</li>
              <li>• Download and additional options</li>
              <li>• View and engagement statistics</li>
              <li>• Cover and featured photo badges</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Technical Implementation */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">CSS Grid Layout</h4>
            <p className="text-sm text-muted-foreground">
              Uses CSS Grid with dynamic grid-template-areas for precise photo positioning
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Framer Motion</h4>
            <p className="text-sm text-muted-foreground">
              Smooth hover animations and micro-interactions for enhanced user experience
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Responsive Design</h4>
            <p className="text-sm text-muted-foreground">
              Automatically adapts to different screen sizes and photo counts
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Performance Optimized</h4>
            <p className="text-sm text-muted-foreground">
              Lazy loading, thumbnail usage, and efficient re-rendering
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
