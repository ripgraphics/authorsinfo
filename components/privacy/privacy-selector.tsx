'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PrivacyService } from '@/lib/privacy-service'
import type { PrivacyLevel } from '@/types/privacy'
import { Shield, Users, UserCheck, Lock, Globe } from 'lucide-react'

interface PrivacySelectorProps {
  currentPrivacyLevel?: PrivacyLevel
  onPrivacyChange: (
    privacyLevel: PrivacyLevel,
    allowFriends?: boolean,
    allowFollowers?: boolean
  ) => void
  disabled?: boolean
  className?: string
}

const privacyOptions = [
  {
    value: 'private' as PrivacyLevel,
    label: 'Private',
    description: 'Only you can see this book',
    icon: Lock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  {
    value: 'friends' as PrivacyLevel,
    label: 'Friends Only',
    description: 'Only your friends can see this book',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    value: 'followers' as PrivacyLevel,
    label: 'Followers Only',
    description: 'Only your followers can see this book',
    icon: UserCheck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    value: 'public' as PrivacyLevel,
    label: 'Public',
    description: 'Anyone can see this book',
    icon: Globe,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
]

export function PrivacySelector({
  currentPrivacyLevel = 'private',
  onPrivacyChange,
  disabled = false,
  className,
}: PrivacySelectorProps) {
  const [selectedPrivacy, setSelectedPrivacy] = useState<PrivacyLevel>(currentPrivacyLevel)
  const [allowFriends, setAllowFriends] = useState(false)
  const [allowFollowers, setAllowFollowers] = useState(false)
  const [open, setOpen] = useState(false)

  const handlePrivacyChange = (privacyLevel: PrivacyLevel) => {
    setSelectedPrivacy(privacyLevel)

    // Reset additional options when changing privacy level
    if (privacyLevel !== 'friends') {
      setAllowFriends(false)
    }
    if (privacyLevel !== 'followers') {
      setAllowFollowers(false)
    }
  }

  const handleSave = () => {
    onPrivacyChange(selectedPrivacy, allowFriends, allowFollowers)
    setOpen(false)
  }

  const getCurrentPrivacyOption = () => {
    return (
      privacyOptions.find((option) => option.value === currentPrivacyLevel) || privacyOptions[0]
    )
  }

  const currentOption = getCurrentPrivacyOption()

  return (
    <div className={className}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <currentOption.icon className="h-4 w-4" />
            {currentOption.label}
            <Badge variant="secondary" className="ml-1">
              {PrivacyService.getPrivacyLevelIcon(currentPrivacyLevel)}
            </Badge>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Privacy Level</DialogTitle>
            <DialogDescription>
              Control who can see this book in your reading list
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <RadioGroup value={selectedPrivacy} onValueChange={handlePrivacyChange}>
              {privacyOptions.map((option) => {
                const IconComponent = option.icon
                return (
                  <div key={option.value} className="flex items-center space-x-3">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label
                      htmlFor={option.value}
                      className="flex items-center gap-3 flex-1 cursor-pointer p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <div className={`p-2 rounded-full ${option.bgColor}`}>
                        <IconComponent className={`h-4 w-4 ${option.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-muted-foreground">{option.description}</div>
                      </div>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>

            <Separator />

            {/* Additional options for friends/followers */}
            {selectedPrivacy === 'friends' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Friends to See</Label>
                    <p className="text-sm text-muted-foreground">
                      Let your friends see this book in your reading list
                    </p>
                  </div>
                  <Switch checked={allowFriends} onCheckedChange={setAllowFriends} />
                </div>
              </div>
            )}

            {selectedPrivacy === 'followers' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Followers to See</Label>
                    <p className="text-sm text-muted-foreground">
                      Let your followers see this book in your reading list
                    </p>
                  </div>
                  <Switch checked={allowFollowers} onCheckedChange={setAllowFollowers} />
                </div>
              </div>
            )}

            {/* Privacy level description */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">
                      {PrivacyService.getPrivacyLevelDisplayName(selectedPrivacy)}
                    </p>
                    <p className="text-muted-foreground">
                      {PrivacyService.getPrivacyLevelDescription(selectedPrivacy)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Privacy Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
