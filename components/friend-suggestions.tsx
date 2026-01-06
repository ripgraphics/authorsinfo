'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users, UserPlus, X, Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { getProfileUrlFromUser } from '@/lib/utils/profile-url-client'

interface Suggestion {
  id: string
  suggested_user_id: string
  mutual_friends_count: number
  suggestion_score: number
  is_dismissed: boolean
  suggested_user: {
    id: string
    name: string
    email: string
    permalink?: string
  }
}

export function FriendSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [processingSuggestion, setProcessingSuggestion] = useState<string | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/friends/suggestions')

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      } else {
        console.error('Failed to fetch suggestions')
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateNewSuggestions = async () => {
    try {
      setIsGenerating(true)
      const response = await fetch('/api/friends/suggestions', {
        method: 'POST',
      })

      if (response.ok) {
        await fetchSuggestions()
        toast({
          title: 'Suggestions updated',
          description: 'New friend suggestions have been generated',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to generate new suggestions',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error generating suggestions:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate new suggestions',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSuggestionAction = async (suggestionId: string, action: 'accept' | 'dismiss') => {
    try {
      setProcessingSuggestion(suggestionId)
      const response = await fetch('/api/friends/suggestions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suggestionId, action }),
      })

      if (response.ok) {
        // Remove the suggestion from the list
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId))

        toast({
          title: action === 'accept' ? 'Friend request sent!' : 'Suggestion dismissed',
          description:
            action === 'accept' ? 'Friend request has been sent' : 'Suggestion has been dismissed',
        })
      } else {
        toast({
          title: 'Error',
          description: `Failed to ${action} suggestion`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error(`Error ${action}ing suggestion:`, error)
      toast({
        title: 'Error',
        description: `Failed to ${action} suggestion`,
        variant: 'destructive',
      })
    } finally {
      setProcessingSuggestion(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading suggestions...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Friend Suggestions</h2>
            <p className="text-sm text-muted-foreground">
              AI-powered recommendations based on mutual friends
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={generateNewSuggestions}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {suggestions.length === 0 ? (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No suggestions available</h3>
                <p className="text-muted-foreground mb-4">
                  We'll generate new suggestions based on your network
                </p>
                <Button onClick={generateNewSuggestions} disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Generate Suggestions
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          suggestions.map((suggestion) => (
            <Card key={suggestion.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(suggestion.suggested_user.name)}`}
                      />
                      <AvatarFallback>
                        {suggestion.suggested_user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <Link
                        href={getProfileUrlFromUser(suggestion.suggested_user)}
                        className="font-semibold hover:underline"
                      >
                        {suggestion.suggested_user.name}
                      </Link>

                      <div className="flex items-center space-x-2 mt-1">
                        {suggestion.mutual_friends_count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {suggestion.mutual_friends_count} mutual friend
                            {suggestion.mutual_friends_count !== 1 ? 's' : ''}
                          </Badge>
                        )}

                        <Badge variant="outline" className="text-xs">
                          {Math.round(suggestion.suggestion_score * 100)}% match
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionAction(suggestion.id, 'dismiss')}
                      disabled={processingSuggestion === suggestion.id}
                      className="text-muted-foreground hover:text-red-600"
                    >
                      {processingSuggestion === suggestion.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleSuggestionAction(suggestion.id, 'accept')}
                      disabled={processingSuggestion === suggestion.id}
                    >
                      {processingSuggestion === suggestion.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      Add Friend
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
