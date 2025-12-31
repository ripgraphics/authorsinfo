import React from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, MessageCircle, Heart, Share2, TrendingUp, Award, Star, Zap } from 'lucide-react'

interface PhotoGalleryCommunityProps {
  community: {
    active_followers: number
    total_interactions: number
    community_score: number
  }
  className?: string
}

export function PhotoGalleryCommunity({ community, className = '' }: PhotoGalleryCommunityProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Mock community data
  const topContributors = [
    {
      id: '1',
      name: 'Sarah Johnson',
      avatar: '/placeholder.svg',
      contributions: 156,
      badge: 'Gold',
    },
    { id: '2', name: 'Mike Chen', avatar: '/placeholder.svg', contributions: 142, badge: 'Silver' },
    { id: '3', name: 'Emma Davis', avatar: '/placeholder.svg', contributions: 98, badge: 'Bronze' },
    {
      id: '4',
      name: 'Alex Thompson',
      avatar: '/placeholder.svg',
      contributions: 87,
      badge: 'Bronze',
    },
    { id: '5', name: 'Lisa Wang', avatar: '/placeholder.svg', contributions: 76, badge: 'Bronze' },
  ]

  const recentActivities = [
    {
      id: '1',
      user: 'Sarah Johnson',
      action: 'liked your photo',
      time: '2 minutes ago',
      avatar: '/placeholder.svg',
    },
    {
      id: '2',
      user: 'Mike Chen',
      action: 'commented on your album',
      time: '5 minutes ago',
      avatar: '/placeholder.svg',
    },
    {
      id: '3',
      user: 'Emma Davis',
      action: 'shared your gallery',
      time: '12 minutes ago',
      avatar: '/placeholder.svg',
    },
    {
      id: '4',
      user: 'Alex Thompson',
      action: 'followed you',
      time: '1 hour ago',
      avatar: '/placeholder.svg',
    },
    {
      id: '5',
      user: 'Lisa Wang',
      action: 'added to favorites',
      time: '2 hours ago',
      avatar: '/placeholder.svg',
    },
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Community Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {formatNumber(community.active_followers)}
              </div>
              <div className="text-sm text-muted-foreground">Active Followers</div>
              <div className="text-xs text-blue-500 mt-1">+15.3% from last week</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <MessageCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-green-600">
                {formatNumber(community.total_interactions)}
              </div>
              <div className="text-sm text-muted-foreground">Total Interactions</div>
              <div className="text-xs text-green-500 mt-1">+8.7% from last week</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold text-yellow-600">
                {community.community_score.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Community Score</div>
              <div className="text-xs text-yellow-500 mt-1">+2.1 points this week</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Top Contributors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topContributors.map((contributor, index) => (
                <div
                  key={contributor.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-white shadow-md relative">
                        {contributor.avatar ? (
                          <Image
                            src={contributor.avatar}
                            alt={`${contributor.name} avatar`}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-sm font-semibold text-muted-foreground">
                              {contributor.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </span>
                          </div>
                        )}
                      </div>
                      {index < 3 && (
                        <div className="absolute -top-1 -right-1">
                          <Badge variant="secondary" className="text-xs">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{contributor.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {contributor.contributions} contributions
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      contributor.badge === 'Gold'
                        ? 'default'
                        : contributor.badge === 'Silver'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {contributor.badge}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-white shadow-md relative">
                    {activity.avatar ? (
                      <Image
                        src={activity.avatar}
                        alt={`${activity.user} avatar`}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {activity.user
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="font-medium">{activity.user}</span>
                      <span className="text-muted-foreground"> {activity.action}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Community Engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-red-600">2.4K</div>
              <div className="text-sm text-muted-foreground">Likes This Week</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <MessageCircle className="h-6 w-6 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-600">847</div>
              <div className="text-sm text-muted-foreground">Comments This Week</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Share2 className="h-6 w-6 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-600">156</div>
              <div className="text-sm text-muted-foreground">Shares This Week</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-purple-600">89</div>
              <div className="text-sm text-muted-foreground">New Followers</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Community Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Invite Friends
            </Button>

            <Button className="w-full justify-start" variant="outline">
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Discussion
            </Button>

            <Button className="w-full justify-start" variant="outline">
              <Heart className="h-4 w-4 mr-2" />
              Create Challenge
            </Button>

            <Button className="w-full justify-start" variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share Gallery
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
