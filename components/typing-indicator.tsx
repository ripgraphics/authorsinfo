'use client'

import { cn } from '@/lib/utils'

/**
 * Reusable typing indicator with animated dots.
 *
 * Shows a small "X is typing..." message with three animated bouncing dots.
 * Fully prop-driven: works with any chat surface — no hardcoded routes or
 * page-specific logic.
 */

export interface TypingIndicatorProps {
  /** Names of users currently typing. */
  typingUserNames: string[]
  /** Additional classes merged onto the container element. */
  className?: string
}

/**
 * Generates a human-readable string from a list of typing user names.
 * - Empty list → returns empty string
 * - 1 user → "Alice is typing..."
 * - 2 users → "Alice and Bob are typing..."
 * - 3+ users → "Alice, Bob, and Charlie are typing..."
 */
function formatTypingText(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return `${names[0]} is typing...`
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`
  const last = names[names.length - 1]
  const rest = names.slice(0, -1).join(', ')
  return `${rest}, and ${last} are typing...`
}

export function TypingIndicator({ typingUserNames, className }: TypingIndicatorProps) {
  if (typingUserNames.length === 0) return null

  return (
    <div
      className={cn(
        'typing-indicator flex items-center gap-1.5 text-sm text-muted-foreground',
        className
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="typing-indicator__dots flex items-center gap-0.5">
        <span className="typing-indicator__dot inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <span className="typing-indicator__dot inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <span className="typing-indicator__dot inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
      </span>
      <span className="typing-indicator__text">{formatTypingText(typingUserNames)}</span>
    </div>
  )
}
