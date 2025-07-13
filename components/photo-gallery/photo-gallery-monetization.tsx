import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Crown,
  CreditCard,
  Gift,
  Zap,
  Star
} from 'lucide-react'

interface PhotoGalleryMonetizationProps {
  monetization: {
    total_earnings: number
    premium_subscribers: number
    revenue_share: number
  }
  className?: string
}

export function PhotoGalleryMonetization({ monetization, className = '' }: PhotoGalleryMonetizationProps) {
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-green-600">{formatCurrency(monetization.total_earnings)}</div>
              <div className="text-sm text-muted-foreground">Total Earnings</div>
              <div className="text-xs text-green-500 mt-1">+12.5% from last month</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Crown className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold text-yellow-600">{formatNumber(monetization.premium_subscribers)}</div>
              <div className="text-sm text-muted-foreground">Premium Subscribers</div>
              <div className="text-xs text-yellow-500 mt-1">+8.2% from last month</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CreditCard className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-blue-600">{formatCurrency(monetization.revenue_share)}</div>
              <div className="text-sm text-muted-foreground">Revenue Share</div>
              <div className="text-xs text-blue-500 mt-1">Platform commission</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Premium Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-medium">Premium Content</div>
                    <div className="text-sm text-muted-foreground">Exclusive high-quality images</div>
                  </div>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="font-medium">Priority Access</div>
                    <div className="text-sm text-muted-foreground">Early access to new features</div>
                  </div>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Gift className="h-5 w-5 text-pink-500" />
                  <div>
                    <div className="font-medium">Exclusive Bonuses</div>
                    <div className="text-sm text-muted-foreground">Special rewards and bonuses</div>
                  </div>
                </div>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Monetization Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button className="w-full justify-start" variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                Enable Premium Subscriptions
              </Button>
              
              <Button className="w-full justify-start" variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                Set Up Payment Processing
              </Button>
              
              <Button className="w-full justify-start" variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                Configure Revenue Sharing
              </Button>
              
              <Button className="w-full justify-start" variant="outline">
                <Gift className="h-4 w-4 mr-2" />
                Create Promotional Offers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(monetization.total_earnings * 0.4)}</div>
              <div className="text-sm text-muted-foreground">This Month</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(monetization.total_earnings * 0.25)}</div>
              <div className="text-sm text-muted-foreground">Last Month</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(monetization.total_earnings * 0.15)}</div>
              <div className="text-sm text-muted-foreground">Average per Subscriber</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(monetization.total_earnings * 0.2)}</div>
              <div className="text-sm text-muted-foreground">Projected Next Month</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 