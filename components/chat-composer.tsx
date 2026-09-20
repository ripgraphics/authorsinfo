'use client'

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Film, Mic, Paperclip, Send, Smile, Sparkles, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
  replyContext?: { authorName: string; body: string } | null
  onCancelReply?: () => void
  mentionCandidates?: Array<{ id: string; name: string | null }>
  onMentionIdsChange?: (ids: string[]) => void
  onFilesSelected?: (files: File[]) => void | Promise<void>
  emojiOptions?: string[]
  gifSearch?: (query: string) => Promise<ChatComposerGif[]>
  onGifSelected?: (gif: ChatComposerGif) => void | Promise<void>
  stickerSearch?: (query: string) => Promise<ChatComposerGif[]>
  onStickerSelected?: (sticker: ChatComposerGif) => void | Promise<void>
  onVoiceNoteSelected?: (file: File) => void | Promise<void>
}

export interface ChatComposerGif {
  id: string
  title: string
  url: string
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
  replyContext = null,
  onCancelReply,
  mentionCandidates = [],
  onMentionIdsChange,
  onFilesSelected,
  emojiOptions = [],
  gifSearch,
  onGifSelected,
  stickerSearch,
  onStickerSelected,
  onVoiceNoteSelected,
}: ChatComposerProps) {
  const [draft, setDraft] = useState('')
  const [mentionIds, setMentionIds] = useState<string[]>([])
  const [gifPickerOpen, setGifPickerOpen] = useState(false)
  const [gifQuery, setGifQuery] = useState('trending')
  const [gifResults, setGifResults] = useState<ChatComposerGif[]>([])
  const [loadingGifs, setLoadingGifs] = useState(false)
  const [stickerPickerOpen, setStickerPickerOpen] = useState(false)
  const [stickerQuery, setStickerQuery] = useState('trending')
  const [stickerResults, setStickerResults] = useState<ChatComposerGif[]>([])
  const [loadingStickers, setLoadingStickers] = useState(false)
  const [recordingVoice, setRecordingVoice] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const voiceChunksRef = useRef<Blob[]>([])
  const voiceStreamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
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

  const updateMentionIds = (ids: string[]) => {
    setMentionIds(ids)
    onMentionIdsChange?.(ids)
  }

  const insertEmoji = (emoji: string) => {
    const nextDraft = draft ? `${draft} ${emoji}` : emoji
    updateDraft(nextDraft)
  }

  const stopVoiceStream = () => {
    voiceStreamRef.current?.getTracks().forEach((track) => track.stop())
    voiceStreamRef.current = null
  }

  const startVoiceRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    voiceChunksRef.current = []
    voiceStreamRef.current = stream
    mediaRecorderRef.current = recorder
    recorder.ondataavailable = (event) => {
      if (event.data.size) voiceChunksRef.current.push(event.data)
    }
    recorder.onstop = () => {
      const mimeType = recorder.mimeType || 'audio/webm'
      const extension = mimeType.includes('ogg') ? 'ogg' : 'webm'
      const file = new File(voiceChunksRef.current, `voice-note-${Date.now()}.${extension}`, { type: mimeType })
      stopVoiceStream()
      setRecordingVoice(false)
      void onVoiceNoteSelected?.(file)
    }
    recorder.start()
    setRecordingVoice(true)
  }

  const stopVoiceRecording = () => {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
  }

  useEffect(() => {
    if (!gifPickerOpen || !gifSearch) return
    let cancelled = false
    setLoadingGifs(true)
    void gifSearch(gifQuery.trim() || 'trending')
      .then((results) => {
        if (!cancelled) setGifResults(results)
      })
      .catch(() => {
        if (!cancelled) setGifResults([])
      })
      .finally(() => {
        if (!cancelled) setLoadingGifs(false)
      })
    return () => {
      cancelled = true
    }
  }, [gifPickerOpen, gifQuery, gifSearch])

  useEffect(() => {
    if (!stickerPickerOpen || !stickerSearch) return
    let cancelled = false
    setLoadingStickers(true)
    void stickerSearch(stickerQuery.trim() || 'trending')
      .then((results) => {
        if (!cancelled) setStickerResults(results)
      })
      .catch(() => {
        if (!cancelled) setStickerResults([])
      })
      .finally(() => {
        if (!cancelled) setLoadingStickers(false)
      })
    return () => {
      cancelled = true
    }
  }, [stickerPickerOpen, stickerQuery, stickerSearch])

  const mentionQuery = draft.match(/(?:^|\s)@([^\s@]*)$/)?.[1]?.toLowerCase() ?? null
  const mentionOptions = mentionQuery === null
    ? []
    : mentionCandidates.filter((candidate) =>
      (candidate.name ?? '').toLowerCase().includes(mentionQuery)
    ).slice(0, 5)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const body = draft.trim()
    if (disabled || !body) return
    const result = await onSend(body)
    if (result === false) return // send failed — keep the draft
    setDraft('')
    updateMentionIds([])
    writeDraft(conversationId, '')
  }

  return (
    <form onSubmit={submit} className={cn('flex flex-col gap-2', className)}>
      {replyContext ? (
        <div className="chat-composer__reply flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-xs">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Replying to {replyContext.authorName}</p>
            <p className="truncate text-muted-foreground">{replyContext.body}</p>
          </div>
          {onCancelReply ? (
            <button type="button" aria-label="Cancel reply" onClick={onCancelReply}>
              Cancel
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="flex gap-2">
      {onFilesSelected ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept="image/*,video/*,audio/*,application/pdf"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? [])
              if (files.length) void onFilesSelected(files)
              event.currentTarget.value = ''
            }}
          />
          <Button type="button" size="icon" aria-label="Attach files" title="Attach files" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="h-4 w-4" />
          </Button>
        </>
      ) : null}
      {emojiOptions.length > 0 ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Open emoji picker"
              title="Open emoji picker"
              disabled={disabled}
            >
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex max-w-56 flex-wrap gap-1" role="group" aria-label="Emoji picker">
              {emojiOptions.map((emoji) => (
                <Button
                  key={emoji}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-lg"
                  aria-label={`Insert ${emoji}`}
                  title={`Insert ${emoji}`}
                  onClick={() => insertEmoji(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
      {gifSearch && onGifSelected ? (
        <Popover open={gifPickerOpen} onOpenChange={setGifPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Open GIF picker"
              title="Open GIF picker"
              disabled={disabled}
            >
              <Film className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="start">
            <input
              value={gifQuery === 'trending' ? '' : gifQuery}
              onChange={(event) => setGifQuery(event.target.value || 'trending')}
              placeholder="Search GIFs"
              aria-label="Search GIFs"
              className="mb-2 h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto" aria-live="polite">
              {loadingGifs ? <p className="col-span-2 text-xs text-muted-foreground">Loading GIFs...</p> : null}
              {!loadingGifs && gifResults.length === 0 ? (
                <p className="col-span-2 text-xs text-muted-foreground">No GIFs found.</p>
              ) : null}
              {gifResults.map((gif) => (
                <button
                  key={gif.id}
                  type="button"
                  className="overflow-hidden rounded border text-left hover:ring-2 hover:ring-ring"
                  aria-label={`Insert GIF ${gif.title}`}
                  title={gif.title}
                  onClick={() => {
                    void onGifSelected(gif)
                    setGifPickerOpen(false)
                  }}
                >
                  <img src={gif.url} alt={gif.title} className="aspect-video w-full object-cover" />
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
      {stickerSearch && onStickerSelected ? (
        <Popover open={stickerPickerOpen} onOpenChange={setStickerPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Open sticker picker"
              title="Open sticker picker"
              disabled={disabled}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="start">
            <input
              value={stickerQuery === 'trending' ? '' : stickerQuery}
              onChange={(event) => setStickerQuery(event.target.value || 'trending')}
              placeholder="Search stickers"
              aria-label="Search stickers"
              className="mb-2 h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto" aria-live="polite">
              {loadingStickers ? <p className="col-span-2 text-xs text-muted-foreground">Loading stickers...</p> : null}
              {!loadingStickers && stickerResults.length === 0 ? (
                <p className="col-span-2 text-xs text-muted-foreground">No stickers found.</p>
              ) : null}
              {stickerResults.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  className="overflow-hidden rounded border text-left hover:ring-2 hover:ring-ring"
                  aria-label={`Insert sticker ${sticker.title}`}
                  title={sticker.title}
                  onClick={() => {
                    void onStickerSelected(sticker)
                    setStickerPickerOpen(false)
                  }}
                >
                  <img src={sticker.url} alt={sticker.title} className="aspect-square w-full object-contain" />
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
      {onVoiceNoteSelected ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={recordingVoice ? 'Stop voice recording' : 'Record voice message'}
          title={recordingVoice ? 'Stop voice recording' : 'Record voice message'}
          disabled={disabled}
          onClick={() => {
            if (recordingVoice) stopVoiceRecording()
            else void startVoiceRecording()
          }}
        >
          {recordingVoice ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
      ) : null}
      {mentionOptions.length > 0 ? (
        <div className="chat-composer__mentions absolute z-10 mb-12 rounded border bg-background p-1 shadow-lg">
          {mentionOptions.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-muted"
              onClick={() => updateMentionIds([...mentionIds, candidate.id])}
            >
              @{candidate.name || 'User'}
            </button>
          ))}
        </div>
      ) : null}
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
      </div>
    </form>
  )
}
