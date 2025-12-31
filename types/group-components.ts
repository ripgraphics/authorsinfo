/**
 * Type definitions for reusable group components
 * All components follow props-based design pattern with no direct database access
 */

import type { Group } from './group'
import type {
  GroupCategory,
  ActivityLevelDefinition,
} from '@/app/actions/groups/get-group-constants'

// ============================================================================
// FILTER COMPONENTS
// ============================================================================

export interface CategorySelectProps {
  categories: GroupCategory[]
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
}

export interface ActivityLevelSelectProps {
  activityLevels: ActivityLevelDefinition[]
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
}

// ============================================================================
// POLL COMPONENTS
// ============================================================================

export interface Poll {
  id: string
  group_id: string
  question: string
  options: string[]
  is_anonymous: boolean
  allows_multiple_votes: boolean
  expires_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface PollVote {
  id: string
  poll_id: string
  user_id: string
  option_index: number
  created_at: string
}

export interface CreatePollInput {
  question: string
  options: string[]
  is_anonymous?: boolean
  allows_multiple_votes?: boolean
  expires_at?: string | null
}

export interface GroupPollsProps {
  groupId: string
  polls?: Poll[]
  onCreatePoll?: (pollData: CreatePollInput) => Promise<void>
  onVote?: (pollId: string, optionIndex: number) => Promise<void>
  onDeletePoll?: (pollId: string) => Promise<void>
  onUpdatePoll?: (pollId: string, updates: Partial<Poll>) => Promise<void>
  userPermissions?: {
    canCreate: boolean
    canDelete: boolean
    canUpdate?: boolean
  }
}

// ============================================================================
// READING CHALLENGE COMPONENTS
// ============================================================================

export interface ReadingChallenge {
  id: string
  group_id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  goal_books: number | null
  goal_pages: number | null
  status: 'active' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface UserChallengeProgress {
  challenge_id: string
  user_id: string
  books_read: number
  pages_read: number
  joined_at: string
}

export interface CreateChallengeInput {
  name: string
  description?: string
  start_date: string
  end_date: string
  goal_books?: number
  goal_pages?: number
}

export interface ProgressUpdate {
  books_read?: number
  pages_read?: number
}

export interface GroupReadingChallengesProps {
  groupId: string
  challenges?: ReadingChallenge[]
  userChallenges?: UserChallengeProgress[]
  onCreateChallenge?: (challengeData: CreateChallengeInput) => Promise<void>
  onJoinChallenge?: (challengeId: string) => Promise<void>
  onUpdateProgress?: (challengeId: string, progress: ProgressUpdate) => Promise<void>
  onDeleteChallenge?: (challengeId: string) => Promise<void>
  onUpdateChallenge?: (challengeId: string, updates: Partial<ReadingChallenge>) => Promise<void>
  userPermissions?: {
    canCreate: boolean
    canDelete: boolean
    canUpdate?: boolean
  }
}

// ============================================================================
// GENERAL COMPONENT PATTERNS
// ============================================================================

/**
 * Standard pattern for reusable group components:
 * - Receive data via props (no internal fetching)
 * - Use callback props for mutations (parent calls server actions)
 * - No direct database access
 * - No assumptions about parent context
 */
export interface ReusableGroupComponentProps {
  groupId: string
  // Add other common props as needed
}
