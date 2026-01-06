'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useToast } from '@/hooks/use-toast'
import type { GroupPollsProps, Poll } from '@/types/group-components'
import { Plus, Trash2, BarChart3 } from 'lucide-react'

/**
 * Reusable Group Polls Component
 *
 * Props-based design - receives all data via props, no internal data fetching
 * All mutations via callback props (parent calls server actions)
 */
export default function GroupPolls({
  groupId,
  polls = [],
  onCreatePoll = async () => {},
  onVote = async () => {},
  onDeletePoll = async () => {},
  onUpdatePoll,
  userPermissions = { canCreate: false, canDelete: false },
}: GroupPollsProps) {
  const { toast } = useToast()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', ''],
    is_anonymous: false,
    allows_multiple_votes: false,
    expires_at: '',
  })

  const handleAddOption = () => {
    setNewPoll({ ...newPoll, options: [...newPoll.options, ''] })
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...newPoll.options]
    newOptions[index] = value
    setNewPoll({ ...newPoll, options: newOptions })
  }

  const handleRemoveOption = (index: number) => {
    if (newPoll.options.length > 2) {
      const newOptions = newPoll.options.filter((_, i) => i !== index)
      setNewPoll({ ...newPoll, options: newOptions })
    }
  }

  const handleCreatePoll = async () => {
    if (!newPoll.question.trim()) {
      toast({
        title: 'Error',
        description: 'Poll question is required',
        variant: 'destructive',
      })
      return
    }

    const validOptions = newPoll.options.filter((opt) => opt.trim())
    if (validOptions.length < 2) {
      toast({
        title: 'Error',
        description: 'Poll must have at least 2 options',
        variant: 'destructive',
      })
      return
    }

    try {
      await onCreatePoll({
        question: newPoll.question.trim(),
        options: validOptions,
        is_anonymous: newPoll.is_anonymous,
        allows_multiple_votes: newPoll.allows_multiple_votes,
        expires_at: newPoll.expires_at || null,
      })

      setCreateDialogOpen(false)
      setNewPoll({
        question: '',
        options: ['', ''],
        is_anonymous: false,
        allows_multiple_votes: false,
        expires_at: '',
      })

      toast({
        title: 'Success',
        description: 'Poll created successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create poll',
        variant: 'destructive',
      })
    }
  }

  const handleVote = async (pollId: string, optionIndex: number) => {
    try {
      await onVote(pollId, optionIndex)
      toast({
        title: 'Success',
        description: 'Vote recorded',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to vote',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll?')) return

    try {
      await onDeletePoll(pollId)
      toast({
        title: 'Success',
        description: 'Poll deleted successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete poll',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Group Polls</h2>
        {userPermissions.canCreate && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Poll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Poll</DialogTitle>
                <DialogDescription>
                  Create a poll to get feedback from group members
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="question">Question</Label>
                  <Textarea
                    id="question"
                    value={newPoll.question}
                    onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                    placeholder="What would you like to ask?"
                  />
                </div>
                <div>
                  <Label>Options</Label>
                  {newPoll.options.map((option, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                      {newPoll.options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddOption}
                    className="mt-2"
                  >
                    Add Option
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_anonymous"
                    checked={newPoll.is_anonymous}
                    onChange={(e) => setNewPoll({ ...newPoll, is_anonymous: e.target.checked })}
                  />
                  <Label htmlFor="is_anonymous">Anonymous poll</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allows_multiple"
                    checked={newPoll.allows_multiple_votes}
                    onChange={(e) =>
                      setNewPoll({ ...newPoll, allows_multiple_votes: e.target.checked })
                    }
                  />
                  <Label htmlFor="allows_multiple">Allow multiple votes</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePoll}>Create Poll</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {polls.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No polls yet. Create one to get started!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={handleVote}
              onDelete={userPermissions.canDelete ? handleDelete : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PollCard({
  poll,
  onVote,
  onDelete,
}: {
  poll: Poll
  onVote: (pollId: string, optionIndex: number) => Promise<void>
  onDelete?: (pollId: string) => Promise<void>
}) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const handleVoteClick = () => {
    if (selectedOption !== null) {
      onVote(poll.id, selectedOption)
    }
  }

  const isExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle>{poll.question}</CardTitle>
          {onDelete && (
            <Button variant="ghost" size="icon" onClick={() => onDelete(poll.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        {isExpired && <p className="text-sm text-muted-foreground">This poll has expired</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {poll.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="radio"
                id={`option-${poll.id}-${index}`}
                name={`poll-${poll.id}`}
                value={index}
                checked={selectedOption === index}
                onChange={() => setSelectedOption(index)}
                disabled={isExpired}
              />
              <Label htmlFor={`option-${poll.id}-${index}`} className="flex-1 cursor-pointer">
                {option}
              </Label>
            </div>
          ))}
        </div>
        {!isExpired && selectedOption !== null && (
          <Button onClick={handleVoteClick} className="w-full">
            Vote
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
