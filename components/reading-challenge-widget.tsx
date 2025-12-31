'use client'

/**
 * ReadingChallengeWidget Component - Dashboard Widget
 * A compact widget showing active reading challenges with progress
 * Designed for placement in dashboard sidebars
 * 
 * @example Basic usage
 * <ReadingChallengeWidget />
 * 
 * @example With custom max challenges
 * <ReadingChallengeWidget maxChallenges={2} />
 */

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Target, 
  BookOpen, 
  Clock, 
  FileText,
  Plus,
  ChevronRight,
  Loader2,
  Flame
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { 
  calculateProgress, 
  getGoalLabel, 
  isOnTrack,
  type ChallengeData,
  type GoalType
} from '@/components/challenge-card'

// ============================================================================
// TYPES - Exported for reusability
// ============================================================================

/** Widget props */
export interface ReadingChallengeWidgetProps {
  /** Maximum number of challenges to display */
  maxChallenges?: number
  /** Additional CSS classes */
  className?: string
  /** Callback when create challenge is clicked */
  onCreateChallenge?: () => void
  /** Callback when a challenge is clicked */
  onChallengeClick?: (challenge: ChallengeData) => void
  /** Show the create button */
  showCreateButton?: boolean
  /** Show view all link */
  showViewAllLink?: boolean
  /** Custom empty state message */
  emptyMessage?: string
}

// ============================================================================
// UTILITIES - Exported for reusability
// ============================================================================

/** Get icon for goal type */
export function getGoalIcon(goalType: GoalType): React.ReactNode {
  const iconMap: Record<GoalType, React.ReactNode> = {
    books: <BookOpen className="h-4 w-4" />,
    pages: <FileText className="h-4 w-4" />,
    minutes: <Clock className="h-4 w-4" />,
    authors: <Target className="h-4 w-4" />
  }
  return iconMap[goalType] || <Target className="h-4 w-4" />
}

/** Format days remaining */
export function formatDaysRemaining(endDate: string | Date): string {
  const end = new Date(endDate)
  const now = new Date()
  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'Ended'
  if (diffDays === 0) return 'Ends today'
  if (diffDays === 1) return '1 day left'
  if (diffDays <= 7) return `${diffDays} days left`
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks left`
  return `${Math.ceil(diffDays / 30)} months left`
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ReadingChallengeWidget({
  maxChallenges = 3,
  className = '',
  onCreateChallenge,
  onChallengeClick,
  showCreateButton = true,
  showViewAllLink = true,
  emptyMessage = "No active challenges. Start one to track your reading goals!"
}: ReadingChallengeWidgetProps) {
  const [challenges, setChallenges] = useState<ChallengeData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  const fetchChallenges = useCallback(async () => {
    if (!user) {
      setIsLoading(false)
      setChallenges([])
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/challenges?status=active')

      if (response.ok) {
        const data = await response.json()
        // Map API response to ChallengeData format
        const mappedChallenges: ChallengeData[] = (data.challenges || data || [])
          .slice(0, maxChallenges)
          .map((c: any) => ({
            id: c.id,
            title: c.title || c.name || 'Reading Challenge',
            description: c.description,
            goalType: c.goal_type || c.goalType || 'books',
            goalValue: c.goal_value || c.goalValue || 0,
            currentValue: c.current_value || c.currentValue || c.progress || 0,
            startDate: c.start_date || c.startDate,
            endDate: c.end_date || c.endDate,
            challengeYear: c.challenge_year || c.challengeYear || new Date().getFullYear(),
            status: c.status || 'active',
            isPublic: c.is_public ?? c.isPublic ?? false
          }))
        setChallenges(mappedChallenges)
      } else if (response.status === 401) {
        setChallenges([])
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching challenges:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [user, maxChallenges])

  useEffect(() => {
    fetchChallenges()
  }, [fetchChallenges])

  // Don't show widget for unauthenticated users
  if (!user && !isLoading) {
    return null
  }

  return (
    <Card className={cn('reading-challenge-widget', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">Reading Challenges</CardTitle>
          </div>
          {challenges.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {challenges.length} active
            </Badge>
          )}
        </div>
        <CardDescription>Track your reading goals</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-4">
            <Target className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              {emptyMessage}
            </p>
            {showCreateButton && (
              <Button 
                size="sm"
                onClick={onCreateChallenge}
                asChild={!onCreateChallenge}
              >
                {onCreateChallenge ? (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Create Challenge
                  </>
                ) : (
                  <Link href="/reading-challenge">
                    <Plus className="h-4 w-4 mr-1" />
                    Create Challenge
                  </Link>
                )}
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Challenge Items */}
            <div className="space-y-3">
              {challenges.map((challenge) => {
                const progress = calculateProgress(challenge.currentValue, challenge.goalValue)
                const onTrack = isOnTrack(challenge)
                
                return (
                  <div
                    key={challenge.id}
                    className={cn(
                      "p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer",
                      onChallengeClick && "cursor-pointer"
                    )}
                    onClick={() => onChallengeClick?.(challenge)}
                  >
                    {/* Title and Status Row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getGoalIcon(challenge.goalType)}
                        <span className="font-medium text-sm truncate">
                          {challenge.title}
                        </span>
                      </div>
                      {onTrack ? (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600 border-green-200">
                          <Flame className="h-3 w-3 mr-0.5" />
                          On Track
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          Behind
                        </Badge>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {challenge.currentValue} / {challenge.goalValue} {getGoalLabel(challenge.goalType)}
                        </span>
                        <span>{formatDaysRemaining(challenge.endDate)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center gap-2 pt-2">
              {showCreateButton && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={onCreateChallenge}
                  asChild={!onCreateChallenge}
                >
                  {onCreateChallenge ? (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      New
                    </>
                  ) : (
                    <Link href="/reading-challenge">
                      <Plus className="h-4 w-4 mr-1" />
                      New
                    </Link>
                  )}
                </Button>
              )}
              {showViewAllLink && (
                <Button variant="ghost" size="sm" className="flex-1" asChild>
                  <Link href="/reading-challenge">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ReadingChallengeWidget
