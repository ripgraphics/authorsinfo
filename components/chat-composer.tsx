'use client'

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

/**
 * Fully reusable chat message composer.
 *
 * Features:
 * - Auto-growing textarea (grows with content up to `maxLines`, then
 *   scrolls internally instead of growing).
 * - Per-conversation draft persistence in localStorage so drafts survive
 *   page refreshes, reloads, and browser close/reopen.
 * - Enter sends, Shift+Enter inserts a newline.
 * - Fully prop-driven: works with any chat surface (floating chat,
 *   direct-message page, group chats, etc.) — no hardcoded routes or
 *   page-specific logic.
 */

/** localStorage key prefix for per-conversation chat drafts. */
const DRAFT_STORAGE_PREFIX = 'authorsinfo:chat-draft:'

/** Reads the persisted draft for a conversation (empty string when none). */
function readDraft(conversationId: string | null): string {
  if (!conversationId) return ''
  try {
    return window.localStorage.getItem(DRAFT_STORAGE_PREFIX + conversationId) ?? ''
  } catch {
    return ''
  }
}

/** Persists (or clears) the draft for a conversation. */
function writeDraft(conversationId: string | null, value: string): void {
  if (!conversationId) return
  try {
    if (value) {
      window.localStorage.setItem(DRAFT_STORAGE_PREFIX + conversationId, value)
    } else {
      window.localStorage.removeItem(DRAFT_STORAGE_PREFIX + conversationId)
    }
  } catch {
    // Storage unavailable (private mode/quota) — drafts simply won't persist.
  }
}

export interface ChatComposerProps {
  /** Conversation the draft belongs to; drafts are stored per conversation. */
  conversationId: string | null
  /**
   * Called with the trimmed message body when the user submits. Return false
   * (or a promise resolving to false) to signal failure — the draft is then
   * restored so the user's text is not lost.
   */
  onSend: (body: string) => boolean | Promise<boolean> | void
  /**
   * Called when the user types in the textarea. Use this to broadcast typing
   * events to other participants. The composer does NOT debounce this — the
   * caller should debounce if needed.
   */
  onTyping?: () => void
  /** Placeholder text for the textarea. */
  placeholder?: string
  /** Accessible label for the textarea. */
  ariaLabel?: string
  /** Disables the composer (e.g. while sending or when offline). */
  disabled?: boolean
  /** Growth cap in lines (default 10). */
  maxLines?: number
  /** Additional classes merged onto the form element. */
  className?: string
  /** Additional classes merged onto the textarea. */
  textareaClassName?: string
  /** Additional classes merged onto the send button. */
  sendButtonClassName?: string
  /** Accessible label for the send button (default "Send message"). */
  sendButtonLabel?: string
}

export function ChatComposer({
  conversationId,
  onSend,
  onTyping,
  placeholder = 'Type a message',
  ariaLabel = 'Chat message',
  disabled = false,
  maxLines = 10,
  className,
  textareaClassName,
  sendButtonClassName,
  sendButtonLabel = 'Send message',
}: ChatComposerProps) {
  const [draft, setDraft] = useState('')
  const elementRef = useRef<HTMLTextAreaElement | null>(null)

  // Restore the persisted draft whenever the active conversation changes
  // (including the initial mount when a stored conversation is restored).
  // Persistence is event-driven (onChange/submit), NOT an effect — an effect
  // would race this restore on mount and clear the just-restored draft.
  useEffect(() => {
    setDraft(readDraft(conversationId))
  }, [conversationId])

  // Auto-grow the textarea with the content, capped at maxLines. Beyond the
  // cap the textarea scrolls internally instead of growing. 10rem ≈ 10 lines
  // at the default composer padding/line-height (1rem per line).
  const maxHeightPx = maxLines * 16
  useEffect(() => {
    const textarea = elementRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeightPx)}px`
  }, [draft, maxHeightPx])

  // Size the textarea when it (re)mounts. A restored draft can be set in
  // state before the composer renders (e.g. auth still loading during a
  // reload), so the effect above would miss it — the ref callback catches
  // that first mount and sizes the textarea for the current value.
  const textareaRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      elementRef.current = el
      if (el) {
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, maxHeightPx)}px`
      }
    },
    [maxHeightPx]
  )

  const updateDraft = (value: string) => {
    setDraft(value)
    writeDraft(conversationId, value)
    onTyping?.()
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const body = draft.trim()
    if (disabled || !body) return
    const result = await onSend(body)
    if (result === false) return // send failed — keep the draft
    setDraft('')
    writeDraft(conversationId, '')
  }

  return (
    <form onSubmit={submit} className={cn('flex gap-2', className)}>
      <Textarea
        ref={textareaRef}
        value={draft}
        onChange={(event) => updateDraft(event.target.value)}
        onKeyDown={(event) => {
          // Enter sends; Shift+Enter inserts a newline.
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            event.currentTarget.form?.requestSubmit()
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        rows={1}
        maxLength={10000}
        disabled={disabled}
        className={cn(
          'chat-composer__textarea min-h-[2.5rem] w-full resize-none overflow-y-auto py-2',
          textareaClassName
        )}
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled || !draft.trim()}
        aria-label={sendButtonLabel}
        title={sendButtonLabel}
        className={cn('chat-composer__send', sendButtonClassName)}
      >
        <Send className="chat-composer__send-icon h-4 w-4" />
      </Button>
    </form>
  )
}
