'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import type { GroupReadingChallengesProps, ReadingChallenge } from '@/types/group-components'
import { Plus, Trash2, TrendingUp, BookOpen, Calendar } from 'lucide-react'

/**
 * Reusable Group Reading Challenges Component
 *
 * Props-based design - receives all data via props, no internal data fetching
 * All mutations via callback props (parent calls server actions)
 */
export default function GroupReadingChallenges({
  groupId,
  challenges = [],
  userChallenges = [],
  onCreateChallenge = async () => {},
  onJoinChallenge = async () => {},
  onUpdateProgress = async () => {},
  onDeleteChallenge = async () => {},
  onUpdateChallenge,
  userPermissions = { canCreate: false, canDelete: false },
}: GroupReadingChallengesProps) {
  const { toast } = useToast()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newChallenge, setNewChallenge] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    goal_books: '',
    goal_pages: '',
  })

  const handleCreateChallenge = async () => {
    if (!newChallenge.name.trim() || !newChallenge.start_date || !newChallenge.end_date) {
      toast({
        title: 'Error',
        description: 'Challenge name, start date, and end date are required',
        variant: 'destructive',
      })
      return
    }

    try {
      await onCreateChallenge({
        name: newChallenge.name.trim(),
        description: newChallenge.description || undefined,
        start_date: newChallenge.start_date,
        end_date: newChallenge.end_date,
        goal_books: newChallenge.goal_books ? parseInt(newChallenge.goal_books) : undefined,
        goal_pages: newChallenge.goal_pages ? parseInt(newChallenge.goal_pages) : undefined,
      })

      setCreateDialogOpen(false)
      setNewChallenge({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        goal_books: '',
        goal_pages: '',
      })

      toast({
        title: 'Success',
        description: 'Challenge created successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create challenge',
        variant: 'destructive',
      })
    }
  }

  const handleJoin = async (challengeId: string) => {
    try {
      await onJoinChallenge(challengeId)
      toast({
        title: 'Success',
        description: 'You joined the challenge!',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to join challenge',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (challengeId: string) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return

    try {
      await onDeleteChallenge(challengeId)
      toast({
        title: 'Success',
        description: 'Challenge deleted successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete challenge',
        variant: 'destructive',
      })
    }
  }

  const userChallengeMap = new Map(userChallenges.map((uc) => [uc.challenge_id, uc]))

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reading Challenges</h2>
        {userPermissions.canCreate && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Reading Challenge</DialogTitle>
                <DialogDescription>
                  Create a reading challenge for your group members
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Challenge Name</Label>
                  <Input
                    id="name"
                    value={newChallenge.name}
                    onChange={(e) => setNewChallenge({ ...newChallenge, name: e.target.value })}
                    placeholder="e.g., Summer Reading Challenge 2025"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newChallenge.description}
                    onChange={(e) =>
                      setNewChallenge({ ...newChallenge, description: e.target.value })
                    }
                    placeholder="Describe the challenge..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={newChallenge.start_date}
                      onChange={(e) =>
                        setNewChallenge({ ...newChallenge, start_date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={newChallenge.end_date}
                      onChange={(e) =>
                        setNewChallenge({ ...newChallenge, end_date: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="goal_books">Goal Books (optional)</Label>
                    <Input
                      id="goal_books"
                      type="number"
                      value={newChallenge.goal_books}
                      onChange={(e) =>
                        setNewChallenge({ ...newChallenge, goal_books: e.target.value })
                      }
                      placeholder="e.g., 12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="goal_pages">Goal Pages (optional)</Label>
                    <Input
                      id="goal_pages"
                      type="number"
                      value={newChallenge.goal_pages}
                      onChange={(e) =>
                        setNewChallenge({ ...newChallenge, goal_pages: e.target.value })
                      }
                      placeholder="e.g., 5000"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateChallenge}>Create Challenge</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {challenges.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No reading challenges yet. Create one to get started!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {challenges.map((challenge) => {
            const userProgress = userChallengeMap.get(challenge.id)
            const isParticipating = !!userProgress

            return (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userProgress={userProgress}
                isParticipating={isParticipating}
                onJoin={() => handleJoin(challenge.id)}
                onDelete={userPermissions.canDelete ? () => handleDelete(challenge.id) : undefined}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function ChallengeCard({
  challenge,
  userProgress,
  isParticipating,
  onJoin,
  onDelete,
}: {
  challenge: ReadingChallenge
  userProgress?: { books_read: number; pages_read: number }
  isParticipating: boolean
  onJoin: () => Promise<void>
  onDelete?: () => Promise<void>
}) {
  const booksProgress =
    challenge.goal_books && userProgress
      ? Math.min((userProgress.books_read / challenge.goal_books) * 100, 100)
      : 0

  const pagesProgress =
    challenge.goal_pages && userProgress
      ? Math.min((userProgress.pages_read / challenge.goal_pages) * 100, 100)
      : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{challenge.name}</CardTitle>
            {challenge.description && (
              <CardDescription className="mt-2">{challenge.description}</CardDescription>
            )}
          </div>
          {onDelete && (
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(challenge.start_date).toLocaleDateString()} -{' '}
              {new Date(challenge.end_date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="capitalize">{challenge.status}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isParticipating && userProgress ? (
          <>
            {challenge.goal_books && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Books Read</span>
                  <span>
                    {userProgress.books_read} / {challenge.goal_books}
                  </span>
                </div>
                <Progress value={booksProgress} />
              </div>
            )}
            {challenge.goal_pages && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Pages Read</span>
                  <span>
                    {userProgress.pages_read} / {challenge.goal_pages}
                  </span>
                </div>
                <Progress value={pagesProgress} />
              </div>
            )}
          </>
        ) : (
          !isParticipating &&
          challenge.status === 'active' && (
            <Button onClick={onJoin} className="w-full">
              <BookOpen className="h-4 w-4 mr-2" />
              Join Challenge
            </Button>
          )
        )}
      </CardContent>
    </Card>
  )
}
